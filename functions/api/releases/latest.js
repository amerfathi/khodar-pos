/**
 * GET /api/releases/latest?platform=windows&current=2.3.1
 * Cloudflare Pages Function
 */

const FALLBACK_RELEASES = {
  web: {
    version: '2.6.1',
    minimumVersion: '2.2.0',
    updateType: 'recommended',
    releaseNotes: [
      'مركز تقارير استراتيجي بتصميم بطاقات تنفيذية موحدة',
      'إضافة تقارير الأرباح والهوامش وأعمار الديون والوردية وحساب الموردين',
      'تحسينات عامة على واجهة وتجربة المستخدم'
    ],
    downloadUrl: 'https://khodar-pos.pages.dev',
    fileSizeBytes: 980000,
    publishedAt: '2026-09-20T00:00:00Z'
  },
  windows: {
    version: '2.6.1',
    minimumVersion: '2.2.0',
    updateType: 'recommended',
    releaseNotes: [
      'مركز تقارير استراتيجي بتصميم بطاقات تنفيذية موحدة',
      'إضافة تقارير الأرباح والهوامش وأعمار الديون والوردية وحساب الموردين',
      'تحسينات عامة على واجهة وتجربة المستخدم'
    ],
    downloadUrl: 'https://github.com/amerfathi/khodar-pos/releases/download/v2.6.1/KhodarPOS-Setup.exe',
    fileSizeBytes: 131108786,
    publishedAt: '2026-09-20T00:00:00Z'
  },
  android: {
    version: '2.6.1',
    minimumVersion: '2.2.0',
    updateType: 'recommended',
    releaseNotes: [
      'مركز تقارير استراتيجي بتصميم بطاقات تنفيذية موحدة',
      'شاشة ترحيبية انسيابية (Splash Screen) وخطوط آبل الرسمية',
      'إضافة تقارير الأرباح والهوامش وأعمار الديون والوردية وحساب الموردين'
    ],
    downloadUrl: 'https://github.com/amerfathi/khodar-pos/releases/download/v2.6.1/KhodarPOS.apk',
    fileSizeBytes: 5577618,
    publishedAt: '2026-09-20T00:00:00Z'
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
      const { results } = await env.DB.prepare(
        "SELECT * FROM app_releases WHERE platform = ? AND status = 'published'"
      ).bind(platform).all();

      if (results && results.length > 0) {
        // Sort by semantic version descending so the true newest version always wins regardless of date format
        results.sort((a, b) => compareSemver(b.version, a.version));
        const row = results[0];

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
      // D1 query failed; will use FALLBACK_RELEASES
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
