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

    // Fetch tenant's staff users if any exist in the cloud (sanitized - NO PASSWORDS)
    const { results: staffResults } = await env.DB.prepare(
      "SELECT id, tenant_id, branch_id, name, username, role, status, phone, permissions_json FROM users WHERE tenant_id = ?"
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

// Secure Server-Side Authentication
export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env || !env.DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database unavailable' }), { status: 500, headers: CORS_HEADERS });
  }

  try {
    const { storeCode, username, password } = await request.json();
    const cleanStoreCode = (storeCode || '').trim().toUpperCase();
    const cleanUser = (username || '').trim().toLowerCase();

    if (!cleanUser || !password) {
      return new Response(JSON.stringify({ success: false, error: 'بيانات الدخول غير مكتملة' }), { status: 400, headers: CORS_HEADERS });
    }

    let tenantRow = null;
    if (cleanStoreCode) {
      tenantRow = await env.DB.prepare(
        "SELECT * FROM tenants WHERE UPPER(store_code) = ? OR id = ? LIMIT 1"
      ).bind(cleanStoreCode, cleanStoreCode.toLowerCase()).first();
    } else {
      tenantRow = await env.DB.prepare(
        "SELECT * FROM tenants WHERE LOWER(username) = ? LIMIT 1"
      ).bind(cleanUser).first();
    }

    if (!tenantRow) {
      return new Response(JSON.stringify({ success: false, error: 'كود المتجر أو المستخدم غير مسجل' }), { status: 404, headers: CORS_HEADERS });
    }

    // A) Check Owner
    if (tenantRow.username.toLowerCase() === cleanUser && tenantRow.password_hash === password) {
      return new Response(JSON.stringify({
        success: true,
        authenticated: true,
        userType: 'owner',
        user: {
          id: tenantRow.id,
          storeCode: tenantRow.store_code,
          companyName: tenantRow.company_name,
          username: tenantRow.username,
          role: tenantRow.role || 'company_owner',
          status: tenantRow.status || 'active',
          expiresAt: tenantRow.expires_at,
          allowedBranches: tenantRow.allowed_branches || 1
        },
        tenant: {
          id: tenantRow.id,
          storeCode: tenantRow.store_code,
          companyName: tenantRow.company_name,
          role: tenantRow.role || 'company_owner',
          status: tenantRow.status || 'active',
          expiresAt: tenantRow.expires_at,
          allowedBranches: tenantRow.allowed_branches || 1
        }
      }), { headers: CORS_HEADERS });
    }

    // B) Check Staff
    const staffRow = await env.DB.prepare(
      "SELECT * FROM users WHERE tenant_id = ? AND LOWER(username) = ? AND password_hash = ? LIMIT 1"
    ).bind(tenantRow.id, cleanUser, password).first();

    if (staffRow) {
      let perms = {};
      try { perms = JSON.parse(staffRow.permissions_json); } catch (e) {}
      return new Response(JSON.stringify({
        success: true,
        authenticated: true,
        userType: 'staff',
        user: {
          id: staffRow.id,
          tenantId: staffRow.tenant_id,
          branchId: staffRow.branch_id || 'all',
          name: staffRow.name,
          username: staffRow.username,
          role: staffRow.role || 'cashier',
          status: staffRow.status || 'active',
          phone: staffRow.phone || '',
          permissions: perms
        },
        tenant: {
          id: tenantRow.id,
          storeCode: tenantRow.store_code,
          companyName: tenantRow.company_name,
          role: tenantRow.role || 'company_owner',
          status: tenantRow.status || 'active',
          expiresAt: tenantRow.expires_at,
          allowedBranches: tenantRow.allowed_branches || 1
        }
      }), { headers: CORS_HEADERS });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى'
    }), { status: 401, headers: CORS_HEADERS });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: CORS_HEADERS });
  }
}
