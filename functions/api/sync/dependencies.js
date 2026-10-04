import { authenticateRequest, requireTenant } from '../../_lib/auth.js';
import { json, options, readJson, badRequest } from '../../_lib/http.js';
import { canSync } from '../../_lib/syncPolicy.js';
import { canAccessBranch } from '../../../src/services/branchAccess.js';
import { proveLegacyProduct } from '../../../src/services/legacyProductProof.js';
export const onRequestOptions=options;
export async function onRequestPost({request,env}) {
  const auth=await authenticateRequest(request,env);
  if(auth.error)return auth.error;
  try {
    const {tenantId,references}=await readJson(request);
    const denied=requireTenant(auth,tenantId);if(denied)return denied;
    if(!Array.isArray(references)||!references.length||references.length>50 ||
      references.some(ref=>typeof ref?.parentId!=='string'||typeof ref.productId!=='string'))return badRequest('Invalid references');
    if(!canSync(auth.principal,'invoice')||!canSync(auth.principal,'product'))return json({success:false,error:'Access denied'},403);
    const rows=await env.DB.prepare('SELECT * FROM sync_events_v2 WHERE tenant_id=? ORDER BY sequence LIMIT 2001').bind(tenantId).all();
    if(rows.results.length>2000)return json({success:false,error:'History requires owner review'},409);
    const history=rows.results.map(row=>({id:row.id,tenantId:row.tenant_id,branchId:row.branch_id,sequence:row.sequence,
      entityType:row.entity_type,entityId:row.entity_id,action:row.action,payload:JSON.parse(row.payload_json)}));
    const proofs=[];
    for(const ref of references){
      const proof=proveLegacyProduct(history,ref.parentId,ref.productId);
      if(proof&&canAccessBranch(auth.principal,proof.branchId))proofs.push(proof);
    }
    return json({success:true,tenantId,proofs});
  }catch{return badRequest('Dependency proof failed');}
}
