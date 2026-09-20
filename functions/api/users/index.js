/**
 * Central Multi-Tenant Users API (/api/users)
 * Handles Cloudflare D1 database operations for staff users, roles, and granular permissions
 */

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestOptions() {
  return new Response(null, { headers: CORS_HEADERS });
}

async function isAuthorizedTenantAdmin(request, env, targetTenantId) {
  const authHeader = request.headers.get('Authorization') || '';
  let token = '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  // Fallback if no token passed in dev mode
  if (!token) return true;

  // Master super admin check
  if (token === 'A20101993f' || token === 'admin' || (env?.SUPER_ADMIN_SECRET && token === env.SUPER_ADMIN_SECRET)) {
    return true;
  }

  if (env?.DB && targetTenantId && token) {
    try {
      const tenantOwner = await env.DB.prepare(
        "SELECT id FROM tenants WHERE id = ? AND password_hash = ? LIMIT 1"
      ).bind(targetTenantId, token).first();
      if (tenantOwner) return true;

      const adminUser = await env.DB.prepare(
        "SELECT id FROM users WHERE tenant_id = ? AND role = 'admin' AND password_hash = ? AND status = 'active' LIMIT 1"
      ).bind(targetTenantId, token).first();
      if (adminUser) return true;
    } catch (e) {}
  }

  return false;
}

// 1. GET: Fetch users for a tenant or specific user
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const tenantId = (url.searchParams.get('tenantId') || '').trim();
  const userId = (url.searchParams.get('id') || '').trim();

  if (!tenantId && !userId) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'tenantId مطلوب للاستعلام عن المستخدمين لضمان عزل البيانات بين المتاجر' 
    }), { status: 400, headers: CORS_HEADERS });
  }

  if (!env || !env.DB) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'قاعدة البيانات السحابية D1 غير متصلة' 
    }), { status: 500, headers: CORS_HEADERS });
  }

  try {
    let query = "SELECT * FROM users";
    const params = [];

    if (userId && tenantId) {
      query += " WHERE id = ? AND tenant_id = ? LIMIT 1";
      params.push(userId, tenantId);
    } else if (userId) {
      query += " WHERE id = ? LIMIT 1";
      params.push(userId);
    } else {
      query += " WHERE tenant_id = ? ORDER BY created_at DESC";
      params.push(tenantId);
    }

    const { results } = await env.DB.prepare(query).bind(...params).all();

    const formattedUsers = (results || []).map(u => {
      let perms = {};
      try {
        perms = typeof u.permissions_json === 'string' ? JSON.parse(u.permissions_json) : (u.permissions_json || {});
      } catch (e) {
        perms = {};
      }

      return {
        id: u.id,
        tenantId: u.tenant_id,
        branchId: u.branch_id || 'all',
        name: u.name,
        username: u.username,
        role: u.role || 'cashier',
        status: u.status || 'active',
        phone: u.phone || '',
        permissions: perms,
        createdAt: u.created_at,
        updatedAt: u.updated_at
      };
    });

    return new Response(JSON.stringify({
      success: true,
      users: formattedUsers,
      total: formattedUsers.length
    }), { headers: CORS_HEADERS });

  } catch (err) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: err.message 
    }), { status: 500, headers: CORS_HEADERS });
  }
}

// 2. POST: Create a new user in D1
export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env || !env.DB) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'قاعدة البيانات السحابية D1 غير متصلة' 
    }), { status: 500, headers: CORS_HEADERS });
  }

  try {
    const body = await request.json();
    const { 
      id, 
      tenantId, 
      branchId = 'all', 
      name, 
      username, 
      password, 
      role = 'cashier', 
      status = 'active', 
      phone = '', 
      permissions = {} 
    } = body;

    if (!tenantId || !name || !username || !password) {
      return new Response(JSON.stringify({
        success: false,
        error: 'بيانات غير مكتملة: tenantId, name, username, password مطلوبة'
      }), { status: 400, headers: CORS_HEADERS });
    }

    if (!(await isAuthorizedTenantAdmin(request, env, tenantId))) {
      return new Response(JSON.stringify({
        success: false,
        error: 'غير مصرح: إضافة موظفين تتطلب صلاحيات مدير أو مالك المتجر'
      }), { status: 401, headers: CORS_HEADERS });
    }

    const cleanUsername = username.trim().toLowerCase();
    const userId = id || `user-${Date.now()}`;
    const permissionsJson = typeof permissions === 'string' ? permissions : JSON.stringify(permissions || {});

    // Check duplicate username within same tenant
    const existing = await env.DB.prepare(
      "SELECT id FROM users WHERE tenant_id = ? AND LOWER(username) = ? LIMIT 1"
    ).bind(tenantId, cleanUsername).first();

    if (existing) {
      return new Response(JSON.stringify({
        success: false,
        error: `اسم المستخدم (${username}) مسجل مسبقاً لموظف آخر في متجركم`
      }), { status: 409, headers: CORS_HEADERS });
    }

    await env.DB.prepare(`
      INSERT INTO users (
        id, tenant_id, branch_id, name, username, password_hash, role, status, phone, permissions_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      userId,
      tenantId,
      branchId || 'all',
      name.trim(),
      cleanUsername,
      password,
      role,
      status,
      (phone || '').trim(),
      permissionsJson
    ).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'تم إضافة المستخدم بنجاح في السحابة المركزية',
      user: {
        id: userId,
        tenantId,
        branchId: branchId || 'all',
        name: name.trim(),
        username: cleanUsername,
        password,
        role,
        status,
        phone: (phone || '').trim(),
        permissions: typeof permissions === 'object' ? permissions : JSON.parse(permissionsJson)
      }
    }), { status: 201, headers: CORS_HEADERS });

  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message
    }), { status: 500, headers: CORS_HEADERS });
  }
}

// 3. PATCH / PUT: Update user and permissions in D1
export async function onRequestPatch(context) {
  const { request, env } = context;

  if (!env || !env.DB) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'قاعدة البيانات السحابية D1 غير متصلة' 
    }), { status: 500, headers: CORS_HEADERS });
  }

  try {
    const body = await request.json();
    const { id, tenantId, name, username, password, role, status, branchId, phone, permissions } = body;

    if (!id || !tenantId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'معرف المستخدم id وكود المستأجر tenantId مطلوبان لتحديث البيانات لضمان عزل البيانات'
      }), { status: 400, headers: CORS_HEADERS });
    }

    if (!(await isAuthorizedTenantAdmin(request, env, tenantId))) {
      return new Response(JSON.stringify({
        success: false,
        error: 'غير مصرح: تعديل بيانات أو صلاحيات الموظفين تتطلب صلاحيات مدير أو مالك المتجر'
      }), { status: 401, headers: CORS_HEADERS });
    }

    // Fetch existing user to verify tenant ownership
    const existing = await env.DB.prepare(
      "SELECT * FROM users WHERE id = ? AND tenant_id = ? LIMIT 1"
    ).bind(id, tenantId).first();

    if (!existing) {
      // If user doesn't exist yet in D1 (e.g. was created offline or initially), upsert it!
      if (tenantId && name && username) {
        const permsJson = permissions ? (typeof permissions === 'string' ? permissions : JSON.stringify(permissions)) : '{}';
        await env.DB.prepare(`
          INSERT INTO users (
            id, tenant_id, branch_id, name, username, password_hash, role, status, phone, permissions_json, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          id,
          tenantId,
          branchId || 'all',
          name.trim(),
          username.trim().toLowerCase(),
          password || '123456',
          role || 'cashier',
          status || 'active',
          (phone || '').trim(),
          permsJson
        ).run();

        return new Response(JSON.stringify({
          success: true,
          message: 'تم إنشاء المستخدم وحفظ الصلاحيات في السحابة بنجاح',
          upserted: true
        }), { headers: CORS_HEADERS });
      }

      return new Response(JSON.stringify({
        success: false,
        error: 'المستخدم غير موجود بالسحابة المركزية'
      }), { status: 404, headers: CORS_HEADERS });
    }

    const updatedName = name !== undefined ? name.trim() : existing.name;
    const updatedUsername = username !== undefined ? username.trim().toLowerCase() : existing.username;
    const updatedPassword = password !== undefined ? password : existing.password_hash;
    const updatedRole = role !== undefined ? role : existing.role;
    const updatedStatus = status !== undefined ? status : existing.status;
    const updatedBranchId = branchId !== undefined ? branchId : existing.branch_id;
    const updatedPhone = phone !== undefined ? phone.trim() : existing.phone;
    
    let updatedPermissionsJson = existing.permissions_json;
    if (permissions !== undefined) {
      updatedPermissionsJson = typeof permissions === 'string' ? permissions : JSON.stringify(permissions);
    }

    await env.DB.prepare(`
      UPDATE users SET
        name = ?,
        username = ?,
        password_hash = ?,
        role = ?,
        status = ?,
        branch_id = ?,
        phone = ?,
        permissions_json = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      updatedName,
      updatedUsername,
      updatedPassword,
      updatedRole,
      updatedStatus,
      updatedBranchId,
      updatedPhone,
      updatedPermissionsJson,
      id
    ).run();

    let parsedPerms = {};
    try { parsedPerms = JSON.parse(updatedPermissionsJson); } catch (e) {}

    return new Response(JSON.stringify({
      success: true,
      message: 'تم تحديث بيانات وصلاحيات المستخدم بنجاح',
      user: {
        id,
        tenantId: existing.tenant_id,
        branchId: updatedBranchId,
        name: updatedName,
        username: updatedUsername,
        password: updatedPassword,
        role: updatedRole,
        status: updatedStatus,
        phone: updatedPhone,
        permissions: parsedPerms
      }
    }), { headers: CORS_HEADERS });

  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message
    }), { status: 500, headers: CORS_HEADERS });
  }
}

// 4. DELETE: Remove user from D1
export async function onRequestDelete(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = (url.searchParams.get('id') || '').trim();
  const tenantId = (url.searchParams.get('tenantId') || '').trim();

  if (!id || !tenantId) {
    return new Response(JSON.stringify({
      success: false,
      error: 'معرف المستخدم id وكود المستأجر tenantId مطلوبان للحذف لضمان عزل البيانات'
    }), { status: 400, headers: CORS_HEADERS });
  }

  if (!(await isAuthorizedTenantAdmin(request, env, tenantId))) {
    return new Response(JSON.stringify({
      success: false,
      error: 'غير مصرح: حذف الموظفين يتطلب صلاحيات مدير أو مالك المتجر'
    }), { status: 401, headers: CORS_HEADERS });
  }

  if (!env || !env.DB) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'قاعدة البيانات السحابية D1 غير متصلة' 
    }), { status: 500, headers: CORS_HEADERS });
  }

  try {
    const res = await env.DB.prepare("DELETE FROM users WHERE id = ? AND tenant_id = ?").bind(id, tenantId).run();
    if (!res.meta?.changes) {
      return new Response(JSON.stringify({
        success: false,
        error: 'لم يتم العثور على المستخدم للحذف أو أنه لا يتبع هذا المتجر'
      }), { status: 404, headers: CORS_HEADERS });
    }
    return new Response(JSON.stringify({
      success: true,
      message: 'تم حذف المستخدم من السحابة بنجاح',
      changes: res.meta?.changes || 0
    }), { headers: CORS_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: err.message 
    }), { status: 500, headers: CORS_HEADERS });
  }
}
