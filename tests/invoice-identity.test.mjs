import assert from 'node:assert/strict';
import test from 'node:test';
import { displayInvoiceNumber } from '../src/services/invoiceIdentity.js';

test('invoice display number does not expose the immutable sync id', () => {
  const invoice = { id: '000001-386c2d5a-3d67-4029-85a7-2856210b3b51', invoiceNumber: 1 };
  assert.equal(displayInvoiceNumber(invoice), '000001');
  assert.equal(invoice.id, '000001-386c2d5a-3d67-4029-85a7-2856210b3b51');
});

test('legacy invoices without a display number retain their original id', () => {
  assert.equal(displayInvoiceNumber({ id: 'OLD-42' }), 'OLD-42');
  assert.equal(displayInvoiceNumber({ id: 'OLD-42', invoiceNumber: 0 }), 'OLD-42');
});
