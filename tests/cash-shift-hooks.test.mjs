import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { seedAggregate } from './aggregate-fixture.mjs';
import { accountingDate } from '../src/services/cashShiftEngine.js';

const locks = globalThis.navigator.locks;
const storage = () => ({ values: new Map(),
  getItem(key) { return this.values.get(key) ?? null; },
  setItem(key, value) { this.values.set(key, String(value)); },
  removeItem(key) { this.values.delete(key); }, clear() { this.values.clear(); },
  key(index) { return [...this.values.keys()][index] ?? null; },
  get length() { return this.values.size; } });

const openShift = () => ({ id: 'shift-1', tenantId: 'A', branchId: 'branch-main', drawerId: 'drawer-1',
  actorId: 'u', offlineDeviceId: 'device-1', timeZone: 'Asia/Riyadh', accountingDate: accountingDate(new Date().toISOString(), 'Asia/Riyadh'),
  openedAt: new Date().toISOString(), openingCash: 100, events: [], status: 'open' });

test('a cash expense attributes to the open shift and appends its journal entry atomically', async () => {
  const target = storage();
  seedAggregate(target, { id: 'u', tenantId: 'A' }, { cash_shifts_v1: [openShift()] });
  globalThis.localStorage = target;
  globalThis.sessionStorage = storage();
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { onLine: false, locks } });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { addEventListener() {}, removeEventListener() {}, location: { origin: 'https://test.invalid' } } });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { addEventListener() {}, removeEventListener() {}, visibilityState: 'hidden' } });
  const bundle = await build({ stdin: { contents: "export {useAppStore} from './src/store/useAppStore.js';export {setSessionToken,setSessionUser} from './src/services/authSession.js';", resolveDir: process.cwd() },
    bundle: true, write: false, define: { 'import.meta.env': '{}' }, format: 'cjs', platform: 'node', external: ['react', 'react-test-renderer'] });
  const loaded = { exports: {} };
  new Function('require', 'module', 'exports', bundle.outputFiles[0].text)(createRequire(import.meta.url), loaded, loaded.exports);
  const { useAppStore, setSessionToken, setSessionUser } = loaded.exports;
  let app, root;
  function Harness() { app = useAppStore(); return null; }
  try {
    setSessionToken('test');
    setSessionUser({ id: 'u', tenantId: 'A', role: 'company_owner', branchId: 'branch-main', branchIds: ['branch-main'], sessionExpiresAt: new Date(Date.now() + 60000).toISOString() });
    await act(async () => { root = TestRenderer.create(React.createElement(Harness)); await Promise.resolve(); });
    await act(async () => { app.addExpense({ id: 'e1', title: 'Rent', amount: 12, paymentMethod: 'cash' }); });
    const expense = app.expenses.find(item => item.id === 'e1');
    assert.equal(expense.cashShiftId, 'shift-1');
    assert.equal(app.cashShifts[0].events.length, 1);
    assert.equal(app.cashShifts[0].events[0].amount, -12);
  } finally {
    await act(async () => { root?.unmount(); });
    delete globalThis.window;
    delete globalThis.document;
  }
});
