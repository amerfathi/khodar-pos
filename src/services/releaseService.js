/**
 * Central Multi-Platform Release Service
 * Handles update detection, minimum supported version enforcement, and release notes
 */
import { APP_VERSION, MINIMUM_SUPPORTED_VERSION, getClientPlatform, compareSemver } from '../config/appVersion';
import { UPDATE_TYPES } from '../types/contracts';

// Embedded Fallback Releases (Offline-safe & Zero Mock Data)
export const OFFICIAL_RELEASES = [
  {
    id: 'rel-web-2-4-0',
    platform: 'web',
    version: '2.4.0',
    minimumVersion: '2.2.0',
    status: 'published',
    updateType: 'recommended',
    releaseNotes: [
      'تحديث شامل لمنظومة واجهة وتجربة المستخدم المؤسسية (Quiet Luxury)',
      'توحيد كامل لمنظومة التطبيق (Web / Desktop / Mobile) من مصدر كود واحد',
      'إضافة لوحة إدارة الإصدارات والتحديثات المركزية',
      'تعزيز التوافق العكسي وتأمين كاش المتصفح'
    ],
    downloadUrl: 'https://khodar-pos.pages.dev',
    fileSizeBytes: 950000,
    publishedAt: '2026-09-18T00:00:00Z'
  },
  {
    id: 'rel-win-2-4-0',
    platform: 'windows',
    version: '2.4.0',
    minimumVersion: '2.2.0',
    status: 'published',
    updateType: 'recommended',
    releaseNotes: [
      'إطار نافذة مدمج فائق الأناقة (Frameless Custom Window)',
      'شريط جانبي مؤسسي متطور قابل للطي (Mini-rail 68px)',
      'دعم كامل للموازين الإلكترونية وطباعة الفواتير والباركود',
      'فحص تلقائي للتحديثات الجديدة عند الإقلاع'
    ],
    downloadUrl: 'https://khodar-pos.pages.dev/downloads/KhodarPOS-Setup.exe',
    fileSizeBytes: 120716182,
    publishedAt: '2026-09-18T00:00:00Z'
  },
  {
    id: 'rel-and-2-4-0',
    platform: 'android',
    version: '2.4.0',
    minimumVersion: '2.2.0',
    status: 'published',
    updateType: 'recommended',
    releaseNotes: [
      'واجهة رئيسية للهواتف الذكية (Mobile Home Hub) سريعة ومريحة للمس',
      'شريط تنقل سفلي ذكي (Bottom Navigation) مع مؤشر تفاعلي ناعم',
      'مزامنة سحابية فائقة السرعة مع قاعدة بيانات Cloudflare D1',
      'دعم كامل للعمل دون انترنت وحفظ المبيعات محلياً'
    ],
    downloadUrl: 'https://khodar-pos.pages.dev/downloads/KhodarPOS.apk',
    fileSizeBytes: 3386842,
    publishedAt: '2026-09-18T00:00:00Z'
  }
];

export async function checkLatestRelease(customPlatform = null) {
  const platform = customPlatform || getClientPlatform();
  const currentVersion = APP_VERSION;

  try {
    // Attempt remote check first
    const res = await fetch(`/api/releases/latest?platform=${platform}&current=${currentVersion}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    // Network offline or worker unavailable: fallback to embedded official release
  }

  const official = OFFICIAL_RELEASES.find(r => r.platform === platform) || OFFICIAL_RELEASES[0];
  const isAvailable = compareSemver(official.version, currentVersion) > 0;
  const isRequired = compareSemver(currentVersion, official.minimumVersion) < 0 || official.updateType === 'required';

  return {
    platform,
    currentVersion,
    latestVersion: official.version,
    minimumVersion: official.minimumVersion,
    isUpdateAvailable: isAvailable,
    isRequired,
    updateType: isRequired ? UPDATE_TYPES.REQUIRED : (isAvailable ? official.updateType : UPDATE_TYPES.NONE),
    releaseNotes: official.releaseNotes || [],
    downloadUrl: official.downloadUrl,
    fileSizeBytes: official.fileSizeBytes,
    publishedAt: official.publishedAt
  };
}
