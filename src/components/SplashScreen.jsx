import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BRRAKA_LOGO } from '../assets/branding';
import { APP_VERSION } from '../config/appVersion';
import { Sparkles, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function SplashScreen({ onFinish, duration = 5000 }) {
  const [timeLeft, setTimeLeft] = useState(Math.ceil(duration / 1000));

  useEffect(() => {
    // Countdown timer for user feedback
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Transition trigger after exactly duration ms (5 seconds)
    const timer = setTimeout(() => {
      if (onFinish) onFinish();
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [duration, onFinish]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 flex flex-col justify-between items-center bg-gradient-to-b from-[#0a0f1d] via-[#11182c] to-[#080b15] text-white p-6 pt-safe pb-safe select-none overflow-hidden"
      dir="rtl"
    >
      {/* Ambient background glow effects */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 -right-20 w-80 h-80 bg-primary-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar: Skip button & Badge */}
      <div className="w-full max-w-md flex items-center justify-between z-10 pt-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[11px] font-medium text-slate-300 border border-white/10">
          <Sparkles size={13} className="text-emerald-400" />
          <span>سوق الخضار الذكي</span>
        </span>

        <button
          type="button"
          onClick={onFinish}
          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-slate-300 hover:text-white rounded-xl text-xs font-semibold backdrop-blur-md border border-white/10 flex items-center gap-1 transition-all cursor-pointer"
          title="تخطي شاشة البداية والدخول فوراً"
        >
          <span>تخطي</span>
          <ArrowLeft size={13} />
        </button>
      </div>

      {/* Center: Hero Logo & Brand Identity */}
      <div className="flex flex-col items-center justify-center text-center z-10 my-auto py-8">
        {/* Glowing Logo Container */}
        <motion.div
          initial={{ scale: 0.75, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-6"
        >
          <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/25 to-teal-400/25 rounded-3xl blur-xl animate-pulse" />
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-white/5 backdrop-blur-md border border-white/15 p-4 flex items-center justify-center shadow-2xl">
            <img 
              src={BRRAKA_LOGO} 
              alt="شعار براكه" 
              className="w-full h-full object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)]" 
            />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.7 }}
          className="space-y-2"
        >
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            منظومة براكه
          </h1>
          <p className="text-sm sm:text-base text-slate-300 font-medium max-w-xs mx-auto leading-relaxed">
            كاشير ومحاسبة سحابية لمبيعات وموازين الخضار والفواكه
          </p>
        </motion.div>

        {/* Feature Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="flex items-center gap-2 mt-5 text-[11px] text-emerald-300 font-semibold bg-emerald-950/40 px-3.5 py-1.5 rounded-full border border-emerald-500/20"
        >
          <span>سريع</span>
          <span className="text-emerald-500/60">•</span>
          <span>دقيق بالميزان</span>
          <span className="text-emerald-500/60">•</span>
          <span>سحابي وأوفلاين</span>
        </motion.div>
      </div>

      {/* Bottom: 5-Second Progress Bar & Status */}
      <div className="w-full max-w-sm space-y-3 z-10 pb-4 text-center">
        {/* Progress Bar (Fills in exactly 5 seconds) */}
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
          <motion.div 
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: duration / 1000, ease: "linear" }}
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 rounded-full shadow-[0_0_12px_rgba(52,211,153,0.8)]"
          />
        </div>

        {/* Countdown & Status */}
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
          <span className="flex items-center gap-1.5 font-sans text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span>جاري تهيئة المنظومة...</span>
          </span>
          <span className="text-[11px] text-slate-400">
            {timeLeft} ثوانٍ
          </span>
        </div>

        <div className="pt-2 text-[11px] text-slate-500 font-mono">
          الإصدار المعتمد v{APP_VERSION} • Brraka POS
        </div>
      </div>
    </motion.div>
  );
}
