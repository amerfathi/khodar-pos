/**
 * Store Code & Tenant Lookup API (/api/tenants/lookup)
 * Enables any client/cashier device to discover and verify a store code in real time
 */

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestOptions() {
  return new Response(null, { headers: CORS_HEADERS });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = (url.searchParams.get('code') || '').trim().toUpperCase();
  const username = (url.searchParams.get('username') || '').trim().toLowerCase();
  const id = (url.searchParams.get('id') || '').trim();

  if (!code && !username && !id) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'يرجى تقديم كود المتجر أو اسم المستخدم للاستعلام' 
    }), { status: 400, headers: CORS_HEADERS });
  }

  if (!env || !env.DB) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'قاعدة البيانات السحابية غير متاحة' 
    }), { status: 500, headers: CORS_HEADERS });
  }

  try {
    let tenantRow = null;

    if (code) {
      tenantRow = await env.DB.prepare(
        "SELECT * FROM tenants WHERE UPPER(store_code) = ? OR id = ? LIMIT 1"
      ).bind(code, code.toLowerCase()).first();
    } else if (id) {
      tenantRow = await env.DB.prepare(
        "SELECT * FROM tenants WHERE id = ? LIMIT 1"
      ).bind(id).first();
    } else if (username) {
      tenantRow = await env.DB.prepare(
        "SELECT * FROM tenants WHERE LOWER(username) = ? LIMIT 1"
      ).bind(username).first();
    }

    if (!tenantRow) {
      return new Response(JSON.stringify({ 
        success: false, 
        notFound: true,
        error: `كود المتجر (${code || username || id}) غير مسجل في السحابة المركزية` 
      }), { status: 404, headers: CORS_HEADERS });
    }

    // Fetch tenant's staff users if any exist in the cloud
    const { results: staffResults } = await env.DB.prepare(
      "SELECT id, tenant_id, branch_id, name, username, password_hash, role, status, phone, permissions_json FROM users WHERE tenant_id = ?"
    ).bind(tenantRow.id).all();

    const staffUsers = (staffResults || []).map(u => {
      let perms = {};
      try { perms = JSON.parse(u.permissions_json); } catch (e) {}
      return {
        id: u.id,
        tenantId: u.tenant_id,
        branchId: u.branch_id || 'all',
        name: u.name,
        username: u.username,
        password: u.password_hash,
        role: u.role || 'cashier',
        status: u.status || 'active',
        phone: u.phone || '',
        permissions: perms
      };
    });

    const tenant = {
      id: tenantRow.id,
      storeCode: tenantRow.store_code || code,
      companyName: tenantRow.company_name,
      username: tenantRow.username,
      password: tenantRow.password_hash,
      role: tenantRow.role || 'company_owner',
      status: tenantRow.status || 'active',
      expiresAt: tenantRow.expires_at,
      allowedBranches: tenantRow.allowed_branches || 1,
      phone: tenantRow.phone || '',
      notes: tenantRow.notes || '',
      createdAt: tenantRow.created_at,
      updatedAt: tenantRow.updated_at
    };

    return new Response(JSON.stringify({
      success: true,
      tenant,
      users: staffUsers
    }), { headers: CORS_HEADERS });

  } catch (err) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: err.message 
    }), { status: 500, headers: CORS_HEADERS });
  }
}
