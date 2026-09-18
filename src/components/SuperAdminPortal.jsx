import React, { useState } from 'react';
import { OFFICIAL_RELEASES } from '../services/releaseService';
import { APP_VERSION } from '../config/appVersion';
import { 
  Building2, Users, Monitor, Smartphone, Globe, Download, Tag, Plus, ShieldCheck, Calendar, Clock, Phone, 
  Check, X, Copy, Trash2, Power, RefreshCw, Key, MessageCircle, 
  ExternalLink, Search, Sparkles, ArrowRight
} from 'lucide-react';

export default function SuperAdminPortal({ isOpen, onClose, store, onSwitchToStore }) {
  const { 
    tenants = [], 
    currentUser, 
    createTenantAccount, 
    updateTenantAccount, 
    deleteTenantAccount,
    trialRequests = [],
    updateTrialRequest,
    deleteTrialRequest
  } = store;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedTenantId, setCopiedTenantId] = useState(null);
  const [activatingTrialId, setActivatingTrialId] = useState(null);

  // New Tenant Form State
  const [companyName, setCompanyName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [durationMonths, setDurationMonths] = useState('12');
  const [allowedBranches, setAllowedBranches] = useState('1');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [createdWelcomeMsg, setCreatedWelcomeMsg] = useState(null);
  const [activeTab, setActiveTab] = useState('tenants'); // 'tenants' | 'releases' | 'trials'
  const [releasesList, setReleasesList] = useState(OFFICIAL_RELEASES);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [releaseForm, setReleaseForm] = useState({
    platform: 'windows',
    version: '2.4.1',
    minimum_version: '2.2.0',
    update_type: 'recommended',
    release_notes: '',
    download_url: ''
  });

  
  const handlePublishRelease = async (e) => {
    e.preventDefault();
    const notesArray = releaseForm.release_notes
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const newRel = {
      id: 'rel-' + releaseForm.platform + '-' + releaseForm.version.replace(/\./g, '-'),
      platform: releaseForm.platform,
      version: releaseForm.version,
      minimum_version: releaseForm.minimum_version,
      update_type: releaseForm.update_type,
      status: 'published',
      release_notes: notesArray,
      download_url: releaseForm.download_url || (releaseForm.platform === 'windows' ? 'https://khodar-pos.pages.dev/downloads/KhodarPOS-Setup.exe' : 'https://khodar-pos.pages.dev'),
      published_at: new Date().toISOString()
    };

    try {
      await fetch('/api/releases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRel)
      });
    } catch (err) {
      // offline fallback
    }

    setReleasesList(prev => [newRel, ...prev.filter(r => !(r.platform === newRel.platform && r.version === newRel.version))]);
    setIsReleaseModalOpen(false);
    alert('تم نشر الإصدار بنجاح!');
  };

  if (!isOpen) return null;

  // Generate strong random password
  const generatePassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let pass = '';
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

  const handleActivateTrial = (req) => {
    setCompanyName(req.shopName || req.name);
    setPhone(req.phone || '');
    setDurationMonths('1'); // 1 month free trial
    setAllowedBranches('1');
    setNotes(`طلب تجربة مجانية شهر من الموقع: ${req.name} (${req.city || 'المدينة غير محددة'}) - ${req.notes || ''}`);
    
    // Auto-generate clean unique username
    const baseUser = (req.shopName || 'shop').toLowerCase().replace(/[^a-z0-9]/g, '') || `user${Math.floor(1000 + Math.random() * 9000)}`;
    const randomSuffix = Math.floor(10 + Math.random() * 90);
    setUsername(`${baseUser.slice(0, 10)}${randomSuffix}`);
    generatePassword();
    setFormError('');
    setActivatingTrialId(req.id);
    setIsAddModalOpen(true);
  };

  const handleCreateTenant = (e) => {
    e.preventDefault();
    setFormError('');

    try {
      const newTenant = createTenantAccount({
        companyName,
        username,
        password,
        phone,
        durationMonths,
        allowedBranches,
        notes
      });

      // Mark trial request as activated if this was initiated from a trial request
      if (activatingTrialId && updateTrialRequest) {
        updateTrialRequest(activatingTrialId, { status: 'activated', tenantUsername: newTenant.username });
        setActivatingTrialId(null);
      }

      // Prepare welcome WhatsApp message
      const welcomeText = `مرحباً بكم في نظام نقاط البيع والمحاسبة المركزي! 🥬✨\n\nتم تفعيل اشتراككم التجريبي المجاني (لمدة شهر كامل) بنجاح:\n🏬 المتجر: ${newTenant.companyName}\n👤 اسم المستخدم: ${newTenant.username}\n🔑 كلمة المرور المبدئية: ${newTenant.password}\n📅 تاريخ انتهاء الشهر المجاني: ${newTenant.expiresAt}\n🌐 رابط الدخول المباشر: https://khodar-pos.pages.dev/?login=true\n\n💡 يمكنك تسجيل الدخول والبدء مباشرة وتهيئة أصنافك وطباعة فواتيرك.`;
      
      setCreatedWelcomeMsg({
        text: welcomeText,
        phone: newTenant.phone,
        tenant: newTenant
      });

      // Reset form
      setCompanyName('');
      setUsername('');
      setPassword('');
      setPhone('');
      setNotes('');
      setIsAddModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'حدث خطأ أثناء إنشاء الحساب');
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedTenantId(id);
    setTimeout(() => setCopiedTenantId(null), 2000);
  };

  const handleToggleStatus = (tenant) => {
    const newStatus = tenant.status === 'active' ? 'suspended' : 'active';
    updateTenantAccount(tenant.id, { status: newStatus });
  };

  const handleExtendSubscription = (tenant, months) => {
    const currentExp = new Date(tenant.expiresAt || new Date());
    const base = currentExp < new Date() ? new Date() : currentExp;
    base.setMonth(base.getMonth() + months);
    const newDate = base.toISOString().split('T')[0];
    updateTenantAccount(tenant.id, { expiresAt: newDate, status: 'active' });
    alert(`تم تمديد اشتراك (${tenant.companyName}) حتى ${newDate}`);
  };

  const filteredTenants = tenants.filter(t => 
    t.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.phone && t.phone.includes(searchQuery))
  );

  const activeCount = tenants.filter(t => t.status === 'active').length;
  const expiredCount = tenants.filter(t => {
    const today = new Date().toISOString().split('T')[0];
    return t.expiresAt && t.expiresAt < today;
  }).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto" dir="rtl">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border border-slate-100 animate-in zoom-in-95">
        
        {/* Top Executive Header */}
        <div className="px-6 py-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">بوابة المالك وإدارة المنظومة</h2>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold rounded-full">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                إدارة المشتركين، والتحديثات المركزية لكافة المنصات (Web, Windows, Mobile)
              </p>
            </div>
          </div>

          {/* Center: Tabs Switcher */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('tenants')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'tenants' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              المشتركون والمؤسسات ({tenants.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('trials')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'trials' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>طلبات التجربة (شهر مجاني)</span>
              {trialRequests.length > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 font-black rounded-full text-[10px]">
                  {trialRequests.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('releases')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'releases' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              إدارة الإصدارات ({releasesList.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onSwitchToStore && (
              <button
                type="button"
                onClick={() => { onClose(); onSwitchToStore(); }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <span>العودة للمتجر</span>
                <ArrowRight size={14} />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          
          {/* Tab 1: Tenants SaaS Management */}
          {activeTab === 'tenants' && (
            <>
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">إجمالي المشتركين</span>
                <strong className="text-2xl font-black text-slate-900 font-mono">{tenants.length}</strong>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-700">
                <Building2 size={20} />
              </div>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 block">الاشتراكات السارية والنشطة</span>
                <strong className="text-2xl font-black text-emerald-700 font-mono">{activeCount}</strong>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-200/60 flex items-center justify-center text-emerald-800">
                <Check size={20} />
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-800 block">اشتراكات منتهية تحتاج تجديد</span>
                <strong className="text-2xl font-black text-amber-700 font-mono">{expiredCount}</strong>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-200/60 flex items-center justify-center text-amber-800">
                <Clock size={20} />
              </div>
            </div>
          </div>

          {/* Success Generated Client Message Card */}
          {createdWelcomeMsg && (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-emerald-600" />
                  <h4 className="font-black text-emerald-950 text-sm">
                    تم إنشاء وتفعيل حساب ({createdWelcomeMsg.tenant.companyName}) بنجاح!
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setCreatedWelcomeMsg(null)}
                  className="text-xs text-emerald-800 hover:text-emerald-950 font-bold"
                >
                  إغلاق ✕
                </button>
              </div>

              <div className="bg-white p-3 rounded-xl border border-emerald-200 font-mono text-[11px] text-slate-800 whitespace-pre-line leading-relaxed select-all">
                {createdWelcomeMsg.text}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(createdWelcomeMsg.text, 'created-welcome')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  {copiedTenantId === 'created-welcome' ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedTenantId === 'created-welcome' ? 'تم نسخ الرسالة!' : 'نسخ الرسالة لإرسالها للعميل'}</span>
                </button>

                {createdWelcomeMsg.phone && (
                  <a
                    href={`https://wa.me/${createdWelcomeMsg.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(createdWelcomeMsg.text)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <MessageCircle size={14} className="text-emerald-400" />
                    <span>إرسال مباشر عبر واتساب العميل</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Action Bar: Search & New Client Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="البحث باسم المتجر أو اسم المستخدم أو الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>إنشاء اشتراك عميل جديد</span>
            </button>
          </div>

          {/* Tenants Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-600">
                    <th className="p-3.5">المتجر / الشركة</th>
                    <th className="p-3.5">اسم المستخدم (الثابت)</th>
                    <th className="p-3.5">كلمة المرور</th>
                    <th className="p-3.5">حالة الاشتراك</th>
                    <th className="p-3.5">تاريخ الانتهاء</th>
                    <th className="p-3.5">الهاتف</th>
                    <th className="p-3.5 text-center">إجراءات المالك السريعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTenants.map(tenant => {
                    const isSuper = tenant.role === 'super_admin';
                    const isExpired = tenant.expiresAt && tenant.expiresAt < new Date().toISOString().split('T')[0];
                    const welcomeMsg = `بيانات الدخول لحسابكم في نظام نقاط البيع:\n👤 اسم المستخدم: ${tenant.username}\n🔑 كلمة المرور: ${tenant.password}\n📅 تاريخ الصلاحية: ${tenant.expiresAt}`;

                    return (
                      <tr key={tenant.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>{tenant.companyName}</span>
                            {isSuper && (
                              <span className="px-1.5 py-0.5 bg-slate-900 text-white text-[9px] rounded font-mono">المالك</span>
                            )}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/60 font-mono font-bold text-slate-800" dir="ltr">
                            <span>{tenant.username}</span>
                          </div>
                        </td>

                        <td className="p-3.5 font-mono text-slate-700">
                          <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                            {tenant.password}
                          </span>
                        </td>

                        <td className="p-3.5">
                          {tenant.status === 'suspended' ? (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px]">
                              معلّق / موقوف
                            </span>
                          ) : isExpired ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">
                              منتهي الصلاحية
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                              ساري ونشط
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 font-mono font-bold text-slate-700">
                          {isSuper ? 'دائم (غير محدد)' : tenant.expiresAt}
                        </td>

                        <td className="p-3.5 font-mono text-slate-500">
                          {tenant.phone || '—'}
                        </td>

                        <td className="p-3.5">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Copy Credentials button */}
                            <button
                              type="button"
                              onClick={() => copyToClipboard(welcomeMsg, tenant.id)}
                              title="نسخ بيانات الدخول"
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                            >
                              {copiedTenantId === tenant.id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                            </button>

                            {/* Extend 3 months button */}
                            {!isSuper && (
                              <button
                                type="button"
                                onClick={() => handleExtendSubscription(tenant, 3)}
                                title="تمديد الاشتراك +3 أشهر"
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold transition-colors"
                              >
                                +3 أشهر
                              </button>
                            )}

                            {/* Extend 1 year button */}
                            {!isSuper && (
                              <button
                                type="button"
                                onClick={() => handleExtendSubscription(tenant, 12)}
                                title="تمديد الاشتراك +سنة"
                                className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 rounded-lg text-[10px] font-bold transition-colors"
                              >
                                +سنة
                              </button>
                            )}

                            {/* Toggle suspend button */}
                            {!isSuper && (
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(tenant)}
                                title={tenant.status === 'active' ? 'إيقاف الحساب مؤقتاً' : 'تفعيل الحساب'}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  tenant.status === 'active' 
                                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-700' 
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                                }`}
                              >
                                <Power size={13} />
                              </button>
                            )}

                            {/* Delete tenant button */}
                            {!isSuper && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`هل أنت متأكد من حذف حساب المشترك (${tenant.companyName}) نهائياً؟`)) {
                                    deleteTenantAccount(tenant.id);
                                  }
                                }}
                                title="حذف الحساب"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
            </>
          )}

          {/* Tab 2: Multi-Platform Release Management */}
          {activeTab === 'releases' && (
            <div className="space-y-6">
              {/* Platform Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Windows Card */}
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Monitor size={20} />
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      مستقر (Production)
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">برنامج سطح المكتب (Windows)</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Electron 40 + SQLite / Cloud D1</p>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-semibold">الإصدار الحالي:</span>
                      <span className="font-mono font-black text-blue-600">v{APP_VERSION}</span>
                    </div>
                  </div>
                </div>

                {/* Android Card */}
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <Smartphone size={20} />
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      جاهز للتثبيت (APK)
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">تطبيق الجوال (Android)</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Capacitor 7 + Touch UX</p>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-semibold">الإصدار الحالي:</span>
                      <span className="font-mono font-black text-emerald-600">v{APP_VERSION}</span>
                    </div>
                  </div>
                </div>

                {/* Web Card */}
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <Globe size={20} />
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      سحابي نشط (Edge CDN)
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">منصة الويب (Web App)</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Cloudflare Pages + Edge APIs</p>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-semibold">الإصدار الحالي:</span>
                      <span className="font-mono font-black text-indigo-600">v{APP_VERSION}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Releases Table & Action Bar */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">سجل الإصدارات المعتمدة وقواعد التحديث عبر المنصات</h3>
                    <p className="text-[11px] text-slate-500">
                      يتم فحص هذا السجل بواسطة جميع التطبيقات (سطح المكتب، الجوال، الويب) لإخطار المستخدمين بالتحديثات وفرض التحديثات الإجبارية.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsReleaseModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 self-start sm:self-auto cursor-pointer transition-colors shadow-sm"
                  >
                    <Plus size={15} />
                    <span>إضافة إصدار جديد</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                        <th className="py-2.5 px-3">المنصة</th>
                        <th className="py-2.5 px-3">رقم الإصدار</th>
                        <th className="py-2.5 px-3">الحد الأدنى المدعوم</th>
                        <th className="py-2.5 px-3">مستوى الإلزامية</th>
                        <th className="py-2.5 px-3">أبرز التحسينات والميزات</th>
                        <th className="py-2.5 px-3">تاريخ النشر</th>
                        <th className="py-2.5 px-3 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {releasesList.map((rel) => {
                        const isMandatory = rel.update_type === 'required';
                        const isRecommended = rel.update_type === 'recommended';
                        return (
                          <tr key={rel.id} className="hover:bg-slate-100/60 transition-colors">
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2 font-bold text-slate-800">
                                {rel.platform === 'windows' && <Monitor size={15} className="text-blue-600" />}
                                {rel.platform === 'android' && <Smartphone size={15} className="text-emerald-600" />}
                                {rel.platform === 'ios' && <Smartphone size={15} className="text-purple-600" />}
                                {rel.platform === 'web' && <Globe size={15} className="text-indigo-600" />}
                                <span className="capitalize">{rel.platform}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-mono font-bold bg-slate-200/70 text-slate-800 px-2 py-0.5 rounded-md">
                                v{rel.version}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-600">
                              v{rel.minimum_version}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                isMandatory 
                                  ? 'bg-rose-100 text-rose-800' 
                                  : isRecommended 
                                    ? 'bg-amber-100 text-amber-800' 
                                    : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {isMandatory ? 'إجباري (Required)' : isRecommended ? 'موصى به (Recommended)' : 'اختياري (Optional)'}
                              </span>
                            </td>
                            <td className="py-3 px-3 max-w-xs">
                              <ul className="list-disc list-inside text-slate-600 text-[11px] space-y-0.5">
                                {(Array.isArray(rel.release_notes) ? rel.release_notes : [rel.release_notes]).slice(0, 2).map((n, i) => (
                                  <li key={i} className="truncate" title={n}>{n}</li>
                                ))}
                              </ul>
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                              {rel.published_at ? rel.published_at.substring(0, 10) : '2026-03-18'}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {rel.download_url && (
                                <a
                                  href={rel.download_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-[11px] font-bold transition-colors"
                                >
                                  <Download size={12} />
                                  <span>تنزيل</span>
                                </a>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Free 1-Month Trial Requests (Leads) */}
          {activeTab === 'trials' && (
            <div className="space-y-6">
              {/* Summary Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-bold block">إجمالي طلبات التجربة</span>
                    <span className="text-2xl font-black text-slate-900 mt-1 block">{trialRequests.length}</span>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Sparkles size={22} />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-bold block">طلبات بانتظار التفعيل</span>
                    <span className="text-2xl font-black text-amber-600 mt-1 block">
                      {trialRequests.filter(r => r.status !== 'activated').length}
                    </span>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                    <Clock size={22} />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-bold block">تم تفعيل اشتراكهم المجاني</span>
                    <span className="text-2xl font-black text-emerald-600 mt-1 block">
                      {trialRequests.filter(r => r.status === 'activated').length}
                    </span>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <ShieldCheck size={22} />
                  </div>
                </div>
              </div>

              {/* Trials Table Card */}
              <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
                <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-amber-500" />
                    <h3 className="font-bold text-slate-800 text-sm">طلبات تجربة المنظومة (شهر مجاني) الواردة من الموقع</h3>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                      {trialRequests.length} طلب
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    يمكنك بضغطة زر واحدة إنشاء حساب المتجر وتوليد اسم المستخدم وكلمة المرور ومراسلتهم عبر واتساب
                  </p>
                </div>

                {trialRequests.length === 0 ? (
                  <div className="py-16 px-4 text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                      <Sparkles size={28} />
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm">لا توجد طلبات تجربة واردة حالياً</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      عند قيام أي تاجر أو عميل بالضغط على زر "طلب تجربة مجانية لمدة شهر" في الموقع وتعبئة بياناته، ستظهر بيانات طلبه هنا فوراً لمراجعتها وتفعيل حسابه.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                        <tr>
                          <th className="py-3 px-4">تاريخ الطلب</th>
                          <th className="py-3 px-4">التاجر / اسم المتجر</th>
                          <th className="py-3 px-4">رقم الهاتف / واتساب</th>
                          <th className="py-3 px-4">المدينة</th>
                          <th className="py-3 px-4">ملاحظات العميل</th>
                          <th className="py-3 px-4 text-center">الحالة</th>
                          <th className="py-3 px-4 text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {trialRequests.map((req) => {
                          const isActivated = req.status === 'activated';
                          const cleanPhone = (req.phone || '').replace(/[^0-9]/g, '');
                          const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('0') ? '20' + cleanPhone.slice(1) : cleanPhone}` : null;
                          const formattedDate = req.createdAt 
                            ? new Date(req.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : 'حديثاً';

                          return (
                            <tr key={req.id} className={`hover:bg-slate-50/80 transition-colors ${isActivated ? 'bg-slate-50/40' : 'bg-amber-50/20'}`}>
                              <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                                {formattedDate}
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-900 text-sm">{req.name}</div>
                                <div className="text-slate-500 text-[11px] font-medium flex items-center gap-1 mt-0.5">
                                  <Building2 size={11} className="text-slate-400" />
                                  <span>{req.shopName || 'متجر جديد'}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 font-mono font-bold text-slate-800">
                                <div className="flex items-center gap-2">
                                  <span>{req.phone || '—'}</span>
                                  {waUrl && (
                                    <a
                                      href={waUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-sans text-[11px] font-bold transition-colors"
                                      title="فتح محادثة واتساب مع التاجر"
                                    >
                                      <MessageCircle size={12} />
                                      <span>واتساب</span>
                                    </a>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-slate-600 font-medium">
                                {req.city || 'غير محدد'}
                              </td>
                              <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate" title={req.notes}>
                                {req.notes || '—'}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {isActivated ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                    <ShieldCheck size={12} />
                                    <span>تم التفعيل (شهر مجاني)</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 animate-pulse">
                                    <Clock size={12} />
                                    <span>بانتظار التفعيل</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  {!isActivated ? (
                                    <button
                                      type="button"
                                      onClick={() => handleActivateTrial(req)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                                    >
                                      <Plus size={13} />
                                      <span>تفعيل شهر مجاني</span>
                                    </button>
                                  ) : (
                                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                                      الحساب: {req.tenantUsername || 'نشط'}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`هل أنت متأكد من حذف طلب "${req.name}"؟`)) {
                                        deleteTrialRequest(req.id);
                                      }
                                    }}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="حذف الطلب"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Add Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 text-right">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 size={20} className="text-emerald-600" />
                <h3 className="font-black text-sm text-slate-900">إنشاء اشتراك متجر / شركة جديد</h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-bold text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateTenant} className="space-y-3.5 text-xs">
              
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">اسم المتجر أو الشركة *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مؤسسة ثمار البركة للتجارة"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    اسم المستخدم الثابت (Unique Username) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: albaraka"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    dir="ltr"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">حروف إنجليزية وأرقام فقط (لا يتغير لاحقاً)</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>كلمة المرور المبدئية *</span>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="text-[10px] text-emerald-700 hover:underline font-bold"
                    >
                      توليد كلمة سر
                    </button>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: Pass@123"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">مدة الاشتراك المدفوع</label>
                  <select
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="1">شهر واحد (تجريبي)</option>
                    <option value="3">3 أشهر (ربع سنوي)</option>
                    <option value="6">6 أشهر (نصف سنوي)</option>
                    <option value="12">سنة كاملة (سنوي)</option>
                    <option value="24">سنتان</option>
                    <option value="0">اشتراك دائم (مفتوح)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">رقم هاتف العميل (واتساب)</label>
                  <input
                    type="text"
                    placeholder="مثال: 0501234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">ملاحظات داخلية للمالك</label>
                <input
                  type="text"
                  placeholder="مثال: تم السداد بحوالة الراجحي 1200 ريال"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <Plus size={16} />
                  <span>تفعيل وحفظ الاشتراك</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Add New Release Modal */}
      {isReleaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Tag size={20} className="text-blue-600" />
                <h3 className="font-black text-sm text-slate-900">نشر إصدار وتحديث جديد للمنظومة</h3>
              </div>
              <button 
                onClick={() => setIsReleaseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePublishRelease} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">المنصة المستهدفة *</label>
                  <select
                    value={releaseForm.platform}
                    onChange={(e) => setReleaseForm({ ...releaseForm, platform: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  >
                    <option value="windows">برنامج سطح المكتب (Windows)</option>
                    <option value="android">تطبيق الجوال (Android)</option>
                    <option value="web">منصة الويب السحابية (Web)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">مستوى إلزامية التحديث *</label>
                  <select
                    value={releaseForm.update_type}
                    onChange={(e) => setReleaseForm({ ...releaseForm, update_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  >
                    <option value="optional">اختياري (Optional) - تحسينات بسيطة</option>
                    <option value="recommended">موصى به (Recommended) - مزايا جديدة</option>
                    <option value="required">إجباري (Required) - أمان وتغييرات هيكلية</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">رقم الإصدار الجديد (SemVer) *</label>
                  <input
                    type="text"
                    required
                    placeholder="2.4.1"
                    value={releaseForm.version}
                    onChange={(e) => setReleaseForm({ ...releaseForm, version: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">أدنى إصدار مسموح بتشغيله *</label>
                  <input
                    type="text"
                    required
                    placeholder="2.2.0"
                    value={releaseForm.minimum_version}
                    onChange={(e) => setReleaseForm({ ...releaseForm, minimum_version: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">رابط التنزيل المباشر (اختياري)</label>
                <input
                  type="url"
                  placeholder="https://khodar-pos.pages.dev/downloads/KhodarPOS-Setup.exe"
                  value={releaseForm.download_url}
                  onChange={(e) => setReleaseForm({ ...releaseForm, download_url: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 text-left dir-ltr"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">سجل التغييرات والميزات (سطر لكل نقطة) *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="إضافة دعم طباعة الفواتير على طابعات البلوتوث&#10;تحسين أداء مزامنة السحابة مع Cloudflare D1&#10;إصلاح مشكلة احتساب الخصم المئوي"
                  value={releaseForm.release_notes}
                  onChange={(e) => setReleaseForm({ ...releaseForm, release_notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setIsReleaseModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  <Tag size={16} />
                  <span>اعتماد ونشر التحديث فوراً</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
