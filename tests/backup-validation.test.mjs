import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BACKUP_ARRAY_FIELDS, validateBackup } from '../src/services/backupValidation.js';
const fixture = () => ({ version: 4, tenantId: 'A', syncCursor: 0, settings: {},
  ...Object.fromEntries(BACKUP_ARRAY_FIELDS.map(key => [key, []])),
  branches:[{id:'main',tenantId:'A'}],activeBranchId:'main' });
test('complete tenant snapshot is accepted without mutation', () => {
  const data = fixture(), before = structuredClone(data);
  assert.equal(validateBackup(data, 'A'), data); assert.deepEqual(data, before);
});
test('foreign, missing-identity, old and partial backups fail closed', () => {
  for (const change of [{ tenantId: 'B' }, { tenantId: undefined }, { version: 3 }, { syncCursor: undefined },
    { purchases: undefined },{branches:[]},{activeBranchId:'missing'}])
    assert.throws(() => validateBackup({ ...fixture(), ...change }, 'A'));
});
test('nested foreign ownership, credentials and duplicate identities are rejected', () => {
  for (const products of [[{ id: 'p', tenantId: 'B' }], [{ id: 'p', password: 'placeholder' }], [{ id: 'p' }, { id: 'p' }]])
    assert.throws(() => validateBackup({ ...fixture(), products }, 'A'));
});
test('orphan receipts cannot be restored without their customer', () => {
  const data = { ...fixture(), customerPayments: [{ id: 'receipt', customerId: 'missing' }] };
  assert.throws(() => validateBackup(data, 'A'));
  Reflect.set(data, 'customers', [{ id: 'missing' }]); assert.equal(validateBackup(data, 'A'), data);
});
test('business relationships, branches and monetary values fail closed', () => {
  const cases = [
    { products:[{id:'p'}], invoices:[{id:'i',items:[{productId:'missing'}]}] },
    { products:[{id:'p'}], suppliers:[{id:'s'}], purchases:[{id:'buy',productId:'missing',supplierId:'s'}] },
    { products:[{id:'p'}], branches:[{id:'main',tenantId:'A'}], stockTransfers:[{id:'move',productId:'p',fromBranchId:'main',toBranchId:'missing',quantityKg:1}] },
    { products:[{id:'p',costPerKg:'not-money'}] },
    { partners:[{id:'partner'}], profitDistributions:[{id:'distribution',shares:[{partnerId:'missing',netPayout:1}]}] }
  ];
  for (const change of cases) assert.throws(() => validateBackup({ ...fixture(), ...change }, 'A'));
});
