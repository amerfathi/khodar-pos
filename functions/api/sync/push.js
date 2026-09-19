// Cloudflare Pages Function: Push Synchronization (Multi-Tenant)
// Handles batched mutations from offline or live POS instances

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  try {
    const body = await request.json();
    const { tenantId, branchId, events } = body;

    if (!tenantId || !Array.isArray(events)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'بيانات المزامنة غير صالحة: tenantId ومصفوفة events إلزامية'
      }), { status: 400, headers: corsHeaders });
    }

    if (!env.DB) {
      // Mock / Local mode fallback
      return new Response(JSON.stringify({
        success: true,
        mode: 'preview_without_d1',
        syncedCount: events.length,
        message: 'تم استقبال أحداث المزامنة بنجاح (D1 Binding pending)',
        timestamp: Date.now()
      }), { status: 200, headers: corsHeaders });
    }

    // Insert events into D1 sync_events table inside a transaction or batch
    const statements = events.map(evt => {
      const eventId = evt.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const payload = typeof evt.payload === 'string' ? evt.payload : JSON.stringify(evt.payload || {});
      const clientTime = evt.timestamp || Date.now();

      return env.DB.prepare(`
        INSERT OR IGNORE INTO sync_events (id, tenant_id, branch_id, entity_type, entity_id, action, payload_json, client_timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        eventId,
        tenantId,
        branchId || null,
        evt.entityType || 'unknown',
        evt.entityId || 'none',
        evt.action || 'update',
        payload,
        clientTime
      );
    });

    if (statements.length > 0) {
      await env.DB.batch(statements);
    }

    return new Response(JSON.stringify({
      success: true,
      syncedCount: events.length,
      serverTimestamp: Date.now()
    }), { status: 200, headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'حدث خطأ غير متوقع أثناء معالجة المزامنة السحابية'
    }), { status: 500, headers: corsHeaders });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}
