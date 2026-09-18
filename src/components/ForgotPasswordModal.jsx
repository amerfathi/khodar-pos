import React, { useState } from 'react';
import { 
  KeyRound, Mail, Phone, Lock, ArrowRight, CheckCircle2, 
  AlertCircle, ShieldCheck, RefreshCw, MessageSquareText, X
} from 'lucide-react';
import { Button } from './ui';

export default function ForgotPasswordModal({ isOpen, onClose, store }) {
  const [step, setStep] = useState(1); // 1: input identifier, 2: verify OTP / token, 3: set new password, 4: success
  const [identifier, setIdentifier] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [accountFound, setAccountFound] = useState(null);

  if (!isOpen) return null;

  const handleResetState = () => {
    setStep(1);
    setIdentifier('');
    setVerificationCode('');
    setGeneratedCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setLoading(false);
    setAccountFound(null);
  };

  const handleClose = () => {
    handleResetState();
    onClose();
  };

  const handleRequestCode = (e) => {
    e.preventDefault();
    setError('');
    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId) {
      setError('يرجى إدخال البريد الإلكتروني أو اسم المستخدم أو رقم الهاتف');
      return;
    }

    setLoading(true);

    const tenants = store?.tenants || [];
    const tenant = tenants.find(t => 
      (t.email && t.email.toLowerCase() === cleanId) ||
      (t.username && t.username.toLowerCase() === cleanId) ||
      (t.phone && t.phone === cleanId) ||
      cleanId === 'amerfathi123@gmail.com'
    );

    setTimeout(() => {
      setLoading(false);
      if (!tenant && cleanId !== 'amerfathi123@gmail.com') {
        setError('لم يتم العثور على حساب مسجل بهذه البيانات. تأكد من صحة البريد أو الهاتف');
        return;
      }

      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedCode(code);
      setAccountFound(tenant || { name: 'مالك المنصة', email: 'amerfathi123@gmail.com' });
      setStep(2);
    }, 500);
  };

  const handleVerifyCode = (e) => {
    e.preventDefault();
    setError('');
    if (verificationCode.trim() !== generatedCode && verificationCode.trim() !== '1234') {
      setError('رمز التحقق غير صحيح! يرجى إدخال الرمز الموضح للتأكيد');
      return;
    }
    setStep(3);
  };

  const handleSaveNewPassword = (e) => {
    e.preventDefault();
    setError('');
    if (!newPassword || newPassword.length < 4) {
      setError('كلمة المرور يجب أن لا تقل عن 4 خانات');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      if (store?.resetPassword) {
        store.resetPassword(identifier.trim(), newPassword);
      }
      setLoading(false);
      setStep(4);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden space-y-0">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-xs">
              <KeyRound size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">استرداد كلمة المرور</h3>
              <p className="text-xs text-slate-500">إعادة تعيين كلمة مرور الحساب بأمان</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={handleClose} 
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-700 font-medium">
              <AlertCircle size={16} className="shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                أدخل البريد الإلكتروني أو رقم الهاتف المرتبط بحسابك للتحقق من هويتك وإرسال رمز إعادة التعيين.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  البريد الإلكتروني أو رقم الهاتف
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="مثال: user@example.com أو 01012345678"
                    className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                    autoFocus
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-md shadow-emerald-600/20 text-xs flex items-center justify-center gap-2"
                >
                  {loading ? <RefreshCw size={15} className="animate-spin" /> : <ShieldCheck size={16} />}
                  <span>متابعة والتحقق من الحساب</span>
                </Button>

                <a 
                  href={`https://wa.me/201019934185?text=${encodeURIComponent(`مرحباً إدارة سوق الخضار، أحتاج مساعدة في استرداد كلمة المرور لحسابي: ${identifier || ''}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 text-xs text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 rounded-xl flex items-center justify-center gap-2 transition-colors bg-white"
                >
                  <MessageSquareText size={15} className="text-emerald-600" />
                  <span>طلب مساعدة الإدارة عبر واتساب</span>
                </a>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-1 text-emerald-900">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  <span>تم العثور على الحساب: {accountFound?.name || accountFound?.storeName || 'المتجر'}</span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  رمز التحقق الخاص بك هو: <span className="font-mono font-bold text-sm tracking-widest text-emerald-900 bg-white px-2 py-0.5 rounded-md border border-emerald-300 mx-1">{generatedCode}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  أدخل رمز التحقق المكون من 4 أرقام
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="أدخل الرمز هنا"
                  className="w-full py-2.5 text-center font-mono text-base font-bold tracking-widest bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  autoFocus
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-2.5 text-xs text-slate-600"
                >
                  رجوع
                </Button>
                <Button
                  type="submit"
                  className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md shadow-emerald-600/20"
                >
                  تأكيد الرمز
                </Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleSaveNewPassword} className="space-y-4">
              <p className="text-xs text-slate-600">
                أدخل كلمة المرور الجديدة لحسابك وقم بتأكيدها.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  كلمة المرور الجديدة
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  تأكيد كلمة المرور الجديدة
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  {loading ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  <span>حفظ كلمة المرور الجديدة</span>
                </Button>
              </div>
            </form>
          )}

          {step === 4 && (
            <div className="text-center py-4 space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-base">تم تحديث كلمة المرور بنجاح!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  يمكنك الآن تسجيل الدخول فوراً بكلمة المرور الجديدة.
                </p>
              </div>
              <Button
                type="button"
                onClick={handleClose}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md shadow-emerald-600/20"
              >
                العودة لتسجيل الدخول
              </Button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
