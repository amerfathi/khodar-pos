/**
 * Central Multi-Platform Release Service
 * Handles update detection, minimum supported version enforcement, and release notes
 */
import { APP_VERSION, MINIMUM_SUPPORTED_VERSION, getClientPlatform, compareSemver } from '../config/appVersion';
import { UPDATE_TYPES } from '../types/contracts';

// Embedded Fallback Releases (Offline-safe & Zero Mock Data)
export const OFFICIAL_RELEASES = [
  {
    id: 'rel-web-2-5-8',
    platform: 'web',
    version: '2.5.8',
    minimumVersion: '2.2.0',
    status: 'published',
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
  {
    id: 'rel-win-2-5-8',
    platform: 'windows',
    version: '2.5.8',
    minimumVersion: '2.2.0',
    status: 'published',
    updateType: 'required',
    releaseNotes: [
      'تحديثات مهمة لرفع كفاءة واستقرار المنظومة',
      'إصلاحات أمنية وبرمجية عامة وشاملة',
      'إضافة ميزات وترقيات تشغيلية جديدة',
      'تحسينات عامة على واجهة وتجربة المستخدم'
    ],
    downloadUrl: 'https://github.com/amerfathi/khodar-pos/releases/download/v2.5.8/KhodarPOS-Setup.exe',
    fileSizeBytes: 131108786,
    publishedAt: '2026-09-19T00:00:00Z'
  },
  {
    id: 'rel-and-2-5-0',
    platform: 'android',
    version: '2.5.0',
    minimumVersion: '2.2.0',
    status: 'published',
    updateType: 'recommended',
    releaseNotes: [
      'نظام استرداد كلمة المرور وتأمين الحسابات',
      'واجهة رئيسية للهواتف الذكية (Mobile Home Hub) سريعة ومريحة للمس',
      'شريط تنقل سفلي ذكي ومزامنة سحابية مع Cloudflare D1'
    ],
    downloadUrl: 'https://khodar-pos.pages.dev/downloads/KhodarPOS.apk',
    fileSizeBytes: 3386842,
    publishedAt: '2026-09-19T00:00:00Z'
  }
];

export async function checkLatestRelease(customPlatform = null) {
  const platform = customPlatform || getClientPlatform();
  const currentVersion = APP_VERSION;

  // Use live Cloudflare domain when on Electron desktop file:/// or mobile
  const baseUrl = (typeof window !== 'undefined' && window.location?.origin && window.location.origin.startsWith('http'))
    ? window.location.origin
    : 'https://khodar-pos.pages.dev';

  try {
    // Attempt remote check first
    const res = await fetch(`${baseUrl}/api/releases/latest?platform=${platform}&current=${currentVersion}`, {
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
