// Cloudflare Pages Function: Pull Synchronization (Multi-Tenant)
// Retrieves updates since the last known sync timestamp for a tenant

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const tenantId = url.searchParams.get('tenantId');
  const since = parseInt(url.searchParams.get('since') || '0', 10);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '500', 10), 1000);

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (!tenantId) {
    return new Response(JSON.stringify({
      success: false,
      error: 'tenantId مطلوب للاستعلام عن التحديثات'
    }), { status: 400, headers: corsHeaders });
  }

  if (!env.DB) {
    return new Response(JSON.stringify({
      success: true,
      events: [],
      latestTimestamp: Date.now(),
      mode: 'preview_without_d1'
    }), { status: 200, headers: corsHeaders });
  }

  try {
    const query = `
      SELECT id, tenant_id, branch_id, entity_type, entity_id, action, payload_json, client_timestamp, server_timestamp
      FROM sync_events
      WHERE tenant_id = ? AND server_timestamp > ?
      ORDER BY server_timestamp ASC
      LIMIT ?
    `;

    const result = await env.DB.prepare(query).bind(tenantId, since, limit).all();

    const events = (result.results || []).map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      branchId: row.branch_id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      action: row.action,
      payload: (() => {
        try { return JSON.parse(row.payload_json); } catch { return row.payload_json; }
      })(),
      clientTimestamp: row.client_timestamp,
      serverTimestamp: row.server_timestamp
    }));

    const latestTimestamp = events.length > 0
      ? events[events.length - 1].serverTimestamp
      : since;

    return new Response(JSON.stringify({
      success: true,
      events,
      count: events.length,
      latestTimestamp
    }), { status: 200, headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'فشل جلب التحديثات من قاعدة بيانات كلاودفلير'
    }), { status: 500, headers: corsHeaders });
  }
}
