// Cloudflare Pages Function: Automated Cloud Backups
// Stores compressed/JSON state snapshots per tenant

export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const { tenantId, snapshot, version = '2.5.0' } = await request.json();

    if (!tenantId || !snapshot) {
      return new Response(JSON.stringify({
        success: false,
        error: 'بيانات غير مكتملة: tenantId و snapshot مطلوبة'
      }), { status: 400, headers: corsHeaders });
    }

    const snapshotString = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);
    const backupId = `bkp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sizeBytes = new TextEncoder().encode(snapshotString).length;

    if (!env.DB) {
      return new Response(JSON.stringify({
        success: true,
        backupId,
        sizeBytes,
        mode: 'preview_without_d1',
        message: 'تم استقبال النسخة الاحتياطية بنجاح'
      }), { status: 200, headers: corsHeaders });
    }

    await env.DB.prepare(`
      INSERT INTO tenant_backups (id, tenant_id, snapshot_json, size_bytes, version, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(backupId, tenantId, snapshotString, sizeBytes, version).run();

    return new Response(JSON.stringify({
      success: true,
      backupId,
      sizeBytes,
      timestamp: new Date().toISOString()
    }), { status: 200, headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'فشل حفظ النسخة الاحتياطية'
    }), { status: 500, headers: corsHeaders });
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const tenantId = url.searchParams.get('tenantId');

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (!tenantId) {
    return new Response(JSON.stringify({
      success: false,
      error: 'tenantId مطلوب لعرض النسخ الاحتياطية'
    }), { status: 400, headers: corsHeaders });
  }

  if (!env.DB) {
    return new Response(JSON.stringify({
      success: true,
      backups: []
    }), { status: 200, headers: corsHeaders });
  }

  try {
    const list = await env.DB.prepare(`
      SELECT id, tenant_id, size_bytes, version, created_at
      FROM tenant_backups
      WHERE tenant_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `).bind(tenantId).all();

    return new Response(JSON.stringify({
      success: true,
      backups: list.results || []
    }), { status: 200, headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'فشل استرجاع قائمة النسخ الاحتياطية'
    }), { status: 500, headers: corsHeaders });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}
