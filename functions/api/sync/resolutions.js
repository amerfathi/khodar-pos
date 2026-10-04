import { authenticateRequest, requireTenant } from '../../_lib/auth.js';
import { badRequest,json,options,readJson } from '../../_lib/http.js';
import { canSync,validateTenantPayload } from '../../_lib/syncPolicy.js';
import { canAccessBranch } from '../../../src/services/branchAccess.js';
import { readReviewSnapshot } from '../../_lib/reviewResolution.js';
import { replayReviewedLedger,reviewedLedgerState } from '../../../src/services/reviewLedgerReplay.js';
import { INITIAL_SETTINGS } from '../../../src/data/initialData.js';
export const onRequestOptions=options;
const types={products:'product',customers:'customer',suppliers:'supplier',invoices:'invoice',purchases:'purchase',expenses:'expense',
  customerPayments:'customer_payment',supplierPayments:'supplier_payment',salesReturns:'sales_return',purchaseReturns:'purchase_return',
  damagedItems:'damaged_item',workers:'worker',workerTransactions:'worker_transaction',partners:'partner',partnerDrawings:'partner_drawing',
  profitDistributions:'profit_distribution',stockTransfers:'stock_transfer'};
export async function onRequestPost({request,env}){
  const auth=await authenticateRequest(request,env);if(auth.error)return auth.error;
  try{
    const {tenantId,events}=await readJson(request,256*1024),denied=requireTenant(auth,tenantId);if(denied)return denied;
    if(!Array.isArray(events)||!events.length||events.length>1000||new Set(events.map(event=>event.id)).size!==events.length)return badRequest('Invalid recovery queue');
    for(const event of events){
      if(event.tenantId!==tenantId||!canAccessBranch(auth.principal,event.branchId)||!canSync(auth.principal,event.entityType,event.action))return json({success:false,error:'Recovery scope denied'},403);
      validateTenantPayload(event,tenantId);
    }
    // Only the original submitting identity may consume the receipt. Owners
    // review others' evidence, but never install somebody else's local queue.
    const rows=await env.DB.prepare(`SELECT DISTINCT r.receipt_json,r.created_at,r.review_id FROM sync_review_originals source
      JOIN sync_review_resolutions r ON r.review_id=source.review_id JOIN sync_conflict_reviews c ON c.id=r.review_id
      WHERE source.tenant_id=? AND source.event_id IN(SELECT value FROM json_each(?)) AND c.submitted_by=? ORDER BY r.created_at,r.review_id`)
      .bind(tenantId,JSON.stringify(events.map(event=>event.id)),auth.principal.id).all();
    const pending=new Map(events.map(event=>[event.id,event])),covered=new Set(),receipts=[];
    for(const row of rows.results){
      const receipt=JSON.parse(row.receipt_json);
      if(!receipt.events.some(event=>pending.has(event.id)))continue;
      if(receipt.events.some(event=>!pending.has(event.id)||covered.has(event.id)||JSON.stringify(pending.get(event.id))!==JSON.stringify(event)))return json({success:false,error:'Pending source changed'},409);
      receipt.events.forEach(event=>covered.add(event.id));receipts.push(receipt);
    }
    if(covered.size!==events.length)return json({success:true,ready:false,unresolvedEventIds:events.filter(event=>!covered.has(event.id)).map(event=>event.id)});
    const snapshot=await readReviewSnapshot(env,tenantId);
    const ledger=replayReviewedLedger(snapshot.history,tenantId,{branches:snapshot.branches});
    reviewedLedgerState(ledger,tenantId,snapshot.cursor,snapshot.branches[0]?.id);
    // Calculate from the complete tenant ledger server-side, then redact before
    // transmitting. Hidden purchases must not produce incorrect stock totals.
    ledger.branches=ledger.branches.filter(row=>canAccessBranch(auth.principal,row.id));
    for(const [field,type] of Object.entries(types))ledger[field]=canSync(auth.principal,type)?ledger[field].filter(row=>
      row.branchId?canAccessBranch(auth.principal,row.branchId):auth.principal.branchIds?.includes('all')):[];
    if(!canSync(auth.principal,'settings'))ledger.settings=structuredClone(INITIAL_SETTINGS);
    ledger.settings.openingCashDrawerFloatByBranch=Object.fromEntries(Object.entries(ledger.settings.openingCashDrawerFloatByBranch||{}).filter(([id])=>canAccessBranch(auth.principal,id)));
    for(const product of ledger.products)if(product.branchStock)product.branchStock=Object.fromEntries(Object.entries(product.branchStock).filter(([id])=>canAccessBranch(auth.principal,id)));
    if(!ledger.branches.length)return json({success:false,error:'No authorized branch'},403);
    // Validation is against the full replay; a permission-redacted checkpoint
    // can omit financial relations the cashier is not permitted to read.
    const history=snapshot.history.filter(event=>canSync(auth.principal,event.entityType)&&
      (event.branchId?canAccessBranch(auth.principal,event.branchId):auth.principal.branchIds?.includes('all')));
    return json({success:true,ready:true,protocol:'owner-reviewed-ledger-v1',tenantId,completeHistory:true,
      checkpoint:ledger,history,branches:ledger.branches,queue:events,receipts,nextCursor:snapshot.cursor,conflictHeads:snapshot.heads});
  }catch{return json({success:false,error:'Recovery cannot safely replay complete history; local sources retained'},409);}
}
