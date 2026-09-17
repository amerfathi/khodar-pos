import React, { useState } from 'react';
import { 
  Lock, User, KeyRound, ShieldCheck, AlertTriangle, Eye, EyeOff, 
  MessageCircle, HelpCircle, Store, Monitor, Smartphone, Globe, 
  Download, ArrowLeft, CheckCircle2, Sparkles, Laptop
} from 'lucide-react';
import { Button, Input, Badge } from './ui';
import { APP_VERSION } from '../config/appVersion';

export default function LoginView({ store }) {
  const { login } = store;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isExpiredAlert, setIsExpiredAlert] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeViewTab, setActiveViewTab] = useState('login'); // 'login' | 'platforms'

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsExpiredAlert(false);

    if (!username.trim() || !password) {
      setErrorMessage('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = login(username, password);
      setLoading(false);
      if (!res.success) {
        setErrorMessage(res.error);
        if (res.isExpired) {
          setIsExpiredAlert(true);
        }
      }
    }, 250);
  };

  const handleQuickFill = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setErrorMessage('');
    setIsExpiredAlert(false);
  };

  return (
    <div className="min-h-screen bg-slate-50/90 py-8 px-4 flex flex-col justify-center items-center text-right font-sans" dir="rtl">
      
      {/* Central Product Gateway Card */}
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200/90 z-10">
        
        {/* Gateway Brand Header */}
        <div className="bg-slate-900 text-white p-6 text-center relative border-b border-slate-800">
          <div className="w-12 h-12 mx-auto mb-3 bg-white/10 border border-white/15 rounded-xl flex items-center justify-center text-primary-400 shadow-xs">
            <Store size={24} />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-lg font-bold text-white tracking-tight">نظام سوق الخضار والمحاسبة المركزي</h1>
            <Badge variant="success" size="sm">الإصدار {APP_VERSION}</Badge>
          </div>
          <p className="text-xs text-slate-300 mt-1 font-normal">منظومة موحدة لإدارة المبيعات والتوريد والموازين السحابية</p>

          {/* Navigation Pill Switcher */}
          <div className="mt-4 grid grid-cols-2 p-1 bg-slate-800/80 rounded-lg text-xs font-semibold max-w-xs mx-auto border border-slate-700/60">
            <button
              type="button"
              onClick={() => setActiveViewTab('login')}
              className={`py-1.5 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeViewTab === 'login'
                  ? 'bg-primary-600 text-white shadow-2xs font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <ShieldCheck size={14} />
              <span>تسجيل الدخول</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveViewTab('platforms')}
              className={`py-1.5 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeViewTab === 'platforms'
                  ? 'bg-primary-600 text-white shadow-2xs font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Download size={14} />
              <span>تحميل التطبيقات</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Login View */}
        {activeViewTab === 'login' && (
          <div className="p-6 space-y-4">
            
            {errorMessage && (
              <div className={`p-3 rounded-lg text-xs flex items-start gap-2.5 ${
                isExpiredAlert 
                  ? 'bg-amber-50 border border-amber-200 text-amber-900' 
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}>
                <AlertTriangle size={16} className={`shrink-0 mt-0.5 ${isExpiredAlert ? 'text-amber-600' : 'text-rose-600'}`} />
                <div className="space-y-1">
                  <span className="font-medium block leading-relaxed">{errorMessage}</span>
                  {isExpiredAlert && (
                    <a
                      href="https://wa.me/?text=مرحباً، أود تجديد اشتراكي في برنامج نقاط البيع السحابي"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-600 text-white font-medium rounded text-[11px] mt-1 shadow-2xs hover:bg-primary-700 transition-colors"
                    >
                      <MessageCircle size={13} />
                      <span>تواصل مع الإدارة للتجديد الفوري عبر واتساب</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700">
                  اسم المستخدم أو البريد (معرّف الحساب)
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    required
                    autoFocus
                    placeholder="demo أو admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    dir="ltr"
                    className="font-mono text-xs pl-8"
                  />
                  <User size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-700">
                    كلمة المرور
                  </label>
                  <a
                    href="https://wa.me/?text=مرحباً، نسيت كلمة المرور الخاصة بحسابي في برنامج نقاط البيع"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-primary-600 hover:text-primary-700 font-medium"
                  >
                    نسيت كلمة المرور؟
                  </a>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    dir="ltr"
                    className="font-mono text-xs pl-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Remember Session */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 w-3.5 h-3.5"
                  />
                  <span>تذكر بيانات الدخول على هذا الجهاز</span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="default"
                  isLoading={loading}
                  className="w-full justify-center"
                >
                  <ShieldCheck size={16} />
                  <span>تسجيل الدخول إلى النظام</span>
                </Button>
              </div>
            </form>

            {/* Quick Demo Credentials Bar for Easy Testing */}
            <div className="pt-3 border-t border-slate-100 text-center space-y-1.5">
              <span className="text-[10px] font-medium text-slate-400 block">حسابات تجريبية سريعة بنقرة واحدة:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="admin-login-btn"
                  onClick={() => handleQuickFill('admin', 'admin')}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 rounded text-[11px] font-medium flex flex-col items-center gap-0.5 transition-colors cursor-pointer"
                >
                  <span className="text-slate-900 font-semibold">مالك المنصة</span>
                  <span className="text-[10px] text-slate-500 font-mono">admin / admin</span>
                </button>

                <button
                  type="button"
                  id="demo-login-btn"
                  onClick={() => handleQuickFill('demo', '123')}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 rounded text-[11px] font-medium flex flex-col items-center gap-0.5 transition-colors cursor-pointer"
                >
                  <span className="text-primary-700 font-semibold">عميل مشترك</span>
                  <span className="text-[10px] text-slate-500 font-mono">demo / 123</span>
                </button>
              </div>
            </div>

            {/* Quick banner to switch to downloads */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveViewTab('platforms')}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors border border-slate-200/80 cursor-pointer"
              >
                <Laptop size={14} className="text-primary-600" />
                <span>تحميل البرنامج للكمبيوتر أو تطبيق الهاتف (Windows / Android)</span>
              </button>
            </div>

          </div>
        )}

        {/* Tab 2: Multi-Platform Downloads (استخدم التطبيق بالطريقة التي تناسبك) */}
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
                      <span>الحجم: ~115 ميجابايت</span>
                    </div>
                  </div>
                </div>

                <a
                  href="/downloads/KhodarPOS-Setup.exe"
                  download="KhodarPOS-Setup.exe"
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

      <p className="text-[11px] text-slate-400 mt-6 font-medium text-center font-mono">
        نظام إدارة المتاجر المحاسبي © {new Date().getFullYear()} — جميع الحقوق محفوظة • إصدار {APP_VERSION}
      </p>
    </div>
  );
}
