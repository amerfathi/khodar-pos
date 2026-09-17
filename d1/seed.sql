-- Initial Seeding for Cloudflare D1
INSERT OR IGNORE INTO tenants (id, company_name, username, password_hash, role, status, expires_at, allowed_branches, phone, notes)
VALUES 
('tenant-super-admin', 'إدارة المنصة الرئيسية (المالك)', 'admin', 'admin', 'super_admin', 'active', '2099-12-31', 99, '', 'حساب مالك المنصة'),
('tenant-demo', 'سوق ومحل الخضار والفواكه', 'demo', '123', 'company_owner', 'active', '2028-12-31', 3, '0500000000', 'حساب تجريبي');

INSERT OR IGNORE INTO branches (id, tenant_id, name, code, phone, address, manager_name, is_main, status)
VALUES 
('branch-main', 'tenant-demo', 'الفرع الرئيسي (السوق المركزي)', 'BR-01', '0500000001', 'السوق المركزي - جناح أ - بوابة 3', 'مدير المحل الرئيسي', 1, 'active'),
('branch-north', 'tenant-demo', 'فرع الشمال (حي المروج)', 'BR-02', '0500000002', 'حي المروج - طريق الملك عبدالعزيز', 'أبو فهد', 0, 'active');
