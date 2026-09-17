/**
 * Central Version & Platform Detection
 * Semantic Versioning: MAJOR.MINOR.PATCH
 */

export const APP_VERSION = '2.4.0';
export const APP_BUILD_NUMBER = 2400;
export const APP_RELEASE_DATE = '2026-09-18';
export const MINIMUM_SUPPORTED_VERSION = '2.2.0';

export function getClientPlatform() {
  if (typeof window === 'undefined') return 'web';

  // 1. Electron Desktop Window
  if (window.electronAPI?.isElectron || window.navigator.userAgent.includes('Electron')) {
    return 'windows';
  }

  // 2. Capacitor Mobile (Android / iOS Native App)
  if (window.Capacitor?.isNativePlatform?.() || window.location.protocol === 'capacitor:') {
    const p = window.Capacitor?.getPlatform ? window.Capacitor.getPlatform() : (window.Capacitor?.platform || 'android');
    return p === 'ios' ? 'ios' : 'android';
  }

  // 3. Web App (Mobile Browser or Desktop Browser - continuously updated)
  return 'web';
}

export function compareSemver(v1, v2) {
  // Returns:
  //  1 if v1 > v2
  // -1 if v1 < v2
  //  0 if v1 === v2
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
