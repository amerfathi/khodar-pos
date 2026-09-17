export const formatCurrency = (amount, currency = 'د.ل') => {
  const val = Number(amount) || 0;
  return `${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
};

export const formatNumber = (num, decimals = 2) => {
  const val = Number(num) || 0;
  return val.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

export const formatWeight = (kg, decimals = 2) => {
  const val = Number(kg) || 0;
  return `${val.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} كجم`;
};

export const padInvoiceNumber = (num) => {
  return String(num).padStart(6, '0');
};

export const getCurrentDateFormatted = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const getCurrentTimeFormatted = () => {
  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'م' : 'ص';
  hours = hours % 12;
  hours = hours ? hours : 12; // 12 instead of 0
  return `${hours}:${minutes} ${ampm}`;
};
