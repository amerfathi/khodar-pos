import { authenticateRequest, requireTenant } from '../../_lib/auth.js';
import { badRequest, forbidden, json, options, readJson } from '../../_lib/http.js';
import { canAccessBranch } from '../../../src/services/branchAccess.js';

export const onRequestOptions = options;
const admin = principal => ['company_owner','admin','super_admin'].includes(principal.role);
const text = (value, limit) => typeof value === 'string' && value.trim() && value.length <= limit;

export async function onRequestGet({request,env}) {
  const auth=await authenticateRequest(request,env);
  if (auth.error) return auth.error;
  const url=new URL(request.url), tenantId=url.searchParams.get('tenantId'), branchId=url.searchParams.get('branchId');
  const denied=requireTenant(auth,tenantId);
  if (denied) return denied;
  if (!text(branchId,128) || !canAccessBranch(auth.principal,branchId)) return forbidden('Branch access denied');
  const rows=await env.DB.prepare('SELECT id,branch_id AS branchId,name,status FROM cash_drawers WHERE tenant_id=? AND branch_id=? ORDER BY created_at,id')
    .bind(tenantId,branchId).all();
  return json({success:true,drawers:rows.results});
}

export async function onRequestPost({request,env}) {
  const auth=await authenticateRequest(request,env);
  if (auth.error) return auth.error;
  try {
    const {tenantId,branchId,id,name}=await readJson(request);
    const denied=requireTenant(auth,tenantId);
    if (denied) return denied;
    if (!admin(auth.principal) || !canAccessBranch(auth.principal,branchId)) return forbidden('Drawer management denied');
    if (![id,branchId].every(value=>text(value,128)) || !text(name,100)) return badRequest('Invalid drawer');
    const branch=await env.DB.prepare("SELECT id FROM branches WHERE id=? AND tenant_id=? AND status='active'").bind(branchId,tenantId).first();
    if (!branch) return badRequest('Unknown active branch');
    await env.DB.prepare('INSERT INTO cash_drawers(id,tenant_id,branch_id,name) VALUES(?,?,?,?)')
      .bind(id,tenantId,branchId,name.trim()).run();
    return json({success:true,id},201);
  } catch(error) {
    if (/UNIQUE constraint failed/.test(error.message)) return json({success:false,error:'Drawer already exists'},409);
    return badRequest(error.message);
  }
}
