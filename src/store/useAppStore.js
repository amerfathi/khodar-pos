import { useState, useEffect, useCallback } from 'react';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_CUSTOMERS, 
  INITIAL_SETTINGS, 
  INITIAL_INVOICES, 
  INITIAL_EXPENSES,
  INITIAL_EXPENSE_CATEGORIES,
  INITIAL_DAMAGED_ITEMS,
  INITIAL_WORKERS,
  INITIAL_WORKER_TRANSACTIONS,
  INITIAL_CUSTOMER_PAYMENTS,
  INITIAL_PURCHASES,
  INITIAL_SUPPLIERS,
  INITIAL_SUPPLIER_PAYMENTS,
  INITIAL_PARTNERS,
  INITIAL_PARTNER_DRAWINGS,
  INITIAL_PROFIT_DISTRIBUTIONS,
  INITIAL_SALES_RETURNS,
  INITIAL_PURCHASE_RETURNS,
  INITIAL_TENANTS,
  INITIAL_BRANCHES,
  INITIAL_STOCK_TRANSFERS,
  INITIAL_USERS,
  DEFAULT_PERMISSIONS,
  ROLE_PERMISSIONS_PRESETS
} from '../data/initialData';
import { getCurrentDateFormatted, getCurrentTimeFormatted } from '../utils/formatters';
import { cloudflareSync } from '../services/cloudflareSync';

const STORAGE_KEYS = {
  PRODUCTS: 'khodar_pos_products_v3',
  CUSTOMERS: 'khodar_pos_customers_v3',
  INVOICES: 'khodar_pos_invoices_v3',
  EXPENSES: 'khodar_pos_expenses_v3',
  EXPENSE_CATEGORIES: 'khodar_pos_expense_categories_v3',
  SETTINGS: 'khodar_pos_settings_v3',
  DAMAGED: 'khodar_pos_damaged_v3',
  WORKERS: 'khodar_pos_workers_v3',
  WORKER_TRANSACTIONS: 'khodar_pos_worker_transactions_v3',
  CUSTOMER_PAYMENTS: 'khodar_pos_customer_payments_v3',
  PURCHASES: 'khodar_pos_purchases_v3',
  SUPPLIERS: 'khodar_pos_suppliers_v3',
  SUPPLIER_PAYMENTS: 'khodar_pos_supplier_payments_v3',
  PARTNERS: 'khodar_pos_partners_v3',
  PARTNER_DRAWINGS: 'khodar_pos_partner_drawings_v3',
  PROFIT_DISTRIBUTIONS: 'khodar_pos_profit_distributions_v3',
  SALES_RETURNS: 'khodar_pos_sales_returns_v3',
  PURCHASE_RETURNS: 'khodar_pos_purchase_returns_v3',
  TENANTS: 'khodar_pos_tenants_v1',
  USERS: 'khodar_pos_users_v1',
  CURRENT_USER: 'khodar_pos_current_user_v1',
  BRANCHES: 'khodar_pos_branches_v1',
  ACTIVE_BRANCH_ID: 'khodar_pos_active_branch_id_v1',
  STOCK_TRANSFERS: 'khodar_pos_stock_transfers_v1',
  TRIAL_REQUESTS: 'khodar_trial_leads_v1'
};

const getStoredItem = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
    return fallback;
  }
};

const setStoredItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage`, e);
  }
};

export function useAppStore() {
  const [products, setProducts] = useState(() => getStoredItem(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS));
  const [customers, setCustomers] = useState(() => getStoredItem(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS));
  const [invoices, setInvoices] = useState(() => getStoredItem(STORAGE_KEYS.INVOICES, INITIAL_INVOICES));
  const [expenses, setExpenses] = useState(() => getStoredItem(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES));
  const [expenseCategories, setExpenseCategories] = useState(() => getStoredItem(STORAGE_KEYS.EXPENSE_CATEGORIES, INITIAL_EXPENSE_CATEGORIES));
  const [settings, setSettings] = useState(() => getStoredItem(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS));
  const [damagedItems, setDamagedItems] = useState(() => getStoredItem(STORAGE_KEYS.DAMAGED, INITIAL_DAMAGED_ITEMS));
  const [workers, setWorkers] = useState(() => getStoredItem(STORAGE_KEYS.WORKERS, INITIAL_WORKERS));
  const [workerTransactions, setWorkerTransactions] = useState(() => getStoredItem(STORAGE_KEYS.WORKER_TRANSACTIONS, INITIAL_WORKER_TRANSACTIONS));
  const [customerPayments, setCustomerPayments] = useState(() => getStoredItem(STORAGE_KEYS.CUSTOMER_PAYMENTS, INITIAL_CUSTOMER_PAYMENTS));
  const [purchases, setPurchases] = useState(() => getStoredItem(STORAGE_KEYS.PURCHASES, INITIAL_PURCHASES));
  const [suppliers, setSuppliers] = useState(() => getStoredItem(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS));
  const [supplierPayments, setSupplierPayments] = useState(() => getStoredItem(STORAGE_KEYS.SUPPLIER_PAYMENTS, INITIAL_SUPPLIER_PAYMENTS));
  const [partners, setPartners] = useState(() => getStoredItem(STORAGE_KEYS.PARTNERS, INITIAL_PARTNERS));
  const [partnerDrawings, setPartnerDrawings] = useState(() => getStoredItem(STORAGE_KEYS.PARTNER_DRAWINGS, INITIAL_PARTNER_DRAWINGS));
  const [profitDistributions, setProfitDistributions] = useState(() => getStoredItem(STORAGE_KEYS.PROFIT_DISTRIBUTIONS, INITIAL_PROFIT_DISTRIBUTIONS));
  const [salesReturns, setSalesReturns] = useState(() => getStoredItem(STORAGE_KEYS.SALES_RETURNS, INITIAL_SALES_RETURNS));
  const [purchaseReturns, setPurchaseReturns] = useState(() => getStoredItem(STORAGE_KEYS.PURCHASE_RETURNS, INITIAL_PURCHASE_RETURNS));
  const [tenants, setTenants] = useState(() => getStoredItem(STORAGE_KEYS.TENANTS, INITIAL_TENANTS));
  const [users, setUsers] = useState(() => getStoredItem(STORAGE_KEYS.USERS, INITIAL_USERS));
  const [currentUser, setCurrentUser] = useState(() => getStoredItem(STORAGE_KEYS.CURRENT_USER, null));
  const [branches, setBranches] = useState(() => getStoredItem(STORAGE_KEYS.BRANCHES, INITIAL_BRANCHES));
  const [activeBranchId, setActiveBranchId] = useState(() => getStoredItem(STORAGE_KEYS.ACTIVE_BRANCH_ID, 'branch-main'));
  const [stockTransfers, setStockTransfers] = useState(() => getStoredItem(STORAGE_KEYS.STOCK_TRANSFERS, INITIAL_STOCK_TRANSFERS));
  const [trialRequests, setTrialRequests] = useState(() => getStoredItem(STORAGE_KEYS.TRIAL_REQUESTS, []));

  // Sync to localStorage
  useEffect(() => { setStoredItem(STORAGE_KEYS.PRODUCTS, products); }, [products]);
  useEffect(() => { setStoredItem(STORAGE_KEYS.CUSTOMERS, customers); }, [customers]);
  useEffect(() => { setStoredItem(STORAGE_KEYS.INVOICES, invoices); }, [invoices]);
  useEffect(() => { setStoredItem(STORAGE_KEYS.EXPENSES, expenses); }, [expenses]);
  useEffect(() => { setStoredItem(STORAGE_KEYS.EXPENSE_CATEGORIES, expenseCategories); }, [expenseCategories]);
  useEffect(() => { setStoredItem(STORAGE_KEYS.SETTINGS, settings); }, [settings]);
  useEffect(() => { setStoredItem(STORAGE_KEYS.DAMAGED, damagedItems); }, [damagedItems]);
  useEffect(() => { setStoredItem(STORAGE_KEYS.WORKERS, workers); }, [workers]);
  useEffect(() => { setStoredItem(STORAGE_KEYS.WORKER_TRANSACTIONS, workerTransactions); }, [workerTransactions]);
  useEffect(() => { setStoredItem(STORAGE_KEYS.CUSTOMER_PAYMENTS, customerPayments); }, [customerPayments]);
  useEffect(() => { setStoredItem(STORAGE_KEYS.PURCHASES, purchases); }, [purchases]);
  useEffect(() => { setStoredItem(STORAGE_KEYS.SUPPLIERS, suppliers); }, [suppliers]);
  useEffect(() => { setStoredItem(STORAGE_KEYS.SUPPLIER_PAYMENTS, supplierPayments); }, [supplierPayments]);
  useEffect(() => { setStoredItem(STORAGE_KEYS.PARTNERS, partners); }, [partners]);
  useEffect(() => { setStoredItem(STORAGE_KEYS.PARTNER_DRAWINGS, partnerDrawings); }, [partnerDrawings]);
  useEffect(() => { setStoredItem(STORAGE_KEYS.PROFIT_DISTRIBUTIONS, profitDistributions); }, [profitDistributions]);
  useEffect(() => { setStoredItem(STORAGE_KEYS.SALES_RETURNS, salesReturns); }, [salesReturns]);
  useEffect(() => { setStoredItem(STORAGE_KEYS.PURCHASE_RETURNS, purchaseReturns); }, [purchaseReturns]);
  useEffect(() => { setStoredItem(STORAGE_KEYS.TENANTS, tenants); }, [tenants]);
  useEffect(() => { setStoredItem(STORAGE_KEYS.USERS, users); }, [users]);
  useEffect(() => { setStoredItem(STORAGE_KEYS.CURRENT_USER, currentUser); }, [currentUser]);
  useEffect(() => { setStoredItem(STORAGE_KEYS.BRANCHES, branches); }, [branches]);
  useEffect(() => { setStoredItem(STORAGE_KEYS.ACTIVE_BRANCH_ID, activeBranchId); }, [activeBranchId]);
  useEffect(() => { setStoredItem(STORAGE_KEYS.STOCK_TRANSFERS, stockTransfers); }, [stockTransfers]);
  useEffect(() => { setStoredItem(STORAGE_KEYS.TRIAL_REQUESTS, trialRequests); }, [trialRequests]);
  
  // Central Cloud Tenants Synchronization (Cloud-First & Offline-First)
  const syncCloudTenants = useCallback(async () => {
    if (typeof window === 'undefined') return;
    try {
      const baseUrl = (window.location?.origin && window.location.origin.startsWith('http'))
        ? window.location.origin
        : 'https://khodar-pos.pages.dev';
      const res = await fetch(`${baseUrl}/api/tenants`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.tenants)) {
          setTenants(prev => {
            const map = new Map();
            prev.forEach(t => map.set(t.id, t));
            data.tenants.forEach(t => map.set(t.id, { ...map.get(t.id), ...t }));
            return Array.from(map.values());
          });
        }
      }
    } catch (e) {
      console.warn('Sync cloud tenants warning:', e);
    }
  }, []);

  useEffect(() => {
    syncCloudTenants();
  }, [syncCloudTenants]);

  // Background Auto-sync to Cloudflare Edge
  useEffect(() => {
    const tenantId = currentUser?.tenantId || 'tenant-demo';
    cloudflareSync.startAutoSync(tenantId, 30000);
    return () => cloudflareSync.stopAutoSync();
  }, [currentUser?.tenantId]);

  // Product Actions
  const addProduct = (prod) => {
    const newProd = {
      ...prod,
      id: prod.id || `prod-${Date.now()}`
    };
    setProducts(prev => [newProd, ...prev]);
    return newProd;
  };

  const updateProduct = (id, updates) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const updateProductPrice = (id, newPrice) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, defaultPricePerKg: Number(newPrice) } : p));
  };

  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // Customer Actions
  const addCustomer = (cust) => {
    const newCust = {
      id: `cust-${Date.now()}`,
      name: cust.name,
      phone: cust.phone || '',
      balance: Number(cust.initialBalance || 0),
      address: cust.address || '',
      notes: cust.notes || ''
    };
    setCustomers(prev => [newCust, ...prev]);
    return newCust;
  };

  const updateCustomer = (id, updates) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const recordCustomerPayment = (customerId, amount, note = 'سداد دفعة نقدية', paymentMethod = 'cash') => {
    const numAmount = Math.round(Number(amount) * 100) / 100;
    if (!numAmount || numAmount <= 0) return null;

    const targetCustomer = customers.find(c => c.id === customerId);
    const customerName = targetCustomer ? targetCustomer.name : 'عميل';

    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        return {
          ...c,
          balance: Math.round(((c.balance || 0) - numAmount) * 100) / 100
        };
      }
      return c;
    }));

    const newPayment = {
      id: `pay-${Date.now()}`,
      customerId,
      customerName,
      amount: numAmount,
      method: paymentMethod || 'cash', // 'cash' (في الدرج) | 'bank' (تحويل بنكي)
      date: getCurrentDateFormatted(),
      time: getCurrentTimeFormatted(),
      notes: note || 'سداد دفعة نقدية'
    };

    setCustomerPayments(prev => [newPayment, ...prev]);
    return newPayment;
  };

  const deleteCustomerPayment = (paymentId) => {
    const target = customerPayments.find(p => p.id === paymentId);
    if (target) {
      setCustomers(prev => prev.map(c => {
        if (c.id === target.customerId) {
          return {
            ...c,
            balance: Math.round(((c.balance || 0) + target.amount) * 100) / 100
          };
        }
        return c;
      }));
      setCustomerPayments(prev => prev.filter(p => p.id !== paymentId));
    }
  };

  // Invoice Actions
  const saveInvoice = (invoiceData) => {
    const newInvoiceNumber = settings.nextInvoiceNumber || (invoices.length + 126);
    const invoiceId = String(newInvoiceNumber).padStart(6, '0');

    // Credit / remaining debt calculation for credit or split payments
    let creditDebt = 0;
    if (invoiceData.paymentMethod === 'credit') {
      creditDebt = Number(invoiceData.finalTotal) || 0;
    } else if (invoiceData.paymentMethod === 'split') {
      creditDebt = Number(invoiceData.creditAmount) || 0;
    } else {
      creditDebt = Number(invoiceData.remainingDebt) || 0;
    }

    const activeB = branches.find(b => b.id === (invoiceData.branchId || activeBranchId)) || branches[0];
    const targetBranchId = activeB?.id || 'branch-main';
    const targetBranchName = activeB?.name || 'الفرع الرئيسي';

    const newInvoice = {
      ...invoiceData,
      id: invoiceId,
      branchId: targetBranchId,
      branchName: targetBranchName,
      remainingDebt: Math.round(creditDebt * 100) / 100,
      timestamp: Date.now(),
      status: 'active'
    };

    // If there is debt remaining and a known customer, update balance
    if (newInvoice.customerId && newInvoice.customerId !== 'walk_in' && creditDebt > 0) {
      setCustomers(prev => prev.map(c => {
        if (c.id === newInvoice.customerId) {
          return {
            ...c,
            balance: Math.round(((c.balance || 0) + creditDebt) * 100) / 100
          };
        }
        return c;
      }));
    }

    // Deduct sold weights from products inventory stock
    if (newInvoice.items && Array.isArray(newInvoice.items)) {
      setProducts(prev => {
        let updated = [...prev];
        newInvoice.items.forEach(it => {
          const soldWeight = Math.round((Number(it.netWeight) || Number(it.grossWeight) || 0) * 100) / 100;
          if (soldWeight > 0) {
            updated = updated.map(p => {
              const isMatch = (it.productId && p.id === it.productId) || 
                              (p.name.trim() === (it.name || '').trim());
              if (isMatch) {
                const curStock = Number(p.currentStockKg) || 0;
                const bStock = p.branchStock || {};
                const curBStock = Number(bStock[targetBranchId] !== undefined ? bStock[targetBranchId] : curStock);
                return {
                  ...p,
                  currentStockKg: Math.round((curStock - soldWeight) * 100) / 100,
                  branchStock: {
                    ...bStock,
                    [targetBranchId]: Math.round((curBStock - soldWeight) * 100) / 100
                  }
                };
              }
              return p;
            });
          }
        });
        return updated;
      });
    }

    setInvoices(prev => [newInvoice, ...prev]);

    // Queue mutation for Cloudflare background sync
    try {
      const activeTenantId = currentUser?.tenantId || 'tenant-demo';
      cloudflareSync.recordMutation(activeTenantId, targetBranchId, 'invoice', invoiceId, 'create', newInvoice);
    } catch (e) {
      console.warn('Sync recording non-fatal warning:', e);
    }

    setSettings(prev => ({
      ...prev,
      nextInvoiceNumber: newInvoiceNumber + 1
    }));

    return newInvoice;
  };

  const updateInvoiceNotes = (invoiceId, notes) => {
    setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, notes } : inv));
  };

  const voidInvoice = (invoiceId) => {
    const target = invoices.find(i => i.id === invoiceId);
    if (!target || target.status === 'voided') return;

    // Reverse customer debt if applicable
    if (target.customerId && target.remainingDebt > 0) {
      setCustomers(prev => prev.map(c => {
        if (c.id === target.customerId) {
          return {
            ...c,
            balance: Math.round(((c.balance || 0) - target.remainingDebt) * 100) / 100
          };
        }
        return c;
      }));
    }

    // Restore stock back to products (both total and branch-specific)
    const targetBranchId = target.branchId || 'branch-main';
    if (target.items && Array.isArray(target.items)) {
      setProducts(prev => {
        let updated = [...prev];
        target.items.forEach(it => {
          const returnedWeight = Math.round((Number(it.netWeight) || Number(it.grossWeight) || 0) * 100) / 100;
          if (returnedWeight > 0) {
            updated = updated.map(p => {
              const isMatch = (it.productId && p.id === it.productId) || 
                              (p.name.trim() === (it.name || '').trim());
              if (isMatch) {
                const curStock = Number(p.currentStockKg) || 0;
                const bStock = p.branchStock || {};
                const curBStock = Number(bStock[targetBranchId] !== undefined ? bStock[targetBranchId] : curStock);
                return {
                  ...p,
                  currentStockKg: Math.round((curStock + returnedWeight) * 100) / 100,
                  branchStock: {
                    ...bStock,
                    [targetBranchId]: Math.round((curBStock + returnedWeight) * 100) / 100
                  }
                };
              }
              return p;
            });
          }
        });
        return updated;
      });
    }

    setInvoices(prev => prev.map(i => i.id === invoiceId ? { ...i, status: 'voided' } : i));
  };

  const deleteInvoice = (invoiceId) => {
    const target = invoices.find(i => i.id === invoiceId);
    if (target && target.status !== 'voided') {
      if (target.customerId && target.remainingDebt > 0) {
        setCustomers(prev => prev.map(c => {
          if (c.id === target.customerId) {
            return {
              ...c,
              balance: Math.round(((c.balance || 0) - target.remainingDebt) * 100) / 100
            };
          }
          return c;
        }));
      }

      // Restore stock if it was not already voided (both total and branch-specific)
      const targetBranchId = target.branchId || 'branch-main';
      if (target.items && Array.isArray(target.items)) {
        setProducts(prev => {
          let updated = [...prev];
          target.items.forEach(it => {
            const returnedWeight = Math.round((Number(it.netWeight) || Number(it.grossWeight) || 0) * 100) / 100;
            if (returnedWeight > 0) {
              updated = updated.map(p => {
                const isMatch = (it.productId && p.id === it.productId) || 
                                (p.name.trim() === (it.name || '').trim());
                if (isMatch) {
                  const curStock = Number(p.currentStockKg) || 0;
                  const bStock = p.branchStock || {};
                  const curBStock = Number(bStock[targetBranchId] !== undefined ? bStock[targetBranchId] : curStock);
                  return {
                    ...p,
                    currentStockKg: Math.round((curStock + returnedWeight) * 100) / 100,
                    branchStock: {
                      ...bStock,
                      [targetBranchId]: Math.round((curBStock + returnedWeight) * 100) / 100
                    }
                  };
                }
                return p;
              });
            }
          });
          return updated;
        });
      }
    }
    setInvoices(prev => prev.filter(i => i.id !== invoiceId));
  };

  // Sales Return Actions (مردودات المبيعات - بالسعر الفعلي التاريخي المحمي المسجل في الفاتورة)
  const recordSalesReturn = ({
    invoiceId,
    returnedItems = [], // Array of { productId, name, unit, returnedWeight, originalPricePerKg, reason }
    refundMethod = 'cash', // 'cash' | 'bank' | 'credit_deduction'
    inventoryAction = 'restock', // 'restock' (إعادة للمخزن) | 'damaged' (تحويل لتوالف وهالك)
    notes = ''
  }) => {
    const originalInvoice = invoices.find(inv => inv.id === invoiceId);
    if (!originalInvoice) throw new Error('الفاتورة الأصلية غير موجودة');

    let totalRefund = 0;
    const processedItems = returnedItems.map(retItem => {
      // Find matching item in original invoice
      const origItem = originalInvoice.items.find(i => 
        (retItem.productId && i.productId === retItem.productId) || 
        (i.name && retItem.name && i.name.trim() === retItem.name.trim())
      );

      // CRITICAL: Strictly use the historical price that was actually sold on this invoice!
      // Any subsequent changes to product catalog price are ignored.
      const historicalPrice = origItem ? Number(origItem.pricePerKg || 0) : Number(retItem.originalPricePerKg || 0);
      const retWeight = Number(retItem.returnedWeight || 0);
      const subtotal = Math.round(retWeight * historicalPrice * 100) / 100;
      totalRefund += subtotal;

      // Update inventory stock or damaged goods
      if (retWeight > 0) {
        if (inventoryAction === 'restock') {
          // Add back to product inventory stock
          const targetProdId = origItem?.productId || retItem.productId;
          setProducts(prev => prev.map(p => {
            if ((targetProdId && p.id === targetProdId) || p.name.trim() === retItem.name.trim()) {
              return {
                ...p,
                currentStockKg: Math.round(((Number(p.currentStockKg) || 0) + retWeight) * 100) / 100
              };
            }
            return p;
          }));
        } else if (inventoryAction === 'damaged') {
          // Automatically log to damaged / loss records
          addDamagedItem({
            productName: retItem.name,
            quantityKg: retWeight,
            estimatedCostPerKg: historicalPrice,
            lossReason: `مردود مبيعات تالف من فاتورة #${invoiceId} (${retItem.reason || 'بضاعة غير صالحة'})`,
            date: getCurrentDateFormatted(),
            time: getCurrentTimeFormatted()
          });
        }
      }

      return {
        ...retItem,
        originalPricePerKg: historicalPrice,
        returnedWeight: retWeight,
        subtotal
      };
    });

    totalRefund = Math.round(totalRefund * 100) / 100;

    // Handle financial refund deduction:
    // If credit_deduction: decrease customer debt
    if (refundMethod === 'credit_deduction' && originalInvoice.customerId && originalInvoice.customerId !== 'walk_in') {
      setCustomers(prev => prev.map(c => {
        if (c.id === originalInvoice.customerId) {
          return {
            ...c,
            balance: Math.round(((c.balance || 0) - totalRefund) * 100) / 100
          };
        }
        return c;
      }));
    }

    const returnId = `ret-sale-${Date.now()}`;
    const newReturn = {
      id: returnId,
      invoiceId,
      customerId: originalInvoice.customerId,
      customerName: originalInvoice.customerName || 'عميل نقدي',
      customerPhone: originalInvoice.customerPhone || '',
      date: getCurrentDateFormatted(),
      time: getCurrentTimeFormatted(),
      items: processedItems,
      totalRefundAmount: totalRefund,
      refundMethod,
      inventoryAction,
      notes,
      createdAt: new Date().toISOString()
    };

    setSalesReturns(prev => [newReturn, ...prev]);

    // Update invoice record to track returned quantities
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        const updatedItems = inv.items.map(item => {
          const ret = processedItems.find(r => 
            (r.productId && r.productId === item.productId) || 
            (r.name && item.name && r.name.trim() === item.name.trim())
          );
          if (ret) {
            return {
              ...item,
              returnedWeight: Math.round(((Number(item.returnedWeight) || 0) + ret.returnedWeight) * 100) / 100
            };
          }
          return item;
        });

        const totalReturnedAmount = Math.round(((Number(inv.totalReturnedAmount) || 0) + totalRefund) * 100) / 100;
        const totalReturnedWeight = updatedItems.reduce((s, i) => s + (Number(i.returnedWeight) || 0), 0);

        return {
          ...inv,
          items: updatedItems,
          hasReturns: true,
          totalReturnedAmount,
          totalReturnedWeight
        };
      }
      return inv;
    }));

    return newReturn;
  };

  const deleteSalesReturn = (returnId) => {
    const target = salesReturns.find(r => r.id === returnId);
    if (!target) return;

    // Reverse customer balance if credit_deduction
    if (target.refundMethod === 'credit_deduction' && target.customerId && target.customerId !== 'walk_in') {
      setCustomers(prev => prev.map(c => {
        if (c.id === target.customerId) {
          return {
            ...c,
            balance: Math.round(((c.balance || 0) + target.totalRefundAmount) * 100) / 100
          };
        }
        return c;
      }));
    }

    // Reverse inventory if restock
    if (target.inventoryAction === 'restock') {
      target.items.forEach(it => {
        setProducts(prev => prev.map(p => {
          if ((it.productId && p.id === it.productId) || p.name.trim() === it.name.trim()) {
            return {
              ...p,
              currentStockKg: Math.max(0, Math.round(((Number(p.currentStockKg) || 0) - it.returnedWeight) * 100) / 100)
            };
          }
          return p;
        }));
      });
    }

    // Revert invoice returned quantities
    setInvoices(prev => prev.map(inv => {
      if (inv.id === target.invoiceId) {
        const updatedItems = inv.items.map(item => {
          const ret = target.items.find(r => 
            (r.productId && r.productId === item.productId) || 
            (r.name && item.name && r.name.trim() === item.name.trim())
          );
          if (ret) {
            return {
              ...item,
              returnedWeight: Math.max(0, Math.round(((Number(item.returnedWeight) || 0) - ret.returnedWeight) * 100) / 100)
            };
          }
          return item;
        });
        const totalReturnedAmount = Math.max(0, Math.round(((Number(inv.totalReturnedAmount) || 0) - target.totalRefundAmount) * 100) / 100);
        return {
          ...inv,
          items: updatedItems,
          hasReturns: totalReturnedAmount > 0,
          totalReturnedAmount
        };
      }
      return inv;
    }));

    setSalesReturns(prev => prev.filter(r => r.id !== returnId));
  };

  // Expense Categories Actions
  const addExpenseCategory = (catName) => {
    const trimmed = (catName || '').trim();
    if (!trimmed) return;
    setExpenseCategories(prev => prev.includes(trimmed) ? prev : [...prev, trimmed]);
  };

  const deleteExpenseCategory = (catName) => {
    setExpenseCategories(prev => prev.filter(c => c !== catName));
  };

  // Expenses Actions
  const addExpense = (exp) => {
    const trimmedCat = (exp.category || 'نثريات وصيانة').trim();
    if (trimmedCat) {
      addExpenseCategory(trimmedCat);
    }
    const activeB = branches.find(b => b.id === (exp.branchId || activeBranchId)) || branches[0];
    const newExp = {
      ...exp,
      id: `exp-${Date.now()}`,
      branchId: activeB?.id || 'branch-main',
      branchName: activeB?.name || 'الفرع الرئيسي',
      category: trimmedCat,
      date: exp.date || new Date().toISOString().split('T')[0],
      amount: Number(exp.amount) || 0
    };
    setExpenses(prev => [newExp, ...prev]);
    return newExp;
  };

  const deleteExpense = (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // Damaged / Spoiled Items Actions (التوالف والإعدامات)
  const addDamagedItem = (item) => {
    const qtyKg = Math.round((Number(item.quantityKg) || 0) * 100) / 100;
    const costPerKg = Number(item.costPerKg) || 0;
    const activeB = branches.find(b => b.id === (item.branchId || activeBranchId)) || branches[0];
    const targetBranchId = activeB?.id || 'branch-main';

    const newItem = {
      ...item,
      id: `dmg-${Date.now()}`,
      branchId: targetBranchId,
      branchName: activeB?.name || 'الفرع الرئيسي',
      date: item.date || new Date().toISOString().split('T')[0],
      quantityKg: qtyKg,
      costPerKg,
      totalLoss: Math.round(qtyKg * costPerKg * 100) / 100
    };

    // Deduct damaged quantity from product stock
    if (qtyKg > 0) {
      setProducts(prev => prev.map(p => {
        const isMatch = (newItem.productId && p.id === newItem.productId) || 
                        (p.name.trim() === (newItem.productName || newItem.name || '').trim());
        if (isMatch) {
          const curStock = Number(p.currentStockKg) || 0;
          const curBStock = p.branchStock || {};
          const branchOldStock = Number(curBStock[targetBranchId] !== undefined ? curBStock[targetBranchId] : curStock);
          return {
            ...p,
            currentStockKg: Math.round((curStock - qtyKg) * 100) / 100,
            branchStock: {
              ...curBStock,
              [targetBranchId]: Math.round((branchOldStock - qtyKg) * 100) / 100
            }
          };
        }
        return p;
      }));
    }

    setDamagedItems(prev => [newItem, ...prev]);
    return newItem;
  };

  const deleteDamagedItem = (id) => {
    const target = damagedItems.find(d => d.id === id);
    if (target && Number(target.quantityKg) > 0) {
      const qtyKg = Number(target.quantityKg);
      setProducts(prev => prev.map(p => {
        const isMatch = (target.productId && p.id === target.productId) || 
                        (p.name.trim() === (target.productName || target.name || '').trim());
        if (isMatch) {
          const curStock = Number(p.currentStockKg) || 0;
          return {
            ...p,
            currentStockKg: Math.round((curStock + qtyKg) * 100) / 100
          };
        }
        return p;
      }));
    }
    setDamagedItems(prev => prev.filter(d => d.id !== id));
  };

  // Workers & Payroll Actions (العمال والرواتب)
  const addWorker = (worker) => {
    const newWorker = {
      ...worker,
      id: `work-${Date.now()}`,
      baseSalary: Number(worker.baseSalary) || 0,
      currentAdvance: 0,
      startDate: worker.startDate || new Date().toISOString().split('T')[0]
    };
    setWorkers(prev => [newWorker, ...prev]);
    return newWorker;
  };

  const updateWorker = (id, updates) => {
    setWorkers(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  const deleteWorker = (id) => {
    setWorkers(prev => prev.filter(w => w.id !== id));
  };

  // Worker Transactions (سلفيات ورواتب)
  const addWorkerTransaction = (transaction) => {
    const amount = Number(transaction.amount) || 0;
    const newTx = {
      ...transaction,
      id: `wt-${Date.now()}`,
      amount,
      date: transaction.date || new Date().toISOString().split('T')[0]
    };

    // Update worker's currentAdvance
    setWorkers(prev => prev.map(w => {
      if (w.id === transaction.workerId) {
        if (transaction.type === 'advance') {
          // Worker took advance money -> advance increases
          return { ...w, currentAdvance: (w.currentAdvance || 0) + amount };
        } else if (transaction.type === 'salary_payment') {
          // Salary paid -> deducts deductedAdvances if any
          const deducted = Number(transaction.deductedAdvance) || 0;
          return { ...w, currentAdvance: Math.max(0, (w.currentAdvance || 0) - deducted) };
        }
      }
      return w;
    }));

    setWorkerTransactions(prev => [newTx, ...prev]);

    // Also optionally record as general expense so cash register reflects the cash payout
    addExpense({
      title: `${transaction.type === 'advance' ? 'سلفة لعامل' : 'صرف راتب'}: ${transaction.workerName}`,
      category: 'رواتب وعمالة',
      amount: amount,
      date: newTx.date,
      time: newTx.time || '',
      notes: transaction.notes || ''
    });

    return newTx;
  };

  const deleteWorkerTransaction = (id) => {
    setWorkerTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Settings Actions
  const updateSettings = (updates) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  // Supplier Actions (الموردون وحسابات الديون والأرصدة)
  const addSupplier = (sup) => {
    const initialAmt = Number(sup.initialBalance) || 0;
    // initialBalanceType: 'due_to_supplier' (له فلوس / دائن) -> positive balance
    //                     'advance_paid' (عليه فلوس / مدين) -> negative balance
    let computedBalance = 0;
    if (sup.balance !== undefined) {
      computedBalance = Number(sup.balance) || 0;
    } else if (sup.initialBalanceType === 'advance_paid') {
      computedBalance = -Math.abs(initialAmt);
    } else {
      computedBalance = Math.abs(initialAmt);
    }

    const newSup = {
      id: `sup-${Date.now()}`,
      name: (sup.name || '').trim(),
      phone: (sup.phone || '').trim(),
      marketOrFarm: (sup.marketOrFarm || '').trim(),
      balance: Math.round(computedBalance * 100) / 100,
      notes: (sup.notes || '').trim()
    };
    setSuppliers(prev => [newSup, ...prev]);
    return newSup;
  };

  const updateSupplier = (id, updates) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { 
      ...s, 
      ...updates,
      balance: updates.balance !== undefined ? Math.round(Number(updates.balance) * 100) / 100 : s.balance
    } : s));
  };

  const deleteSupplier = (id) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
  };

  const recordSupplierPayment = ({ supplierId, amount, paymentMethod = 'cash', notes = '', date = null, time = null }) => {
    const numAmount = Math.round(Number(amount) * 100) / 100;
    if (!numAmount || numAmount <= 0) return null;

    const targetSupplier = suppliers.find(s => s.id === supplierId);
    const supplierName = targetSupplier ? targetSupplier.name : 'مورد';

    // Deduct payment from supplier balance:
    // If balance was +1000 (we owed him) and we pay 1000 -> 0
    // If balance was +1000 and we pay 1200 -> -200 (he owes us / advance)
    // If balance was 0 and we pay 500 -> -500 (advance)
    setSuppliers(prev => prev.map(s => {
      if (s.id === supplierId) {
        return {
          ...s,
          balance: Math.round(((s.balance || 0) - numAmount) * 100) / 100
        };
      }
      return s;
    }));

    const newPayment = {
      id: `supp-pay-${Date.now()}`,
      supplierId,
      supplierName,
      amount: numAmount,
      paymentMethod, // 'cash' (من درج المحل) | 'bank' (تحويل بنكي)
      date: date || getCurrentDateFormatted(),
      time: time || getCurrentTimeFormatted(),
      notes: notes || (paymentMethod === 'cash' ? 'سداد دفعة نقدية من الخزينة' : 'حوالة بنكية للمورد')
    };

    setSupplierPayments(prev => [newPayment, ...prev]);

    // If paid cash from drawer, log as expense for visibility, tagged to prevent double counting
    if (paymentMethod === 'cash') {
      addExpense({
        title: `سداد دفعة لمورد: ${supplierName}`,
        category: 'مشتريات وتوريد',
        amount: numAmount,
        date: newPayment.date,
        time: newPayment.time,
        notes: notes ? `سند صرف لمورد (${notes})` : 'سداد دفعة نقدية لمورد من الخزينة/الدرج',
        isSupplierPayment: true,
        supplierPaymentId: newPayment.id
      });
    }

    return newPayment;
  };

  const deleteSupplierPayment = (paymentId) => {
    const target = supplierPayments.find(p => p.id === paymentId);
    if (target) {
      // Re-add the amount back to the supplier balance
      setSuppliers(prev => prev.map(s => {
        if (s.id === target.supplierId) {
          return {
            ...s,
            balance: Math.round(((s.balance || 0) + target.amount) * 100) / 100
          };
        }
        return s;
      }));
      setSupplierPayments(prev => prev.filter(p => p.id !== paymentId));
      // Remove the linked expense if it was created
      setExpenses(prev => prev.filter(e => e.supplierPaymentId !== paymentId));
    }
  };

  // Purchases Actions (المشتريات وتوريد البضاعة من المزارع وحلقات وسوق الجملة)
  const addPurchase = (purData) => {
    const total = Number(purData.totalCost) || (Number(purData.quantityKg || 0) * Number(purData.costPerKg || 0));
    const roundTotal = Math.round(total * 100) / 100;

    let creditAmount = 0;
    if (purData.paymentMethod === 'credit') {
      creditAmount = roundTotal;
    } else if (purData.paymentMethod === 'split') {
      creditAmount = Number(purData.creditAmount) || 0;
    }

    const method = purData.paymentMethod || 'cash';
    let paidCashAmount = 0;
    let paidBankAmount = 0;
    if (method === 'cash') {
      paidCashAmount = Math.max(0, roundTotal - creditAmount);
    } else if (method === 'bank') {
      paidBankAmount = Math.max(0, roundTotal - creditAmount);
    } else if (method === 'split') {
      paidCashAmount = Number(purData.cashAmount) || 0;
      paidBankAmount = Number(purData.bankAmount) || 0;
    }
    const paidAmount = paidCashAmount + paidBankAmount;

    const activeB = branches.find(b => b.id === (purData.branchId || activeBranchId)) || branches[0];
    const targetBranchId = activeB?.id || 'branch-main';
    const targetBranchName = activeB?.name || 'الفرع الرئيسي';

    const newPurchase = {
      ...purData,
      id: purData.id || `pur-${Date.now()}`,
      branchId: targetBranchId,
      branchName: targetBranchName,
      date: purData.date || getCurrentDateFormatted(),
      time: purData.time || getCurrentTimeFormatted(),
      totalCost: roundTotal,
      quantityKg: Number(purData.quantityKg) || 0,
      packagesCount: Number(purData.packagesCount) || 0,
      costPerKg: Number(purData.costPerKg) || 0,
      supplierId: purData.supplierId || null,
      supplierName: purData.supplierName || 'سوق الجملة المركزي',
      paymentMethod: method,
      paymentType: method,
      paidAmount,
      paidCashAmount,
      paidBankAmount,
      creditAmount: creditAmount,
      bankName: purData.bankName || '',
      bankAccountNumber: purData.bankAccountNumber || '',
      notes: purData.notes || ''
    };

    // If purchase has debt (credit) and is linked to a supplier, increase supplier's balance (له فلوس علينا)
    if (creditAmount > 0) {
      if (newPurchase.supplierId) {
        setSuppliers(prev => prev.map(s => {
          if (s.id === newPurchase.supplierId) {
            return {
              ...s,
              balance: Math.round(((s.balance || 0) + creditAmount) * 100) / 100
            };
          }
          return s;
        }));
      } else if (newPurchase.supplierName && newPurchase.supplierName !== 'سوق الجملة المركزي') {
        // Auto-match or auto-create supplier
        setSuppliers(prev => {
          const match = prev.find(s => s.name.trim() === newPurchase.supplierName.trim());
          if (match) {
            newPurchase.supplierId = match.id;
            return prev.map(s => s.id === match.id ? {
              ...s,
              balance: Math.round(((s.balance || 0) + creditAmount) * 100) / 100
            } : s);
          } else {
            const newSupId = `sup-${Date.now()}`;
            newPurchase.supplierId = newSupId;
            return [{
              id: newSupId,
              name: newPurchase.supplierName.trim(),
              phone: '',
              marketOrFarm: '',
              balance: creditAmount,
              notes: 'تم إنشاؤه تلقائياً من فاتورة توريد آجل'
            }, ...prev];
          }
        });
      }
    }

    // Synchronize product inventory stock and update cost / weighted average cost
    const purQty = Math.round((Number(purData.quantityKg) || 0) * 100) / 100;
    const purCost = Math.round((Number(purData.costPerKg) || 0) * 100) / 100;
    const prodName = (purData.productName || '').trim();

    if (purData.isNewProduct && prodName) {
      const existing = products.find(p => p.name.trim() === prodName);
      if (!existing) {
        addProduct({
          name: prodName,
          category: purData.category || 'خضروات',
          icon: purData.icon || '📦',
          defaultPricePerKg: purData.sellingPricePerKg ? Number(purData.sellingPricePerKg) : Math.round((purCost * 1.3) * 100) / 100,
          costPerKg: purCost,
          lastPurchasePrice: purCost,
          tareWeightKg: purData.tareWeightPerPackage ? Number(purData.tareWeightPerPackage) : 1.2,
          defaultPackageType: purData.packageType || 'صندوق بلاستيك',
          currentStockKg: purQty,
          branchStock: { [targetBranchId]: purQty }
        });
      } else {
        // If already exists, update existing product stock and average cost
        setProducts(prev => prev.map(p => {
          if (p.name.trim() === prodName) {
            const oldStock = Math.max(0, Number(p.currentStockKg) || 0);
            const newStock = Math.round((oldStock + purQty) * 100) / 100;
            const oldCost = Number(p.costPerKg) || 0;
            const avgCost = newStock > 0 
              ? Math.round(((oldStock * oldCost + purQty * purCost) / newStock) * 100) / 100
              : purCost;
            const curBStock = p.branchStock || {};
            const branchOldStock = Number(curBStock[targetBranchId] !== undefined ? curBStock[targetBranchId] : oldStock);
            const branchNewStock = Math.round((branchOldStock + purQty) * 100) / 100;
            return {
              ...p,
              currentStockKg: newStock,
              branchStock: {
                ...curBStock,
                [targetBranchId]: branchNewStock
              },
              costPerKg: avgCost > 0 ? avgCost : purCost,
              lastPurchasePrice: purCost,
              ...(purData.sellingPricePerKg ? { defaultPricePerKg: Number(purData.sellingPricePerKg) } : {})
            };
          }
          return p;
        }));
      }
    } else if (purQty > 0) {
      // Existing product selected from list or entered
      setProducts(prev => prev.map(p => {
        const isMatch = (purData.productId && p.id === purData.productId) || 
                        (prodName && p.name.trim() === prodName);
        if (isMatch) {
          const oldStock = Math.max(0, Number(p.currentStockKg) || 0);
          const newStock = Math.round((oldStock + purQty) * 100) / 100;
          const oldCost = Number(p.costPerKg) || 0;
          const avgCost = newStock > 0 
            ? Math.round(((oldStock * oldCost + purQty * purCost) / newStock) * 100) / 100
            : purCost;
          const curBStock = p.branchStock || {};
          const branchOldStock = Number(curBStock[targetBranchId] !== undefined ? curBStock[targetBranchId] : oldStock);
          const branchNewStock = Math.round((branchOldStock + purQty) * 100) / 100;
          return {
            ...p,
            currentStockKg: newStock,
            branchStock: {
              ...curBStock,
              [targetBranchId]: branchNewStock
            },
            costPerKg: avgCost > 0 ? avgCost : purCost,
            lastPurchasePrice: purCost,
            ...(purData.sellingPricePerKg ? { defaultPricePerKg: Number(purData.sellingPricePerKg) } : {})
          };
        }
        return p;
      }));
    }

    setPurchases(prev => [newPurchase, ...prev]);
    return newPurchase;
  };

  const deletePurchase = (id) => {
    const target = purchases.find(p => p.id === id);
    if (target) {
      if (target.creditAmount > 0 && target.supplierId) {
        setSuppliers(prev => prev.map(s => {
          if (s.id === target.supplierId) {
            return {
              ...s,
              balance: Math.round(((s.balance || 0) - target.creditAmount) * 100) / 100
            };
          }
          return s;
        }));
      }

      // Deduct purchased quantity from product stock
      const purQty = Number(target.quantityKg) || 0;
      if (purQty > 0) {
        setProducts(prev => prev.map(p => {
          const isMatch = (target.productId && p.id === target.productId) || 
                          (target.productName && p.name.trim() === target.productName.trim());
          if (isMatch) {
            const curStock = Number(p.currentStockKg) || 0;
            return {
              ...p,
              currentStockKg: Math.round((curStock - purQty) * 100) / 100
            };
          }
          return p;
        }));
      }
    }
    setPurchases(prev => prev.filter(p => p.id !== id));
  };

  // Purchase Return Actions (مردودات المشتريات للموردين - بتكلفة الشراء الفعلية التاريخية المسجلة بالفاتورة)
  const recordPurchaseReturn = ({
    purchaseId,
    returnedKg,
    refundMethod = 'supplier_debt_deduction', // 'supplier_debt_deduction' | 'cash' | 'bank'
    reason = '',
    notes = ''
  }) => {
    const originalPurchase = (purchases || []).find(p => p.id === purchaseId);
    if (!originalPurchase) throw new Error('شحنة المشتريات الأصلية غير موجودة');

    const retKg = Number(returnedKg) || 0;
    // CRITICAL: Strictly lock to historical costPerKg from that purchase bill!
    const historicalCostPerKg = Number(originalPurchase.costPerKg) || 0;
    const totalRefund = Math.round(retKg * historicalCostPerKg * 100) / 100;

    // Deduct from supplier debt if applicable (reduces what we owe him)
    if (refundMethod === 'supplier_debt_deduction' && originalPurchase.supplierId) {
      setSuppliers(prev => prev.map(s => {
        if (s.id === originalPurchase.supplierId) {
          return {
            ...s,
            balance: Math.round(((s.balance || 0) - totalRefund) * 100) / 100
          };
        }
        return s;
      }));
    }

    // Deduct returned quantity from inventory
    if (retKg > 0) {
      setProducts(prev => prev.map(p => {
        if (p.name.trim() === originalPurchase.productName.trim() || p.id === originalPurchase.productId) {
          return {
            ...p,
            currentStockKg: Math.max(0, Math.round(((Number(p.currentStockKg) || 0) - retKg) * 100) / 100)
          };
        }
        return p;
      }));
    }

    const returnId = `ret-pur-${Date.now()}`;
    const newReturn = {
      id: returnId,
      purchaseId,
      productId: originalPurchase.productId,
      productName: originalPurchase.productName,
      supplierId: originalPurchase.supplierId,
      supplierName: originalPurchase.supplierName,
      date: getCurrentDateFormatted(),
      time: getCurrentTimeFormatted(),
      returnedKg: retKg,
      originalCostPerKg: historicalCostPerKg,
      totalRefundAmount: totalRefund,
      refundMethod,
      reason,
      notes,
      createdAt: new Date().toISOString()
    };

    setPurchaseReturns(prev => [newReturn, ...prev]);

    // Update purchase record
    setPurchases(prev => prev.map(p => {
      if (p.id === purchaseId) {
        return {
          ...p,
          returnedKg: Math.round(((Number(p.returnedKg) || 0) + retKg) * 100) / 100,
          totalReturnedAmount: Math.round(((Number(p.totalReturnedAmount) || 0) + totalRefund) * 100) / 100,
          hasReturns: true
        };
      }
      return p;
    }));

    return newReturn;
  };

  const deletePurchaseReturn = (returnId) => {
    const target = purchaseReturns.find(r => r.id === returnId);
    if (!target) return;

    // Re-add to supplier debt if it was deducted
    if (target.refundMethod === 'supplier_debt_deduction' && target.supplierId) {
      setSuppliers(prev => prev.map(s => {
        if (s.id === target.supplierId) {
          return {
            ...s,
            balance: Math.round(((s.balance || 0) + target.totalRefundAmount) * 100) / 100
          };
        }
        return s;
      }));
    }

    // Re-add to inventory
    if (target.returnedKg > 0) {
      setProducts(prev => prev.map(p => {
        if (p.name.trim() === target.productName.trim() || p.id === target.productId) {
          return {
            ...p,
            currentStockKg: Math.round(((Number(p.currentStockKg) || 0) + target.returnedKg) * 100) / 100
          };
        }
        return p;
      }));
    }

    // Revert purchase record
    setPurchases(prev => prev.map(p => {
      if (p.id === target.purchaseId) {
        const totalReturnedAmount = Math.max(0, Math.round(((Number(p.totalReturnedAmount) || 0) - target.totalRefundAmount) * 100) / 100);
        return {
          ...p,
          returnedKg: Math.max(0, Math.round(((Number(p.returnedKg) || 0) - target.returnedKg) * 100) / 100),
          totalReturnedAmount,
          hasReturns: totalReturnedAmount > 0
        };
      }
      return p;
    }));

    setPurchaseReturns(prev => prev.filter(r => r.id !== returnId));
  };

  // Reset or Export/Import
  const resetToSampleData = () => {
    setProducts(INITIAL_PRODUCTS);
    setCustomers(INITIAL_CUSTOMERS);
    setInvoices(INITIAL_INVOICES);
    setExpenses(INITIAL_EXPENSES);
    setExpenseCategories(INITIAL_EXPENSE_CATEGORIES);
    setSettings(INITIAL_SETTINGS);
    setDamagedItems(INITIAL_DAMAGED_ITEMS);
    setWorkers(INITIAL_WORKERS);
    setWorkerTransactions(INITIAL_WORKER_TRANSACTIONS);
    setCustomerPayments(INITIAL_CUSTOMER_PAYMENTS);
    setPurchases(INITIAL_PURCHASES);
    setSuppliers(INITIAL_SUPPLIERS);
    setSupplierPayments(INITIAL_SUPPLIER_PAYMENTS);
    setSalesReturns(INITIAL_SALES_RETURNS);
    setPurchaseReturns(INITIAL_PURCHASE_RETURNS);
  };

  const exportBackupJSON = () => {
    const data = {
      version: 3,
      exportDate: new Date().toISOString(),
      products,
      customers,
      invoices,
      expenses,
      expenseCategories,
      settings,
      damagedItems,
      workers,
      workerTransactions,
      customerPayments,
      purchases,
      suppliers,
      supplierPayments,
      salesReturns,
      purchaseReturns,
      partners,
      partnerDrawings,
      profitDistributions
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `khodar-full-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Partner Actions
  const addPartner = (partnerData) => {
    const newPartner = {
      ...partnerData,
      id: partnerData.id || `partner-${Date.now()}`,
      sharePercentage: Number(partnerData.sharePercentage) || 0,
      initialCapital: Number(partnerData.initialCapital) || 0,
      createdAt: partnerData.createdAt || getCurrentDateFormatted()
    };
    setPartners(prev => [...prev, newPartner]);
    return newPartner;
  };

  const updatePartner = (id, updates) => {
    setPartners(prev => prev.map(p => p.id === id ? {
      ...p,
      ...updates,
      sharePercentage: updates.sharePercentage !== undefined ? Number(updates.sharePercentage) : p.sharePercentage,
      initialCapital: updates.initialCapital !== undefined ? Number(updates.initialCapital) : p.initialCapital
    } : p));
  };

  const deletePartner = (id) => {
    setPartners(prev => prev.filter(p => p.id !== id));
    setPartnerDrawings(prev => prev.filter(d => d.partnerId !== id));
  };

  // Partner Drawings (سحب الشركاء)
  const recordPartnerDrawing = (drawingData) => {
    const newDrawing = {
      ...drawingData,
      id: drawingData.id || `draw-${Date.now()}`,
      amount: Number(drawingData.amount) || 0,
      method: drawingData.method || 'cash', // 'cash' | 'bank'
      date: drawingData.date || getCurrentDateFormatted(),
      time: drawingData.time || getCurrentTimeFormatted(),
      notes: drawingData.notes || '',
      createdAt: new Date().toISOString()
    };
    setPartnerDrawings(prev => [newDrawing, ...prev]);
    return newDrawing;
  };

  const deletePartnerDrawing = (id) => {
    setPartnerDrawings(prev => prev.filter(d => d.id !== id));
  };

  // Profit Distributions (توزيعات الأرباح)
  const recordProfitDistribution = (distData) => {
    const newDist = {
      ...distData,
      id: distData.id || `dist-${Date.now()}`,
      totalDistributedAmount: Number(distData.totalDistributedAmount) || 0,
      date: distData.date || getCurrentDateFormatted(),
      time: distData.time || getCurrentTimeFormatted(),
      periodLabel: distData.periodLabel || 'توزيع أرباح عام',
      shares: distData.shares || [],
      notes: distData.notes || '',
      createdAt: new Date().toISOString()
    };
    setProfitDistributions(prev => [newDist, ...prev]);
    return newDist;
  };

  const deleteProfitDistribution = (id) => {
    setProfitDistributions(prev => prev.filter(d => d.id !== id));
  };

  // --------------------------------------------------------------------------
  // Financial Position Engine ("أين الفلوس الآن؟")
  // --------------------------------------------------------------------------
  const getFinancialPosition = () => {
    // 0. Opening Cash Float (العهدة الافتتاحية للصندوق)
    const openingCashFloat = Number(settings?.openingCashDrawerFloat) || 0;

    // 1. Cash Inflows
    const validInvoices = invoices.filter(i => i.status !== 'voided');
    const cashFromSales = validInvoices.reduce((sum, inv) => {
      if (inv.saleType === 'split') return sum + (Number(inv.cashAmount) || 0);
      if (inv.saleType === 'cash') return sum + (Number(inv.paidAmount) || 0);
      return sum;
    }, 0);

    // If method is missing, default to 'cash' for backwards compatibility
    const cashFromCustomerPayments = customerPayments
      .filter(p => !p.method || p.method === 'cash')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // 2. Cash Outflows
    // Exclude supplier payments from general expenses to prevent double deduction
    const cashExpenses = expenses
      .filter(e => e.paymentMethod !== 'bank' && !e.isSupplierPayment)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const cashPurchases = (purchases || []).reduce((sum, p) => {
      if (p.paidCashAmount !== undefined) return sum + (Number(p.paidCashAmount) || 0);
      if (p.paymentMethod === 'cash') return sum + Math.max(0, (Number(p.totalCost) || 0) - (Number(p.creditAmount) || 0));
      if (p.paymentType === 'cash') return sum + (Number(p.paidAmount) || 0);
      return sum;
    }, 0);

    const cashSupplierPayments = (supplierPayments || [])
      .filter(sp => sp.paymentMethod !== 'bank')
      .reduce((sum, sp) => sum + (Number(sp.amount) || 0), 0);

    const cashWorkerAdvances = (workerTransactions || [])
      .filter(t => t.type === 'advance' && t.paymentMethod !== 'bank')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const cashWorkerSalaries = (workerTransactions || [])
      .filter(t => t.type === 'salary_payment' && t.paymentMethod !== 'bank')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const cashPartnerDrawings = (partnerDrawings || [])
      .filter(d => d.method !== 'bank')
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

    const cashProfitDistributions = (profitDistributions || [])
      .reduce((sum, dist) => {
        const sharesCash = (dist.shares || [])
          .filter(s => s.method !== 'bank')
          .reduce((sSum, s) => sSum + (Number(s.netPayout) || 0), 0);
        return sum + sharesCash;
      }, 0);

    // Sales returns cash refunds
    const cashSalesReturns = (salesReturns || [])
      .filter(r => r.refundMethod === 'cash')
      .reduce((sum, r) => sum + (Number(r.totalRefundAmount) || 0), 0);

    // Purchase returns cash received back into drawer
    const cashPurchaseReturns = (purchaseReturns || [])
      .filter(r => r.refundMethod === 'cash')
      .reduce((sum, r) => sum + (Number(r.totalRefundAmount) || 0), 0);

    // Net Cash in Drawer / Safe
    const totalCashInflow = openingCashFloat + cashFromSales + cashFromCustomerPayments + cashPurchaseReturns;
    const totalCashOutflow = cashExpenses + cashPurchases + cashSupplierPayments + cashWorkerAdvances + cashWorkerSalaries + cashPartnerDrawings + cashProfitDistributions + cashSalesReturns;
    const cashBalance = Math.round((totalCashInflow - totalCashOutflow) * 100) / 100;

    // 3. Bank Inflows
    const bankFromSales = validInvoices.reduce((sum, inv) => {
      if (inv.saleType === 'split') return sum + (Number(inv.bankAmount) || 0);
      if (inv.saleType === 'bank') return sum + (Number(inv.paidAmount) || 0);
      return sum;
    }, 0);

    const bankFromCustomerPayments = customerPayments
      .filter(p => p.method === 'bank')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Bank purchase returns received back into bank
    const bankPurchaseReturns = (purchaseReturns || [])
      .filter(r => r.refundMethod === 'bank')
      .reduce((sum, r) => sum + (Number(r.totalRefundAmount) || 0), 0);

    // 4. Bank Outflows
    const bankExpenses = expenses
      .filter(e => e.paymentMethod === 'bank' && !e.isSupplierPayment)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const bankPurchases = (purchases || []).reduce((sum, p) => {
      if (p.paidBankAmount !== undefined) return sum + (Number(p.paidBankAmount) || 0);
      if (p.paymentMethod === 'bank') return sum + Math.max(0, (Number(p.totalCost) || 0) - (Number(p.creditAmount) || 0));
      if (p.paymentType === 'bank') return sum + (Number(p.paidAmount) || 0);
      return sum;
    }, 0);

    const bankSupplierPayments = (supplierPayments || [])
      .filter(sp => sp.paymentMethod === 'bank')
      .reduce((sum, sp) => sum + (Number(sp.amount) || 0), 0);

    const bankWorkerAdvances = (workerTransactions || [])
      .filter(t => t.type === 'advance' && t.paymentMethod === 'bank')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const bankWorkerSalaries = (workerTransactions || [])
      .filter(t => t.type === 'salary_payment' && t.paymentMethod === 'bank')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const bankPartnerDrawings = (partnerDrawings || [])
      .filter(d => d.method === 'bank')
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

    // Corrected filter to s.method === 'bank'
    const bankProfitDistributions = (profitDistributions || [])
      .reduce((sum, dist) => {
        const sharesBank = (dist.shares || [])
          .filter(s => s.method === 'bank')
          .reduce((sSum, s) => sSum + (Number(s.netPayout) || 0), 0);
        return sum + sharesBank;
      }, 0);

    // Bank sales returns refunded via bank
    const bankSalesReturns = (salesReturns || [])
      .filter(r => r.refundMethod === 'bank')
      .reduce((sum, r) => sum + (Number(r.totalRefundAmount) || 0), 0);

    // Net Bank Balance
    const totalBankInflow = bankFromSales + bankFromCustomerPayments + bankPurchaseReturns;
    const totalBankOutflow = bankExpenses + bankPurchases + bankSupplierPayments + bankWorkerAdvances + bankWorkerSalaries + bankPartnerDrawings + bankProfitDistributions + bankSalesReturns;
    const bankBalance = Math.round((totalBankInflow - totalBankOutflow) * 100) / 100;

    // 5. Debt Positions
    const totalCustomersDebt = customers.reduce((sum, c) => sum + Math.max(0, Number(c.balance) || 0), 0);
    const totalSuppliersDebt = (suppliers || []).reduce((sum, s) => sum + Math.max(0, Number(s.balance) || 0), 0);
    const totalSupplierAdvances = (suppliers || []).reduce((sum, s) => sum + Math.max(0, -(Number(s.balance) || 0)), 0);

    // 6. Total Liquidity & Net Working Capital
    const totalLiquidCash = cashBalance + bankBalance;
    const netMarketPosition = totalCustomersDebt - totalSuppliersDebt;
    const totalWorkingCapital = totalLiquidCash + totalCustomersDebt + totalSupplierAdvances - totalSuppliersDebt;

    const totalSalesReturnsAmount = (salesReturns || []).reduce((sum, r) => sum + (Number(r.totalRefundAmount) || 0), 0);
    const totalPurchaseReturnsAmount = (purchaseReturns || []).reduce((sum, r) => sum + (Number(r.totalRefundAmount) || 0), 0);

    return {
      openingCashFloat,
      cashBalance,
      bankBalance,
      totalLiquidCash,
      totalCustomersDebt,
      totalSuppliersDebt,
      totalSupplierAdvances,
      netMarketPosition,
      totalWorkingCapital,
      cashFromSales,
      cashFromCustomerPayments,
      cashExpenses,
      cashPurchases,
      cashSupplierPayments,
      cashWorkerAdvances,
      cashWorkerSalaries,
      cashPartnerDrawings,
      cashProfitDistributions,
      cashSalesReturns,
      cashPurchaseReturns,
      bankFromSales,
      bankFromCustomerPayments,
      bankExpenses,
      bankPurchases,
      bankSupplierPayments,
      bankWorkerAdvances,
      bankWorkerSalaries,
      bankPartnerDrawings,
      bankProfitDistributions,
      bankSalesReturns,
      bankPurchaseReturns,
      totalSalesReturnsAmount,
      totalPurchaseReturnsAmount
    };
  };

  const importBackupJSON = (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.products) setProducts(data.products);
      if (data.customers) setCustomers(data.customers);
      if (data.invoices) setInvoices(data.invoices);
      if (data.expenses) setExpenses(data.expenses);
      if (data.expenseCategories) setExpenseCategories(data.expenseCategories);
      if (data.settings) setSettings(data.settings);
      if (data.damagedItems) setDamagedItems(data.damagedItems);
      if (data.workers) setWorkers(data.workers);
      if (data.workerTransactions) setWorkerTransactions(data.workerTransactions);
      if (data.customerPayments) setCustomerPayments(data.customerPayments);
      if (data.purchases) setPurchases(data.purchases);
      if (data.suppliers) setSuppliers(data.suppliers);
      if (data.supplierPayments) setSupplierPayments(data.supplierPayments);
      if (data.salesReturns) setSalesReturns(data.salesReturns);
      if (data.purchaseReturns) setPurchaseReturns(data.purchaseReturns);
      if (data.partners) setPartners(data.partners);
      if (data.partnerDrawings) setPartnerDrawings(data.partnerDrawings);
      if (data.profitDistributions) setProfitDistributions(data.profitDistributions);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Authentication & Multi-Tenant Actions (with Store Code support)
  const login = async (username, password, explicitStoreCode = '') => {
    let cleanUser = (username || '').trim().toLowerCase();
    let cleanStoreCode = (explicitStoreCode || '').trim().toUpperCase();

    // Support smart inline format: username@storeCode or storeCode/username
    if (cleanUser.includes('@') && !cleanUser.includes('@gmail.com') && !cleanUser.includes('@yahoo.com') && !cleanUser.includes('@hotmail.com') && !cleanUser.includes('@outlook.com')) {
      const parts = cleanUser.split('@');
      cleanUser = parts[0].trim();
      if (!cleanStoreCode && parts[1]) {
        cleanStoreCode = parts[1].trim().toUpperCase();
      }
    } else if (cleanUser.includes('/')) {
      const parts = cleanUser.split('/');
      cleanStoreCode = parts[0].trim().toUpperCase();
      cleanUser = parts[1].trim().toLowerCase();
    }

    // If still no storeCode provided, fallback to remembered store code in localStorage
    if (!cleanStoreCode && typeof window !== 'undefined') {
      try {
        cleanStoreCode = (localStorage.getItem('khodar_remembered_store_code') || '').trim().toUpperCase();
      } catch (e) {}
    }

    // 0. Master System Creator & Platform Owner (صانع ومالك المنصة الرئيسي)
    if (cleanUser === 'amerfathi123@gmail.com') {
      if (password === 'A20101993f') {
        const ownerSession = {
          id: 'tenant-super-admin',
          storeCode: 'BRK-000',
          companyName: 'إدارة المنظومة (صانع ومالك المنصة)',
          username: 'amerfathi123@gmail.com',
          role: 'super_admin',
          status: 'active',
          expiresAt: '2099-12-31',
          allowedBranches: 999,
          tenantId: 'tenant-super-admin',
          permissions: { ...ROLE_PERMISSIONS_PRESETS.admin.permissions }
        };
        // Ensure owner is present in tenants list
        setTenants(prev => {
          const exists = prev.some(t => t.username.toLowerCase() === 'amerfathi123@gmail.com');
          if (!exists) {
            return [ownerSession, ...prev];
          }
          return prev.map(t => t.username.toLowerCase() === 'amerfathi123@gmail.com' ? { ...t, password: 'A20101993f', role: 'super_admin', storeCode: 'BRK-000' } : t);
        });
        setCurrentUser(ownerSession);
        try {
          localStorage.setItem('khodar_remembered_username', cleanUser);
          localStorage.setItem('khodar_remembered_store_code', 'BRK-000');
        } catch (e) {}
        return { success: true, user: ownerSession };
      } else {
        return { success: false, error: 'كلمة المرور غير صحيحة لحساب مالك المنصة' };
      }
    }

    // 1. If Store Code is specified, target that specific tenant
    if (cleanStoreCode) {
      let targetTenant = tenants.find(t => 
        (t.storeCode || '').toUpperCase() === cleanStoreCode || 
        t.id === cleanStoreCode.toLowerCase()
      );

      // Real-time Cloud Lookup Fallback (Cloud-First & Offline-First)
      // If store code is not yet in local storage, query Cloudflare D1 and cache locally
      if (!targetTenant && typeof window !== 'undefined') {
        try {
          const baseUrl = (window.location?.origin && window.location.origin.startsWith('http'))
            ? window.location.origin
            : 'https://khodar-pos.pages.dev';
          const res = await fetch(`${baseUrl}/api/tenants/lookup?code=${encodeURIComponent(cleanStoreCode)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.tenant) {
              targetTenant = data.tenant;
              // Cache locally so it is permanently available even if internet cuts out later
              setTenants(prev => [targetTenant, ...prev.filter(t => t.id !== targetTenant.id && (t.storeCode || '').toUpperCase() !== cleanStoreCode)]);
              if (Array.isArray(data.users) && data.users.length > 0) {
                setUsers(prev => {
                  const existingIds = new Set(data.users.map(u => u.id));
                  return [...data.users, ...prev.filter(u => !existingIds.has(u.id))];
                });
              }
            }
          }
        } catch (netErr) {
          console.warn('Cloud store code lookup failed or offline:', netErr);
        }
      }

      if (!targetTenant) {
        return { success: false, error: `كود المتجر (${cleanStoreCode}) غير موجود بالنظام، يرجى التحقق من الكود المعتمد` };
      }

      if (targetTenant.status === 'suspended') {
        return { success: false, error: 'تم تعليق هذا المتجر مؤقتاً، يرجى مراجعة إدارة المنصة', isSuspended: true };
      }

      // Check expiry if not super admin
      if (targetTenant.role !== 'super_admin' && targetTenant.expiresAt) {
        const today = new Date().toISOString().split('T')[0];
        if (today > targetTenant.expiresAt) {
          return { 
            success: false, 
            error: `انتهت فترة اشتراك متجر (${targetTenant.companyName}) بتاريخ ${targetTenant.expiresAt}`,
            isExpired: true,
            phone: targetTenant.phone
          };
        }
      }

      // A) Check Staff within this Tenant
      const staffUser = users.find(u => u.username.toLowerCase() === cleanUser && u.tenantId === targetTenant.id);
      if (staffUser) {
        if (staffUser.password !== password) {
          return { success: false, error: 'كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى' };
        }
        if (staffUser.status === 'inactive') {
          return { success: false, error: 'تم تعطيل هذا الحساب من قبل إدارة المتجر' };
        }

        if (staffUser.branchId && staffUser.branchId !== 'all') {
          setActiveBranchId(staffUser.branchId);
        }

        const defaultPerms = ROLE_PERMISSIONS_PRESETS[staffUser.role]?.permissions || DEFAULT_PERMISSIONS;
        const userSession = {
          ...staffUser,
          companyName: targetTenant.companyName || 'سوق ومحل الخضار والفواكه',
          tenantId: targetTenant.id,
          storeCode: targetTenant.storeCode || cleanStoreCode,
          permissions: staffUser.permissions ? { ...defaultPerms, ...staffUser.permissions } : { ...defaultPerms },
          isStaff: true
        };

        try {
          localStorage.setItem('khodar_remembered_username', cleanUser);
          localStorage.setItem('khodar_remembered_store_code', targetTenant.storeCode || cleanStoreCode);
        } catch (e) {}

        setCurrentUser(userSession);
        return { success: true, user: userSession };
      }

      // B) Check Owner of this Tenant
      if (targetTenant.username.toLowerCase() === cleanUser) {
        if (targetTenant.password !== password) {
          return { success: false, error: 'كلمة المرور غير صحيحة لحساب مالك المتجر' };
        }

        if (targetTenant.companyName && targetTenant.role !== 'super_admin') {
          setSettings(prev => ({ ...prev, shopName: targetTenant.companyName }));
        }

        const adminSession = {
          ...targetTenant,
          tenantId: targetTenant.id,
          storeCode: targetTenant.storeCode || cleanStoreCode,
          permissions: { ...ROLE_PERMISSIONS_PRESETS.admin.permissions }
        };

        try {
          localStorage.setItem('khodar_remembered_username', cleanUser);
          localStorage.setItem('khodar_remembered_store_code', targetTenant.storeCode || cleanStoreCode);
        } catch (e) {}

        setCurrentUser(adminSession);
        return { success: true, user: adminSession };
      }

      return { 
        success: false, 
        error: `المستخدم (${cleanUser}) غير مسجل في متجر (${targetTenant.companyName}) [كود: ${cleanStoreCode}]` 
      };
    }

    // 2. Global fallback if no Store Code provided:
    // First, check staff
    const matchingStaff = users.filter(u => u.username.toLowerCase() === cleanUser);
    if (matchingStaff.length > 1) {
      return { 
        success: false, 
        error: 'يوجد أكثر من متجر مسجل بهذا الاسم، يرجى كتابة كود المتجر (Store Code) لتحديد المنشأة التابع لها' 
      };
    }

    if (matchingStaff.length === 1) {
      const staffUser = matchingStaff[0];
      if (staffUser.password !== password) {
        return { success: false, error: 'كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى' };
      }
      if (staffUser.status === 'inactive') {
        return { success: false, error: 'تم تعطيل هذا الحساب من قبل إدارة المتجر' };
      }

      const parentTenant = tenants.find(t => t.id === staffUser.tenantId) || tenants[1];
      if (parentTenant && parentTenant.status === 'suspended') {
        return { success: false, error: 'تم تعليق اشتراك المتجر، يرجى مراجعة إدارة المنصة' };
      }

      if (staffUser.branchId && staffUser.branchId !== 'all') {
        setActiveBranchId(staffUser.branchId);
      }

      const defaultPerms = ROLE_PERMISSIONS_PRESETS[staffUser.role]?.permissions || DEFAULT_PERMISSIONS;
      const userSession = {
        ...staffUser,
        companyName: parentTenant?.companyName || 'سوق ومحل الخضار والفواكه',
        tenantId: staffUser.tenantId || parentTenant?.id || 'tenant-demo',
        storeCode: parentTenant?.storeCode || 'BRK-101',
        permissions: staffUser.permissions ? { ...defaultPerms, ...staffUser.permissions } : { ...defaultPerms },
        isStaff: true
      };

      try {
        localStorage.setItem('khodar_remembered_username', cleanUser);
        if (parentTenant?.storeCode) {
          localStorage.setItem('khodar_remembered_store_code', parentTenant.storeCode);
        }
      } catch (e) {}

      setCurrentUser(userSession);
      return { success: true, user: userSession };
    }

    // Fallback to Tenant / Owner accounts
    let target = tenants.find(t => t.username.toLowerCase() === cleanUser);
    if (!target && typeof window !== 'undefined') {
      try {
        const baseUrl = (window.location?.origin && window.location.origin.startsWith('http'))
          ? window.location.origin
          : 'https://khodar-pos.pages.dev';
        const res = await fetch(`${baseUrl}/api/tenants/lookup?username=${encodeURIComponent(cleanUser)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.tenant) {
            target = data.tenant;
            setTenants(prev => [target, ...prev.filter(t => t.id !== target.id)]);
            if (Array.isArray(data.users) && data.users.length > 0) {
              setUsers(prev => {
                const existingIds = new Set(data.users.map(u => u.id));
                return [...data.users, ...prev.filter(u => !existingIds.has(u.id))];
              });
            }
          }
        }
      } catch (e) {}
    }

    if (!target) {
      return { success: false, error: 'اسم المستخدم أو كود المتجر غير صحيح، يرجى التأكد من البيانات' };
    }

    if (target.password !== password) {
      return { success: false, error: 'كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى' };
    }

    if (target.status === 'suspended') {
      return { success: false, error: 'تم تعليق هذا الحساب مؤقتاً، يرجى التواصل مع إدارة المنصة', isSuspended: true };
    }

    if (target.role !== 'super_admin' && target.expiresAt) {
      const today = new Date().toISOString().split('T')[0];
      if (today > target.expiresAt) {
        return { 
          success: false, 
          error: `انتهت فترة اشتراك حسابكم بتاريخ ${target.expiresAt}. يرجى التواصل لتجديد الباقة ومتابعة العمل.`,
          isExpired: true,
          phone: target.phone
        };
      }
    }

    if (target.companyName && target.role !== 'super_admin') {
      setSettings(prev => ({ ...prev, shopName: target.companyName }));
    }

    const adminSession = {
      ...target,
      tenantId: target.id,
      storeCode: target.storeCode || 'BRK-101',
      permissions: { ...ROLE_PERMISSIONS_PRESETS.admin.permissions }
    };

    try {
      localStorage.setItem('khodar_remembered_username', cleanUser);
      if (target.storeCode) {
        localStorage.setItem('khodar_remembered_store_code', target.storeCode);
      }
    } catch (e) {}

    setCurrentUser(adminSession);
    return { success: true, user: adminSession };
  };

  const logout = () => {
    // Keep khodar_remembered_store_code and khodar_remembered_username in localStorage for fast password-only cashier login
    setCurrentUser(null);
  };

  const changePassword = (newPassword) => {
    if (!currentUser) return false;
    const cleanPass = (newPassword || '').trim();
    if (!cleanPass) return false;

    setTenants(prev => prev.map(t => t.id === currentUser.id ? { ...t, password: cleanPass } : t));
    setCurrentUser(prev => ({ ...prev, password: cleanPass }));
    return true;
  };

  const createTenantAccount = ({
    companyName,
    username,
    password,
    storeCode = '',
    phone = '',
    durationMonths = 12,
    allowedBranches = 1,
    notes = ''
  }) => {
    const cleanUser = (username || '').trim().toLowerCase();
    if (!cleanUser) throw new Error('يرجى كتابة اسم مستخدم ثابت للحساب');

    const existing = tenants.find(t => t.username.toLowerCase() === cleanUser);
    if (existing) throw new Error(`اسم المستخدم (${username}) مسجل مسبقاً، يرجى اختيار اسم مستخدم آخر`);

    // Determine unique Store Code
    let cleanStoreCode = (storeCode || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!cleanStoreCode) {
      let codeNum = 100 + tenants.length;
      while (tenants.some(t => (t.storeCode || '').toUpperCase() === `BRK-${codeNum}`)) {
        codeNum++;
      }
      cleanStoreCode = `BRK-${codeNum}`;
    } else {
      const codeExists = tenants.find(t => (t.storeCode || '').toUpperCase() === cleanStoreCode);
      if (codeExists) throw new Error(`كود المتجر (${cleanStoreCode}) مستخدم بالفعل لمتجر آخر، يرجى اختيار كود آخر`);
    }

    let expiresAt = '2099-12-31';
    if (Number(durationMonths) > 0) {
      const d = new Date();
      d.setMonth(d.getMonth() + Number(durationMonths));
      expiresAt = d.toISOString().split('T')[0];
    }

    const newTenant = {
      id: `tenant-${Date.now()}`,
      storeCode: cleanStoreCode,
      companyName: companyName.trim() || 'متجر مشترك جديد',
      username: cleanUser,
      password: password || '123456',
      role: 'company_owner',
      status: 'active',
      expiresAt,
      allowedBranches: Number(allowedBranches) || 1,
      phone: phone.trim(),
      notes: notes.trim(),
      createdAt: new Date().toISOString().split('T')[0]
    };

    setTenants(prev => [newTenant, ...prev]);

    // Asynchronously synchronize new tenant to Cloudflare D1 central database
    if (typeof window !== 'undefined') {
      const baseUrl = (window.location?.origin && window.location.origin.startsWith('http'))
        ? window.location.origin
        : 'https://khodar-pos.pages.dev';
      fetch(`${baseUrl}/api/tenants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTenant)
      }).catch(err => console.warn('Cloud tenant sync warning:', err));
    }

    return newTenant;
  };

  const updateTenantAccount = (tenantId, updates) => {
    // Validate uniqueness if username is being changed
    if (updates.username) {
      const cleanUser = updates.username.trim().toLowerCase();
      const existingUser = tenants.find(t => t.id !== tenantId && t.username.toLowerCase() === cleanUser);
      if (existingUser) {
        throw new Error(`اسم المستخدم (${updates.username}) مسجل مسبقاً لمشترك آخر`);
      }
    }

    // Validate uniqueness if storeCode is being changed
    if (updates.storeCode) {
      const cleanCode = updates.storeCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
      const existingCode = tenants.find(t => t.id !== tenantId && (t.storeCode || '').toUpperCase() === cleanCode);
      if (existingCode) {
        throw new Error(`كود المتجر (${updates.storeCode}) مسجل مسبقاً لمتجر آخر`);
      }
    }

    setTenants(prev => prev.map(t => {
      if (t.id === tenantId) {
        const updated = {
          ...t,
          ...updates,
          ...(updates.username ? { username: updates.username.trim().toLowerCase() } : {}),
          ...(updates.storeCode ? { storeCode: updates.storeCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '') } : {}),
          ...(updates.password ? { password: updates.password.trim() } : {}),
          ...(updates.companyName ? { companyName: updates.companyName.trim() } : {}),
          ...(updates.phone !== undefined ? { phone: updates.phone.trim() } : {}),
          ...(updates.notes !== undefined ? { notes: updates.notes.trim() } : {}),
          ...(updates.allowedBranches ? { allowedBranches: Number(updates.allowedBranches) || 1 } : {})
        };
        if (currentUser && currentUser.id === tenantId) {
          setCurrentUser(updated);
        }
        return updated;
      }
      return t;
    }));

    // Synchronize tenant updates to Cloudflare D1
    if (typeof window !== 'undefined') {
      const baseUrl = (window.location?.origin && window.location.origin.startsWith('http'))
        ? window.location.origin
        : 'https://khodar-pos.pages.dev';
      fetch(`${baseUrl}/api/tenants`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tenantId, ...updates })
      }).catch(err => console.warn('Cloud tenant update sync warning:', err));
    }
  };

  const deleteTenantAccount = (tenantId) => {
    if (tenantId === 'tenant-super-admin') {
      alert('لا يمكن حذف حساب مالك المنصة الرئيسي');
      return;
    }
    setTenants(prev => prev.filter(t => t.id !== tenantId));

    // Delete tenant from Cloudflare D1
    if (typeof window !== 'undefined') {
      const baseUrl = (window.location?.origin && window.location.origin.startsWith('http'))
        ? window.location.origin
        : 'https://khodar-pos.pages.dev';
      fetch(`${baseUrl}/api/tenants?id=${encodeURIComponent(tenantId)}`, {
        method: 'DELETE'
      }).catch(err => console.warn('Cloud tenant delete sync warning:', err));
    }
  };

  const resetPassword = (identifier, newPassword) => {
    const cleanId = (identifier || '').trim().toLowerCase();
    if (!cleanId || !newPassword) return false;

    setTenants(prev => prev.map(t => {
      const match = (t.email && t.email.toLowerCase() === cleanId) ||
                    (t.username && t.username.toLowerCase() === cleanId) ||
                    (t.phone && t.phone === cleanId) ||
                    (cleanId === 'amerfathi123@gmail.com' && t.role === 'super_admin');
      if (match) {
        return { ...t, password: newPassword };
      }
      return t;
    }));

    setUsers(prev => prev.map(u => {
      const match = (u.username && u.username.toLowerCase() === cleanId) ||
                    (u.phone && u.phone === cleanId);
      if (match) {
        return { ...u, password: newPassword };
      }
      return u;
    }));

    return true;
  };

  const adminResetTenantPassword = (tenantId, newPassword) => {
    if (!tenantId || !newPassword) return false;
    setTenants(prev => prev.map(t => {
      if (t.id === tenantId) {
        return { ...t, password: newPassword };
      }
      return t;
    }));
    return true;
  };

  // Staff Users & Permissions Management (إدارة المستخدمين والموظفين والصلاحيات)
  const hasPermission = (permissionKey) => {
    if (!currentUser) return false;
    if (currentUser.role === 'super_admin' || currentUser.role === 'company_owner' || currentUser.role === 'admin') {
      return true;
    }
    return Boolean(currentUser?.permissions?.[permissionKey]);
  };

  const addUser = ({ name, username, password, role = 'cashier', branchId = 'all', permissions, phone = '' }) => {
    const cleanUser = (username || '').trim().toLowerCase();
    if (!cleanUser) throw new Error('يرجى إدخال اسم مستخدم صحيح');
    if (!name || !name.trim()) throw new Error('يرجى إدخال الاسم الكامل للمستخدم');

    const activeTenantId = currentUser?.tenantId || 'tenant-demo';

    // Check duplicate username within same tenant
    const duplicate = users.some(u => u.tenantId === activeTenantId && u.username.toLowerCase() === cleanUser);
    if (duplicate) throw new Error(`اسم المستخدم (${username}) مسجل مسبقاً لموظف آخر في متجركم`);

    const defaultPerms = ROLE_PERMISSIONS_PRESETS[role]?.permissions || DEFAULT_PERMISSIONS;

    const newUser = {
      id: `user-${Date.now()}`,
      tenantId: activeTenantId,
      name: name.trim(),
      username: cleanUser,
      password: password || '123456',
      role,
      branchId: branchId || 'all',
      phone: phone.trim(),
      status: 'active',
      permissions: permissions ? { ...defaultPerms, ...permissions } : { ...defaultPerms },
      createdAt: getCurrentDateFormatted()
    };

    setUsers(prev => [newUser, ...prev]);

    // Record sync mutation for Cloudflare Edge
    try {
      cloudflareSync.recordMutation(activeTenantId, branchId, 'user', newUser.id, 'create', newUser);
    } catch (e) {
      console.warn('Sync user failed:', e);
    }

    return newUser;
  };

  const updateUser = (userId, updates) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = { ...u, ...updates };
        if (currentUser && currentUser.id === userId) {
          setCurrentUser(prevUser => ({ ...prevUser, ...updated }));
        }
        return updated;
      }
      return u;
    }));

    const activeTenantId = currentUser?.tenantId || 'tenant-demo';
    try {
      cloudflareSync.recordMutation(activeTenantId, updates.branchId || null, 'user', userId, 'update', updates);
    } catch (e) {
      console.warn('Sync user failed:', e);
    }
  };

  const deleteUser = (userId) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    if (target.id === currentUser?.id) {
      throw new Error('لا يمكنك حذف الحساب الذي قمت بتسجيل الدخول به حالياً');
    }

    setUsers(prev => prev.filter(u => u.id !== userId));

    const activeTenantId = currentUser?.tenantId || 'tenant-demo';
    try {
      cloudflareSync.recordMutation(activeTenantId, null, 'user', userId, 'delete', { id: userId });
    } catch (e) {
      console.warn('Sync user failed:', e);
    }
  };

  // Multi-Branch Actions (نظام إدارة الفروع المتعددة ومناقلات المخزون)
  const activeBranch = branches.find(b => b.id === activeBranchId) || branches[0] || {
    id: 'branch-main',
    name: 'الفرع الرئيسي (السوق المركزي)',
    code: 'BR-01',
    isMain: true
  };

  const changeActiveBranch = (branchId) => {
    if (branches.some(b => b.id === branchId)) {
      setActiveBranchId(branchId);
    }
  };

  const addBranch = (branchData) => {
    // Check allowed branches limit for tenant
    let allowed = 1;
    if (currentUser?.role === 'super_admin') {
      allowed = 999;
    } else {
      const parentTenant = tenants.find(t => t.id === currentUser?.tenantId || t.id === currentUser?.id);
      allowed = Number(parentTenant?.allowedBranches || currentUser?.allowedBranches || 1);
    }

    if (branches.length >= allowed) {
      throw new Error(`لقد وصلت للحد الأقصى المسموح لخطة اشتراك متجرك (${allowed} ${allowed > 1 ? 'فروع' : 'فرع'}). يرجى التواصل مع إدارة المنظومة لترقية الخطة وإضافة فروع أخرى.`);
    }

    const newBranch = {
      id: `branch-${Date.now()}`,
      tenantId: currentUser?.id || 'tenant-demo',
      name: (branchData.name || '').trim() || `فرع ${branches.length + 1}`,
      code: (branchData.code || '').trim() || `BR-${String(branches.length + 1).padStart(2, '0')}`,
      phone: (branchData.phone || '').trim(),
      address: (branchData.address || '').trim(),
      managerName: (branchData.managerName || '').trim(),
      isMain: branches.length === 0,
      status: 'active',
      createdAt: getCurrentDateFormatted()
    };

    setBranches(prev => [...prev, newBranch]);
    return newBranch;
  };

  const updateBranch = (branchId, updates) => {
    setBranches(prev => prev.map(b => b.id === branchId ? { ...b, ...updates } : b));
  };

  const deleteBranch = (branchId) => {
    const target = branches.find(b => b.id === branchId);
    if (!target) return;
    if (target.isMain) {
      alert('لا يمكن حذف الفرع الرئيسي. يمكنك تعيين فرع آخر كرئيسي أولاً.');
      return;
    }
    const hasInvoices = invoices.some(i => i.branchId === branchId);
    if (hasInvoices) {
      const confirmDeact = window.confirm('هذا الفرع مسجل عليه فواتير ومبيعات سابقة. هل ترغب في تعطيل الفرع بدلاً من حذفه نهائياً للحفاظ على السجلات المالية والتقارير؟');
      if (confirmDeact) {
        updateBranch(branchId, { status: 'inactive' });
      }
      return;
    }
    setBranches(prev => prev.filter(b => b.id !== branchId));
    if (activeBranchId === branchId) {
      const mainB = branches.find(b => b.isMain) || branches[0];
      setActiveBranchId(mainB?.id || 'branch-main');
    }
  };

  const setMainBranch = (branchId) => {
    setBranches(prev => prev.map(b => ({
      ...b,
      isMain: b.id === branchId
    })));
  };

  const transferStockBetweenBranches = ({ fromBranchId, toBranchId, productId, productName, quantityKg, notes = '' }) => {
    const numQty = Math.round(Number(quantityKg) * 100) / 100;
    if (!numQty || numQty <= 0) throw new Error('يرجى إدخال وزن صحيح للمناقلة');
    if (fromBranchId === toBranchId) throw new Error('لا يمكن مناقلة المخزون لنفس الفرع');

    const fromB = branches.find(b => b.id === fromBranchId);
    const toB = branches.find(b => b.id === toBranchId);
    if (!fromB || !toB) throw new Error('الفرع المصدر أو المستلم غير موجود');

    // Update product branchStock
    setProducts(prev => prev.map(p => {
      const isMatch = (productId && p.id === productId) || (p.name.trim() === (productName || '').trim());
      if (isMatch) {
        const curBStock = p.branchStock || {};
        const totalStock = Number(p.currentStockKg) || 0;
        const fromStock = Number(curBStock[fromBranchId] !== undefined ? curBStock[fromBranchId] : totalStock);
        const toStock = Number(curBStock[toBranchId] !== undefined ? curBStock[toBranchId] : 0);

        const newFromStock = Math.round((fromStock - numQty) * 100) / 100;
        const newToStock = Math.round((toStock + numQty) * 100) / 100;

        return {
          ...p,
          branchStock: {
            ...curBStock,
            [fromBranchId]: newFromStock,
            [toBranchId]: newToStock
          }
        };
      }
      return p;
    }));

    const transferRecord = {
      id: `trans-${Date.now()}`,
      fromBranchId,
      fromBranchName: fromB.name,
      toBranchId,
      toBranchName: toB.name,
      productId,
      productName,
      quantityKg: numQty,
      notes,
      date: getCurrentDateFormatted(),
      time: getCurrentTimeFormatted(),
      timestamp: Date.now()
    };

    setStockTransfers(prev => [transferRecord, ...prev]);
    return transferRecord;
  };

  // 1-Month Trial Requests Management (طلبات التجربة المجانية)
  const addTrialRequest = (req) => {
    const newReq = {
      id: `trial-${Date.now()}`,
      name: (req.name || '').trim(),
      shopName: (req.shopName || '').trim(),
      phone: (req.phone || '').trim(),
      city: (req.city || '').trim(),
      notes: (req.notes || '').trim(),
      status: 'pending', // 'pending' | 'activated' | 'rejected'
      createdAt: getCurrentDateFormatted(),
      timestamp: Date.now()
    };
    setTrialRequests(prev => [newReq, ...prev]);
    return newReq;
  };

  const updateTrialRequest = (id, patch) => {
    setTrialRequests(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  };

  const deleteTrialRequest = (id) => {
    setTrialRequests(prev => prev.filter(r => r.id !== id));
  };

  return {
    trialRequests,
    addTrialRequest,
    updateTrialRequest,
    deleteTrialRequest,
    tenants,
    setTenants,
    syncCloudTenants,
    currentUser,
    branches,
    activeBranchId,
    activeBranch,
    stockTransfers,
    changeActiveBranch,
    addBranch,
    updateBranch,
    deleteBranch,
    setMainBranch,
    transferStockBetweenBranches,
    login,
    logout,
    changePassword,
    resetPassword,
    adminResetTenantPassword,
    createTenantAccount,
    updateTenantAccount,
    deleteTenantAccount,
    users,
    addUser,
    updateUser,
    deleteUser,
    hasPermission,
    products,
    customers,
    invoices,
    expenses,
    expenseCategories,
    settings,
    damagedItems,
    workers,
    workerTransactions,
    customerPayments,
    purchases,
    suppliers,
    supplierPayments,
    salesReturns,
    purchaseReturns,
    partners,
    partnerDrawings,
    profitDistributions,
    addProduct,
    updateProduct,
    updateProductPrice,
    deleteProduct,
    addCustomer,
    updateCustomer,
    recordCustomerPayment,
    deleteCustomerPayment,
    saveInvoice,
    updateInvoiceNotes,
    voidInvoice,
    deleteInvoice,
    recordSalesReturn,
    deleteSalesReturn,
    addExpense,
    deleteExpense,
    addExpenseCategory,
    deleteExpenseCategory,
    addDamagedItem,
    deleteDamagedItem,
    addWorker,
    updateWorker,
    deleteWorker,
    addWorkerTransaction,
    deleteWorkerTransaction,
    addPurchase,
    deletePurchase,
    recordPurchaseReturn,
    deletePurchaseReturn,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    recordSupplierPayment,
    deleteSupplierPayment,
    addPartner,
    updatePartner,
    deletePartner,
    recordPartnerDrawing,
    deletePartnerDrawing,
    recordProfitDistribution,
    deleteProfitDistribution,
    getFinancialPosition,
    updateSettings,
    resetToSampleData,
    syncService: cloudflareSync,
    exportBackupJSON,
    importBackupJSON
  };
}

