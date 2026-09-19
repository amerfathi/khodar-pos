import React, { useState } from 'react';
import { 
  FileText, Printer, MessageCircle, Calendar, Filter, 
  TrendingUp, TrendingDown, Users, AlertOctagon, DollarSign, PieChart, 
  Package, ArrowDownLeft, ArrowUpRight, Scale, Check, ChevronDown
} from 'lucide-react';
import { formatCurrency, formatWeight, getCurrentDateFormatted } from '../utils/formatters';

export default function ReportsCenterView({ store, initialReportType = 'sales' }) {
  const { 
    invoices, customers, expenses, damagedItems, 
    workers, workerTransactions, settings, products, 
    purchases, partners = [], partnerDrawings = [], 
    profitDistributions = [], suppliers = [], getFinancialPosition,
    salesReturns = [], purchaseReturns = []
  } = store;

  const finPos = getFinancialPosition ? getFinancialPosition() : null;

  // Selected report type
  const [reportType, setReportType] = useState(initialReportType);
  // Date range filter: 'today' | 'yesterday' | 'week' | 'month' | 'all'
  const [dateFilter, setDateFilter] = useState('all');
  // Customer selection for customer statement
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  // Partner selection for partner statement
  const [selectedPartnerId, setSelectedPartnerId] = useState(partners[0]?.id || '');

  const todayStr = getCurrentDateFormatted();

  // Helper date filtering
  const filterByDate = (dateStr) => {
    if (!dateStr) return true;
    if (dateFilter === 'all') return true;
    if (dateFilter === 'today') return dateStr === todayStr;
    
    const d = new Date(dateStr);
    const now = new Date();
    
    if (dateFilter === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return dateStr === yesterday.toISOString().split('T')[0];
    }
    if (dateFilter === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    }
    if (dateFilter === 'month') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return d >= monthAgo;
    }
    return true;
  };

  // Filtered collections
  const filteredInvoices = invoices.filter(inv => inv.status !== 'voided' && filterByDate(inv.date));
  const filteredExpenses = expenses.filter(exp => filterByDate(exp.date));
  const filteredDamaged = damagedItems.filter(dmg => filterByDate(dmg.date));
  const filteredWorkerTxs = workerTransactions.filter(tx => filterByDate(tx.date));
  const filteredPurchases = (purchases || []).filter(pur => filterByDate(pur.date));
  const filteredSalesReturns = (salesReturns || []).filter(ret => filterByDate(ret.date));
  const filteredPurchaseReturns = (purchaseReturns || []).filter(ret => filterByDate(ret.date));

  // 1. Sales Totals
  const totalGrossSales = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.finalTotal) || 0), 0);
  const totalSalesReturnsAmount = filteredSalesReturns.reduce((sum, r) => sum + (Number(r.totalRefundAmount) || 0), 0);
  const totalNetSales = Math.max(0, totalGrossSales - totalSalesReturnsAmount);
  const totalSalesRevenue = totalNetSales; // Alias for net revenue

  const totalCashCollected = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0);
  const totalCreditSales = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.remainingDebt) || 0), 0);
  const totalGrossNetKgSold = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.totalNetWeight) || 0), 0);
  const totalSalesReturnsKg = filteredSalesReturns.reduce((sum, r) => sum + (Number(r.returnedNetWeight) || 0), 0);
  const totalNetKgSold = Math.max(0, totalGrossNetKgSold - totalSalesReturnsKg);
  const totalPackagesSold = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.totalPackages) || 0), 0);

  // 2. Purchases Totals (المشتريات والتوريد)
  const totalGrossPurchasesCost = filteredPurchases.reduce((sum, p) => sum + (Number(p.totalCost) || 0), 0);
  const totalPurchaseReturnsAmount = filteredPurchaseReturns.reduce((sum, r) => sum + (Number(r.totalRefundAmount) || 0), 0);
  const totalNetPurchasesCost = Math.max(0, totalGrossPurchasesCost - totalPurchaseReturnsAmount);
  const totalPurchasesCost = totalNetPurchasesCost; // Alias for net cost

  const totalGrossPurchasesKg = filteredPurchases.reduce((sum, p) => sum + (Number(p.quantityKg) || 0), 0);
  const totalPurchaseReturnsKg = filteredPurchaseReturns.reduce((sum, r) => sum + (Number(r.returnedKg) || 0), 0);
  const totalNetPurchasesKg = Math.max(0, totalGrossPurchasesKg - totalPurchaseReturnsKg);
  const totalPurchasesKg = totalNetPurchasesKg; // Alias for net kg
  const totalPurchasesPackages = filteredPurchases.reduce((sum, p) => sum + (Number(p.packagesCount) || 0), 0);

  // 3. Expenses & Loss Totals
  const generalExpensesAmount = filteredExpenses.filter(e => !e.isSupplierPayment).reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  const totalExpensesAmount = generalExpensesAmount;
  const totalDamagedLoss = filteredDamaged.reduce((sum, dmg) => sum + (Number(dmg.totalLoss) || 0), 0);
  const totalDamagedKg = filteredDamaged.reduce((sum, dmg) => sum + (Number(dmg.quantityKg) || 0), 0);
  const totalSalariesPaid = filteredWorkerTxs.filter(t => t.type === 'salary_payment').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalAdvancesGiven = filteredWorkerTxs.filter(t => t.type === 'advance').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // 4. P&L Net Profit (صافي الربح الحقيقي الشامل بعد خصم المردودات والتكاليف والرواتب والهدر)
  const grossTradeProfit = totalNetSales - totalNetPurchasesCost;
  const netEstimatedProfit = totalNetSales - totalNetPurchasesCost - generalExpensesAmount - totalSalariesPaid - totalDamagedLoss;

  // 4. Product Sales Breakdown
  const productPerformance = products.map(prod => {
    let soldKg = 0;
    let packagesCount = 0;
    let totalRevenue = 0;

    filteredInvoices.forEach(inv => {
      inv.items.forEach(item => {
        if (item.productId === prod.id || item.name.includes(prod.name.split(' ')[0])) {
          soldKg += Number(item.netWeight) || 0;
          packagesCount += Number(item.packageCount) || 0;
          totalRevenue += Number(item.total) || 0;
        }
      });
    });

    return {
      id: prod.id,
      name: prod.name,
      emoji: prod.emoji,
      unit: prod.defaultUnit,
      soldKg,
      packagesCount,
      totalRevenue,
      avgPricePerKg: soldKg > 0 ? (totalRevenue / soldKg).toFixed(2) : prod.defaultPricePerKg
    };
  }).filter(p => p.soldKg > 0 || dateFilter === 'all');

  // Customer Statement Data
  const targetCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];
  const customerInvoices = invoices.filter(i => i.customerId === targetCustomer?.id && i.status !== 'voided');
  const targetCustomerPayments = (store.customerPayments || []).filter(p => p.customerId === targetCustomer?.id);

  // Combine invoices and cash payments into a chronological ledger
  const customerLedger = [
    ...customerInvoices.map(inv => ({
      id: inv.id,
      date: inv.date,
      time: inv.time,
      type: 'invoice',
      docName: `فاتورة بيع #${inv.id}`,
      description: inv.items.map(i => `${i.name} (${i.netWeight}كجم)`).join('، '),
      netWeight: inv.totalNetWeight,
      debit: inv.finalTotal, // إجمالي البضاعة
      paidImmediate: inv.paidAmount, // المدفوع كاش فوري
      debtAdded: inv.remainingDebt, // المتبقي المضاف للدين
      creditPaid: 0,
      netEffect: inv.remainingDebt
    })),
    ...targetCustomerPayments.map(pay => ({
      id: pay.id,
      date: pay.date,
      time: pay.time,
      type: 'payment',
      docName: `سند قبض دفعة نقدية`,
      description: pay.notes || 'سداد دفعة نقدية على الحساب',
      netWeight: null,
      debit: 0,
      paidImmediate: 0,
      debtAdded: 0,
      creditPaid: pay.amount, // سداد خفض الدين
      netEffect: -pay.amount
    }))
  ].sort((a, b) => a.date.localeCompare(b.date));

  // Compute running balance
  let runningBal = 0;
  const ledgerWithBalance = customerLedger.map(item => {
    runningBal += item.netEffect;
    return {
      ...item,
      runningBalance: Math.round(runningBal * 100) / 100
    };
  });

  const handlePrint = () => {
    window.print();
  };

  const reportTitles = {
    sales: 'تقرير المبيعات الشامل واليومي',
    purchases: 'تقرير المشتريات وتوريد البضاعة من المزارع والجملة',
    returns: 'سجل مردودات المبيعات والمشتريات (بالسعر التاريخي الأصلي)',
    audit: 'تقرير جرد الخزينة والمركز المالي وتحديد أماكن السيولة',
    partners: 'كشف حساب الشركاء والمسحوبات وتوزيع الأرباح',
    customer: 'كشف حساب تفصيلي للعميل',
    damaged: 'تقرير التوالف وإعدامات البضاعة الهالكة',
    payroll: 'كشف رواتب وسلفيات العمال',
    expenses: 'تقرير المصروفات والتشغيل',
    products: 'تقرير حركة مبيعات وأوزان الأصناف',
    pnl: 'قائمة الدخل وصافي الأرباح والخسائر الشامل',
  };

  return (
    <div className="w-full pb-28 lg:pb-12 pt-3 px-3 sm:px-6 lg:px-8 space-y-4">
      
      {/* Control Header & Filters (Hidden in print) */}
      <div className="bg-white rounded-xl p-4 shadow-2xs border border-slate-200/80 space-y-3 print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 border border-primary-200 flex items-center justify-center">
              <PieChart size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-navy-850">مركز التقارير الشاملة القابلة للطباعة A4</h1>
              <p className="text-xs text-slate-500 font-normal">تقارير رسمية مفصلة جاهزة للطباعة الورقية وتصدير PDF</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-auto px-4 py-2 bg-primary-600 hover:bg-primary-700 active:scale-95 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer"
          >
            <Printer size={15} />
            <span>طباعة تقرير A4 الحالي</span>
          </button>
        </div>

        {/* Report Type Selector Chips - Grouped by Business Department */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            // 1. Sales & Customers
            { id: 'sales', label: 'المبيعات والإيرادات' },
            { id: 'customer', label: 'كشف حساب عميل' },
            { id: 'products', label: 'حركة وأوزان الأصناف' },
            // 2. Purchases & Inventory & Returns
            { id: 'purchases', label: 'المشتريات والتوريد' },
            { id: 'returns', label: 'مردودات البيع والشراء' },
            { id: 'damaged', label: 'التوالف والإعدامات' },
            // 3. Operations & Staff
            { id: 'expenses', label: 'المصروفات والنثريات' },
            { id: 'payroll', label: 'رواتب العمال والسلف' },
            // 4. Finance & Ownership
            { id: 'audit', label: 'الجرد ومطابقة السيولة' },
            { id: 'partners', label: 'الشركاء والمسحوبات' },
            { id: 'pnl', label: 'الأرباح والخسائر الشاملة' },
          ].map(r => (
            <button
              key={r.id}
              type="button"
              onClick={() => setReportType(r.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                reportType === r.id
                  ? 'bg-primary-50 text-primary-700 border border-primary-200 font-bold shadow-2xs'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Date Filter & Options */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-slate-500 text-xs font-semibold">الفترة:</span>
            {[
              { id: 'all', label: 'الكل' },
              { id: 'today', label: 'اليوم' },
              { id: 'yesterday', label: 'أمس' },
              { id: 'week', label: 'آخر 7 أيام' },
              { id: 'month', label: 'هذا الشهر' },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setDateFilter(f.id)}
                className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-all cursor-pointer ${
                  dateFilter === f.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* If Customer statement report is chosen, show customer picker */}
          {reportType === 'customer' && (
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <span className="text-slate-500 text-[11px] font-bold">العميل:</span>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="flex-1 sm:w-56 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-brand-600"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* If Partner statement report is chosen, show partner picker */}
          {reportType === 'partners' && (
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <span className="text-slate-500 text-[11px] font-bold">الشريك:</span>
              <select
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(e.target.value)}
                className="flex-1 sm:w-56 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-brand-600"
              >
                <option value="all">جميع الشركاء (كشف عام)</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sharePercentage}%)</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Printable A4 Report Sheet Container */}
      <div className="overflow-x-auto w-full pb-6">
        <div 
          id="printable-a4-document"
          className="w-full max-w-[210mm] mx-auto bg-white p-3.5 sm:p-8 rounded-2xl shadow-md border border-slate-200/90 text-slate-900 font-sans text-xs print:m-0 print:p-0 print:border-none print:shadow-none print:max-w-none print:rounded-none min-w-0 overflow-hidden"
        >
          {/* Official Store Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b-2 border-slate-900">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🥬</span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight truncate">
                  {settings.shopName}
                </h2>
              </div>
              <p className="text-xs text-slate-600 font-semibold truncate">{settings.subTitle}</p>
              <p className="text-[11px] text-slate-500 truncate">📍 {settings.address} • 📞 {settings.phone}</p>
            </div>

            <div className="text-right sm:text-left space-y-1 shrink-0">
              <div className="inline-block bg-slate-900 text-white px-3 py-1 rounded-lg text-xs font-black">
                {reportTitles[reportType] || 'تقرير رسمي A4'}
              </div>
              <div className="text-[11px] text-slate-600 font-medium mt-1">
                تاريخ الاستخراج: <strong>{todayStr}</strong>
              </div>
              <div className="text-[10px] text-slate-500">
                الفترة: {dateFilter === 'all' ? 'كامل السجلات' : dateFilter === 'today' ? 'اليوم فقط' : dateFilter === 'week' ? 'آخر 7 أيام' : 'هذا الشهر'}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 1. SALES REPORT TABLE */}
          {/* ========================================================================= */}
          {reportType === 'sales' && (
            <div className="py-4 space-y-4">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="bg-white p-2 rounded-lg border border-slate-100 min-w-0 overflow-hidden">
                  <span className="text-[10px] text-slate-500 block truncate">إجمالي المبيعات</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 font-mono block truncate">{formatCurrency(totalGrossSales, settings.currency)}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-100 min-w-0 overflow-hidden">
                  <span className="text-[10px] text-rose-600 font-bold block truncate">مردودات مبيعات (-)</span>
                  <span className="text-xs sm:text-sm font-black text-rose-700 font-mono block truncate">-{formatCurrency(totalSalesReturnsAmount, settings.currency)}</span>
                </div>
                <div className="bg-emerald-50/60 p-2 rounded-lg border border-emerald-200 min-w-0 overflow-hidden">
                  <span className="text-[10px] text-emerald-800 font-black block truncate">صافي المبيعات (=)</span>
                  <span className="text-xs sm:text-sm font-black text-emerald-700 font-mono block truncate">{formatCurrency(totalNetSales, settings.currency)}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-100 min-w-0 overflow-hidden">
                  <span className="text-[10px] text-slate-500 block truncate">المحصل نقداً</span>
                  <span className="text-xs sm:text-sm font-black text-emerald-700 font-mono block truncate">{formatCurrency(totalCashCollected, settings.currency)}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-100 min-w-0 overflow-hidden">
                  <span className="text-[10px] text-slate-500 block truncate">الآجل (الديون)</span>
                  <span className="text-xs sm:text-sm font-black text-amber-800 font-mono block truncate">{formatCurrency(totalCreditSales, settings.currency)}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-100 min-w-0 overflow-hidden">
                  <span className="text-[10px] text-slate-500 block truncate">الوزن الصافي المباع</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 font-mono block truncate">{formatWeight(totalNetKgSold)}</span>
                </div>
              </div>

              {/* Invoices List Wrapped In Scroll Container */}
              <div className="overflow-x-auto w-full rounded-xl border border-slate-300">
                <table className="w-full min-w-[700px] text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[10px]">
                      <th className="p-2 border border-slate-800 text-center w-8">م</th>
                      <th className="p-2 border border-slate-800 text-center">رقم الفاتورة</th>
                      <th className="p-2 border border-slate-800">التاريخ والوقت</th>
                      <th className="p-2 border border-slate-800">اسم العميل</th>
                      <th className="p-2 border border-slate-800 text-center">طريقة الدفع</th>
                      <th className="p-2 border border-slate-800 text-center">العبوات</th>
                      <th className="p-2 border border-slate-800 text-center">الوزن الصافي</th>
                      <th className="p-2 border border-slate-800 text-center">إجمالي الفاتورة</th>
                      <th className="p-2 border border-slate-800 text-center">المدفوع</th>
                      <th className="p-2 border border-slate-800 text-center">المتبقي دين</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    {filteredInvoices.map((inv, idx) => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="p-2 border border-slate-200 text-center font-bold text-slate-600">{idx + 1}</td>
                        <td className="p-2 border border-slate-200 text-center font-mono font-black">#{inv.id}</td>
                        <td className="p-2 border border-slate-200 text-slate-600">{inv.date} {inv.time}</td>
                        <td className="p-2 border border-slate-200 font-bold text-slate-900">{inv.customerName}</td>
                        <td className="p-2 border border-slate-200 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            inv.saleType === 'cash' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {inv.saleType === 'cash' ? 'نقدي' : 'آجل'}
                          </span>
                        </td>
                        <td className="p-2 border border-slate-200 text-center">{inv.totalPackages}</td>
                        <td className="p-2 border border-slate-200 text-center font-mono">{formatWeight(inv.totalNetWeight)}</td>
                        <td className="p-2 border border-slate-200 text-center font-black font-mono">
                          {inv.finalTotal.toFixed(2)} {settings.currency}
                        </td>
                        <td className="p-2 border border-slate-200 text-center text-emerald-700 font-mono">
                          {inv.paidAmount.toFixed(2)}
                        </td>
                        <td className="p-2 border border-slate-200 text-center text-amber-800 font-bold font-mono">
                          {inv.remainingDebt > 0 ? `${inv.remainingDebt.toFixed(2)}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-black text-slate-900 text-xs">
                      <td colSpan="5" className="p-2 border border-slate-300">الإجمالي العام:</td>
                      <td className="p-2 border border-slate-300 text-center">{totalPackagesSold} عبوة</td>
                      <td className="p-2 border border-slate-300 text-center">{formatWeight(totalNetKgSold)}</td>
                      <td className="p-2 border border-slate-300 text-center text-sm font-black bg-slate-200">
                        {totalSalesRevenue.toFixed(2)} {settings.currency}
                      </td>
                      <td className="p-2 border border-slate-300 text-center text-emerald-800">
                        {totalCashCollected.toFixed(2)}
                      </td>
                      <td className="p-2 border border-slate-300 text-center text-amber-900">
                        {totalCreditSales.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 1.5. PURCHASES REPORT (تقرير المشتريات وتوريد البضاعة A4) */}
          {/* ========================================================================= */}
          {reportType === 'purchases' && (
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-slate-100 min-w-0 overflow-hidden text-center">
                  <span className="text-slate-500 block text-[10px] truncate">إجمالي المشتريات:</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 font-mono block truncate">
                    {formatCurrency(totalGrossPurchasesCost, settings.currency)}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-100 min-w-0 overflow-hidden text-center">
                  <span className="text-rose-600 font-bold block text-[10px] truncate">مردودات للموردين (-):</span>
                  <span className="text-xs sm:text-sm font-black text-rose-700 font-mono block truncate">
                    -{formatCurrency(totalPurchaseReturnsAmount, settings.currency)}
                  </span>
                </div>
                <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200 min-w-0 overflow-hidden text-center">
                  <span className="text-emerald-800 font-black block text-[10px] truncate">صافي تكلفة المشتريات:</span>
                  <span className="text-xs sm:text-sm font-black text-emerald-800 font-mono block truncate">
                    {formatCurrency(totalNetPurchasesCost, settings.currency)}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-100 min-w-0 overflow-hidden text-center">
                  <span className="text-slate-500 block text-[10px] truncate">صافي الكميات الموردة:</span>
                  <span className="text-xs sm:text-sm font-black text-slate-800 font-mono block truncate">
                    {formatWeight(totalNetPurchasesKg)}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-100 min-w-0 overflow-hidden text-center">
                  <span className="text-slate-500 block text-[10px] truncate">إجمالي عدد العبوات:</span>
                  <span className="text-xs sm:text-sm font-black text-slate-800 font-mono block truncate">
                    {totalPurchasesPackages} عبوة
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto w-full rounded-xl border border-slate-300">
                <table className="w-full min-w-[700px] text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[10px]">
                      <th className="p-2 border border-slate-800 text-center w-8">م</th>
                      <th className="p-2 border border-slate-800">التاريخ</th>
                      <th className="p-2 border border-slate-800">اسم الصنف</th>
                      <th className="p-2 border border-slate-800">المورد / المزرعة</th>
                      <th className="p-2 border border-slate-800 text-center">العبوة والعدد</th>
                      <th className="p-2 border border-slate-800 text-center">الوزن الصافي</th>
                      <th className="p-2 border border-slate-800 text-center">تكلفة الكيلو</th>
                      <th className="p-2 border border-slate-800 text-center">طريقة الدفع</th>
                      <th className="p-2 border border-slate-800 text-center">إجمالي التكلفة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    {filteredPurchases.map((pur, idx) => (
                      <tr key={pur.id}>
                        <td className="p-2 border border-slate-200 text-center font-bold text-slate-600">{idx + 1}</td>
                        <td className="p-2 border border-slate-200 font-mono text-[10px] text-slate-700">{pur.date}</td>
                        <td className="p-2 border border-slate-200 font-black text-slate-900">
                          {pur.icon} {pur.productName}
                        </td>
                        <td className="p-2 border border-slate-200 text-slate-700">{pur.supplierName}</td>
                        <td className="p-2 border border-slate-200 text-center">{pur.packagesCount} {pur.packageType}</td>
                        <td className="p-2 border border-slate-200 text-center font-bold font-mono">{formatWeight(pur.quantityKg)}</td>
                        <td className="p-2 border border-slate-200 text-center font-mono">{Number(pur.costPerKg).toFixed(2)}</td>
                        <td className="p-2 border border-slate-200 text-center text-[10px]">
                          <span className={`px-1.5 py-0.5 rounded font-bold ${
                            pur.paymentMethod === 'bank' ? 'bg-blue-100 text-blue-900' :
                            pur.paymentMethod === 'credit' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                          }`}>
                            {pur.paymentMethod === 'bank' ? 'بنك' : pur.paymentMethod === 'credit' ? 'آجل' : 'كاش'}
                          </span>
                        </td>
                        <td className="p-2 border border-slate-200 text-center font-black text-slate-900 font-mono">
                          {Number(pur.totalCost).toFixed(2)} {settings.currency}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-black text-slate-900 text-xs">
                      <td colSpan="4" className="p-2 border border-slate-300">الإجمالي العام:</td>
                      <td className="p-2 border border-slate-300 text-center">{totalPurchasesPackages} عبوة</td>
                      <td className="p-2 border border-slate-300 text-center">{formatWeight(totalPurchasesKg)}</td>
                      <td colSpan="2" className="p-2 border border-slate-300"></td>
                      <td className="p-2 border border-slate-300 text-center text-sm font-black bg-slate-200">
                        {totalPurchasesCost.toFixed(2)} {settings.currency}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 1.6. RETURNS REPORT (تقرير مردودات المبيعات والمشتريات بالسعر الأصلي) */}
          {/* ========================================================================= */}
          {reportType === 'returns' && (
            <div className="py-4 space-y-6">
              {/* Summary KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-rose-900">🔄 إجمالي مردودات المبيعات (من الزبائن)</span>
                    <span className="text-[10px] font-bold bg-white text-rose-800 px-2 py-0.5 rounded-md border border-rose-200">
                      {filteredSalesReturns.length} عملية مردود
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-2">
                    <div>
                      <span className="text-[10px] text-slate-500 block">إجمالي المبالغ المستردة:</span>
                      <span className="text-lg sm:text-xl font-black font-mono text-rose-700">
                        {formatCurrency(totalSalesReturnsAmount, settings.currency)}
                      </span>
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] text-slate-500 block">الوزن المرتجع:</span>
                      <span className="text-sm font-bold font-mono text-slate-800">
                        {formatWeight(totalSalesReturnsKg)}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-rose-800 mt-2 pt-2 border-t border-rose-200/60 font-medium">
                    🔒 محتسبة بدقة بالسعر الأصلي المسجل على كل فاتورة مباعة عند البيع.
                  </p>
                </div>

                <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-blue-900">🚛 إجمالي مردودات المشتريات (للموردين)</span>
                    <span className="text-[10px] font-bold bg-white text-blue-800 px-2 py-0.5 rounded-md border border-blue-200">
                      {filteredPurchaseReturns.length} عملية مردود
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-2">
                    <div>
                      <span className="text-[10px] text-slate-500 block">إجمالي المبالغ المستردة:</span>
                      <span className="text-lg sm:text-xl font-black font-mono text-blue-700">
                        {formatCurrency(totalPurchaseReturnsAmount, settings.currency)}
                      </span>
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] text-slate-500 block">الوزن المرتجع:</span>
                      <span className="text-sm font-bold font-mono text-slate-800">
                        {formatWeight(totalPurchaseReturnsKg)}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-blue-800 mt-2 pt-2 border-t border-blue-200/60 font-medium">
                    🔒 محتسبة بسعر التكلفة الأصلي للشحنة الواردة لحفظ حقوق المحل والمورد.
                  </p>
                </div>
              </div>

              {/* Table 1: Sales Returns */}
              <div>
                <h3 className="text-xs font-black text-slate-900 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                  <span>كشف مردودات المبيعات من الزبائن (تفصيلي)</span>
                </h3>
                <div className="overflow-x-auto w-full rounded-xl border border-slate-300">
                  <table className="w-full min-w-[700px] text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white text-[10px]">
                        <th className="p-2 border border-slate-800 text-center w-8">م</th>
                        <th className="p-2 border border-slate-800">التاريخ والوقت</th>
                        <th className="p-2 border border-slate-800 text-center">الفاتورة الأصلية</th>
                        <th className="p-2 border border-slate-800">العميل</th>
                        <th className="p-2 border border-slate-800">الصنف</th>
                        <th className="p-2 border border-slate-800 text-center">الوزن المرتجع</th>
                        <th className="p-2 border border-slate-800 text-center">السعر الأصلي للكيلو</th>
                        <th className="p-2 border border-slate-800 text-center">المبلغ المسترد</th>
                        <th className="p-2 border border-slate-800 text-center">طريقة الرد</th>
                        <th className="p-2 border border-slate-800 text-center">حالة الصنف</th>
                        <th className="p-2 border border-slate-800">السبب</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-[11px]">
                      {filteredSalesReturns.map((ret, idx) => (
                        <tr key={ret.id} className="hover:bg-slate-50">
                          <td className="p-2 border border-slate-200 text-center font-bold text-slate-600">{idx + 1}</td>
                          <td className="p-2 border border-slate-200 font-mono text-[10px] text-slate-600">{ret.date} {ret.time}</td>
                          <td className="p-2 border border-slate-200 text-center font-mono font-bold text-slate-800">#{ret.invoiceId}</td>
                          <td className="p-2 border border-slate-200 font-bold text-slate-900">{ret.customerName}</td>
                          <td className="p-2 border border-slate-200 font-bold">{ret.productName}</td>
                          <td className="p-2 border border-slate-200 text-center font-mono font-bold">{formatWeight(ret.returnedNetWeight)}</td>
                          <td className="p-2 border border-slate-200 text-center font-mono text-emerald-800 font-bold">
                            {Number(ret.originalPricePerKg).toFixed(2)}
                          </td>
                          <td className="p-2 border border-slate-200 text-center font-black font-mono text-rose-700">
                            {formatCurrency(ret.totalRefundAmount, settings.currency)}
                          </td>
                          <td className="p-2 border border-slate-200 text-center text-[10px]">
                            <span className={`px-1.5 py-0.5 rounded font-bold ${
                              ret.refundMethod === 'bank' ? 'bg-blue-100 text-blue-900' :
                              ret.refundMethod === 'customer_debt_deduction' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                            }`}>
                              {ret.refundMethod === 'bank' ? 'بنكي' : ret.refundMethod === 'customer_debt_deduction' ? 'خصم دين' : 'نقدي'}
                            </span>
                          </td>
                          <td className="p-2 border border-slate-200 text-center text-[10px]">
                            <span className={`px-1.5 py-0.5 rounded font-bold ${
                              ret.inventoryAction === 'restock' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {ret.inventoryAction === 'restock' ? 'أعيد للمخزن' : 'إعدام وتالف'}
                            </span>
                          </td>
                          <td className="p-2 border border-slate-200 text-slate-600 text-[10px]">{ret.reason || '—'}</td>
                        </tr>
                      ))}
                      {filteredSalesReturns.length === 0 && (
                        <tr>
                          <td colSpan={11} className="p-4 text-center text-slate-400 text-xs">
                            لا توجد مردودات مبيعات مسجلة خلال الفترة المختارة.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {filteredSalesReturns.length > 0 && (
                      <tfoot>
                        <tr className="bg-slate-100 font-black text-slate-900 text-xs">
                          <td colSpan="5" className="p-2 border border-slate-300">إجمالي مردودات المبيعات:</td>
                          <td className="p-2 border border-slate-300 text-center">{formatWeight(totalSalesReturnsKg)}</td>
                          <td className="p-2 border border-slate-300"></td>
                          <td className="p-2 border border-slate-300 text-center text-rose-800 font-mono text-sm bg-rose-100/60">
                            {formatCurrency(totalSalesReturnsAmount, settings.currency)}
                          </td>
                          <td colSpan="3" className="p-2 border border-slate-300"></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              {/* Table 2: Purchase Returns */}
              <div>
                <h3 className="text-xs font-black text-slate-900 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <span>كشف مردودات المشتريات للموردين (تفصيلي)</span>
                </h3>
                <div className="overflow-x-auto w-full rounded-xl border border-slate-300">
                  <table className="w-full min-w-[700px] text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white text-[10px]">
                        <th className="p-2 border border-slate-800 text-center w-8">م</th>
                        <th className="p-2 border border-slate-800">التاريخ والوقت</th>
                        <th className="p-2 border border-slate-800">المورد / المزرعة</th>
                        <th className="p-2 border border-slate-800">الصنف المرتجع</th>
                        <th className="p-2 border border-slate-800 text-center">الوزن المرتجع</th>
                        <th className="p-2 border border-slate-800 text-center">تكلفة الكيلو الأصلية</th>
                        <th className="p-2 border border-slate-800 text-center">المبلغ المسترد</th>
                        <th className="p-2 border border-slate-800 text-center">طريقة التسوية</th>
                        <th className="p-2 border border-slate-800">السبب والملاحظات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-[11px]">
                      {filteredPurchaseReturns.map((ret, idx) => (
                        <tr key={ret.id} className="hover:bg-slate-50">
                          <td className="p-2 border border-slate-200 text-center font-bold text-slate-600">{idx + 1}</td>
                          <td className="p-2 border border-slate-200 font-mono text-[10px] text-slate-600">{ret.date} {ret.time}</td>
                          <td className="p-2 border border-slate-200 font-bold text-slate-900">{ret.supplierName}</td>
                          <td className="p-2 border border-slate-200 font-bold">{ret.productName}</td>
                          <td className="p-2 border border-slate-200 text-center font-mono font-bold">{formatWeight(ret.returnedKg)}</td>
                          <td className="p-2 border border-slate-200 text-center font-mono text-blue-800 font-bold">
                            {Number(ret.originalCostPerKg).toFixed(2)}
                          </td>
                          <td className="p-2 border border-slate-200 text-center font-black font-mono text-emerald-700">
                            {formatCurrency(ret.totalRefundAmount, settings.currency)}
                          </td>
                          <td className="p-2 border border-slate-200 text-center text-[10px]">
                            <span className={`px-1.5 py-0.5 rounded font-bold ${
                              ret.refundMethod === 'bank' ? 'bg-blue-100 text-blue-900' :
                              ret.refundMethod === 'supplier_debt_deduction' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                            }`}>
                              {ret.refundMethod === 'bank' ? 'بنكي' : ret.refundMethod === 'supplier_debt_deduction' ? 'خصم من دين المورد' : 'نقدي في الدرج'}
                            </span>
                          </td>
                          <td className="p-2 border border-slate-200 text-slate-600 text-[10px]">{ret.reason || ret.notes || '—'}</td>
                        </tr>
                      ))}
                      {filteredPurchaseReturns.length === 0 && (
                        <tr>
                          <td colSpan={9} className="p-4 text-center text-slate-400 text-xs">
                            لا توجد مردودات مشتريات مسجلة خلال الفترة المختارة.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {filteredPurchaseReturns.length > 0 && (
                      <tfoot>
                        <tr className="bg-slate-100 font-black text-slate-900 text-xs">
                          <td colSpan="4" className="p-2 border border-slate-300">إجمالي مردودات المشتريات:</td>
                          <td className="p-2 border border-slate-300 text-center">{formatWeight(totalPurchaseReturnsKg)}</td>
                          <td className="p-2 border border-slate-300"></td>
                          <td className="p-2 border border-slate-300 text-center text-blue-800 font-mono text-sm bg-blue-100/60">
                            {formatCurrency(totalPurchaseReturnsAmount, settings.currency)}
                          </td>
                          <td colSpan="2" className="p-2 border border-slate-300"></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {reportType === 'customer' && targetCustomer && (
            <div className="py-4 space-y-4">
              {/* Customer Banner */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-500 font-medium">كشف حساب صادر للسيد / العميل:</span>
                  <h3 className="text-base font-black text-slate-900 mt-0.5 truncate">{targetCustomer.name}</h3>
                  <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-3">
                    {targetCustomer.phone && <span>هاتف: <strong>{targetCustomer.phone}</strong></span>}
                    {targetCustomer.address && <span>العنوان: <strong>{targetCustomer.address}</strong></span>}
                  </div>
                </div>

                <div className="text-right sm:text-left bg-white p-3 rounded-xl border border-slate-200 shadow-sm shrink-0 w-full sm:w-auto">
                  <span className="text-[10px] text-slate-500 font-bold block">الرصيد الحالي المستحق:</span>
                  <span className={`text-base font-black font-mono block ${targetCustomer.balance > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
                    {formatCurrency(targetCustomer.balance, settings.currency)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {targetCustomer.balance > 0 ? '(دين مستحق على العميل)' : '(خالص الحساب)'}
                  </span>
                </div>
              </div>

              {/* Comprehensive Chronological Ledger Table */}
              <div className="overflow-x-auto w-full rounded-xl border border-slate-300">
                <table className="w-full min-w-[700px] text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[10px]">
                      <th className="p-2 border border-slate-800 text-center w-8">م</th>
                      <th className="p-2 border border-slate-800 text-center">التاريخ</th>
                      <th className="p-2 border border-slate-800">نوع المستند</th>
                      <th className="p-2 border border-slate-800">البيان والتفاصيل</th>
                      <th className="p-2 border border-slate-800 text-center">الوزن الصافي</th>
                      <th className="p-2 border border-slate-800 text-center bg-slate-800">قيمة البضاعة (مدين +)</th>
                      <th className="p-2 border border-slate-800 text-center bg-emerald-900">سداد نقدي (دائن -)</th>
                      <th className="p-2 border border-slate-800 text-center w-28 bg-slate-800">الرصيد بعد الحركة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    {ledgerWithBalance.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="p-6 text-center text-slate-400">
                          لا توجد أي حركات أو فواتير مسجلة لهذا العميل
                        </td>
                      </tr>
                    ) : (
                      ledgerWithBalance.map((item, idx) => (
                        <tr key={item.id || idx} className={item.type === 'payment' ? 'bg-emerald-50/40' : 'hover:bg-slate-50'}>
                          <td className="p-2 border border-slate-200 text-center font-bold text-slate-600">{idx + 1}</td>
                          <td className="p-2 border border-slate-200 text-center text-slate-600 font-mono text-[10px]">{item.date}</td>
                          <td className="p-2 border border-slate-200 font-black text-slate-900">
                            {item.docName}
                          </td>
                          <td className="p-2 border border-slate-200 text-slate-700 text-[10px]">
                            {item.description}
                          </td>
                          <td className="p-2 border border-slate-200 text-center font-mono text-[10px]">
                            {item.netWeight ? formatWeight(item.netWeight) : '-'}
                          </td>
                          <td className="p-2 border border-slate-200 text-center font-mono font-bold">
                            {item.debit > 0 ? `${item.debit.toFixed(2)}` : '-'}
                          </td>
                          <td className="p-2 border border-slate-200 text-center text-emerald-800 font-mono font-bold">
                            {item.type === 'payment' ? `${item.creditPaid.toFixed(2)}` : (item.paidImmediate > 0 ? `${item.paidImmediate.toFixed(2)} (فوري)` : '-')}
                          </td>
                          <td className="p-2 border border-slate-200 text-center font-black font-mono text-slate-900 bg-slate-50">
                            <span className={item.runningBalance > 0 ? 'text-amber-800' : 'text-emerald-700'}>
                              {item.runningBalance.toFixed(2)} {settings.currency}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-black text-slate-900 text-xs">
                      <td colSpan="5" className="p-2 border border-slate-300">الإجمالي النهائي للحساب:</td>
                      <td className="p-2 border border-slate-300 text-center">
                        {ledgerWithBalance.reduce((sum, i) => sum + (i.debit || 0), 0).toFixed(2)}
                      </td>
                      <td className="p-2 border border-slate-300 text-center text-emerald-800">
                        {ledgerWithBalance.reduce((sum, i) => sum + (i.creditPaid || 0) + (i.paidImmediate || 0), 0).toFixed(2)}
                      </td>
                      <td className="p-2 border border-slate-300 text-center text-amber-900 text-sm bg-amber-50">
                        {targetCustomer.balance.toFixed(2)} {settings.currency}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
                <strong>إقرار ومصادقة:</strong> يقر العميل بصحة الفواتير والأوزان والمبالغ الموضحة أعلاه، وأن الرصيد المستحق في ذمته صحيح ونهائي.
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. DAMAGED PRODUCE & WASTE REPORT */}
          {/* ========================================================================= */}
          {reportType === 'damaged' && (
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center p-3 bg-red-50 rounded-xl border border-red-100">
                <div>
                  <span className="text-[10px] text-red-700 block font-medium">إجمالي خسارة التوالف</span>
                  <span className="text-sm font-black text-red-900">{formatCurrency(totalDamagedLoss, settings.currency)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-red-700 block font-medium">إجمالي الوزن المعدم</span>
                  <span className="text-sm font-black text-red-900">{formatWeight(totalDamagedKg)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-red-700 block font-medium">عدد الحالات</span>
                  <span className="text-sm font-black text-slate-900">{filteredDamaged.length} أصناف</span>
                </div>
              </div>

              <div className="overflow-x-auto w-full rounded-xl border border-slate-300">
                <table className="w-full min-w-[650px] text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[10px]">
                      <th className="p-2 border border-slate-800 text-center w-8">م</th>
                      <th className="p-2 border border-slate-800">اسم الصنف</th>
                      <th className="p-2 border border-slate-800 text-center">الوزن التالف (كجم)</th>
                      <th className="p-2 border border-slate-800 text-center">العبوات</th>
                      <th className="p-2 border border-slate-800 text-center">تكلفة الكيلو</th>
                      <th className="p-2 border border-slate-800 text-center">سبب الإتلاف</th>
                      <th className="p-2 border border-slate-800">التاريخ والوقت</th>
                      <th className="p-2 border border-slate-800 text-center">إجمالي الخسارة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    {filteredDamaged.map((dmg, idx) => (
                      <tr key={dmg.id}>
                        <td className="p-2 border border-slate-200 text-center font-bold text-slate-600">{idx + 1}</td>
                        <td className="p-2 border border-slate-200 font-black text-slate-900">{dmg.productName}</td>
                        <td className="p-2 border border-slate-200 text-center font-mono font-bold">{formatWeight(dmg.quantityKg)}</td>
                        <td className="p-2 border border-slate-200 text-center">{dmg.packageCount ? `${dmg.packageCount} ${dmg.unit}` : '-'}</td>
                        <td className="p-2 border border-slate-200 text-center font-mono">{Number(dmg.costPerKg).toFixed(2)}</td>
                        <td className="p-2 border border-slate-200 text-center text-red-800 font-medium">{dmg.reason}</td>
                        <td className="p-2 border border-slate-200 text-slate-600">{dmg.date} {dmg.time}</td>
                        <td className="p-2 border border-slate-200 text-center font-black text-red-700 font-mono">
                          -{Number(dmg.totalLoss).toFixed(2)} {settings.currency}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-black text-slate-900 text-xs">
                      <td colSpan="2" className="p-2 border border-slate-300">المجموع الكلي:</td>
                      <td className="p-2 border border-slate-300 text-center font-black">{formatWeight(totalDamagedKg)}</td>
                      <td colSpan="4" className="p-2 border border-slate-300"></td>
                      <td className="p-2 border border-slate-300 text-center text-red-800 text-sm bg-red-50">
                        -{totalDamagedLoss.toFixed(2)} {settings.currency}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. WORKERS & PAYROLL REPORT */}
          {/* ========================================================================= */}
          {reportType === 'payroll' && (
            <div className="py-4 space-y-4">
              <div className="overflow-x-auto w-full rounded-xl border border-slate-300">
                <table className="w-full min-w-[650px] text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[10px]">
                      <th className="p-2 border border-slate-800 text-center w-8">م</th>
                      <th className="p-2 border border-slate-800">اسم العامل</th>
                      <th className="p-2 border border-slate-800">الوظيفة</th>
                      <th className="p-2 border border-slate-800 text-center">نظام الراتب</th>
                      <th className="p-2 border border-slate-800 text-center">الراتب الأساسي</th>
                      <th className="p-2 border border-slate-800 text-center">السلف المفتوحة</th>
                      <th className="p-2 border border-slate-800 text-center w-36">توقيع استلام العامل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    {workers.map((w, idx) => (
                      <tr key={w.id}>
                        <td className="p-2.5 border border-slate-200 text-center font-bold text-slate-600">{idx + 1}</td>
                        <td className="p-2.5 border border-slate-200 font-black text-slate-900">{w.name}</td>
                        <td className="p-2.5 border border-slate-200 text-slate-700">{w.role}</td>
                        <td className="p-2.5 border border-slate-200 text-center">
                          {w.salaryType === 'daily' ? 'يومية' : w.salaryType === 'weekly' ? 'أسبوعي' : 'شهري'}
                        </td>
                        <td className="p-2.5 border border-slate-200 text-center font-bold font-mono">
                          {formatCurrency(w.baseSalary, settings.currency)}
                        </td>
                        <td className="p-2.5 border border-slate-200 text-center text-amber-800 font-bold font-mono">
                          {w.currentAdvance > 0 ? formatCurrency(w.currentAdvance, settings.currency) : '0.00'}
                        </td>
                        <td className="p-2.5 border border-slate-200 text-center text-slate-300">
                          ............................
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. EXPENSES REPORT */}
          {/* ========================================================================= */}
          {reportType === 'expenses' && (
            <div className="py-4 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="font-bold text-xs">إجمالي المصروفات التشغيلية للفترة:</span>
                <span className="text-base font-black text-red-700 font-mono">
                  {formatCurrency(totalExpensesAmount, settings.currency)}
                </span>
              </div>

              <div className="overflow-x-auto w-full rounded-xl border border-slate-300">
                <table className="w-full min-w-[650px] text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[10px]">
                      <th className="p-2 border border-slate-800 text-center w-8">م</th>
                      <th className="p-2 border border-slate-800">بيان المصروف</th>
                      <th className="p-2 border border-slate-800 text-center">التصنيف</th>
                      <th className="p-2 border border-slate-800">التاريخ والوقت</th>
                      <th className="p-2 border border-slate-800">ملاحظات</th>
                      <th className="p-2 border border-slate-800 text-center w-28">المبلغ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    {filteredExpenses.map((exp, idx) => (
                      <tr key={exp.id}>
                        <td className="p-2 border border-slate-200 text-center font-bold text-slate-600">{idx + 1}</td>
                        <td className="p-2 border border-slate-200 font-bold text-slate-900">{exp.title}</td>
                        <td className="p-2 border border-slate-200 text-center">{exp.category}</td>
                        <td className="p-2 border border-slate-200 text-slate-600">{exp.date} {exp.time}</td>
                        <td className="p-2 border border-slate-200 text-slate-500">{exp.notes || '-'}</td>
                        <td className="p-2 border border-slate-200 text-center font-black text-red-700 font-mono">
                          {Number(exp.amount).toFixed(2)} {settings.currency}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-black text-slate-900 text-xs">
                      <td colSpan="5" className="p-2 border border-slate-300">المجموع الكلي:</td>
                      <td className="p-2 border border-slate-300 text-center text-red-800 text-sm bg-red-50">
                        {totalExpensesAmount.toFixed(2)} {settings.currency}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 6. PRODUCTS PERFORMANCE & WEIGHTS REPORT */}
          {/* ========================================================================= */}
          {reportType === 'products' && (
            <div className="py-4 space-y-4">
              <div className="overflow-x-auto w-full rounded-xl border border-slate-300">
                <table className="w-full min-w-[650px] text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[10px]">
                      <th className="p-2 border border-slate-800 text-center w-8">م</th>
                      <th className="p-2 border border-slate-800">الصنف</th>
                      <th className="p-2 border border-slate-800 text-center">العبوة</th>
                      <th className="p-2 border border-slate-800 text-center">عدد العبوات المباعة</th>
                      <th className="p-2 border border-slate-800 text-center">إجمالي الوزن الصافي المباع</th>
                      <th className="p-2 border border-slate-800 text-center">متوسط سعر البيع</th>
                      <th className="p-2 border border-slate-800 text-center">إجمالي الإيراد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    {productPerformance.map((p, idx) => (
                      <tr key={p.id}>
                        <td className="p-2 border border-slate-200 text-center font-bold text-slate-600">{idx + 1}</td>
                        <td className="p-2 border border-slate-200 font-black text-slate-900">{p.emoji} {p.name}</td>
                        <td className="p-2 border border-slate-200 text-center">{p.unit}</td>
                        <td className="p-2 border border-slate-200 text-center font-bold">{p.packagesCount}</td>
                        <td className="p-2 border border-slate-200 text-center font-black font-mono text-emerald-800">
                          {formatWeight(p.soldKg)}
                        </td>
                        <td className="p-2 border border-slate-200 text-center font-mono">
                          {p.avgPricePerKg} {settings.currency}
                        </td>
                        <td className="p-2 border border-slate-200 text-center font-black font-mono">
                          {p.totalRevenue.toFixed(2)} {settings.currency}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 7. INCOME & PROFIT / LOSS (P&L) STATEMENT */}
          {/* ========================================================================= */}
          {reportType === 'pnl' && (
            <div className="py-4 space-y-4">
              <div className="space-y-2.5 border border-slate-300 rounded-xl p-4 bg-slate-50">
                {/* Sales Section */}
                <div className="flex justify-between items-center py-1.5 border-b border-slate-200 text-xs">
                  <span className="text-slate-700 font-medium">(+) إجمالي إيرادات المبيعات الكلية:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    +{formatCurrency(totalGrossSales, settings.currency)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-200 text-xs">
                  <span className="text-rose-700 font-medium">(-) مردودات مبيعات مرتجعة للزبائن (بالسعر الأصلي للفواتير):</span>
                  <span className="font-bold text-rose-700 font-mono">
                    -{formatCurrency(totalSalesReturnsAmount, settings.currency)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 px-3 bg-emerald-50/70 rounded-lg text-xs font-bold text-emerald-950 border border-emerald-200/50">
                  <span>(=) صافي إيرادات المبيعات المحققة:</span>
                  <span className="font-mono font-black text-sm text-emerald-800">
                    {formatCurrency(totalNetSales, settings.currency)}
                  </span>
                </div>

                {/* Purchases Section */}
                <div className="flex justify-between items-center py-1.5 border-b border-slate-200 text-xs mt-2">
                  <span className="text-slate-700 font-medium">(-) إجمالي تكلفة البضاعة المشتراة والموردة:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    -{formatCurrency(totalGrossPurchasesCost, settings.currency)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-200 text-xs">
                  <span className="text-blue-700 font-medium">(+) مردودات مشتريات مستردة من الموردين (بالتكلفة الأصلية للشحنات):</span>
                  <span className="font-bold text-blue-700 font-mono">
                    +{formatCurrency(totalPurchaseReturnsAmount, settings.currency)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 px-3 bg-blue-50/70 rounded-lg text-xs font-bold text-blue-950 border border-blue-200/50">
                  <span>(=) صافي تكلفة المشتريات الفعلية:</span>
                  <span className="font-mono font-black text-sm text-blue-800">
                    {formatCurrency(totalNetPurchasesCost, settings.currency)}
                  </span>
                </div>

                {/* Gross Profit */}
                <div className="flex justify-between items-center py-2 px-3 bg-emerald-100/70 rounded-xl text-xs font-black text-emerald-950 border border-emerald-300/60 my-1">
                  <span>(=) مجمل الربح التجاري (صافي المبيعات - صافي المشتريات):</span>
                  <span className="font-mono font-black text-base text-emerald-900">
                    {formatCurrency(grossTradeProfit, settings.currency)}
                  </span>
                </div>

                {/* Expenses & Losses */}
                <div className="flex justify-between items-center py-1.5 border-b border-slate-200 text-xs">
                  <span className="text-slate-700 font-medium">(-) تكلفة التوالف والإعدامات (خسائر الهدر):</span>
                  <span className="font-bold text-red-700 font-mono">
                    -{formatCurrency(totalDamagedLoss, settings.currency)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-200 text-xs">
                  <span className="text-slate-700 font-medium">(-) المصروفات التشغيلية والنثريات (نقل، مشال، إيجار، كهرباء):</span>
                  <span className="font-bold text-red-700 font-mono">
                    -{formatCurrency(generalExpensesAmount, settings.currency)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-200 text-xs">
                  <span className="text-slate-700 font-medium">(-) رواتب ومستحقات العمال والموظفين المصروفة:</span>
                  <span className="font-bold text-red-700 font-mono">
                    -{formatCurrency(totalSalariesPaid, settings.currency)}
                  </span>
                </div>

                {/* Net Income */}
                <div className="flex justify-between items-center py-3 bg-slate-900 text-white rounded-xl px-4 mt-3">
                  <span className="font-black text-sm">(=) صافي الدخل والربح الحقيقي للفترة:</span>
                  <span className={`text-lg font-black font-mono ${netEstimatedProfit >= 0 ? 'text-brand-400' : 'text-red-400'}`}>
                    {formatCurrency(netEstimatedProfit, settings.currency)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 8. STORE AUDIT & FINANCIAL POSITION (أين الفلوس وجرد المركز المالي) */}
          {/* ========================================================================= */}
          {reportType === 'audit' && finPos && (
            <div className="py-4 space-y-6">
              
              {/* Core 4 Position Assets & Liabilities */}
              <div>
                <h2 className="text-xs font-black text-slate-900 mb-3 flex items-center gap-1.5">
                  <Scale size={15} className="text-emerald-700" />
                  <span>موقع الأموال والسيولة الحالية (أين الفلوس الآن؟)</span>
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 min-w-0 overflow-hidden">
                    <span className="text-[10px] text-emerald-900 font-bold block truncate">1. نقدية الخزينة / الدرج</span>
                    <span className="text-base sm:text-lg font-black font-mono text-emerald-800 block mt-1 truncate">
                      {formatCurrency(finPos.cashBalance, settings.currency)}
                    </span>
                    <span className="text-[9px] text-emerald-700 font-medium mt-0.5 block truncate">جاهزة في الدرج فوراً</span>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 min-w-0 overflow-hidden">
                    <span className="text-[10px] text-blue-900 font-bold block truncate">2. رصيد البنك والمحافظ</span>
                    <span className="text-base sm:text-lg font-black font-mono text-blue-800 block mt-1 truncate">
                      {formatCurrency(finPos.bankBalance, settings.currency)}
                    </span>
                    <span className="text-[9px] text-blue-700 font-medium mt-0.5 block truncate">شبكة / تحويلات بنكية</span>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 min-w-0 overflow-hidden">
                    <span className="text-[10px] text-amber-900 font-bold block truncate">3. ديون آجلة عند العملاء</span>
                    <span className="text-base sm:text-lg font-black font-mono text-amber-800 block mt-1 truncate">
                      {formatCurrency(finPos.totalCustomersDebt, settings.currency)}
                    </span>
                    <span className="text-[9px] text-amber-700 font-medium mt-0.5 block truncate">لنا طرف الزبائن والمطاعم</span>
                  </div>

                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 min-w-0 overflow-hidden">
                    <span className="text-[10px] text-rose-900 font-bold block truncate">4. ديون آجلة للموردين</span>
                    <span className="text-base sm:text-lg font-black font-mono text-rose-800 block mt-1 truncate">
                      {formatCurrency(finPos.totalSuppliersDebt, settings.currency)}
                    </span>
                    <span className="text-[9px] text-rose-700 font-medium mt-0.5 block truncate">علينا للمزارع وتجار الجملة</span>
                  </div>
                </div>

                {/* Net Working Capital Calculation */}
                <div className="mt-3 p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black block">صافي المركز المالي ورأس المال العامل</span>
                    <span className="text-[10px] text-slate-400 block">(الخزينة + البنك + ديون العملاء) - ديون الموردين</span>
                  </div>
                  <span className="text-base font-black font-mono text-brand-400">
                    {formatCurrency(finPos.totalWorkingCapital, settings.currency)}
                  </span>
                </div>
              </div>

              {/* Cash Drawer Breakdown Flow */}
              <div>
                <h2 className="text-xs font-black text-slate-900 mb-2">حركة التدفقات النقدية للخزينة (الدرج)</h2>
                <div className="overflow-x-auto w-full rounded-xl border border-slate-300">
                  <table className="w-full min-w-[550px] text-right border-collapse">
                    <thead className="bg-slate-100 text-slate-800 font-bold text-xs">
                      <tr>
                        <th className="p-2.5 border-b border-slate-300">بند الحركة النقدية</th>
                        <th className="p-2.5 border-b border-slate-300 text-center">النوع</th>
                        <th className="p-2.5 border-b border-slate-300 text-center">المبلغ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      <tr>
                        <td className="p-2 text-slate-800 font-medium">مبيعات نقدية محصلة في الدرج</td>
                        <td className="p-2 text-center text-emerald-700 font-bold">وارد (+)</td>
                        <td className="p-2 text-center font-mono font-bold text-emerald-700">+{formatCurrency(finPos.cashFromSales, settings.currency)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-slate-800 font-medium">تحصيل ديون قديمة نقداً من العملاء</td>
                        <td className="p-2 text-center text-emerald-700 font-bold">وارد (+)</td>
                        <td className="p-2 text-center font-mono font-bold text-emerald-700">+{formatCurrency(finPos.cashFromCustomerPayments, settings.currency)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-slate-800 font-medium">مردودات مشتريات مستردة نقداً للصندوق</td>
                        <td className="p-2 text-center text-emerald-700 font-bold">وارد (+)</td>
                        <td className="p-2 text-center font-mono font-bold text-emerald-700">+{formatCurrency(finPos.cashPurchaseReturns || 0, settings.currency)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-slate-800 font-medium">مصروفات تشغيلية ونثريات مدفوعة كاش</td>
                        <td className="p-2 text-center text-rose-700 font-bold">صادر (-)</td>
                        <td className="p-2 text-center font-mono font-bold text-rose-700">-{formatCurrency(finPos.cashExpenses, settings.currency)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-slate-800 font-medium">مشتريات بضاعة مسددة كاش فورية</td>
                        <td className="p-2 text-center text-rose-700 font-bold">صادر (-)</td>
                        <td className="p-2 text-center font-mono font-bold text-rose-700">-{formatCurrency(finPos.cashPurchases, settings.currency)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-slate-800 font-medium">سداد دفعات نقدية لحسابات الموردين</td>
                        <td className="p-2 text-center text-rose-700 font-bold">صادر (-)</td>
                        <td className="p-2 text-center font-mono font-bold text-rose-700">-{formatCurrency(finPos.cashSupplierPayments, settings.currency)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-slate-800 font-medium">سلفيات ورواتب عمال مسددة نقداً</td>
                        <td className="p-2 text-center text-rose-700 font-bold">صادر (-)</td>
                        <td className="p-2 text-center font-mono font-bold text-rose-700">-{formatCurrency(finPos.cashWorkerAdvances, settings.currency)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-slate-800 font-medium">مسحوبات نقدية للشركاء من الدرج</td>
                        <td className="p-2 text-center text-amber-700 font-bold">صادر (-)</td>
                        <td className="p-2 text-center font-mono font-bold text-amber-700">-{formatCurrency(finPos.cashPartnerDrawings, settings.currency)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-slate-800 font-medium">توزيعات أرباح نقدية مدفوعة للشركاء</td>
                        <td className="p-2 text-center text-purple-700 font-bold">صادر (-)</td>
                        <td className="p-2 text-center font-mono font-bold text-purple-700">-{formatCurrency(finPos.cashProfitDistributions, settings.currency)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-slate-800 font-medium">مردودات مبيعات مرتجعة نقداً للزبائن</td>
                        <td className="p-2 text-center text-rose-700 font-bold">صادر (-)</td>
                        <td className="p-2 text-center font-mono font-bold text-rose-700">-{formatCurrency(finPos.cashSalesReturns || 0, settings.currency)}</td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-slate-50 font-black text-xs">
                      <tr>
                        <td className="p-2.5 text-slate-900">الرصيد الدفتري المفترض للنقدية بالدرج</td>
                        <td className="p-2.5 text-center text-slate-600">=</td>
                        <td className="p-2.5 text-center font-mono text-sm text-emerald-800">{formatCurrency(finPos.cashBalance, settings.currency)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Debt Balances Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-slate-300 rounded-xl p-3 bg-amber-50/40">
                  <h3 className="text-xs font-bold text-amber-900 mb-2">أرصدة ديون العملاء (لنا)</h3>
                  <div className="space-y-1.5 text-xs">
                    {customers.filter(c => Number(c.balance) > 0).slice(0, 5).map(c => (
                      <div key={c.id} className="flex justify-between items-center py-1 border-b border-amber-200/60">
                        <span className="text-slate-800 font-medium">{c.name}</span>
                        <span className="font-mono font-bold text-amber-900">{formatCurrency(c.balance, settings.currency)}</span>
                      </div>
                    ))}
                    {customers.filter(c => Number(c.balance) > 0).length === 0 && (
                      <p className="text-[11px] text-slate-500 py-1">لا توجد ديون مستحقة على العملاء حالياً.</p>
                    )}
                  </div>
                </div>

                <div className="border border-slate-300 rounded-xl p-3 bg-rose-50/40">
                  <h3 className="text-xs font-bold text-rose-900 mb-2">أرصدة ديون الموردين (علينا)</h3>
                  <div className="space-y-1.5 text-xs">
                    {suppliers.filter(s => Number(s.balance) > 0).slice(0, 5).map(s => (
                      <div key={s.id} className="flex justify-between items-center py-1 border-b border-rose-200/60">
                        <span className="text-slate-800 font-medium">{s.name}</span>
                        <span className="font-mono font-bold text-rose-900">{formatCurrency(s.balance, settings.currency)}</span>
                      </div>
                    ))}
                    {suppliers.filter(s => Number(s.balance) > 0).length === 0 && (
                      <p className="text-[11px] text-slate-500 py-1">لا توجد مستحقات آجلة للموردين حالياً.</p>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* 9. PARTNERS EQUITY & PROFIT DISTRIBUTIONS (كشف الشركاء والأرباح) */}
          {/* ========================================================================= */}
          {reportType === 'partners' && (
            <div className="py-4 space-y-6">
              {/* Partners Overview Table */}
              <div>
                <h2 className="text-xs font-black text-slate-900 mb-2">بيان الشركاء ونسب الملكية والمسحوبات</h2>
                <div className="overflow-x-auto w-full rounded-xl border border-slate-300 text-xs">
                  <table className="w-full min-w-[550px] text-right border-collapse">
                    <thead className="bg-slate-100 text-slate-800 font-bold">
                      <tr>
                        <th className="p-2.5 border-b border-slate-300">اسم الشريك</th>
                        <th className="p-2.5 border-b border-slate-300 text-center">النسبة (%)</th>
                        <th className="p-2.5 border-b border-slate-300 text-center">إجمالي المسحوبات</th>
                        <th className="p-2.5 border-b border-slate-300 text-center">الأرباح المقبوضة</th>
                        <th className="p-2.5 border-b border-slate-300 text-center">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {partners.map(p => {
                        const partnerDrawingsSum = partnerDrawings
                          .filter(d => d.partnerId === p.id)
                          .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
                        const partnerProfitSum = profitDistributions
                          .reduce((sum, dist) => {
                            const detail = dist.shares?.find(s => s.partnerId === p.id);
                            return sum + (Number(detail?.netPaid) || 0);
                          }, 0);

                        return (
                          <tr key={p.id}>
                            <td className="p-2 text-slate-900 font-bold">{p.name} {p.phone ? `(${p.phone})` : ''}</td>
                            <td className="p-2 text-center font-mono font-bold">{p.sharePercentage}%</td>
                            <td className="p-2 text-center font-mono font-bold text-amber-700">{formatCurrency(partnerDrawingsSum, settings.currency)}</td>
                            <td className="p-2 text-center font-mono font-bold text-emerald-700">{formatCurrency(partnerProfitSum, settings.currency)}</td>
                            <td className="p-2 text-center font-bold text-slate-700">شريك نشط</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Individual Partner Drawings Statement if selected */}
              <div>
                <h2 className="text-xs font-black text-slate-900 mb-2">
                  سجل المسحوبات النقدية والبنكية {selectedPartnerId !== 'all' ? `لـ (${partners.find(p => p.id === selectedPartnerId)?.name || ''})` : 'لكافة الشركاء'}
                </h2>
                <div className="overflow-x-auto w-full rounded-xl border border-slate-300 text-xs">
                  <table className="w-full min-w-[550px] text-right border-collapse">
                    <thead className="bg-slate-100 text-slate-800 font-bold">
                      <tr>
                        <th className="p-2.5 border-b border-slate-300">التاريخ والوقت</th>
                        <th className="p-2.5 border-b border-slate-300">الشريك</th>
                        <th className="p-2.5 border-b border-slate-300 text-center">المصدر</th>
                        <th className="p-2.5 border-b border-slate-300">البيان / الملاحظة</th>
                        <th className="p-2.5 border-b border-slate-300 text-center">المبلغ المسحوب</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {partnerDrawings
                        .filter(d => selectedPartnerId === 'all' || d.partnerId === selectedPartnerId)
                        .map(d => {
                          const partnerName = partners.find(p => p.id === d.partnerId)?.name || 'شريك';
                          return (
                            <tr key={d.id}>
                              <td className="p-2 text-slate-600 font-mono text-[11px]">{d.date} {d.time || ''}</td>
                              <td className="p-2 text-slate-900 font-bold">{partnerName}</td>
                              <td className="p-2 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  d.source === 'bank' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {d.source === 'bank' ? 'حساب بنكي' : 'نقدية من الدرج'}
                                </span>
                              </td>
                              <td className="p-2 text-slate-700">{d.notes || 'سحب نقدي تحت حساب الأرباح'}</td>
                              <td className="p-2 text-center font-mono font-bold text-amber-800">{formatCurrency(d.amount, settings.currency)}</td>
                            </tr>
                          );
                        })}
                      {partnerDrawings.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-400">لا توجد مسحوبات مسجلة.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Profit Distributions Summary */}
              <div>
                <h2 className="text-xs font-black text-slate-900 mb-2">سجل جلسات توزيع الأرباح المعتمدة</h2>
                <div className="overflow-x-auto w-full rounded-xl border border-slate-300 text-xs">
                  <table className="w-full min-w-[550px] text-right border-collapse">
                    <thead className="bg-slate-100 text-slate-800 font-bold">
                      <tr>
                        <th className="p-2.5 border-b border-slate-300">التاريخ</th>
                        <th className="p-2.5 border-b border-slate-300">الفترة / البيان</th>
                        <th className="p-2.5 border-b border-slate-300 text-center">إجمالي الربح الموزع</th>
                        <th className="p-2.5 border-b border-slate-300 text-center">طريقة الصرف</th>
                        <th className="p-2.5 border-b border-slate-300">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {profitDistributions.map(dist => (
                        <tr key={dist.id}>
                          <td className="p-2 text-slate-600 font-mono text-[11px]">{dist.date}</td>
                          <td className="p-2 text-slate-900 font-bold">{dist.periodName || 'توزيع أرباح دوري'}</td>
                          <td className="p-2 text-center font-mono font-bold text-emerald-700">{formatCurrency(dist.totalProfitDistributed, settings.currency)}</td>
                          <td className="p-2 text-center font-bold text-slate-700">{dist.paymentMethod === 'bank' ? 'تحويل بنكي' : 'نقدية من الدرج'}</td>
                          <td className="p-2 text-slate-600 text-[11px]">{dist.notes || '—'}</td>
                        </tr>
                      ))}
                      {profitDistributions.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-400">لا توجد جلسات توزيع أرباح سابقة.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* Official A4 Footer & Signatures Block */}
          <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-slate-300 text-center">
            <div className="space-y-6">
              <span className="text-xs font-bold text-slate-700 block">إعداد وتدقيق المحاسب</span>
              <div className="w-44 mx-auto border-b border-dashed border-slate-400"></div>
              <span className="text-[10px] text-slate-400 block">التوقيع والتاريخ</span>
            </div>

            <div className="space-y-6">
              <span className="text-xs font-bold text-slate-700 block">اعتماد الإدارة / صاحب المحل</span>
              <div className="w-44 mx-auto border-b border-dashed border-slate-400"></div>
              <span className="text-[10px] text-slate-400 block">الختم والاعتماد</span>
            </div>
          </div>

          <div className="pt-8 text-center text-[10px] text-slate-400 border-t border-slate-100 mt-6">
            مستند رسمي صادر عن منظومة براكه للمحاسبة والمبيعات • تم الاستخراج بتاريخ {todayStr}
          </div>

        </div>
      </div>

    </div>
  );
}
