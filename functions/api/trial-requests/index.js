/**
 * GET, POST, PATCH, DELETE /api/trial-requests
 * Cloudflare Pages Function for SuperAdmin Central Trial Requests
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
    return new Response(JSON.stringify({ success: true, requests: [] }), { headers: CORS_HEADERS });
  }

  try {
    const { results } = await env.DB.prepare(
      "SELECT * FROM trial_requests ORDER BY timestamp DESC"
    ).all();

    const formatted = (results || []).map(r => ({
      id: r.id,
      name: r.name,
      shopName: r.shop_name,
      phone: r.phone,
      city: r.city,
      notes: r.notes,
      status: r.status,
      tenantUsername: r.tenant_username,
      createdAt: r.created_at,
      timestamp: r.timestamp
    }));

    return new Response(JSON.stringify({ success: true, requests: formatted }), {
      headers: CORS_HEADERS
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message, requests: [] }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env || !env.DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database not available' }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }

  try {
    const body = await request.json();
    const id = body.id || `trial-${Date.now()}`;
    const name = (body.name || '').trim();
    const shopName = (body.shopName || body.shop_name || '').trim();
    const phone = (body.phone || '').trim();
    const city = (body.city || '').trim();
    const notes = (body.notes || '').trim();
    const status = body.status || 'pending';
    const tenantUsername = body.tenantUsername || body.tenant_username || '';
    const createdAt = body.createdAt || body.created_at || new Date().toISOString().split('T')[0];
    const timestamp = body.timestamp || Date.now();

    if (!name || !shopName || !phone) {
      return new Response(JSON.stringify({ success: false, error: 'الاسم واسم المحل ورقم الهاتف مطلوبين' }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }

    await env.DB.prepare(
      `INSERT OR REPLACE INTO trial_requests 
       (id, name, shop_name, phone, city, notes, status, tenant_username, created_at, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, name, shopName, phone, city, notes, status, tenantUsername, createdAt, timestamp).run();

    const createdReq = {
      id,
      name,
      shopName,
      phone,
      city,
      notes,
      status,
      tenantUsername,
      createdAt,
      timestamp
    };

    return new Response(JSON.stringify({ success: true, request: createdReq }), {
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
    return new Response(JSON.stringify({ success: false, error: 'Database not available' }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }

  try {
    const body = await request.json();
    const { id, status, tenantUsername } = body;
    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'معرف الطلب مطلوب' }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }

    await env.DB.prepare(
      `UPDATE trial_requests 
       SET status = COALESCE(?, status), 
           tenant_username = COALESCE(?, tenant_username) 
       WHERE id = ?`
    ).bind(status || null, tenantUsername || null, id).run();

    return new Response(JSON.stringify({ success: true, id, status, tenantUsername }), {
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
    return new Response(JSON.stringify({ success: false, error: 'Database not available' }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'معرف الطلب مطلوب' }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }

    await env.DB.prepare("DELETE FROM trial_requests WHERE id = ?").bind(id).run();

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
