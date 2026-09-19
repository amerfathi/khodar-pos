import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, User, KeyRound, ShieldCheck, AlertTriangle, Eye, EyeOff, 
  Store, Monitor, Smartphone, Globe, Download, ArrowLeft, Laptop
} from 'lucide-react';
import { Button, Badge } from './ui';
import { APP_VERSION } from '../config/appVersion';
import { BRRAKA_LOGO } from '../assets/branding';
import ForgotPasswordModal from './ForgotPasswordModal';

export default function LoginView({ store, onClose }) {
  const { login } = store;

  // Remember storeCode across sessions for multi-tenancy
  const [storeCode, setStoreCode] = useState(() => {
    try {
      return localStorage.getItem('khodar_remembered_store_code') || 'BRK-101';
    } catch {
      return 'BRK-101';
    }
  });
  const [isEditingStoreCode, setIsEditingStoreCode] = useState(false);

  // Remember username across sessions and logouts for fast password-only entry
  const [username, setUsername] = useState(() => {
    try {
      return localStorage.getItem('khodar_remembered_username') || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isExpiredAlert, setIsExpiredAlert] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeViewTab, setActiveViewTab] = useState('login'); // 'login' | 'platforms'

  const usernameInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const storeCodeInputRef = useRef(null);

  // Smart focus: if username is remembered, focus password input directly
  useEffect(() => {
    const timer = setTimeout(() => {
      if (username.trim()) {
        passwordInputRef.current?.focus();
      } else {
        usernameInputRef.current?.focus();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [activeViewTab]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsExpiredAlert(false);

    const cleanUser = username.trim();
    if (!cleanUser || !password) {
      setErrorMessage('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    if (!storeCode.trim()) {
      setErrorMessage('يرجى إدخال كود المتجر (Store Code)');
      return;
    }

    setLoading(true);
    setTimeout(async () => {
      try {
        const res = await login(cleanUser, password, storeCode.trim());
        setLoading(false);
        if (res.success) {
          try {
            if (rememberMe) {
              localStorage.setItem('khodar_remembered_username', cleanUser);
              localStorage.setItem('khodar_remembered_store_code', storeCode.trim().toUpperCase());
            } else {
              localStorage.removeItem('khodar_remembered_username');
            }
          } catch (e) {
            console.warn('Failed to save remembered credentials', e);
          }
        } else {
          setErrorMessage(res.error || 'بيانات الدخول غير صحيحة');
          if (res.isExpired) {
            setIsExpiredAlert(true);
          }
        }
      } catch (err) {
        setLoading(false);
        setErrorMessage('حدث خطأ أثناء التحقق من بيانات الدخول');
      }
    }, 150);
  };

  return (
    <div className={`${onClose ? 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs' : 'min-h-screen bg-[#f8fafc] py-8 px-4 flex flex-col justify-center items-center'} text-right font-sans`} dir="rtl">
      
      {/* Central Product Gateway Card (Pure White Enterprise Theme) */}
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200/90 z-10 relative">
        
        {/* Gateway Brand Header (Clean White / Light Theme) */}
        <div className="bg-white text-slate-800 p-6 text-center relative border-b border-slate-100">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute left-4 top-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer border border-slate-200 shadow-2xs"
              title="العودة إلى الموقع التسويقي"
            >
              <span>العودة للموقع</span>
              <ArrowLeft size={13} />
            </button>
          )}

          <img 
            src={BRRAKA_LOGO} 
            alt="براكه" 
            className="w-24 h-24 mx-auto mb-3 object-contain drop-shadow-sm" 
          />

          <div className="flex items-center justify-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">منظومة براكه | Brraka</h1>
            <Badge variant="success" size="sm">v{APP_VERSION}</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">منظومة موحدة لإدارة الكاشير والمبيعات والموازين السحابية</p>

          {/* Navigation Pill Switcher */}
          <div className="mt-4 grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-bold max-w-xs mx-auto border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveViewTab('login')}
              className={`py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeViewTab === 'login'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck size={14} />
              <span>تسجيل الدخول</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveViewTab('platforms')}
              className={`py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeViewTab === 'platforms'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Download size={14} />
              <span>تحميل التطبيقات</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Login View */}
        {activeViewTab === 'login' && (
          <div className="p-6 sm:p-8 space-y-4">
            
            {errorMessage && (
              <div className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                isExpiredAlert 
                  ? 'bg-amber-50 border border-amber-200 text-amber-900' 
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}>
                <AlertTriangle size={16} className={`shrink-0 mt-0.5 ${isExpiredAlert ? 'text-amber-600' : 'text-rose-600'}`} />
                <div className="space-y-1">
                  <p className="font-bold">{errorMessage}</p>
                  {isExpiredAlert && (
                    <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                      لتجديد ترخيص متجرك أو للاستفسار عن الحساب، يرجى التواصل مباشرة عبر واتساب المعتمد.
                    </p>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Store Code Active Badge / Selector */}
              {!isEditingStoreCode && storeCode ? (
                <div className="p-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center font-bold shrink-0">
                      <Store size={15} />
                    </div>
                    <div className="text-right truncate">
                      <span className="text-[10px] text-slate-400 block font-medium">المنشأة المتصلة</span>
                      <span className="font-bold text-slate-800 text-xs truncate block">
                        {storeCode === 'BRK-000' || storeCode === 'ADMIN' ? 'لوحة المالك السحابي' : 'متجر براكه السحابي'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-black text-xs px-2.5 py-1 bg-white text-emerald-700 rounded-lg border border-slate-200 shadow-2xs tracking-wider" dir="ltr">
                      {storeCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingStoreCode(true);
                        setTimeout(() => storeCodeInputRef.current?.focus(), 100);
                      }}
                      className="text-[11px] text-slate-500 hover:text-emerald-700 font-bold px-1.5 py-1 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                      title="تغيير كود المتجر"
                    >
                      تغيير
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl animate-in fade-in">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-emerald-950">
                      كود المتجر السحابي (Store Code)
                    </label>
                    {storeCode && (
                      <button
                        type="button"
                        onClick={() => setIsEditingStoreCode(false)}
                        className="text-[10px] text-emerald-700 hover:underline font-bold cursor-pointer"
                      >
                        إلغاء ✕
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none">
                      <Store size={15} />
                    </div>
                    <input
                      ref={storeCodeInputRef}
                      type="text"
                      value={storeCode}
                      onChange={(e) => setStoreCode(e.target.value.toUpperCase())}
                      placeholder="مثال: BRK-101"
                      required
                      className="w-full h-10 pr-9 pl-16 bg-white border border-emerald-300 rounded-xl text-slate-900 text-xs font-mono font-black tracking-wider placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all uppercase"
                      dir="ltr"
                    />
                    {storeCode && (
                      <button
                        type="button"
                        onClick={() => setIsEditingStoreCode(false)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-xs"
                      >
                        تثبيت
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    أدخل كود المتجر الممنوح لك لربط المحطة بالمنشأة وتنزيل حسابات الموظفين
                  </p>
                </div>
              )}

              {/* Username / Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  اسم المستخدم أو البريد الإلكتروني
                </label>
                <div className="relative">
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <User size={15} />
                  </div>
                  <input
                    ref={usernameInputRef}
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="أدخل اسم المستخدم أو البريد المسجل"
                    className="w-full h-11 pr-10 pl-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 transition-all select-text font-medium"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  كلمة المرور
                </label>
                <div className="relative">
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <KeyRound size={15} />
                  </div>
                  <input
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 pr-10 pl-10 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 transition-all select-text font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Remember Session & Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/30 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>تذكر بيانات الدخول</span>
                </label>

                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      <span>تسجيل الدخول إلى النظام</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick banner to switch to downloads */}
            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveViewTab('platforms')}
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-slate-200/80 cursor-pointer"
              >
                <Laptop size={14} className="text-emerald-600" />
                <span>تحميل البرنامج للكمبيوتر أو تطبيق الهاتف (Windows / Android)</span>
              </button>
            </div>

          </div>
        )}

        {/* Tab 2: Multi-Platform Downloads */}
        {activeViewTab === 'platforms' && (
          <div className="p-6 space-y-4">
            <div className="text-center space-y-1 pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">استخدم التطبيق بالطريقة التي تناسبك</h2>
              <p className="text-xs text-slate-500">نفس البيانات والحسابات والصلاحيات متزامنة لحظياً على كافة أجهزتك</p>
            </div>

            <div className="space-y-3">
              {/* 1. Web Version */}
              <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                    <Globe size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-bold text-slate-900">نسخة الويب السحابية</h3>
                      <Badge variant="primary" size="sm">تشغيل فوري</Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">يعمل مباشرة في أي متصفح حديث دون تحميل</p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveViewTab('login')}
                >
                  فتح التطبيق
                </Button>
              </div>

              {/* 2. Windows Desktop App */}
              <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                    <Monitor size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-xs font-bold text-slate-900">برنامج الكمبيوتر (Windows)</h3>
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 font-mono font-semibold px-1.5 py-0.5 rounded border border-indigo-200">v{APP_VERSION}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">شاشات مبيعات عريضة، دعم ميزان الباركود وطابعات 80mm</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-medium">
                      <span>Windows 10 / 11 (64-bit)</span>
                      <span>•</span>
                      <span>الحجم: ~122 ميجابايت</span>
                    </div>
                  </div>
                </div>

                <a
                  href="https://github.com/amerfathi/khodar-pos/releases/download/v2.4.0/KhodarPOS-Setup.exe"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors shadow-2xs shrink-0"
                >
                  <Download size={13} />
                  <span>تحميل Setup</span>
                </a>
              </div>

              {/* 3. Android Mobile App */}
              <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-xs font-bold text-slate-900">تطبيق الأندرويد (Android)</h3>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-mono font-semibold px-1.5 py-0.5 rounded border border-emerald-200">APK مباشر</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">مناسب للأجهزة اللوحية وهواتف الكاشير والمناديب</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-medium">
                      <span>Android 8.0 فما فوق</span>
                      <span>•</span>
                      <span>الحجم: 3.4 ميجابايت</span>
                    </div>
                  </div>
                </div>

                <a
                  href="/downloads/KhodarPOS.apk"
                  download="KhodarPOS.apk"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-medium transition-colors shadow-2xs shrink-0"
                >
                  <Download size={13} />
                  <span>تحميل APK</span>
                </a>
              </div>
            </div>

            <div className="pt-2 text-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setActiveViewTab('login')}
                className="text-xs text-primary-600"
              >
                <ArrowLeft size={13} />
                <span>العودة إلى تسجيل الدخول</span>
              </Button>
            </div>
          </div>
        )}

      </div>
 
       <ForgotPasswordModal 
         isOpen={isForgotPasswordOpen} 
         onClose={() => setIsForgotPasswordOpen(false)} 
         store={store} 
       />

       <p className="text-[11px] text-slate-400 mt-6 font-medium text-center font-mono">
         نظام إدارة المتاجر المحاسبي © {new Date().getFullYear()} — جميع الحقوق محفوظة • إصدار v{APP_VERSION}
       </p>
     </div>
   );
 }
