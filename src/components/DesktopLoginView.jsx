import React, { useState, useEffect } from 'react';
import { 
  Lock, User, KeyRound, ShieldCheck, Eye, EyeOff, 
  Store, Minus, Square, X, Database, CheckCircle2, AlertCircle, Sparkles
} from 'lucide-react';
import { Button, Input, Badge } from './ui';
import { APP_VERSION } from '../config/appVersion';

export default function DesktopLoginView({ store }) {
  const { login, settings } = store;

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI?.isMaximized) {
      window.electronAPI.isMaximized().then(setIsMaximized).catch(() => {});
    }
  }, []);

  const handleMinimize = () => {
    if (window.electronAPI?.minimize) window.electronAPI.minimize();
  };

  const handleMaximize = async () => {
    if (window.electronAPI?.maximize) {
      window.electronAPI.maximize();
      const max = await window.electronAPI.isMaximized().catch(() => false);
      setIsMaximized(max);
    }
  };

  const handleClose = () => {
    if (window.electronAPI?.close) window.electronAPI.close();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password) {
      setErrorMessage('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = login(username, password);
      setLoading(false);
      if (!res.success) {
        setErrorMessage(res.error || 'بيانات الدخول غير صحيحة');
      }
    }, 200);
  };

  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage('');
  };

  return (
    <div className="h-screen w-screen bg-slate-950 flex flex-col font-sans select-none overflow-hidden" dir="rtl">
      
      {/* 1. Seamless Electron Native Window Titlebar */}
      <header 
        style={{ WebkitAppRegion: 'drag' }}
        className="h-10 bg-slate-900 border-b border-slate-800/90 flex items-center justify-between px-3 shrink-0 text-slate-300 select-none z-50"
      >
        <div className="flex items-center gap-2.5" style={{ WebkitAppRegion: 'no-drag' }}>
          <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Store size={13} />
          </div>
          <span className="text-xs font-bold text-slate-200">
            {settings?.shopName || 'سوق الخضار'} | محطة سطح المكتب
          </span>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
            v{APP_VERSION}
          </span>
        </div>

        {/* Window Control Buttons */}
        <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' }}>
          <button
            type="button"
            onClick={handleMinimize}
            className="w-8 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
            title="تصغير"
          >
            <Minus size={13} />
          </button>
          <button
            type="button"
            onClick={handleMaximize}
            className="w-8 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
            title={isMaximized ? 'استعادة' : 'تكبير'}
          >
            <Square size={11} className={isMaximized ? 'text-emerald-400' : ''} />
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-600 rounded transition-colors cursor-pointer"
            title="إغلاق البرنامج"
          >
            <X size={14} />
          </button>
        </div>
      </header>

      {/* 2. Main Login Area */}
      <div className="flex-1 flex items-center justify-center p-4 relative bg-slate-950">
        
        {/* Subtle radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08)_0%,transparent_70%)] pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          
          {/* Card Container */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8">
            
            {/* Header / Brand */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center shadow-inner">
                <Store size={28} />
              </div>
              <h1 className="text-xl font-black text-white tracking-tight">
                {settings?.shopName || 'سوق الخضار المركزي'}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                تسجيل الدخول لمحطة الكاشير والمحاسبة المعتمدة
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle size={16} className="shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-right">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  اسم المستخدم أو كود الكاشير
                </label>
                <div className="relative">
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <User size={15} />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="أدخل اسم المستخدم"
                    autoFocus
                    required
                    className="w-full h-10 pr-10 pl-3 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all select-text"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  كلمة المرور
                </label>
                <div className="relative">
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <KeyRound size={15} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full h-10 pr-10 pl-10 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all select-text"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500/30 cursor-pointer"
                  />
                  <span>تذكر بيانات الدخول على هذا الجهاز</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>تسجيل الدخول ومتابعة العمل</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials */}
            <div className="mt-6 pt-4 border-t border-slate-800/90 text-right">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                حسابات سريعة للاختبار:
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin', '123456')}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-center transition-all cursor-pointer"
                >
                  مدير النظام
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('cashier', '123456')}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-center transition-all cursor-pointer"
                >
                  كاشير 1
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('accountant', '123456')}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-center transition-all cursor-pointer"
                >
                  محاسب
                </button>
              </div>
            </div>

            {/* System Status Indicators */}
            <div className="mt-6 flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-800/50">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-400">قاعدة البيانات المحلية: جاهزة</span>
              </div>
              <div className="flex items-center gap-1">
                <Database size={12} className="text-slate-400" />
                <span>محطة رقم 1</span>
              </div>
            </div>

          </div>

          <div className="text-center mt-3 text-[11px] text-slate-600">
            المنظومة المحاسبية المتكاملة &bull; جميع الحقوق محفوظة &copy; 2026
          </div>

        </div>

      </div>

    </div>
  );
}
