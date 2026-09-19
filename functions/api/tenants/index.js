/**
 * Central Cloud Tenants API (/api/tenants)
 * Manages Multi-Tenant store accounts across all platforms
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

export async function onRequestGet(context) {
  const { env } = context;
  if (!env || !env.DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database unavailable', tenants: [] }), { headers: CORS_HEADERS });
  }

  try {
    const { results } = await env.DB.prepare(
      "SELECT * FROM tenants ORDER BY created_at DESC"
    ).all();

    const formatted = (results || []).map(r => ({
      id: r.id,
      storeCode: r.store_code || 'BRK-101',
      companyName: r.company_name,
      username: r.username,
      password: r.password_hash,
      role: r.role || 'company_owner',
      status: r.status || 'active',
      expiresAt: r.expires_at,
      allowedBranches: r.allowed_branches || 1,
      phone: r.phone || '',
      notes: r.notes || '',
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));

    return new Response(JSON.stringify({ success: true, tenants: formatted }), {
      headers: CORS_HEADERS
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message, tenants: [] }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env || !env.DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database unavailable' }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }

  try {
    const body = await request.json();
    const id = body.id || `tenant-${Date.now()}`;
    const storeCode = (body.storeCode || '').trim().toUpperCase();
    const companyName = (body.companyName || '').trim();
    const username = (body.username || '').trim().toLowerCase();
    const password = body.password || '123456';
    const role = body.role || 'company_owner';
    const status = body.status || 'active';
    const expiresAt = body.expiresAt || '2099-12-31';
    const allowedBranches = Number(body.allowedBranches) || 1;
    const phone = (body.phone || '').trim();
    const notes = (body.notes || '').trim();
    const now = new Date().toISOString();

    if (!username || !storeCode) {
      return new Response(JSON.stringify({ success: false, error: 'اسم المستخدم وكود المتجر مطلوبان' }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }

    // Check conflict
    const existing = await env.DB.prepare(
      "SELECT id FROM tenants WHERE LOWER(username) = ? OR UPPER(store_code) = ? LIMIT 1"
    ).bind(username, storeCode).first();

    if (existing && existing.id !== id) {
      return new Response(JSON.stringify({ success: false, error: 'اسم المستخدم أو كود المتجر مسجل مسبقاً' }), {
        status: 409,
        headers: CORS_HEADERS
      });
    }

    await env.DB.prepare(
      `INSERT OR REPLACE INTO tenants 
       (id, store_code, company_name, username, password_hash, role, status, expires_at, allowed_branches, phone, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM tenants WHERE id = ?), ?), ?)`
    ).bind(
      id, storeCode, companyName, username, password, role, status, expiresAt, allowedBranches, phone, notes, id, now, now
    ).run();

    const createdTenant = {
      id,
      storeCode,
      companyName,
      username,
      password,
      role,
      status,
      expiresAt,
      allowedBranches,
      phone,
      notes,
      createdAt: now,
      updatedAt: now
    };

    return new Response(JSON.stringify({ success: true, tenant: createdTenant }), {
      headers: CORS_HEADERS
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}

export async function onRequestPatch(context) {
  const { request, env } = context;
  if (!env || !env.DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database unavailable' }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }

  try {
    const body = await request.json();
    const { id } = body;
    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'معرف المتجر (id) مطلوب' }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }

    const updates = [];
    const bindings = [];

    if (body.storeCode !== undefined) {
      updates.push("store_code = ?");
      bindings.push(body.storeCode.trim().toUpperCase());
    }
    if (body.companyName !== undefined) {
      updates.push("company_name = ?");
      bindings.push(body.companyName.trim());
    }
    if (body.username !== undefined) {
      updates.push("username = ?");
      bindings.push(body.username.trim().toLowerCase());
    }
    if (body.password !== undefined) {
      updates.push("password_hash = ?");
      bindings.push(body.password);
    }
    if (body.status !== undefined) {
      updates.push("status = ?");
      bindings.push(body.status);
    }
    if (body.expiresAt !== undefined) {
      updates.push("expires_at = ?");
      bindings.push(body.expiresAt);
    }
    if (body.allowedBranches !== undefined) {
      updates.push("allowed_branches = ?");
      bindings.push(Number(body.allowedBranches) || 1);
    }
    if (body.phone !== undefined) {
      updates.push("phone = ?");
      bindings.push(body.phone.trim());
    }
    if (body.notes !== undefined) {
      updates.push("notes = ?");
      bindings.push(body.notes.trim());
    }

    updates.push("updated_at = ?");
    bindings.push(new Date().toISOString());

    bindings.push(id);

    const sql = `UPDATE tenants SET ${updates.join(', ')} WHERE id = ?`;
    await env.DB.prepare(sql).bind(...bindings).run();

    return new Response(JSON.stringify({ success: true, id, updates: body }), {
      headers: CORS_HEADERS
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  if (!env || !env.DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database unavailable' }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'معرف المتجر مطلوب' }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }

    await env.DB.prepare("DELETE FROM tenants WHERE id = ?").bind(id).run();

    return new Response(JSON.stringify({ success: true, id }), {
      headers: CORS_HEADERS
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}
