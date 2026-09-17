-- Migration 0002: App Releases & Multi-Platform Update Management
CREATE TABLE IF NOT EXISTS app_releases (
    id TEXT PRIMARY KEY,
    platform TEXT NOT NULL,          -- 'web', 'windows', 'android', 'ios'
    version TEXT NOT NULL,           -- '2.4.0'
    minimum_version TEXT NOT NULL,   -- '2.2.0'
    status TEXT NOT NULL DEFAULT 'published', -- 'published', 'draft', 'deprecated'
    update_type TEXT NOT NULL DEFAULT 'recommended', -- 'optional', 'recommended', 'required'
    release_notes TEXT NOT NULL,     -- JSON array of strings
    download_url TEXT,
    file_size_bytes INTEGER DEFAULT 0,
    sha256 TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    published_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_releases_platform ON app_releases(platform, published_at DESC);

-- Seed current 2.4.0 releases
INSERT OR REPLACE INTO app_releases (id, platform, version, minimum_version, status, update_type, release_notes, download_url, file_size_bytes)
VALUES
('rel-web-2-4-0', 'web', '2.4.0', '2.2.0', 'published', 'recommended', '["تحديث شامل لمنظومة واجهة وتجربة المستخدم المؤسسية (Quiet Luxury)","توحيد كامل لمنظومة التطبيق (Web / Desktop / Mobile)","إدارة الإصدارات والتحديثات المركزية"]', 'https://khodar-pos.pages.dev', 950000),
('rel-win-2-4-0', 'windows', '2.4.0', '2.2.0', 'published', 'recommended', '["إطار نافذة مدمج فائق الأناقة (Frameless Custom Window)","شريط جانبي مؤسسي متطور قابل للطي (Mini-rail 68px)","دعم كامل للموازين الإلكترونية وطباعة الفواتير والباركود"]', 'https://khodar-pos.pages.dev/downloads/KhodarPOS-Setup.exe', 120716182),
('rel-and-2-4-0', 'android', '2.4.0', '2.2.0', 'published', 'recommended', '["واجهة رئيسية للهواتف الذكية (Mobile Home Hub) سريعة ومريحة للمس","شريط تنقل سفلي ذكي (Bottom Navigation) مع مؤشر تفاعلي ناعم","مزامنة سحابية فائقة السرعة مع قاعدة بيانات Cloudflare D1"]', 'https://khodar-pos.pages.dev/downloads/KhodarPOS.apk', 3386842),
('rel-ios-2-4-0', 'ios', '2.4.0', '2.2.0', 'published', 'recommended', '["دعم كامل كتطبيق PWA لشاشات iPhone و iPad","سرعة فائقة في معالجة فواتير الخضار وحفظ سحابي فوري"]', 'https://khodar-pos.pages.dev', 1200000);
