import React from 'react';
import { LayoutGrid, ShoppingCart, Scale, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BottomNav({ currentTab, onChangeTab, cartCount = 0, hasPermission }) {
  // 4 Core Decision/Frequent Actions for Mobile
  const allTabs = [
    { 
      id: 'home', 
      label: 'الرئيسية', 
      icon: LayoutGrid, 
      badge: null 
    },
    { 
      id: 'sale', 
      label: 'البيع والميزان', 
      icon: ShoppingCart, 
      badge: cartCount > 0 ? cartCount : null,
      highlight: true,
      perm: 'canSell'
    },
    { 
      id: 'invoices', 
      label: 'الفواتير', 
      icon: FileText, 
      badge: null,
      perm: 'canViewInvoices'
    },
    { 
      id: 'audit', 
      label: 'الجرد والسيولة', 
      icon: Scale, 
      badge: null,
      perm: 'canViewFinance'
    },
  ];

  const tabs = allTabs.filter(t => !t.perm || (hasPermission ? hasPermission(t.perm) : true));

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] px-2 py-1.5 transition-all w-full pb-safe print:hidden">
      <div 
        className="max-w-md mx-auto grid gap-1 items-center"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl relative select-none cursor-pointer ${
                isActive 
                  ? 'text-primary-600 font-bold' 
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className="relative p-2 rounded-2xl">
                {/* Smooth Animated Active Pill Background */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 bg-primary-50 rounded-2xl shadow-2xs border border-primary-100"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}

                <span className="relative z-10 block">
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </span>
                
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-1.5 z-20 w-5 h-5 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className={`text-[11px] tracking-tight mt-1 whitespace-nowrap transition-colors duration-200 ${
                isActive ? 'font-bold text-navy-850' : 'text-slate-500 font-medium'
              }`}>
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
