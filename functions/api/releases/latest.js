/**
 * GET /api/releases/latest?platform=windows&current=2.6.2
 * Cloudflare Pages Function — Live Release Manifest
 * 
 * Source of truth: D1 table `app_releases`
 * Fallback: FALLBACK_RELEASES (updated on each release)
 * 
 * To publish a new release, INSERT a row into D1 — no code change needed.
 */

// ─── FALLBACK RELEASES ────────────────────────────────────────────────────────
// Updated automatically on each release. Used when D1 is unreachable.
// IMPORTANT: Keep this in sync with the latest published version.
const CURRENT_VERSION = '2.6.3';
const MINIMUM_VERSION = '2.2.0';

const FALLBACK_RELEASES = {
  web: {
    version: CURRENT_VERSION,
    minimumVersion: MINIMUM_VERSION,
    updateType: 'recommended',
    releaseNotes: [
      'إصلاح شاشة الخطأ في سجل الفواتير ومركز التقارير',
      'إصلاح المزامنة الثنائية الاتجاه Desktop ↔ Web في 4 ثواني',
      'إصلاح cursor المزامنة لضمان وصول التحديثات من جميع الأجهزة'
    ],
    downloadUrl: 'https://khodar-pos.pages.dev',
    fileSizeBytes: 980000,
    publishedAt: '2026-09-21T00:00:00Z'
  },
  windows: {
    version: CURRENT_VERSION,
    minimumVersion: MINIMUM_VERSION,
    updateType: 'recommended',
    releaseNotes: [
      'إصلاح شاشة الخطأ في سجل الفواتير ومركز التقارير',
      'إصلاح المزامنة الثنائية الاتجاه Desktop ↔ Web في 4 ثواني',
      'إصلاح cursor المزامنة لضمان وصول التحديثات من جميع الأجهزة'
    ],
    downloadUrl: `https://github.com/amerfathi/khodar-pos/releases/download/v${CURRENT_VERSION}/KhodarPOS-Setup.exe`,
    fileSizeBytes: 133955791,
    publishedAt: '2026-09-21T00:00:00Z'
  },
  android: {
    version: CURRENT_VERSION,
    minimumVersion: MINIMUM_VERSION,
    updateType: 'recommended',
    releaseNotes: [
      'إصلاح شاشة الخطأ في سجل الفواتير ومركز التقارير',
      'إصلاح المزامنة الثنائية الاتجاه بشكل كامل',
      'التطبيق يُحدَّث تلقائياً من السحابة عند كل فتح'
    ],
    downloadUrl: `https://github.com/amerfathi/khodar-pos/releases/download/v${CURRENT_VERSION}/KhodarPOS.apk`,
    fileSizeBytes: 5577618,
    publishedAt: '2026-09-21T00:00:00Z'
  },
  ios: {
    version: CURRENT_VERSION,
    minimumVersion: MINIMUM_VERSION,
    updateType: 'recommended',
    releaseNotes: [
      'إصلاح شاشة الخطأ في سجل الفواتير ومركز التقارير',
      'تحديثات تلقائية عبر PWA'
    ],
    downloadUrl: 'https://khodar-pos.pages.dev',
    fileSizeBytes: 1200000,
    publishedAt: '2026-09-21T00:00:00Z'
  }
};
// ─────────────────────────────────────────────────────────────────────────────

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

  // ── 1. Try D1 database (source of truth for live releases) ──────────────────
  if (env && env.DB) {
    try {
      // Ensure table exists (idempotent)
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS app_releases (
          id TEXT PRIMARY KEY,
          platform TEXT NOT NULL,
          version TEXT NOT NULL,
          minimum_version TEXT NOT NULL DEFAULT '2.2.0',
          status TEXT NOT NULL DEFAULT 'published',
          update_type TEXT NOT NULL DEFAULT 'recommended',
          release_notes TEXT,
          download_url TEXT,
          file_size_bytes INTEGER DEFAULT 0,
          published_at TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        )
      `).run();

      const { results } = await env.DB.prepare(
        "SELECT * FROM app_releases WHERE platform = ? AND status = 'published'"
      ).bind(platform).all();

      if (results && results.length > 0) {
        results.sort((a, b) => compareSemver(b.version, a.version));
        const row = results[0];
        let notes = [];
        try { notes = JSON.parse(row.release_notes); } catch (e) { notes = [row.release_notes || '']; }
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
      // D1 unavailable — fall through to hardcoded fallback
    }
  }

  // ── 2. Fallback to hardcoded release data ───────────────────────────────────
  if (!release) {
    release = FALLBACK_RELEASES[platform] || FALLBACK_RELEASES.web;
  }

  // ── 3. Compute update availability ─────────────────────────────────────────
  const isAvailable = compareSemver(release.version, currentVersion) > 0;
  const isBelowMin = compareSemver(currentVersion, release.minimumVersion) < 0;
  const isRequired = isBelowMin || release.updateType === 'required';

  return new Response(JSON.stringify({
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
  }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}
