import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CloudflareSyncService } from '../src/services/cloudflareSync.js';
import { setSessionToken, setSessionUser } from '../src/services/authSession.js';

const memoryStorage = () => {
  const rows = new Map();
  return {
    getItem: key => rows.get(key) ?? null,
    setItem: (key, value) => { rows.set(key, String(value)); },
    removeItem: key => { rows.delete(key); },
    clear: () => rows.clear(), key: index => [...rows.keys()][index] ?? null,
    get length() { return rows.size; }
  };
};

test('server acceptance waits for durable outbox acknowledgement before sync success', async () => {
  const oldSession = globalThis.sessionStorage, oldFetch = globalThis.fetch;
  globalThis.sessionStorage = memoryStorage();
  setSessionToken('fixture-token');
  setSessionUser({ id: 'owner', tenantId: 'test-tenant', sessionExpiresAt: new Date(Date.now() + 60_000).toISOString() });
  const event = { id: 'sale-event', tenantId: 'test-tenant', entityType: 'invoice', entityId: 'sale', action: 'create', payload: { id: 'sale' } };
  const outbox = [event];
  let acknowledge, attempts = 0;
  const service = new CloudflareSyncService();
  service.isOnline = true;
  service.currentTenantId = 'test-tenant';
  service.pullUpdates = async () => 0;
  service.repository = {
    durable: {}, current: { outbox },
    acknowledgeDurable: ids => {
      attempts++;
      return new Promise((resolve, reject) => { acknowledge = { resolve: () => { outbox.splice(0, outbox.length); resolve(undefined); }, reject }; });
    }
  };
  const statuses = [];
  service.subscribe(item => statuses.push(item.status));
  globalThis.fetch = async () => Response.json({ success: true, acceptedIds: ['sale-event'] });
  try {
    const first = service.flushQueue();
    for (let i = 0; i < 20 && !acknowledge; i++) await new Promise(resolve => setTimeout(resolve, 0));
    assert.ok(acknowledge, 'server acknowledgement reached the durable repository');
    assert.equal(service.isSyncing, true);
    assert.deepEqual(outbox.map(item => item.id), ['sale-event']);
    assert.equal(statuses.includes('synced_batch'), false);
    acknowledge.reject(new Error('Injected durable acknowledgement failure'));
    await first;
    assert.equal(service.lastError, 'Injected durable acknowledgement failure');
    assert.deepEqual(outbox.map(item => item.id), ['sale-event']);
    assert.equal(statuses.includes('synced_batch'), false);

    acknowledge = null;
    const retry = service.flushQueue();
    for (let i = 0; i < 20 && !acknowledge; i++) await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(attempts, 2);
    acknowledge.resolve();
    await retry;
    assert.deepEqual(outbox, []);
    assert.equal(service.lastError, null);
    assert.equal(statuses.filter(status => status === 'synced_batch').length, 1);
  } finally {
    globalThis.fetch = oldFetch;
    globalThis.sessionStorage = oldSession;
  }
});

test('incomplete or unrelated server acknowledgement never clears an aggregate event', async () => {
  const oldSession = globalThis.sessionStorage, oldFetch = globalThis.fetch;
  globalThis.sessionStorage = memoryStorage();
  setSessionToken('fixture-token');
  setSessionUser({ id: 'owner', tenantId: 'test-tenant', sessionExpiresAt: new Date(Date.now() + 60_000).toISOString() });
  const event = { id: 'sale-event', tenantId: 'test-tenant', entityType: 'invoice', entityId: 'sale', action: 'create', payload: { id: 'sale' } };
  let acknowledged = 0;
  const service = new CloudflareSyncService();
  service.isOnline = true;
  service.currentTenantId = 'test-tenant';
  service.repository = { current: { outbox: [event] }, acknowledge: () => { acknowledged++; } };
  const statuses = [];
  service.subscribe(item => statuses.push(item.status));
  try {
    for (const ids of [[], ['unrelated-event'], ['sale-event', 'unexpected-event']]) {
      globalThis.fetch = async () => Response.json({ success: true, acceptedIds: ids });
      await service.flushQueue();
      assert.match(service.lastError, /incomplete or unrelated/);
      assert.equal(acknowledged, 0);
      assert.deepEqual(service.repository.current.outbox, [event]);
    }
    assert.equal(statuses.includes('synced_batch'), false);
  } finally {
    globalThis.fetch = oldFetch;
    globalThis.sessionStorage = oldSession;
  }
});

test('causal conflict remains visible, retains local outbox and blocks inbound overwrite', async () => {
  const oldSession=globalThis.sessionStorage,oldFetch=globalThis.fetch;
  globalThis.sessionStorage=memoryStorage();setSessionToken('fixture-token');
  setSessionUser({id:'owner',tenantId:'test-tenant',sessionExpiresAt:new Date(Date.now()+60000).toISOString()});
  const event={id:'stale-sale',tenantId:'test-tenant',entityType:'invoice',entityId:'sale',action:'create',payload:{id:'sale'}};
  let pulls=0,acknowledged=0;const statuses=[];
  const service=new CloudflareSyncService();service.isOnline=true;service.currentTenantId='test-tenant';
  service.repository={current:{outbox:[event]},acknowledge:()=>{acknowledged++;}};
  service.pullUpdates=async()=>{pulls++;return 1;};service.subscribe(state=>statuses.push(state));
  globalThis.fetch=async()=>Response.json({error:'Stale multi-device mutation'},{status:409});
  try {
    const result=await service.syncNow('test-tenant');
    assert.equal(result.success,false);assert.equal(pulls,0);assert.equal(acknowledged,0);
    assert.deepEqual(service.repository.current.outbox,[event]);
    assert.match(service.lastError,/تعارض بين جهازين/);
    assert.equal(statuses.at(-1).status,'error');
  } finally {globalThis.fetch=oldFetch;globalThis.sessionStorage=oldSession;}
});

test('manual sync does not claim success when outbound queue is still pending', async () => {
  const oldSession=globalThis.sessionStorage;
  globalThis.sessionStorage=memoryStorage();setSessionToken('fixture-token');
  const service=new CloudflareSyncService();service.isOnline=true;service.currentTenantId='test-tenant';
  const event={id:'pending',tenantId:'test-tenant',entityType:'invoice',entityId:'sale'};
  service.repository={current:{outbox:[event]}};
  let pulls=0;service.flushQueue=async()=>false;service.pullUpdates=async()=>{pulls++;return 0;};
  try {
    const result=await service.syncNow('test-tenant');
    assert.equal(result.success,false);
    assert.match(result.error,/لم تكتمل مزامنة/);
    assert.equal(pulls,0);
    assert.deepEqual(service.repository.current.outbox,[event]);
  } finally {globalThis.sessionStorage=oldSession;}
});

test('manual sync waits for inbound application after a complete outbound flush', async () => {
  const oldSession=globalThis.sessionStorage;
  globalThis.sessionStorage=memoryStorage();setSessionToken('fixture-token');
  const service=new CloudflareSyncService();service.isOnline=true;service.currentTenantId='test-tenant';
  let finishPull,settled=false,pullCalls=0;
  service.flushQueue=async options=>{assert.equal(options.pullAfterFlush,false);return true;};
  service.pullUpdates=()=>{pullCalls++;return new Promise(resolve=>{finishPull=resolve;});};
  try {
    const pending=service.syncNow('test-tenant').then(result=>{settled=true;return result;});
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(pullCalls,1);assert.equal(settled,false);
    finishPull(2);
    assert.deepEqual(await pending,{success:true,pulledCount:2});
  } finally {globalThis.sessionStorage=oldSession;}
});
