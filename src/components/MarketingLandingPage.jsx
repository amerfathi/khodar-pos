import React, { useState } from 'react';
import { 
  Store, ShieldCheck, CheckCircle2, ArrowLeft, Download, 
  ShoppingCart, Truck, Users, Scale, FileText, Smartphone, Monitor,
  Globe, MessageCircle, Phone, Sparkles, ChevronRight, X, Clock,
  DollarSign, Check, Award, BarChart3, Lock, HelpCircle
} from 'lucide-react';
import { Button, Input, Badge } from './ui';
import { APP_VERSION } from '../config/appVersion';

export default function MarketingLandingPage({ onOpenLogin }) {
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [trialForm, setTrialForm] = useState({
    name: '',
    shopName: '',
    phone: '',
    city: '',
    notes: ''
  });
  const [trialSubmitted, setTrialSubmitted] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState('sale');

  const handleTrialSubmit = (e) => {
    e.preventDefault();
    if (!trialForm.name || !trialForm.phone || !trialForm.shopName) return;

    // Build WhatsApp message URL
    const message = encodeURIComponent(
      `مرحباً، أود طلب تجربة مجانية لمدة شهر لنظام المحاسبة وسوق الخضار:\n` +
      `- الاسم: ${trialForm.name}\n` +
      `- المنشأة: ${trialForm.shopName}\n` +
      `- رقم الهاتف: ${trialForm.phone}\n` +
      `- المدينة: ${trialForm.city || 'غير محدد'}\n` +
      `- ملاحظات: ${trialForm.notes || 'لا يوجد'}`
    );

    // Save lead in localStorage
    try {
      const leads = JSON.parse(localStorage.getItem('khodar_trial_leads') || '[]');
      leads.push({ ...trialForm, date: new Date().toISOString() });
      localStorage.setItem('khodar_trial_leads', JSON.stringify(leads));
    } catch (_) {}

    setTrialSubmitted(true);

    // Open WhatsApp in new tab if requested
    setTimeout(() => {
      window.open(`https://wa.me/201099684120?text=${message}`, '_blank');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-emerald-500 selection:text-white" dir="rtl">
      
      {/* 1. SaaS Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shadow-xs border border-slate-800">
              <Store size={22} />
            </div>
            <div>
              <span className="font-bold text-base text-slate-900 block tracking-tight">سوق الخضار</span>
              <span className="text-[11px] text-slate-500 block font-medium">المنظومة المحاسبية المعتمدة</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-emerald-600 transition-colors">المميزات</a>
            <a href="#steps" className="hover:text-emerald-600 transition-colors">تجربة مجانية شهر</a>
            <a href="#showcase" className="hover:text-emerald-600 transition-colors">الشاشات والتقارير</a>
            <a href="#pricing" className="hover:text-emerald-600 transition-colors">الأسعار</a>
            <a href="#platforms" className="hover:text-emerald-600 transition-colors">المنصات</a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenLogin}
              className="py-2 px-3.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-all cursor-pointer"
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              onClick={() => { setTrialSubmitted(false); setIsTrialModalOpen(true); }}
              className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles size={14} className="text-emerald-200" />
              <span>اطلب تجربة مجانية</span>
            </button>
          </div>

        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28 bg-gradient-to-b from-slate-50 via-white to-slate-50/50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold mb-6 shadow-2xs">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>الإصدار التجاري {APP_VERSION} متوفر الآن مع المزامنة السحابية</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-normal leading-normal sm:leading-[1.3] mb-6">
              المنظومة المحاسبية المتكاملة لإدارة <span className="text-emerald-600">أسواق ومحلات الخضار</span> باحترافية
            </h1>

            {/* Subhead */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 max-w-2xl mx-auto">
              تحكم كامل في مبيعات الكاشير والموازين، تسجيل المشتريات والمخزون، تتبع ديون العملاء والموردين، وإصدار تقارير A4 وحرارية رسمية بدقة محاسبية متناهية.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-10">
              <button
                type="button"
                onClick={() => { setTrialSubmitted(false); setIsTrialModalOpen(true); }}
                className="w-full sm:w-auto py-3 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>اطلب تجربة مجانية لمدة شهر</span>
                <ArrowLeft size={16} />
              </button>
              <button
                type="button"
                onClick={onOpenLogin}
                className="w-full sm:w-auto py-3 px-6 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-sm font-bold transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock size={15} className="text-slate-500" />
                <span>تسجيل دخول المشتركين</span>
              </button>
            </div>

            {/* Guarantees Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium pt-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>تجربة حقيقية 30 يوماً مجاناً</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>تدريب وتهيئة مخصصة لمتجرك</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>دعم سطح المكتب وأندرويد والويب</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 3. 4-Step Process: "جرّب النظام لمدة شهر" */}
      <section id="steps" className="py-16 sm:py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2 block">
              خطة التجربة المعتمدة
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              كيف تبدأ تجربة النظام مجاناً لمدة شهر؟
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              لا نطلب أي بطاقة ائتمانية أو التزام مالي. نجهز نظامك بالكامل ونبدأ معك خطوة بخطوة.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 relative">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black text-sm flex items-center justify-center mb-4">
                1
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">تقديم طلب التجربة</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                املأ استمارة طلب التجربة وسجل بيانات نشاطك التجاري ونوع أجهزة الكاشير والموازين المتوفرة لديك.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 relative">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-black text-sm flex items-center justify-center mb-4">
                2
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">التواصل والتهيئة</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                يتواصل معك مهندس الدعم الفني خلال ساعتين لتهيئة قاعدة البيانات وإدخال قائمة أصناف وأسعار متجرك.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 relative">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-black text-sm flex items-center justify-center mb-4">
                3
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">التدريب والتسليم</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                جلسة تدريبية مبسطة لك وللكاشير على إصدار الفواتير، ربط الميزان، وجرد الخزينة اليومي بكل سهولة.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 relative">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black text-sm flex items-center justify-center mb-4">
                4
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">الاستخدام والدعم المباشر</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                تبدأ العمل الفعلي طوال 30 يوماً مع دعم فني مستمر، ومتابعة التقارير المالية لتقييم أداء متجرك.
              </p>
            </div>

          </div>

          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => { setTrialSubmitted(false); setIsTrialModalOpen(true); }}
              className="py-3 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              ابدأ الآن بطلب نسختك التجريبية
            </button>
          </div>

        </div>
      </section>

      {/* 4. Real System Capabilities Grid */}
      <section id="features" className="py-16 sm:py-20 bg-slate-50/60 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2 block">
              وظائف النظام المحاسبي
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              كل ما تحتاجه لإدارة وتأمين أموالك وتجارتك
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              مصمم خصيصاً ليناسب طبيعة حركة بيع وتوريد الخضروات والفواكه وسرعة الكاشير.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <ShoppingCart size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">كاشير سريع وموازين ذكية</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                إتمام الفاتورة في ثوانٍ معدودة، قراءة تلقائية للأوزان من الميزان الإلكتروني، ودعم الدفع النقدي والآجل والبطاقات.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Truck size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">التوريد وحسابات الموردين</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                تسجيل فواتير المشتريات بالكيلو والقفص، رصد أمانات الموردين، وجدولة الدفعات النقدية مع كشف حساب تفصيلي لكل مورد.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Users size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">العملاء الآجلين وسجل الديون</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                تحديد سقف الائتمان للعملاء، تسجيل الدفعات المسددة، وتنبيهات فورية بالديون المتأخرة مع طباعة كشوفات المطالبة المالية.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <Scale size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">جرد الخزينة ومطابقة الدرج</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                مطابقة نقدية الدرج مع مبيعات النظام بنهاية كل وردية، رصد العجز والزيادة بدقة، والتحكم بمصروفات النثريات اليومية.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <FileText size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">تقارير A4 والحرارية الرسمية</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                ميزان مراجعة معتمد، تقرير أرباح وخسائر فعلي، حركة دوران الأصناف، وتصدير كامل للـ PDF مع مراعاة المعايير المحاسبية.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-4">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">صلاحيات محكمة وتعدد فروع</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                تحديد دقيق لصلاحيات الكاشير والمحاسب والمدير، منع التعديل بعد الإغلاق، ودعم الفروع المتعددة بمزامنة سحابية آمنة.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 5. Live Showcase Gallery */}
      <section id="showcase" className="py-16 sm:py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2 block">
              تجربة مستخدم حقيقية
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              واجهات عمل متطورة وسلسة للمحترفين
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              شاشات مصممة بأعلى معايير الـ Fintech لضمان أسرع أداء وتفادي أي أخطاء بشرية.
            </p>
          </div>

          {/* Interactive Showcase Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {[
              { id: 'sale', label: 'نقطة البيع والميزان' },
              { id: 'invoices', label: 'سجل الفواتير' },
              { id: 'purchases', label: 'المشتريات والموردين' },
              { id: 'customers', label: 'ديون العملاء' },
              { id: 'reports', label: 'تقارير A4 الرسمية' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActivePreviewTab(tab.id)}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activePreviewTab === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Device Mockup Window */}
          <div className="max-w-5xl mx-auto rounded-2xl border border-slate-300 bg-slate-900 p-2 shadow-2xl">
            <div className="h-6 flex items-center justify-between px-3 text-slate-400 text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <span className="font-mono text-slate-400">سوق الخضار | شاشة {activePreviewTab}</span>
              <span className="text-emerald-400">مباشر &bull; متصل</span>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 sm:p-6 overflow-hidden min-h-[360px] flex flex-col justify-center items-center text-center">
              {activePreviewTab === 'sale' && (
                <div className="w-full max-w-2xl bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-right">
                  <div className="flex items-center justify-between border-b pb-3 mb-4">
                    <span className="font-bold text-sm text-slate-800">شاشة الكاشير والميزان الإلكتروني</span>
                    <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-1 rounded">الوزن: 2.450 كجم</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs mb-4">
                    <div className="p-3 bg-slate-50 rounded-lg border">طماطم بلدي: 36.75 ج.م</div>
                    <div className="p-3 bg-slate-50 rounded-lg border">بطاطس تحمير: 45.00 ج.م</div>
                    <div className="p-3 bg-slate-50 rounded-lg border">بصل أحمر: 28.00 ج.م</div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="font-bold text-base text-emerald-600">الإجمالي: 109.75 ج.م</span>
                    <span className="text-xs bg-slate-900 text-white px-4 py-2 rounded-lg font-bold">طباعة وإغلاق (F9)</span>
                  </div>
                </div>
              )}

              {activePreviewTab === 'invoices' && (
                <div className="w-full max-w-2xl bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-right">
                  <div className="flex items-center justify-between border-b pb-3 mb-4">
                    <span className="font-bold text-sm text-slate-800">سجل الفواتير والمردودات اللحظي</span>
                    <span className="text-xs text-slate-500">24 فاتورة اليوم</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between p-2.5 bg-slate-50 rounded border">
                      <span>فاتورة #INV-2401 &bull; نقدي</span>
                      <span className="font-bold text-emerald-600">145.50 ج.م</span>
                    </div>
                    <div className="flex justify-between p-2.5 bg-slate-50 rounded border">
                      <span>فاتورة #INV-2400 &bull; عميل آجل (مطعم الشرق)</span>
                      <span className="font-bold text-amber-600">820.00 ج.م</span>
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === 'purchases' && (
                <div className="w-full max-w-2xl bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-right">
                  <div className="flex items-center justify-between border-b pb-3 mb-4">
                    <span className="font-bold text-sm text-slate-800">حركة التوريد وفواتير الموردين</span>
                    <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2 py-1 rounded">المخزون محدث</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between p-2.5 bg-slate-50 rounded border">
                      <span>توريد قفص خيار (40 كجم) &bull; الحاج محمود</span>
                      <span className="font-bold text-slate-800">600.00 ج.م</span>
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === 'customers' && (
                <div className="w-full max-w-2xl bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-right">
                  <div className="flex items-center justify-between border-b pb-3 mb-4">
                    <span className="font-bold text-sm text-slate-800">كشوفات حسابات العملاء والديون</span>
                    <span className="text-xs text-rose-600 font-bold">إجمالي الديون القائمة: 4,120 ج.م</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between p-2.5 bg-slate-50 rounded border">
                      <span>سوبرماركت الخير &bull; سداد دفعة 1,000 ج.م</span>
                      <span className="font-bold text-emerald-600">تم التسديد</span>
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === 'reports' && (
                <div className="w-full max-w-2xl bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-right">
                  <div className="flex items-center justify-between border-b pb-3 mb-4">
                    <span className="font-bold text-sm text-slate-800">ميزان المراجعة والأرباح والخسائر الرسمية</span>
                    <span className="text-xs bg-slate-100 font-bold px-2 py-1 rounded">طباعة A4 رسمية</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded border text-center text-xs text-slate-600">
                    تقرير محاسبي شامل ومعتمد للإيرادات وتكلفة البضاعة المباعة وصافي أرباح الشركاء بعد المصروفات.
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* 6. Pricing Section */}
      <section id="pricing" className="py-16 sm:py-20 bg-slate-50/60 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2 block">
              خطط واضحة ومرنة
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              استثمار اقتصادي مع عائد حقيقي مباشر
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              ابدأ بشهر تجربة مجاني، ثم اختر الباقة الأنسب لحجم أعمالك مع دعم فني مستمر.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* Plan 1: Single Store */}
            <div className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm relative flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full inline-block mb-3">
                  الأكثر طلباً لمحلات التجزئة
                </span>
                <h3 className="text-xl font-bold text-slate-900 mb-1">باقة المتجر الفردي</h3>
                <p className="text-xs text-slate-500 mb-6">مناسبة للمحلات ونقاط البيع المنفردة</p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-black text-slate-900">اشتراك رمزي</span>
                  <span className="text-xs text-slate-500">/ بعد انتهاء شهر التجربة</span>
                </div>

                <ul className="space-y-3 text-xs text-slate-700 mb-8">
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-600 shrink-0" />
                    <span>ترخيص برنامج سطح المكتب للويندوز</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-600 shrink-0" />
                    <span>تطبيق أندرويد للمالك لمتابعة المبيعات من الهاتف</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-600 shrink-0" />
                    <span>مزامنة سحابية للبيانات ونسخ احتياطي يومي</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-600 shrink-0" />
                    <span>مركز التقارير الرسمية A4 والفواتير الحرارية</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-600 shrink-0" />
                    <span>دعم فني مباشر وتحديثات مستمرة</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => { setTrialSubmitted(false); setIsTrialModalOpen(true); }}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer"
              >
                طلب تجربة الباقة لمدة شهر
              </button>
            </div>

            {/* Plan 2: Multi-branch */}
            <div className="p-7 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl relative flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full inline-block mb-3">
                  للسلاسل والأنشطة المتعددة
                </span>
                <h3 className="text-xl font-bold text-white mb-1">باقة المؤسسات والفروع</h3>
                <p className="text-xs text-slate-400 mb-6">إدارة مركزية لعدة منافذ بيع ومستودعات</p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-black text-white">تخصيص كامل</span>
                  <span className="text-xs text-slate-400">/ حسب عدد الفروع</span>
                </div>

                <ul className="space-y-3 text-xs text-slate-300 mb-8">
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-400 shrink-0" />
                    <span>فروع ومحطات كاشير غير محدودة</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-400 shrink-0" />
                    <span>ربط مركزي بين المخازن ومنافذ البيع</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-400 shrink-0" />
                    <span>حسابات الشركاء والمسحوبات وتوزيع الأرباح</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-400 shrink-0" />
                    <span>خادم سحابي مخصص مع أعلى معايير الحماية</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-400 shrink-0" />
                    <span>مسؤول دعم فني مخصص وتدريب ميداني</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => { setTrialSubmitted(false); setIsTrialModalOpen(true); }}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-900/50 cursor-pointer"
              >
                طلب تجربة المؤسسات
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* 7. Supported Platforms */}
      <section id="platforms" className="py-16 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2 block">
              المرونة الكاملة
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              يعمل على كافة أجهزتك بكل موثوقية
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-4">
                <Monitor size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">أجهزة سطح المكتب (Windows)</h3>
              <p className="text-xs text-slate-600">
                برنامج خفيف وسريع متوافق مع كافة طابعات الفواتير والموازين وأجهزة الكاشير العاملة بنظام ويندوز.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-4">
                <Smartphone size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">هواتف وأجهزة أندرويد (Android)</h3>
              <p className="text-xs text-slate-600">
                تطبيق هاتف مخصص يمكنك من متابعة نشاط المحل، الاطلاع على الأرباح، وفحص مبيعات الكاشير لحظة بلحظة.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-4">
                <Globe size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">بوابة الويب السحابية (Web Cloud)</h3>
              <p className="text-xs text-slate-600">
                إمكانية تسجيل الدخول وإدارة الحسابات مباشرة من أي متصفح مع تحديث تلقائي مستمر دون الحاجة لأي تثبيت.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 8. Footer */}
      <footer className="bg-slate-900 text-white py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Store size={20} />
              </div>
              <div>
                <span className="font-bold text-sm text-white block">نظام سوق الخضار والمحاسبة</span>
                <span className="text-[11px] text-slate-400 block">إدارة تجارية متقدمة &bull; v{APP_VERSION}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="https://wa.me/201099684120"
                target="_blank"
                rel="noreferrer"
                className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <MessageCircle size={15} />
                <span>تواصل عبر الواتساب</span>
              </a>
              <button
                type="button"
                onClick={onOpenLogin}
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700"
              >
                دخول المشتركين
              </button>
            </div>
          </div>

          <div className="pt-8 text-center text-xs text-slate-500">
            جميع الحقوق محفوظة &copy; 2026 المنظومة المحاسبية المعتمدة لإدارة أسواق الخضار والأنشطة التجارية.
          </div>
        </div>
      </footer>

      {/* 9. Trial Request Modal */}
      {isTrialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity" 
            onClick={() => setIsTrialModalOpen(false)}
          />

          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">طلب تجربة مجانية لمدة شهر</h3>
                <p className="text-xs text-slate-500 mt-0.5">نسخة كاملة الصلاحيات مع تدريب فني مخصص لنشاطك</p>
              </div>
              <button
                type="button"
                onClick={() => setIsTrialModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {trialSubmitted ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 size={32} />
                </div>
                <h4 className="font-bold text-base text-slate-900">تم استلام طلب التجربة بنجاح!</h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  شكراً لاهتمامك. يتم الآن توجيه طلبك إلى فريق الدعم الفني، وسنتواصل معك على رقم هاتفك لتهيئة نسختك وبدء التدريب فوراً.
                </p>
                <button
                  type="button"
                  onClick={() => setIsTrialModalOpen(false)}
                  className="mt-4 py-2 px-6 bg-slate-900 text-white text-xs font-bold rounded-xl"
                >
                  إغلاق
                </button>
              </div>
            ) : (
              <form onSubmit={handleTrialSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    الاسم الكامل <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={trialForm.name}
                    onChange={(e) => setTrialForm({ ...trialForm, name: e.target.value })}
                    placeholder="مثال: أحمد محمود"
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 select-text"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    اسم المنشأة أو المتجر <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={trialForm.shopName}
                    onChange={(e) => setTrialForm({ ...trialForm, shopName: e.target.value })}
                    placeholder="مثال: أسواق النور للخضار"
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 select-text"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      رقم الهاتف / واتساب <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={trialForm.phone}
                      onChange={(e) => setTrialForm({ ...trialForm, phone: e.target.value })}
                      placeholder="010XXXXXXXX"
                      className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 select-text"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      المدينة أو المحافظة
                    </label>
                    <input
                      type="text"
                      value={trialForm.city}
                      onChange={(e) => setTrialForm({ ...trialForm, city: e.target.value })}
                      placeholder="مثال: القاهرة / الإسكندرية"
                      className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 select-text"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ملاحظات أو متطلبات خاصة (اختياري)
                  </label>
                  <textarea
                    rows={2}
                    value={trialForm.notes}
                    onChange={(e) => setTrialForm({ ...trialForm, notes: e.target.value })}
                    placeholder="مثال: عدد محطات الكاشير، نوع الميزان المتوفر..."
                    className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 select-text resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTrialModalOpen(false)}
                    className="py-2 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm"
                  >
                    تأكيد وإرسال طلب التجربة
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
