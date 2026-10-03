import { authenticateRequest, requireTenant } from '../../../_lib/auth.js';
import { badRequest, forbidden, json, options, readJson } from '../../../_lib/http.js';
import { canAccessBranch } from '../../../../src/services/branchAccess.js';
import { hashCashDeviceProof } from '../../../_lib/cashDeviceProof.js';

export const onRequestOptions = options;
const validId = value => typeof value === 'string' && value.trim() && value.length <= 128;

export async function onRequestPost({request,env}) {
  const auth=await authenticateRequest(request,env);
  if (auth.error) return auth.error;
  try {
    const input=await readJson(request);
    const denied=requireTenant(auth,input.tenantId);
    if (denied) return denied;
    if (![input.branchId,input.shiftId,input.deviceId].every(validId)) return badRequest('Invalid shift identity');
    if (!canAccessBranch(auth.principal,input.branchId)) return forbidden('Branch access denied');
    if (![input.pendingEventCount,input.confirmedMovementCount].every(value=>Number.isSafeInteger(value) && value>=0))
      return badRequest('Unconfirmed local sync state');
    if (input.pendingEventCount !== 0) return json({success:false,error:'Local cash events are still pending'},409);
    const counted=Number(input.countedCash);
    if (!Number.isFinite(counted) || counted<0 || Math.abs(counted*100-Math.round(counted*100))>1e-6)
      return badRequest('Invalid counted cash');
    const shift=await env.DB.prepare('SELECT * FROM cash_shifts WHERE id=? AND tenant_id=? AND branch_id=?')
      .bind(input.shiftId,input.tenantId,input.branchId).first();
    if (!shift) return json({success:false,error:'Shift not found'},404);
    if (shift.opened_by !== auth.principal.id || shift.offline_device_id !== input.deviceId ||
        !shift.device_proof_hash || !/^[a-f0-9]{64}$/.test(input.deviceProof || '') ||
        shift.device_proof_hash !== await hashCashDeviceProof(env.AUTH_SECRET,input.deviceProof))
      return forbidden('Only the designated cashier device may close this shift');
    if (shift.status !== 'open') return json({success:false,error:'Shift is already closed'},409);
    const movement=await env.DB.prepare('SELECT COUNT(*) AS count,COALESCE(SUM(amount_cents),0) AS delta FROM cash_shift_movements WHERE tenant_id=? AND shift_id=?')
      .bind(input.tenantId,input.shiftId).first();
    if (movement.count !== input.confirmedMovementCount)
      return json({success:false,error:'Cash movements have not fully reconciled'},409);
    const expectedCents=shift.opening_cash_cents+movement.delta;
    const countedCents=Math.round(counted*100);
    const closedAt=new Date().toISOString();
    const result=await env.DB.prepare(`UPDATE cash_shifts SET status='closed',closed_at=?,closed_by=?,
      counted_cash_cents=?,expected_cash_cents=?,variance_cents=?
      WHERE id=? AND tenant_id=? AND branch_id=? AND status='open'
        AND (SELECT COUNT(*) FROM cash_shift_movements WHERE tenant_id=? AND shift_id=?)=?
        AND opening_cash_cents+(SELECT COALESCE(SUM(amount_cents),0) FROM cash_shift_movements WHERE tenant_id=? AND shift_id=?)=?`)
      .bind(closedAt,auth.principal.id,countedCents,expectedCents,countedCents-expectedCents,
        input.shiftId,input.tenantId,input.branchId,input.tenantId,input.shiftId,movement.count,
        input.tenantId,input.shiftId,expectedCents).run();
    if (result.meta?.changes !== 1) return json({success:false,error:'Shift changed during close; recount and retry'},409);
    return json({success:true,shiftId:input.shiftId,closedAt,expectedCash:expectedCents/100,
      countedCash:countedCents/100,variance:(countedCents-expectedCents)/100});
  } catch(error) {
    if (error instanceof SyntaxError) return badRequest('Invalid JSON');
    return badRequest(error.message);
  }
}
