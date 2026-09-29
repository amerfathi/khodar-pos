// The UUID-bearing id is the immutable sync identity. The human-facing number
// remains short and may repeat across branches, so show the branch beside it.
export function displayInvoiceNumber(invoice) {
  const number = Number(invoice?.invoiceNumber);
  if (Number.isSafeInteger(number) && number > 0)
    return String(number).padStart(6, '0');
  return String(invoice?.id || '');
}
