import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { build } from 'esbuild';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { AtomicStore } from '../src/services/atomicStore.js';
import { scopedStorageKey } from '../src/services/tenantStorage.js';
import { verifyCloudCheckpoint } from '../src/services/legacyMigrationAudit.js';
import { INITIAL_BRANCHES } from '../src/data/initialData.js';
import { hashPassword } from '../functions/_lib/passwords.js';
import legacyReset from '../scripts/prepare-legacy-reset.cjs';
import { attachConflictPreconditions, conflictKeysForEvent, SYNC_HEADS_STATE_KEY } from '../src/services/syncConflictPolicy.js';

const memoryStorage = () => ({ items: new Map(),
  getItem(key) { return this.items.get(key) ?? null; },
  setItem(key,value) { this.items.set(key,String(value)); },
  removeItem(key) { this.items.delete(key); }, clear() { this.items.clear(); },
  key(index) { return [...this.items.keys()][index] ?? null; },
  get length() { return this.items.size; }
});

let mf, db, a, b, staff, platform;
const pass = crypto.randomUUID() + 'Aa!'; // ephemeral fixture, never production credentials
async function call(path, method = 'GET', body, token, ip = 'local') {
  if (path === '/api/sync/push' && method === 'POST' && Array.isArray(body?.events) && db) {
    const heads=new Map();
    for (const event of body.events) {
      if (event.conflictPolicyVersion === 1) continue;
      const keys=conflictKeysForEvent(event);
      const preconditions={};
      for (const key of keys) {
        if (!heads.has(key)) heads.set(key,(await db.prepare(
          'SELECT last_event_id FROM sync_conflict_heads WHERE tenant_id = ? AND conflict_key = ?'
        ).bind(body.tenantId,key).first())?.last_event_id ?? null);
        preconditions[key]=heads.get(key); heads.set(key,event.id);
      }
      event.conflictPolicyVersion=1; event.preconditions=preconditions;
    }
  }
  return mf.dispatchFetch('https://test.invalid' + path, { method,
    headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}) });
}
async function login(code, username, password = pass, ip = 'local') {
  const response = await call('/api/tenants/lookup', 'POST', { storeCode: code, username, password }, undefined, ip);
  const body = await response.json();
  assert.equal(response.status, 200, JSON.stringify(body));
  assert.ok(body.session.token);
  assert.equal(JSON.stringify(body).includes(password), false);
  return body.session.token;
}
before(async () => {
  const bundle = await build({ entryPoints: ['tests/runtime-worker.js'], bundle: true, write: false, format: 'esm', platform: 'browser', target: 'es2022' });
  mf = new Miniflare(convertV4MiniflareOptions({ workers: [{ name: 'test', modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2024-09-01',
    d1Databases: ['DB', 'BOOTSTRAP', 'LEGACY'], bindings: { AUTH_SECRET: crypto.randomUUID() + crypto.randomUUID() } }] }));
  db = await mf.getD1Database('DB');
  for (const name of (await readdir('d1/migrations')).filter(n => n.endsWith('.sql')).sort()) {
    const sql = (await readFile('d1/migrations/' + name, 'utf8')).replace(/--[^\n]*/g, '');
    // Preserve trigger BEGIN...END bodies as single statements.
    const statements = sql.match(/\s*CREATE TRIGGER[\s\S]*?END;|[^;]+;/gi) || [];
    for (const statement of statements) {
      if (statement.trim()) {
        try { await db.prepare(statement).run(); } catch (err) { throw new Error(name + ': ' + statement.slice(0,100), { cause: err }); }
      }
    }
  }
  const hashed = await hashPassword(pass);
  for (const id of ['A','B']) await db.prepare('INSERT INTO tenants (id,store_code,company_name,username,password_hash,status,role) VALUES (?,?,?,?,?,?,?)')
    .bind(id, id, 'Fixture ' + id, 'owner' + id, hashed, 'active', 'company_owner').run();
  await db.prepare("UPDATE tenants SET allowed_branches = 10 WHERE id = 'A'").run();
  await db.prepare("INSERT INTO branches (id,tenant_id,name,code,is_main,status) VALUES ('fixture-a-main','A','Fixture main','MAIN',1,'active')").run();
  await db.prepare('INSERT INTO tenants (id,store_code,company_name,username,password_hash,status,role) VALUES (?,?,?,?,?,?,?)')
    .bind('PLATFORM','PLATFORM','Platform fixture','platform',hashed,'active','super_admin').run();
  await db.prepare("INSERT INTO users (id,tenant_id,name,username,password_hash,role,status,permissions_json) VALUES ('staff','A','Cashier','cashier',?,'cashier','active','{}')").bind(hashed).run();
  a = await login('A','ownerA'); b = await login('B','ownerB'); staff = await login('A','cashier'); platform = await login('PLATFORM','platform');
});
after(async () => { await mf?.dispose(); });

test('schema bootstrap and numbered migrations produce identical database structures', async () => {
  const bootstrap=await mf.getD1Database('BOOTSTRAP');
  const sql=(await readFile('d1/schema.sql','utf8')).replace(/--[^\n]*/g,'');
  for(const statement of sql.match(/\s*CREATE TRIGGER[\s\S]*?END;|[^;]+;/gi) || []) {
    if(statement.trim()) await bootstrap.prepare(statement).run();
  }
  const schema="SELECT type,name,tbl_name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY type,name";
  const normalize=result=>result.results.map(row=>({...row,sql:row.sql?.replace(/\s+/g,' ').trim()}));
  assert.deepEqual(normalize(await bootstrap.prepare(schema).all()),normalize(await db.prepare(schema).all()));
});
test('sync sequence migration preserves events from the preceding schema', async () => {
  const legacy=await mf.getD1Database('LEGACY');
  for(const name of (await readdir('d1/migrations')).filter(n=>/^000[1-4]_/.test(n)).sort()) {
    const sql=(await readFile('d1/migrations/'+name,'utf8')).replace(/--[^\n]*/g,'');
    for(const statement of sql.match(/\s*CREATE TRIGGER[\s\S]*?END;|[^;]+;/gi) || []) if(statement.trim()) await legacy.prepare(statement).run();
  }
  await legacy.prepare("INSERT INTO tenants(id,company_name,username,password_hash) VALUES('legacy','Fixture','legacy','disabled-fixture')").run();
  await legacy.prepare("INSERT INTO sync_events(id,tenant_id,entity_type,entity_id,action,payload_json,client_timestamp,server_timestamp) VALUES('legacy-event','legacy','product','p','create','{}',1,1)").run();
  const sql=(await readFile('d1/migrations/0005_sync_sequence.sql','utf8')).replace(/--[^\n]*/g,'');
  for(const statement of sql.split(';')) if(statement.trim()) await legacy.prepare(statement).run();
  assert.equal((await legacy.prepare("SELECT COUNT(*) AS n FROM sync_events").first()).n,1);
  const migrated=await legacy.prepare("SELECT id,payload_json,sequence FROM sync_events_v2").first();
  assert.deepEqual(migrated,{id:'legacy-event',payload_json:'{}',sequence:1});
});
test('missing authentication is denied on all protected routes', async () => {
  for (const [path, method] of [['/api/users?tenantId=A','GET'], ['/api/users','POST'], ['/api/tenants','GET'], ['/api/sync/push','POST'], ['/api/sync/pull?tenantId=A','GET'], ['/api/branches?tenantId=A','GET'], ['/api/backup?tenantId=A','GET'], ['/api/backup','POST'], ['/api/trial-requests','GET'], ['/api/trial-requests?id=x','DELETE'], ['/api/releases','POST']]) {
    assert.equal((await call(path,method, method === 'POST' ? {} : undefined)).status,401,path);
  }
});
test('cross-tenant identifiers are rejected for reads and writes', async () => {
  for (const path of ['/api/users?tenantId=B','/api/backup?tenantId=B','/api/sync/pull?tenantId=B','/api/branches?tenantId=B']) assert.equal((await call(path,'GET',undefined,a)).status,403,path);
  assert.equal((await call('/api/sync/push','POST',{tenantId:'B',events:[]},a)).status,403);
  assert.equal((await call('/api/backup','POST',{tenantId:'B',snapshot:{}},a)).status,403);
});
test('cashier cannot administer users, backups, trials, or releases', async () => {
  assert.equal((await call('/api/users?tenantId=A','GET',undefined,staff)).status,403);
  assert.equal((await call('/api/backup?tenantId=A','GET',undefined,staff)).status,403);
  assert.equal((await call('/api/trial-requests','GET',undefined,staff)).status,403);
  assert.equal((await call('/api/releases','POST',{},staff)).status,403);
});
test('tenant administrator cannot manufacture a platform administrator', async () => {
  const r = await call('/api/users','POST',{tenantId:'A', name:'Escalation',username:'attacker',password:pass,role:'super_admin'},a);
  assert.equal(r.status,400);
  assert.equal(await db.prepare("SELECT id FROM users WHERE username = 'attacker'").first(),null);
});
test('sync retries are idempotent and changed retries conflict', async () => {
  const event = { id:'evt-fixture-1',entityType:'product',entityId:'p1',action:'create',payload:{id:'p1',tenantId:'A',name:'Fixture'}};
  const body = {tenantId:'A',events:[event]};
  for (let i=0;i<2;i++) assert.equal((await call('/api/sync/push','POST',body,a)).status,200);
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM sync_events_v2').first()).n,1);
  assert.equal((await call('/api/sync/push','POST',{tenantId:'A',events:[{...event,payload:{...event.payload,name:'changed'}}]},a)).status,409);
  assert.equal((await call('/api/sync/pull?tenantId=B','GET',undefined,b).then(r=>r.json())).events.length,0);
});
test('legacy checkpoint audit requires full-tenant server visibility and every applied prefix event', async () => {
  const fetchPage = token => async ({tenantId,cursor,limit}) => {
    const response=await call(`/api/sync/pull?tenantId=${encodeURIComponent(tenantId)}&cursor=${cursor}&limit=${limit}`,'GET',undefined,token);
    assert.equal(response.status,200);
    return response.json();
  };
  const first=await fetchPage(a)({tenantId:'A',cursor:0,limit:500});
  assert.equal(first.fullTenantVisibility,true);
  assert.ok(first.events.length>0);
  const fetchBranches = token => async ({tenantId}) => {
    const response=await call(`/api/branches?tenantId=${encodeURIComponent(tenantId)}`,'GET',undefined,token);
    assert.equal(response.status,200);
    return response.json();
  };
  const manifest=await fetchBranches(a)({tenantId:'A'});
  assert.equal(manifest.latestSequence,first.nextCursor);
  assert.equal(manifest.branches.length,1);
  const recordsFor = type => first.events
    .filter(event => event.entityType === type && event.action === 'create')
    .map(event => event.payload);
  const snapshot={identity:{id:'ownerA',tenantId:'A'},cursor:first.nextCursor,
    applied:Object.fromEntries(first.events.map(event=>[event.id,true])),outbox:[],state:{
      khodar_pos_branches_v1:manifest.branches,khodar_pos_active_branch_id_v1:manifest.branches[0].id,
      khodar_pos_products_v3:recordsFor('product')
    }};
  const result=await verifyCloudCheckpoint(snapshot,fetchPage(a));
  assert.equal(result.verifiedThrough,snapshot.cursor);
  assert.equal(result.observedEvents,first.events.length);
  const missing=structuredClone(snapshot);
  delete missing.applied[first.events[0].id];
  await assert.rejects(verifyCloudCheckpoint(missing,fetchPage(a)),/لم تُطبّق محليًا/);
  const staffPage=await fetchPage(staff)({tenantId:'A',cursor:0,limit:500});
  assert.equal(staffPage.fullTenantVisibility,false);
  await assert.rejects(verifyCloudCheckpoint(snapshot,fetchPage(staff)),/كامل سجل مزامنة الشركة/);
  assert.equal((await call('/api/branches?tenantId=A','GET',undefined,staff)).status,403);
  await assert.rejects(verifyCloudCheckpoint(snapshot,async()=>({...first,nextCursor:first.nextCursor+1})),/تخفي أحداثًا/);
  const backend=memoryStorage();
  const receiveState={
    khodar_pos_branches_v1:manifest.branches,
    khodar_pos_active_branch_id_v1:manifest.branches[0].id
  };
  const local=new AtomicStore({id:'audit-fixture',tenantId:'A'},receiveState,backend);
  await local.acquire();
  try {
    const tables = {
      product: 'khodar_pos_products_v3',
      branch: 'khodar_pos_branches_v1',
      customer: 'khodar_pos_customers_v3',
      customer_payment: 'khodar_pos_customer_payments_v3',
      supplier: 'khodar_pos_suppliers_v3',
      supplier_payment: 'khodar_pos_supplier_payments_v3',
      expense: 'khodar_pos_expenses_v3',
      worker_transaction: 'khodar_pos_worker_transactions_v3'
    };
    local.receive(first.events,first.nextCursor,batch=>{
      for (const event of batch) {
        const key=tables[event.entityType];
        if (!key) continue;
        const rows=local.value.state[key] || [];
        if (event.action === 'create') local.set(key,rows.some(row=>row.id===event.entityId)?rows:[...rows,event.payload]);
        else if (event.action === 'update') local.set(key,rows.map(row=>row.id===event.entityId?{...row,...event.payload}:row));
        else if (event.action === 'delete') local.set(key,rows.filter(row=>row.id!==event.entityId));
      }
    });
    let adopted=false;
    const migrated=await local.adoptCloudCheckedAggregate({adoptIfEmpty:async(_key,record)=>{
      adopted=true;return structuredClone(record);
    }},fetchPage(a),fetchBranches(a));
    assert.equal(adopted,true);
    assert.equal(migrated.saved.cursor,first.nextCursor);
    assert.equal(migrated.audit.observedEvents,first.events.length);
    assert.equal(migrated.branchAudit.branchCount,1);
  } finally {await local.close();}
});
test('legacy checkpoint rejects a local receipt amount that differs from actual D1 event payload', async () => {
  const receipt={id:'migration-receipt',tenantId:'A',customerId:'migration-customer',amount:12};
  const customer={id:'migration-customer',tenantId:'A',name:'Migration customer',balance:0};
  const events=[
    {id:'migration-customer-event',entityType:'customer',entityId:'migration-customer',action:'create',
      payload:customer},
    {id:'migration-receipt-event',entityType:'customer_payment',entityId:receipt.id,action:'create',payload:receipt}
  ];
  const pushed=await call('/api/sync/push','POST',{tenantId:'A',events},a);
  assert.equal(pushed.status,200,await pushed.text());
  const pull=async({tenantId,cursor,limit})=>(await call(
    `/api/sync/pull?tenantId=${tenantId}&cursor=${cursor}&limit=${limit}`,'GET',undefined,a)).json();
  const page=await pull({tenantId:'A',cursor:0,limit:500});
  const recordsFor = type => page.events
    .filter(event => event.entityType === type && event.action === 'create')
    .map(event => event.payload);
  const snapshot={identity:{id:'ownerA',tenantId:'A'},cursor:page.nextCursor,
    applied:Object.fromEntries(page.events.map(event=>[event.id,true])),outbox:[],
    state:{khodar_pos_customer_payments_v3:[{...receipt,amount:13}],
      khodar_pos_customers_v3:[{...customer,balance:-12}],
      khodar_pos_products_v3:recordsFor('product')}};
  await assert.rejects(verifyCloudCheckpoint(snapshot,pull),/لا يطابق آخر حركة/);
  const backend=memoryStorage();
  const raw=JSON.stringify({...snapshot,schema:1,revision:1});
  const key=scopedStorageKey('atomic_v1',snapshot.identity);
  backend.setItem(key,raw);
  const legacy=new AtomicStore(snapshot.identity,snapshot.state,backend);
  await legacy.acquire();
  let adopted=false;
  try {
    await assert.rejects(legacy.adoptCloudCheckedAggregate({adoptIfEmpty:async()=>{adopted=true;}},
      pull,async()=>{throw Error('branch audit must not run after financial mismatch');}),/لا يطابق آخر حركة/);
    assert.equal(adopted,false);
    assert.equal(legacy.writable,false);
    assert.equal(backend.getItem(key),raw);
  } finally {await legacy.close();}
  snapshot.state.khodar_pos_customer_payments_v3=[receipt];
  snapshot.state.khodar_pos_customers_v3=[{...customer,balance:-11}];
  await assert.rejects(verifyCloudCheckpoint(snapshot,pull),/رصيد عميل محلي لا يطابق/);
  snapshot.state.khodar_pos_customers_v3=[{...customer,balance:-12}];
  const verified=await verifyCloudCheckpoint(snapshot,pull);
  assert.equal(verified.verifiedThrough,page.nextCursor);
  assert.equal(verified.verifiedCustomerBalances,1);
  await assert.rejects(verifyCloudCheckpoint({...snapshot,outbox:[{
    ...page.events.find(event=>event.id==='migration-receipt-event'),
    payload:{...receipt,amount:13}
  }]},pull),/تختلف عن الحركة المقبولة/);
});
test('legacy checkpoint rejects a local supplier balance that differs from actual D1 purchase history', async () => {
  const supplier={id:'migration-supplier',tenantId:'B',name:'Migration supplier',balance:5};
  const purchase={id:'migration-purchase',tenantId:'B',supplierId:supplier.id,creditAmount:20};
  const payment={id:'migration-supplier-payment',tenantId:'B',supplierId:supplier.id,amount:7};
  const returned={id:'migration-purchase-return',tenantId:'B',purchaseId:purchase.id,supplierId:supplier.id,
    refundMethod:'supplier_debt_deduction',totalRefundAmount:3};
  const events=[
    {id:'migration-supplier-event',entityType:'supplier',entityId:supplier.id,action:'create',payload:supplier},
    {id:'migration-purchase-event',entityType:'purchase',entityId:purchase.id,action:'create',payload:purchase},
    {id:'migration-supplier-payment-event',entityType:'supplier_payment',entityId:payment.id,action:'create',payload:payment},
    {id:'migration-purchase-return-event',entityType:'purchase_return',entityId:returned.id,action:'create',payload:returned}
  ];
  const pushed=await call('/api/sync/push','POST',{tenantId:'B',events},b);
  assert.equal(pushed.status,200,await pushed.text());
  const pull=async({tenantId,cursor,limit})=>(await call(
    `/api/sync/pull?tenantId=${tenantId}&cursor=${cursor}&limit=${limit}`,'GET',undefined,b)).json();
  const page=await pull({tenantId:'B',cursor:0,limit:500});
  const applied=Object.fromEntries(page.events.map(event=>[event.id,true]));
  const recordsFor = type => page.events
    .filter(event => event.entityType === type && event.action === 'create')
    .map(event => event.payload);
  const snapshot={identity:{id:'ownerB',tenantId:'B'},cursor:page.nextCursor,applied,outbox:[],
    state:{khodar_pos_suppliers_v3:[{...supplier,balance:16}],
      khodar_pos_purchases_v3:recordsFor('purchase'),
      khodar_pos_purchase_returns_v3:recordsFor('purchase_return'),
      khodar_pos_products_v3:recordsFor('product'),
      khodar_pos_customer_payments_v3:recordsFor('customer_payment'),
      khodar_pos_supplier_payments_v3:recordsFor('supplier_payment'),
      khodar_pos_expenses_v3:recordsFor('expense'),
      khodar_pos_worker_transactions_v3:recordsFor('worker_transaction')}};
  await assert.rejects(verifyCloudCheckpoint(snapshot,pull),/رصيد مورد محلي لا يطابق/);
  snapshot.state.khodar_pos_suppliers_v3=[{...supplier,balance:15}];
  const verified=await verifyCloudCheckpoint(snapshot,pull);
  assert.equal(verified.verifiedThrough,page.nextCursor);
  assert.equal(verified.verifiedSupplierBalances,1);
  snapshot.state.khodar_pos_purchases_v3[0]={...purchase,paidBankAmount:99};
  await assert.rejects(verifyCloudCheckpoint(snapshot,pull),/مصدر النقد أو البنك/);
});
test('branch creation and dependent transfer are one D1 batch, visible to owner only', async () => {
  const branchId='branch-created-for-transfer';
  const branch={id:branchId,tenantId:'A',name:'Receiving branch',code:'RCV',isMain:false,status:'active'};
  const main={id:'main',tenantId:'A',name:'Main',code:'MAIN',isMain:true,status:'active'};
  const createMain={id:'evt-create-main-branch',entityType:'branch',entityId:'main',action:'create',payload:main};
  const create={id:'evt-create-branch',entityType:'branch',entityId:branchId,action:'create',payload:branch};
  const transfer={id:'evt-transfer-branch',entityType:'stock_transfer',entityId:'transfer-branch',action:'create',payload:{id:'transfer-branch',fromBranchId:'main',toBranchId:branchId,productId:'p',quantityKg:3}};
  const body={tenantId:'A',events:[createMain,create,transfer]};
  assert.equal((await call('/api/sync/push','POST',body,staff)).status,403);
  assert.equal((await call('/api/sync/push','POST',{tenantId:'B',events:[create]},b)).status,400);
  assert.equal((await call('/api/sync/push','POST',{tenantId:'A',events:[transfer]},a)).status,400);
  assert.equal((await call('/api/sync/push','POST',{tenantId:'A',events:[transfer,create]},a)).status,400);
  assert.equal(await db.prepare('SELECT id FROM branches WHERE id = ?').bind(branchId).first(),null);
  let response=await call('/api/sync/push','POST',body,a);
  assert.equal(response.status,200,await response.text());
  assert.equal((await db.prepare('SELECT tenant_id AS tenantId, name FROM branches WHERE id = ?').bind(branchId).first()).tenantId,'A');
  assert.equal((await db.prepare("SELECT COUNT(*) AS n FROM sync_events_v2 WHERE id IN ('evt-create-main-branch','evt-create-branch','evt-transfer-branch')").first()).n,3);
  response=await call('/api/sync/push','POST',body,a);
  assert.equal(response.status,200,await response.text());
  assert.equal((await db.prepare("SELECT COUNT(*) AS n FROM sync_events_v2 WHERE id IN ('evt-create-main-branch','evt-create-branch','evt-transfer-branch')").first()).n,3);
  const all=await call('/api/sync/pull?tenantId=A','GET',undefined,a).then(r=>r.json());
  assert.ok(all.events.find(e=>e.id===create.id));assert.ok(all.events.find(e=>e.id===transfer.id));
  const tenantB=await call('/api/sync/pull?tenantId=B','GET',undefined,b).then(r=>r.json());
  assert.equal(tenantB.events.some(e=>e.entityId===branchId),false);
  const update={id:'evt-update-branch',entityType:'branch',entityId:branchId,action:'update',payload:{...branch,status:'inactive'}};
  assert.equal((await call('/api/sync/push','POST',{tenantId:'A',events:[update]},a)).status,200);
  assert.equal((await db.prepare('SELECT status FROM branches WHERE id = ?').bind(branchId).first()).status,'inactive');
  assert.equal((await call('/api/sync/push','POST',{tenantId:'A',events:[{...update,id:'evt-branch-delete',action:'delete'}]},a)).status,400);
});
test('legacy demo branch bootstrap fails closed before inventing another tenant branch', async () => {
  const tenantId=`bootstrap-${crypto.randomUUID()}`;
  await db.prepare('INSERT INTO tenants (id,store_code,company_name,username,password_hash,status,role,allowed_branches) VALUES (?,?,?,?,?,?,?,?)')
    .bind(tenantId,tenantId,'Fresh fixture','fresh',await hashPassword(pass),'active','company_owner',1).run();
  await db.prepare("INSERT OR IGNORE INTO branches (id,tenant_id,name,status) VALUES ('branch-main','A','Existing fixture','active')").run();
  const token=await login(tenantId,'fresh');
  const backend=memoryStorage();
  const local=new AtomicStore({id:tenantId,tenantId},{branches:INITIAL_BRANCHES},backend);
  await local.acquire();
  try {
    assert.throws(()=>local.bootstrapBranches('branches'),/لا تخص هذه الشركة/);
    assert.deepEqual(local.value.outbox,[]);
    const response=await call('/api/sync/pull?tenantId='+encodeURIComponent(tenantId),'GET',undefined,token);
    assert.equal(response.status,200);
    assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM branches WHERE tenant_id = ?').bind(tenantId).first()).n,0);
    assert.equal(local.value.state.branches[0].tenantId,'tenant-demo','source remains available for owner review');
  } finally {await local.close();}
});
test('new tenant creation atomically provisions a unique main branch and permits its idempotent first sync event', async () => {
  const tenantId=`new-${crypto.randomUUID()}`;
  const response=await call('/api/tenants','POST',{
    id:tenantId,storeCode:tenantId,companyName:'New fixture',username:'newowner',password:pass,allowedBranches:1
  },platform);
  const created=await response.json();
  assert.equal(response.status,200,JSON.stringify(created));
  assert.equal(created.mainBranch.tenantId,tenantId);
  assert.notEqual(created.mainBranch.id,'branch-main');
  const row=await db.prepare('SELECT tenant_id,is_main FROM branches WHERE id = ?').bind(created.mainBranch.id).first();
  assert.equal(row.tenant_id,tenantId);
  assert.equal(row.is_main,1);
  const signIn=await call('/api/tenants/lookup','POST',{storeCode:tenantId,username:'newowner',password:pass});
  assert.equal(signIn.status,200);
  const session=await signIn.json();
  assert.deepEqual(session.branches,[created.mainBranch]);
  assert.equal(session.tenant.allowedBranches,1);
  const backend=memoryStorage();
  const local=new AtomicStore({id:tenantId,tenantId},{branches:session.branches},backend);
  await local.acquire();
  try {
    local.bootstrapBranches('branches');
    const event=local.value.outbox[0];
    assert.equal(event.entityId,created.mainBranch.id);
    for(let i=0;i<2;i++) {
      const pushed=await call('/api/sync/push','POST',{tenantId,events:[event]},session.session.token);
      assert.equal(pushed.status,200,await pushed.text());
    }
    const changed={...event,id:`evt-${crypto.randomUUID()}`,payload:{...event.payload,name:'Altered main'}};
    assert.equal((await call('/api/sync/push','POST',{tenantId,events:[changed]},session.session.token)).status,409);
    assert.equal(await db.prepare('SELECT id FROM sync_events_v2 WHERE tenant_id = ? AND id = ?').bind(tenantId,changed.id).first(),null);
    const extraId=`branch-${crypto.randomUUID()}`;
    const extra={id:`evt-${crypto.randomUUID()}`,entityType:'branch',entityId:extraId,action:'create',
      payload:{id:extraId,tenantId,name:'Over limit',isMain:false,status:'active'}};
    assert.equal((await call('/api/sync/push','POST',{tenantId,events:[extra]},session.session.token)).status,400);
    assert.equal(await db.prepare('SELECT id FROM branches WHERE id = ?').bind(extraId).first(),null);
    assert.equal(await db.prepare('SELECT id FROM sync_events_v2 WHERE tenant_id = ? AND id = ?').bind(tenantId,extra.id).first(),null);
    const pulled=await call(`/api/sync/pull?tenantId=${encodeURIComponent(tenantId)}`,'GET',undefined,session.session.token).then(r=>r.json());
    assert.equal(pulled.events.filter(item=>item.id===event.id).length,1);
    const second=await call('/api/tenants/lookup','POST',{storeCode:tenantId,username:'newowner',password:pass}).then(r=>r.json());
    assert.deepEqual(second.branches,session.branches);
  } finally {await local.close();}
});
test('branch provisioning failure rolls back tenant creation in the same D1 batch', async () => {
  const tenantId=`fail-provision-${crypto.randomUUID()}`;
  await db.prepare(`CREATE TRIGGER fixture_abort_branch_provision BEFORE INSERT ON branches
    WHEN NEW.tenant_id = '${tenantId}' BEGIN SELECT RAISE(ABORT, 'fixture abort'); END`).run();
  try {
    const response=await call('/api/tenants','POST',{
      id:tenantId,storeCode:tenantId,companyName:'Rollback fixture',username:'rollback',password:pass,allowedBranches:1
    },platform);
    assert.equal(response.status,500);
    assert.equal(await db.prepare('SELECT id FROM tenants WHERE id = ?').bind(tenantId).first(),null);
    assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM branches WHERE tenant_id = ?').bind(tenantId).first()).n,0);
  } finally {await db.prepare('DROP TRIGGER fixture_abort_branch_provision').run();}
});
test('sync rejects nested foreign tenant and cashier inventory writes', async () => {
  const evt = {id:'evt-foreign',entityType:'product',entityId:'p2',action:'create',payload:{tenantId:'B'}};
  assert.equal((await call('/api/sync/push','POST',{tenantId:'A',events:[evt]},a)).status,400);
  assert.equal((await call('/api/sync/push','POST',{tenantId:'A',events:[{...evt,payload:{tenantId:'A'}}]},staff)).status,403);
});
test('sequence pagination cannot lose events with identical wall-clock time', async () => {
  const before=await db.prepare("SELECT COALESCE(MAX(sequence), 0) AS cursor FROM sync_events_v2 WHERE tenant_id = 'A'").first();
  const events = Array.from({length:3},(_,i)=>({id:'page-'+i,entityId:'p-'+i,entityType:'product',action:'create',timestamp:1,payload:{name:'Product '+i}}));
  assert.equal((await call('/api/sync/push','POST',{tenantId:'A',events},a)).status,200);
  let cursor=before.cursor; const ids=[];
  for(let i=0;i<3;i++) {
    const body=await call('/api/sync/pull?tenantId=A&limit=1&cursor='+cursor,'GET',undefined,a).then(r=>r.json());
    ids.push(...body.events.map(e=>e.id)); cursor=body.nextCursor;
  }
  assert.deepEqual(new Set(ids),new Set(events.map(event=>event.id)));
});
test('pull pagination retains a complete local commit group and advances cursor past it', async () => {
  const before=await db.prepare("SELECT COALESCE(MAX(sequence), 0) AS cursor FROM sync_events_v2 WHERE tenant_id = 'A'").first();
  const groupId=crypto.randomUUID();
  const events=['supplier','purchase','customer_payment'].map((type,i)=>({id:`group-boundary-${i}`,tenantId:'A',entityType:type,entityId:`group-record-${i}`,action:'create',payload:{id:`group-record-${i}`},groupId}));
  const response=await call('/api/sync/push','POST',{tenantId:'A',events},a);
  assert.equal(response.status,200,await response.text());
  const first=await call(`/api/sync/pull?tenantId=A&cursor=${before.cursor}&limit=1`,'GET',undefined,a).then(r=>r.json());
  assert.deepEqual(first.events.map(e=>e.id),events.map(e=>e.id));
  assert.equal(first.events.every(e=>e.groupId===groupId),true);
  const next=await call(`/api/sync/pull?tenantId=A&cursor=${first.nextCursor}&limit=1`,'GET',undefined,a).then(r=>r.json());
  assert.equal(next.events.some(e=>e.groupId===groupId),false);
  assert.equal((await call('/api/sync/push','POST',{tenantId:'A',events:[{...events[0],groupId:crypto.randomUUID()}]},a)).status,409);
  const lateBase={...events[0]}; Reflect.deleteProperty(lateBase,'conflictPolicyVersion'); Reflect.deleteProperty(lateBase,'preconditions');
  assert.equal((await call('/api/sync/push','POST',{tenantId:'A',events:[{...lateBase,id:'late-group-member',entityId:'late-group-member',payload:{id:'late-group-member'}}]},a)).status,409);
});
test('concurrent first writers cannot extend the same commit group', async () => {
  const groupId=crypto.randomUUID();
  const event=n=>({id:`concurrent-group-${n}`,tenantId:'A',entityType:'product',entityId:`concurrent-product-${n}`,action:'create',payload:{id:`concurrent-product-${n}`},groupId});
  const [first,second]=await Promise.all([0,1].map(n=>call('/api/sync/push','POST',{tenantId:'A',events:[event(n)]},a)));
  assert.deepEqual([first.status,second.status].sort(),[200,409]);
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM sync_events_v2 WHERE tenant_id = ? AND group_id = ?').bind('A',groupId).first()).n,1);
  assert.equal((await db.prepare('SELECT event_count FROM sync_commit_groups WHERE tenant_id = ? AND group_id = ?').bind('A',groupId).first()).event_count,1);
  assert.equal((await call('/api/sync/push','POST',{tenantId:'A',events:[event(0),{...event(1),groupId:crypto.randomUUID()},event(0)]},a)).status,400);
});
test('conflicting duplicate IDs roll back the whole sync batch', async () => {
  const event = {id:'batch-conflict', entityId:'batch-product', entityType:'product', action:'create', payload:{name:'first'}};
  const response = await call('/api/sync/push','POST',{tenantId:'A',events:[event,{...event,payload:{name:'second'}}]},a);
  assert.equal(response.status,409);
  assert.equal(await db.prepare("SELECT id FROM sync_events_v2 WHERE id='batch-conflict'").first(),null);
});
test('concurrent changed retries acknowledge only one payload', async () => {
  const event = {id:'concurrent-conflict', entityId:'concurrent-product', entityType:'product', action:'create', payload:{name:'first'}};
  const responses = await Promise.all([event,{...event,payload:{name:'second'}}].map(e=>call('/api/sync/push','POST',{tenantId:'A',events:[e]},a)));
  assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);
  assert.equal((await db.prepare("SELECT COUNT(*) AS n FROM sync_events_v2 WHERE id='concurrent-conflict'").first()).n,1);
});
test('server rejects stale edits, cancel-modify races, debt races, stock races and offline reconnects', async () => {
  const loadHeads=async()=>Object.fromEntries((await db.prepare(
    'SELECT conflict_key,last_event_id FROM sync_conflict_heads WHERE tenant_id = ?'
  ).bind('A').all()).results.map(row=>[row.conflict_key,row.last_event_id]));
  const push=event=>call('/api/sync/push','POST',{tenantId:'A',events:[event]},a);

  const customerHeads=await loadHeads();
  const customer=attachConflictPreconditions({id:'conflict-customer-create',entityType:'customer',entityId:'conflict-customer',action:'create',payload:{id:'conflict-customer',balance:100}},customerHeads);
  assert.equal((await push(customer)).status,200);
  const editA=attachConflictPreconditions({id:'conflict-customer-edit-a',entityType:'customer',entityId:'conflict-customer',action:'update',payload:{id:'conflict-customer',name:'A'}},{...customerHeads});
  const editB=attachConflictPreconditions({id:'conflict-customer-edit-b',entityType:'customer',entityId:'conflict-customer',action:'update',payload:{id:'conflict-customer',name:'B'}},{...customerHeads});
  assert.equal((await push(editA)).status,200); assert.equal((await push(editB)).status,409);

  const invoiceHeads=await loadHeads();
  const invoice=attachConflictPreconditions({id:'conflict-invoice-create',branchId:'fixture-a-main',entityType:'invoice',entityId:'conflict-invoice',action:'create',payload:{id:'conflict-invoice',branchId:'fixture-a-main',items:[]}},invoiceHeads);
  assert.equal((await push(invoice)).status,200);
  const cancel=attachConflictPreconditions({id:'conflict-invoice-void',branchId:'fixture-a-main',entityType:'invoice',entityId:'conflict-invoice',action:'void',payload:{id:'conflict-invoice',status:'voided'}},{...invoiceHeads});
  const modify=attachConflictPreconditions({id:'conflict-invoice-edit',branchId:'fixture-a-main',entityType:'invoice',entityId:'conflict-invoice',action:'update',payload:{id:'conflict-invoice',notes:'stale'}},{...invoiceHeads});
  assert.equal((await push(cancel)).status,200); assert.equal((await push(modify)).status,409);

  const debtHeads=await loadHeads();
  const paymentA=attachConflictPreconditions({id:'conflict-payment-a',entityType:'customer_payment',entityId:'conflict-payment-a',action:'create',payload:{id:'conflict-payment-a',customerId:'conflict-customer',amount:60}},{...debtHeads});
  const paymentB=attachConflictPreconditions({id:'conflict-payment-b',entityType:'customer_payment',entityId:'conflict-payment-b',action:'create',payload:{id:'conflict-payment-b',customerId:'conflict-customer',amount:60}},{...debtHeads});
  assert.equal((await push(paymentA)).status,200); assert.equal((await push(paymentB)).status,409);

  const stockHeads=await loadHeads();
  const saleA=attachConflictPreconditions({id:'conflict-sale-a',branchId:'fixture-a-main',entityType:'invoice',entityId:'conflict-sale-a',action:'create',payload:{id:'conflict-sale-a',branchId:'fixture-a-main',items:[{productId:'p',netWeight:8}]}},{...stockHeads});
  const saleB=attachConflictPreconditions({id:'conflict-sale-b',branchId:'fixture-a-main',entityType:'invoice',entityId:'conflict-sale-b',action:'create',payload:{id:'conflict-sale-b',branchId:'fixture-a-main',items:[{productId:'p',netWeight:8}]}},{...stockHeads});
  assert.equal((await push(saleA)).status,200); assert.equal((await push(saleB)).status,409);

  const offlineHeads=await loadHeads();
  const offline=attachConflictPreconditions({id:'conflict-offline-edit',entityType:'product',entityId:'offline-product',action:'update',payload:{id:'offline-product',name:'offline'}},{...offlineHeads});
  const online=attachConflictPreconditions({id:'conflict-online-edit',entityType:'product',entityId:'online-product',action:'update',payload:{id:'online-product',name:'online'}},{...offlineHeads});
  assert.equal((await push(online)).status,200); assert.equal((await push(offline)).status,409);
  const missing={id:'conflict-policy-missing',entityType:'expense',entityId:'conflict-policy-missing',action:'create',payload:{id:'conflict-policy-missing',amount:1}};
  const raw=await mf.dispatchFetch('https://test.invalid/api/sync/push',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${a}`},body:JSON.stringify({tenantId:'A',events:[missing]})});
  assert.equal(raw.status,400);
});
test('server accept followed by lost acknowledgement survives reopen and retries exactly once', async () => {
  const storage=memoryStorage();
  const identity={id:'retry-device',tenantId:'A'};
  const currentHeads=Object.fromEntries((await db.prepare(
    'SELECT conflict_key,last_event_id FROM sync_conflict_heads WHERE tenant_id = ?'
  ).bind('A').all()).results.map(row=>[row.conflict_key,row.last_event_id]));
  const store=new AtomicStore(identity,{stock:20,[SYNC_HEADS_STATE_KEY]:currentHeads},storage);
  await store.acquire();
  const event={id:'lost-response-event',tenantId:'A',entityType:'product',entityId:'retry-product',action:'create',payload:{id:'retry-product',currentStockKg:17}};
  store.transact(()=>{store.set('stock',17);store.enqueue(event);});
  assert.equal((await call('/api/sync/push','POST',{tenantId:'A',events:store.value.outbox},a)).status,200);
  // Simulate transport loss after the real server commit: intentionally do not acknowledge locally.
  await store.close();
  const reopened=new AtomicStore(identity,{},storage);await reopened.acquire();
  try {
    assert.equal(reopened.read('stock'),17);assert.equal(reopened.value.outbox.length,1);
    const response=await call('/api/sync/push','POST',{tenantId:'A',events:reopened.value.outbox},a);
    assert.equal(response.status,200);
    reopened.acknowledge(new Set((await response.json()).acceptedIds));
    assert.equal(reopened.value.outbox.length,0);
    assert.equal((await db.prepare("SELECT COUNT(*) AS n FROM sync_events_v2 WHERE id='lost-response-event'").first()).n,1);
    assert.equal(reopened.read('stock'),17);
  } finally {await reopened.close();}
});
test('authoritative restore events require tenant-wide administrators and round-trip unchanged', async () => {
  const before=await db.prepare("SELECT COALESCE(MAX(sequence), 0) AS cursor FROM sync_events_v2 WHERE tenant_id = 'A'").first();
  const snapshot={version:4,tenantId:'A',syncCursor:before.cursor,settings:{},products:[],customers:[],invoices:[],expenses:[],
    expenseCategories:[],damagedItems:[],workers:[],workerTransactions:[],customerPayments:[],purchases:[],suppliers:[],
    supplierPayments:[],salesReturns:[],purchaseReturns:[],partners:[],partnerDrawings:[],profitDistributions:[],
    branches:[{id:'fixture-a-main',tenantId:'A'}],activeBranchId:'fixture-a-main',stockTransfers:[]};
  const id='restore-api-fixture';
  const event={id,tenantId:'A',entityType:'restore_snapshot',entityId:id,action:'create',payload:{id,snapshot}};
  assert.equal((await call('/api/sync/push','POST',{tenantId:'A',events:[event]},staff)).status,403);
  const accepted=await call('/api/sync/push','POST',{tenantId:'A',events:[event]},a);
  assert.equal(accepted.status,200,await accepted.text());
  assert.equal((await call('/api/sync/push','POST',{tenantId:'A',events:[event]},a)).status,200);
  const later={id:'post-restore-api-fixture',entityType:'product',entityId:'post-restore-product',action:'create',payload:{id:'post-restore-product',name:'Later'}};
  assert.equal((await call('/api/sync/push','POST',{tenantId:'A',events:[later]},a)).status,200);
  const pulled=await call(`/api/sync/pull?tenantId=A&cursor=${before.cursor}`,'GET',undefined,a).then(r=>r.json());
  assert.deepEqual(pulled.events.find(item=>item.id===id)?.payload,event.payload);
  assert.equal(pulled.events.some(item=>item.id===later.id),false);
  assert.equal(pulled.hasMore,true);
  const next=await call(`/api/sync/pull?tenantId=A&cursor=${pulled.nextCursor}`,'GET',undefined,a).then(r=>r.json());
  assert.equal(next.events.some(item=>item.id===later.id),true);
  const oversized={...event,id:'restore-too-large',entityId:'restore-too-large',payload:{id:'restore-too-large',snapshot:{...snapshot,padding:'x'.repeat(5*1024*1024)}}};
  assert.equal((await call('/api/sync/push','POST',{tenantId:'A',events:[oversized]},a)).status,400);
});
test('backup round trip preserves data', async () => {
  const snapshot={products:[{id:'p',tenantId:'A',currentStockKg:17.25}],customers:[]};
  assert.equal((await call('/api/backup','POST',{tenantId:'A',snapshot},a)).status,200);
  const read=await call('/api/backup?tenantId=A&latest=true','GET',undefined,a).then(r=>r.json());
  assert.deepEqual(read.backup.snapshot,snapshot);
});
test('session identity is sanitized and follows the database, not request hints', async () => {
  const response = await call('/api/auth/me?tenantId=B&role=super_admin','GET',undefined,a);
  assert.equal(response.status,200);
  const result = await response.json();
  assert.equal(result.user.tenantId,'A');
  assert.equal(result.user.role,'company_owner');
  assert.equal(result.user.password_hash,undefined);
  assert.equal(result.user.token,undefined);
  assert.equal(result.user.syncScopeVersion,0);
});
test('staff authorization changes revoke the old session and advance the client sync scope', async () => {
  const beforeResponse=await call('/api/tenants/lookup','POST',{storeCode:'A',username:'cashier',password:pass});
  const before=await beforeResponse.json();
  assert.equal(beforeResponse.status,200);
  const changed=await call('/api/users','PATCH',{tenantId:'A',id:'staff',name:'Cashier',username:'cashier',
    role:'cashier',status:'active',branchId:'fixture-a-main',phone:'',permissions:{}},a);
  assert.equal(changed.status,200,await changed.text());
  assert.equal((await call('/api/auth/me','GET',undefined,before.session.token)).status,401);
  const afterResponse=await call('/api/tenants/lookup','POST',{storeCode:'A',username:'cashier',password:pass});
  const after=await afterResponse.json();
  assert.equal(afterResponse.status,200);
  assert.equal(after.user.branchId,'fixture-a-main');
  assert.equal(after.user.syncScopeVersion,before.user.syncScopeVersion+1);
  const verified=await call('/api/auth/me','GET',undefined,after.session.token).then(response=>response.json());
  assert.equal(verified.user.syncScopeVersion,after.user.syncScopeVersion);
  staff=after.session.token;
});
test('recovery tokens are tenant-scoped, one-use, and revoke existing sessions', async () => {
  assert.equal((await call('/api/auth/recovery-token','POST',{tenantId:'B',userId:'staff'},a)).status,403);
  assert.equal((await call('/api/auth/recovery-token','POST',{tenantId:'A',userId:'staff'},staff)).status,403);
  const issued = await call('/api/auth/recovery-token','POST',{tenantId:'A',userId:'staff'},a).then(r=>r.json());
  assert.ok(issued.resetToken);
  const newPassword=crypto.randomUUID()+'Aa!';
  assert.equal((await call('/api/auth/reset','POST',{resetToken:issued.resetToken,newPassword})).status,200);
  assert.equal((await call('/api/auth/me','GET',undefined,staff)).status,401);
  assert.equal((await call('/api/auth/reset','POST',{resetToken:issued.resetToken,newPassword})).status,400);
  staff=await login('A','cashier',newPassword);
});
test('trusted legacy reset preserves owner, admin, staff and disabled identities without accepting plaintext', async () => {
  assert.throws(()=>legacyReset.prepareLegacyReset({tenantId:"LEGACY';DROP",principalType:'user',principalId:'staff'}));
  assert.throws(()=>legacyReset.prepareLegacyReset({tenantId:'LEGACY',principalType:'tenant',principalId:'OTHER'}));
  const legacyCall=(path,method,body,token)=>call(path,method,body,token,'legacy-reset-fixture');
  const oldHashed=await hashPassword(pass);
  await db.prepare("INSERT INTO tenants (id,store_code,company_name,username,password_hash,status,role) VALUES ('LEGACY','LEGACY','Legacy company','legacyowner',?,'active','company_owner')")
    .bind(oldHashed).run();
  const oldOwnerResponse=await legacyCall('/api/tenants/lookup','POST',{storeCode:'LEGACY',username:'legacyowner',password:pass});
  assert.equal(oldOwnerResponse.status,200);
  const oldOwnerToken=(await oldOwnerResponse.json()).session.token;
  await db.prepare("UPDATE tenants SET password_hash='OldPlain123!' WHERE id='LEGACY'").run();
  for(const [id,role,status] of [['legacy-normal','cashier','active'],['legacy-admin','admin','active'],['legacy-disabled','cashier','disabled']])
    await db.prepare('INSERT INTO users (id,tenant_id,name,username,password_hash,role,status,permissions_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id,'LEGACY',id,id,'OldPlain123!',role,status,'{"reports":true}').run();
  for(const username of ['legacyowner','legacy-normal','legacy-admin','legacy-disabled'])
    assert.equal((await legacyCall('/api/tenants/lookup','POST',{storeCode:'LEGACY',username,password:'OldPlain123!'})).status,401);
  const issue=async(type,id)=>{
    const prepared=legacyReset.prepareLegacyReset({tenantId:'LEGACY',principalType:type,principalId:id});
    assert.equal(prepared.sql.includes(prepared.token),false);
    assert.equal((await db.prepare(prepared.sql).run()).meta.changes,1);
    return prepared.token;
  };
  const freshPassword=crypto.randomUUID()+'Aa!';
  for(const [type,id] of [['tenant','LEGACY'],['user','legacy-normal'],['user','legacy-admin'],['user','legacy-disabled']]){
    const resetToken=await issue(type,id);
    assert.equal((await legacyCall('/api/auth/reset','POST',{resetToken,newPassword:freshPassword})).status,200);
    assert.equal((await legacyCall('/api/auth/reset','POST',{resetToken,newPassword:freshPassword})).status,400);
  }
  assert.equal((await legacyCall('/api/auth/me','GET',undefined,oldOwnerToken)).status,401);
  assert.equal((await legacyCall('/api/tenants/lookup','POST',{storeCode:'LEGACY',username:'legacyowner',password:'WrongPassword123!'})).status,401);
  for(const [username,role] of [['legacyowner','company_owner'],['legacy-normal','cashier'],['legacy-admin','admin']]){
    const response=await legacyCall('/api/tenants/lookup','POST',{storeCode:'LEGACY',username,password:freshPassword});
    assert.equal(response.status,200);
    const body=await response.json();
    assert.equal(body.user.role,role);assert.equal(body.user.tenantId,'LEGACY');
  }
  assert.equal((await legacyCall('/api/tenants/lookup','POST',{storeCode:'LEGACY',username:'legacy-disabled',password:freshPassword})).status,401);
  const {results:users}=await db.prepare("SELECT id,tenant_id,role,status,permissions_json FROM users WHERE tenant_id='LEGACY' ORDER BY id").all();
  assert.deepEqual(users.map(row=>[row.id,row.tenant_id,row.role,row.status,row.permissions_json]),[
    ['legacy-admin','LEGACY','admin','active','{"reports":true}'],
    ['legacy-disabled','LEGACY','cashier','disabled','{"reports":true}'],
    ['legacy-normal','LEGACY','cashier','active','{"reports":true}']
  ]);
});
test('session expiration compares dates, including the same calendar day', async () => {
  const token=await login('A','ownerA');
  await db.prepare("UPDATE sessions SET expires_at = strftime('%Y-%m-%dT%H:%M:%fZ','now','-1 minute') WHERE principal_id = 'A'").run();
  assert.equal((await call('/api/users?tenantId=A','GET',undefined,token)).status,401);
  a=await login('A','ownerA');
});
test('tenant suspension immediately invalidates staff sessions', async () => {
  await db.prepare("UPDATE tenants SET status='suspended' WHERE id='A'").run();
  assert.equal((await call('/api/sync/pull?tenantId=A','GET',undefined,staff)).status,401);
  await db.prepare("UPDATE tenants SET status='active' WHERE id='A'").run();
  a=await login('A','ownerA');
});
test('logout revokes token server-side', async () => {
  assert.equal((await call('/api/auth/logout','POST',{},a)).status,200);
  assert.equal((await call('/api/users?tenantId=A','GET',undefined,a)).status,401);
});
test('platform owner securely initializes and changes email/password with audit and session revocation', async () => {
  assert.equal((await call('/api/auth/platform-owner','GET',undefined,b)).status,403);
  assert.equal((await call('/api/auth/platform-owner','PATCH',{currentPassword:pass,newEmail:'blocked@example.test'},b)).status,403);

  const initialReset=legacyReset.prepareLegacyReset({tenantId:'PLATFORM',principalType:'tenant',principalId:'PLATFORM'});
  assert.equal(initialReset.sql.includes(initialReset.token),false);
  assert.equal((await db.prepare(initialReset.sql).run()).meta.changes,1);
  const initialPassword=crypto.randomUUID()+'Init!Aa';
  assert.equal((await call('/api/auth/reset','POST',{resetToken:initialReset.token,newPassword:initialPassword})).status,200);
  assert.equal((await call('/api/auth/me','GET',undefined,platform)).status,401);
  assert.equal((await call('/api/auth/reset','POST',{resetToken:initialReset.token,newPassword:initialPassword})).status,400);
  platform=await login('PLATFORM','platform',initialPassword,'platform-owner-initial-login');
  assert.equal((await call('/api/auth/password','POST',{currentPassword:'wrong-password',newPassword:crypto.randomUUID()+'Aa!'},platform)).status,403);
  assert.equal((await call('/api/auth/password','POST',{currentPassword:initialPassword,newPassword:initialPassword},platform)).status,400);
  assert.equal((await call('/api/tenants','PATCH',{id:'PLATFORM',username:'bypass@example.test'},platform)).status,403);

  const profileResponse=await call('/api/auth/platform-owner','GET',undefined,platform);
  assert.equal(profileResponse.status,200);
  const profile=await profileResponse.json();
  assert.equal(profile.owner.email,'platform');
  assert.equal(profile.events.some(event=>event.type==='platform_owner_password_initialized'),true);
  assert.equal(JSON.stringify(profile.events).includes(initialPassword),false);

  assert.equal((await call('/api/auth/platform-owner','PATCH',{
    currentPassword:'incorrect-current-password',newEmail:'owner@example.test'
  },platform)).status,403);
  assert.equal((await call('/api/auth/platform-owner','PATCH',{
    currentPassword:initialPassword,newPassword:'AnotherStrongPassword!24',confirmPassword:'mismatch'
  },platform)).status,400);
  assert.equal((await call('/api/auth/platform-owner','PATCH',{
    currentPassword:initialPassword,newEmail:'ownera'
  },platform)).status,400);
  await db.prepare("INSERT INTO users(id,tenant_id,name,username,password_hash,role,status,permissions_json) VALUES('email-conflict','A','Conflict','taken@example.test',?,'cashier','active','{}')")
    .bind(await hashPassword(crypto.randomUUID()+'Aa!')).run();
  assert.equal((await call('/api/auth/platform-owner','PATCH',{
    currentPassword:initialPassword,newEmail:'taken@example.test'
  },platform)).status,409);

  const replacementPassword=crypto.randomUUID()+'Next!Aa';
  const changed=await call('/api/auth/platform-owner','PATCH',{
    currentPassword:initialPassword,newEmail:'owner@example.test',
    newPassword:replacementPassword,confirmPassword:replacementPassword
  },platform);
  assert.equal(changed.status,200,await changed.text());
  assert.equal((await call('/api/auth/me','GET',undefined,platform)).status,401);
  assert.equal((await call('/api/tenants/lookup','POST',{storeCode:'PLATFORM',username:'platform',password:initialPassword},undefined,'platform-owner-old-login')).status,401);
  platform=await login('PLATFORM','owner@example.test',replacementPassword,'platform-owner-replacement-login');
  const me=await call('/api/auth/me','GET',undefined,platform).then(response=>response.json());
  assert.equal(me.user.role,'super_admin');
  const events=await call('/api/auth/platform-owner','GET',undefined,platform).then(response=>response.json());
  const credentialEvent=events.events.find(event=>event.type==='platform_owner_credentials_changed');
  assert.deepEqual(credentialEvent.metadata.fields,['email','password']);
  assert.equal(credentialEvent.metadata.allSessionsRevoked,true);
  assert.equal(JSON.stringify(credentialEvent).includes(replacementPassword),false);
  assert.equal((await db.prepare("SELECT role FROM tenants WHERE id='PLATFORM'").first()).role,'super_admin');

  const genericPassword=crypto.randomUUID()+'Generic!Aa';
  const genericChange=await call('/api/auth/password','POST',{
    currentPassword:replacementPassword,newPassword:genericPassword
  },platform);
  assert.equal(genericChange.status,200,await genericChange.text());
  assert.equal((await call('/api/auth/me','GET',undefined,platform)).status,401);
  assert.equal((await call('/api/tenants/lookup','POST',{
    storeCode:'PLATFORM',username:'owner@example.test',password:replacementPassword
  },undefined,'platform-owner-generic-old-login')).status,401);
  platform=await login('PLATFORM','owner@example.test',genericPassword,'platform-owner-generic-new-login');
  const afterGeneric=await call('/api/auth/platform-owner','GET',undefined,platform).then(response=>response.json());
  assert.equal(afterGeneric.events.some(event=>event.type==='platform_owner_credentials_changed' &&
    event.metadata.fields.length===1 && event.metadata.fields[0]==='password'),true);
});
test('plaintext records never authenticate', async () => {
  await db.prepare("UPDATE tenants SET password_hash=? WHERE id='B'").bind(pass).run();
  assert.equal((await call('/api/tenants/lookup','POST',{storeCode:'B',username:'ownerB',password:pass},undefined,'plaintext-login-test')).status,401);
});
