import { authenticateRequest, requireAdmin, requireTenant } from '../../_lib/auth.js';
import { hashPassword } from '../../_lib/passwords.js';
import { json, badRequest, options, readJson } from '../../_lib/http.js';

const roles = new Set(['admin', 'cashier', 'accountant', 'inventory_manager', 'custom']);
const statuses = new Set(['active', 'inactive']);
const permissionNames = new Set(['canSell', 'canViewInvoices', 'canVoidInvoices', 'canManageCustomers',
  'canManagePurchases', 'canManageInventory', 'canManageExpenses', 'canManagePayroll', 'canViewFinance', 'canAccessSettings']);
export const onRequestOptions = options;
const serialize = u => ({
  id: u.id, tenantId: u.tenant_id, branchId: u.branch_id, name: u.name, username: u.username,
  role: u.role, status: u.status, phone: u.phone, permissions: JSON.parse(u.permissions_json || '{}')
});
async function authorize(request, env, tenantId) {
  const auth = await authenticateRequest(request, env);
  return { auth, error: requireAdmin(auth) || requireTenant(auth, tenantId) };
}
function validate(body) {
  if (!roles.has(body.role) || !statuses.has(body.status)) throw new Error('Invalid role or status');
  if (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 120 ||
      typeof body.username !== 'string' || !body.username.trim() || body.username.length > 120) throw new Error('Invalid user');
  if (!body.permissions || typeof body.permissions !== 'object' || Array.isArray(body.permissions)) throw new Error('Invalid permissions');
  if (Object.entries(body.permissions).some(([k,v]) => !permissionNames.has(k) || typeof v !== 'boolean')) throw new Error('Invalid permissions');
}
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const auth = await authenticateRequest(request, env);
  if (auth.error) return auth.error;
  const access = requireTenant(auth, url.searchParams.get('tenantId'));
  if (access) return access;
  const id = url.searchParams.get('id');
  if (requireAdmin(auth) && id !== auth.principal.id) return json({ success: false, error: 'Forbidden' }, 403);
  const q = id ? 'SELECT * FROM users WHERE tenant_id = ? AND id = ?' : 'SELECT * FROM users WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 1000';
  const rows = await env.DB.prepare(q).bind(...(id ? [auth.principal.tenantId, id] : [auth.principal.tenantId])).all();
  return json({ success: true, users: rows.results.map(serialize), total: rows.results.length });
}
export async function onRequestPost({ request, env }) {
  try {
    const body = await readJson(request, 16384);
    const { auth, error } = await authorize(request, env, body.tenantId);
    if (error) return error;
    const user = { role: 'cashier', status: 'active', branchId: 'all', permissions: {}, phone: '', ...body };
    validate(user);
    const branch = user.branchId || 'all';
    if (branch !== 'all' && !await env.DB.prepare('SELECT id FROM branches WHERE id = ? AND tenant_id = ?').bind(branch, auth.principal.tenantId).first()) return badRequest('Invalid branch');
    const passwordHash = await hashPassword(user.password);
    const id = user.id || crypto.randomUUID();
    if (await env.DB.prepare('SELECT id FROM users WHERE id = ? OR (tenant_id = ? AND LOWER(username) = ?)').bind(id, auth.principal.tenantId, user.username.trim().toLowerCase()).first()) return json({ success: false, error: 'User already exists' }, 409);
    await env.DB.prepare('INSERT INTO users (id, tenant_id, branch_id, name, username, password_hash, role, status, phone, permissions_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, auth.principal.tenantId, branch, user.name.trim(), user.username.trim().toLowerCase(), passwordHash, user.role, user.status, String(user.phone).slice(0,40), JSON.stringify(user.permissions)).run();
    const row = await env.DB.prepare('SELECT * FROM users WHERE id = ? AND tenant_id = ?').bind(id, auth.principal.tenantId).first();
    return json({ success: true, user: serialize(row) }, 201);
  } catch { return badRequest('Invalid user request'); }
}
export async function onRequestPatch({ request, env }) {
  try {
    const body = await readJson(request, 16384);
    const { auth, error } = await authorize(request, env, body.tenantId);
    if (error) return error;
    const old = await env.DB.prepare('SELECT * FROM users WHERE id = ? AND tenant_id = ?').bind(body.id, auth.principal.tenantId).first();
    if (!old) return json({ success: false, error: 'User not found' }, 404);
    const user = { ...serialize(old), ...body };
    validate(user);
    if (user.branchId !== 'all' && !await env.DB.prepare('SELECT id FROM branches WHERE id = ? AND tenant_id = ?').bind(user.branchId, auth.principal.tenantId).first()) return badRequest('Invalid branch');
    const passwordHash = body.password === undefined ? old.password_hash : await hashPassword(body.password);
    await env.DB.prepare("UPDATE users SET name = ?, username = ?, password_hash = ?, role = ?, status = ?, branch_id = ?, phone = ?, permissions_json = ?, auth_version = auth_version + 1, updated_at = datetime('now') WHERE id = ? AND tenant_id = ?")
      .bind(user.name.trim(), user.username.trim().toLowerCase(), passwordHash, user.role, user.status, user.branchId, String(user.phone).slice(0,40), JSON.stringify(user.permissions), body.id, auth.principal.tenantId).run();
    return json({ success: true, user: serialize(await env.DB.prepare('SELECT * FROM users WHERE id = ? AND tenant_id = ?').bind(body.id, auth.principal.tenantId).first()) });
  } catch { return badRequest('Invalid user update'); }
}
export const onRequestPut = onRequestPatch;
export async function onRequestDelete({ request, env }) {
  const url = new URL(request.url);
  const { auth, error } = await authorize(request, env, url.searchParams.get('tenantId'));
  if (error) return error;
  const id = url.searchParams.get('id');
  if (!id || id === auth.principal.id) return badRequest('Cannot delete active user');
  const result = await env.DB.prepare('DELETE FROM users WHERE id = ? AND tenant_id = ?').bind(id, auth.principal.tenantId).run();
  return json({ success: result.meta.changes > 0 }, result.meta.changes ? 200 : 404);
}
