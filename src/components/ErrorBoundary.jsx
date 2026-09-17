import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full max-w-xl mx-auto my-12 p-6 bg-white rounded-2xl shadow-sm border border-slate-200 text-center space-y-4 animate-in fade-in duration-200">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto text-xl">
            <AlertTriangle size={26} />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">
              {this.props.fallbackTitle || 'حدث تنبيه أثناء عرض هذا القسم'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              تم حماية بياناتك وأمان النظام؛ يمكنك إعادة تحميل هذا القسم أو الانتقال لنقطة البيع مباشرة.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <RotateCcw size={14} className="text-emerald-400" />
              <span>إعادة المحاولة</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
