/**
 * GET /api/releases/latest?platform=windows&current=2.3.1
 * Cloudflare Pages Function
 */

const FALLBACK_RELEASES = {
  web: {
    version: '2.5.4',
    minimumVersion: '2.2.0',
    updateType: 'recommended',
    releaseNotes: [
      'تحديثات مهمة لرفع كفاءة واستقرار المنظومة',
      'إصلاحات أمنية وبرمجية عامة وشاملة',
      'إضافة ميزات وترقيات برمجية جديدة',
      'تحسينات عامة على واجهة وتجربة المستخدم'
    ],
    downloadUrl: 'https://khodar-pos.pages.dev',
    fileSizeBytes: 980000,
    publishedAt: '2026-09-19T00:00:00Z'
  },
  windows: {
    version: '2.5.4',
    minimumVersion: '2.2.0',
    updateType: 'required',
    releaseNotes: [
      'تحديثات مهمة لرفع كفاءة واستقرار المنظومة',
      'إصلاحات أمنية وبرمجية عامة وشاملة',
      'إضافة ميزات وترقيات تشغيلية جديدة',
      'تحسينات عامة على واجهة وتجربة المستخدم'
    ],
    downloadUrl: 'https://github.com/amerfathi/khodar-pos/releases/download/v2.5.4/KhodarPOS-Setup.exe',
    fileSizeBytes: 131108786,
    publishedAt: '2026-09-19T00:00:00Z'
  },
  android: {
    version: '2.5.0',
    minimumVersion: '2.2.0',
    updateType: 'recommended',
    releaseNotes: [
      'نظام استرداد كلمة المرور وتأمين الحسابات',
      'واجهة رئيسية للهواتف الذكية (Mobile Home Hub) سريعة ومريحة للمس',
      'شريط تنقل سفلي ذكي ومزامنة سحابية مع Cloudflare D1'
    ],
    downloadUrl: 'https://khodar-pos.pages.dev/downloads/KhodarPOS.apk',
    fileSizeBytes: 3386842,
    publishedAt: '2026-09-19T00:00:00Z'
  },
  ios: {
    version: '2.5.0',
    minimumVersion: '2.2.0',
    updateType: 'recommended',
    releaseNotes: [
      'نظام استرداد كلمة المرور وتأمين الحسابات',
      'دعم كامل كتطبيق PWA لشاشات iPhone و iPad'
    ],
    downloadUrl: 'https://khodar-pos.pages.dev',
    fileSizeBytes: 1200000,
    publishedAt: '2026-09-19T00:00:00Z'
  }
};

function compareSemver(v1, v2) {
  const p1 = (v1 || '0.0.0').split('.').map(n => parseInt(n, 10) || 0);
  const p2 = (v2 || '0.0.0').split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const a = p1[i] || 0;
    const b = p2[i] || 0;
    if (a > b) return 1;
    if (a < b) return -1;
  }
  return 0;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const platform = (url.searchParams.get('platform') || 'web').toLowerCase();
  const currentVersion = url.searchParams.get('current') || '1.0.0';

  let release = null;

  // 1. Try fetching from Cloudflare D1
  if (env && env.DB) {
    try {
      const row = await env.DB.prepare(
        "SELECT * FROM app_releases WHERE platform = ? AND status = 'published' ORDER BY published_at DESC LIMIT 1"
      ).bind(platform).first();

      if (row) {
        let notes = [];
        try { notes = JSON.parse(row.release_notes); } catch (e) { notes = [row.release_notes]; }
        release = {
          version: row.version,
          minimumVersion: row.minimum_version,
          updateType: row.update_type,
          releaseNotes: notes,
          downloadUrl: row.download_url,
          fileSizeBytes: row.file_size_bytes,
          publishedAt: row.published_at
        };
      }
    } catch (e) {
      // D1 query failed or table not yet migrated; will use FALLBACK_RELEASES
    }
  }

  if (!release) {
    release = FALLBACK_RELEASES[platform] || FALLBACK_RELEASES.web;
  }

  const isAvailable = compareSemver(release.version, currentVersion) > 0;
  const isBelowMin = compareSemver(currentVersion, release.minimumVersion) < 0;
  const isRequired = isBelowMin || release.updateType === 'required';

  const responsePayload = {
    platform,
    currentVersion,
    latestVersion: release.version,
    minimumVersion: release.minimumVersion,
    isUpdateAvailable: isAvailable,
    isRequired,
    updateType: isRequired ? 'required' : (isAvailable ? release.updateType : 'none'),
    releaseNotes: release.releaseNotes || [],
    downloadUrl: release.downloadUrl,
    fileSizeBytes: release.fileSizeBytes,
    publishedAt: release.publishedAt
  };

  return new Response(JSON.stringify(responsePayload), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}
