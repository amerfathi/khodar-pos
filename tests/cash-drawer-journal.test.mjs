import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AtomicStore } from '../src/services/atomicStore.js';
import * as journal from '../src/services/cashDrawerJournal.js';
import { verifySignedOfflineGrant } from '../src/services/verifiedOfflineGrant.js';

const cache = () => ({ rows:new Map(), getItem(key){return this.rows.get(key)??null;},
  setItem(key,value){this.rows.set(key,String(value));}, removeItem(key){this.rows.delete(key);} });
const locks = { async request(_key,_options,fn){return fn({});}, async query(){return {held:[],pending:[]};} };
const durable = () => ({ rows:new Map(), fail:false,
  async read(key){return structuredClone(this.rows.get(key)??null);},
  async commit(key,value,expectedRevision){
    if ((this.rows.get(key)?.revision??null)!==expectedRevision) throw Error('Revision conflict');
    this.rows.set(key,structuredClone(value));return structuredClone(value);
  },
  async commitBatch(entries){
    if(this.fail)throw Error('Injected paired commit failure');
    for(const entry of entries)if((this.rows.get(entry.key)?.revision??null)!==entry.expectedRevision)throw Error('Revision conflict');
    for(const entry of entries)this.rows.set(entry.key,structuredClone(entry.snapshot));
    return entries.map(entry=>structuredClone(entry.snapshot));
  }
});
const storeFor = async (id,disk,storage) => {
  const store=new AtomicStore({id,tenantId:'tenant-a'},{},storage,{durableFirst:true});
  assert.equal(await store.acquire(locks,disk),true);return store;
};
const grant = cashierId => ({tenantId:'tenant-a',cashierId,deviceId:'device-1',branchIds:['branch-1'],onlineVerifiedAt:'2026-10-01T17:00:00Z'});
const keys = await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
const publicJwk = await crypto.subtle.exportKey('jwk',keys.publicKey);
const signedGrant = async cashierId => {
  const claims=grant(cashierId);
  const signature=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},keys.privateKey,
    new TextEncoder().encode(JSON.stringify(claims)));
  return verifySignedOfflineGrant({claims,signature:Buffer.from(signature).toString('base64url')},publicJwk);
};
const open = (id,actorId,at) => ({id,tenantId:'tenant-a',branchId:'branch-1',drawerId:'drawer-1',actorId,
  offlineDeviceId:'device-1',openingCash:100,at,timeZone:'Asia/Riyadh'});
const close = (id,actorId,at) => ({shiftId:id,actorId,deviceId:'device-1',countedCash:100,at});

test('two pre-enrolled cashier claim fixtures hand over a local drawer without mixing user records',async()=>{
  assert.equal(typeof journal.commitDrawerShiftDurable,'function');
  const disk=durable(),storage=cache();
  const first=await storeFor('cashier-1',disk,storage),second=await storeFor('cashier-2',disk,storage);
  await journal.commitDrawerShiftDurable(first,disk,locks,'open',open('shift-1','cashier-1','2026-10-01T18:00:00Z'),await signedGrant('cashier-1'));
  await journal.commitDrawerShiftDurable(first,disk,locks,'close',close('shift-1','cashier-1','2026-10-01T19:00:00Z'),await signedGrant('cashier-1'));
  await journal.commitDrawerShiftDurable(second,disk,locks,'open',open('shift-2','cashier-2','2026-10-01T19:01:00Z'),await signedGrant('cashier-2'));
  assert.deepEqual(first.value.state.khodar_pos_cash_shifts_v1.map(row=>row.id),['shift-1']);
  assert.deepEqual(second.value.state.khodar_pos_cash_shifts_v1.map(row=>row.id),['shift-2']);
  const shared=[...disk.rows.entries()].find(([key])=>key.endsWith(':cash_drawer_journal_v1'))?.[1];
  assert.deepEqual(shared.shifts.map(row=>[row.id,row.actorId,row.status]),[
    ['shift-1','cashier-1','closed_local'],['shift-2','cashier-2','open']]);
  await first.close();await second.close();
  const reopened=await storeFor('cashier-2',disk,storage);
  assert.equal(reopened.value.state.khodar_pos_cash_shifts_v1[0].id,'shift-2');
  await reopened.close();
});

test('failed paired commit cannot open a shift only in one of the two records',async()=>{
  assert.equal(typeof journal.commitDrawerShiftDurable,'function');
  const disk=durable(),storage=cache(),first=await storeFor('cashier-1',disk,storage);
  disk.fail=true;
  await assert.rejects(journal.commitDrawerShiftDurable(first,disk,locks,'open',open('shift-1','cashier-1','2026-10-01T18:00:00Z'),await signedGrant('cashier-1')),/Injected paired commit failure/);
  assert.deepEqual(first.value.state,{});
  assert.equal([...disk.rows.keys()].some(key=>key.endsWith(':cash_drawer_journal_v1')),false);
  await first.close();
});

test('unsigned caller-provided claims cannot authorize an offline drawer opening',async()=>{
  const disk=durable(),storage=cache(),first=await storeFor('cashier-1',disk,storage);
  await assert.rejects(journal.commitDrawerShiftDurable(first,disk,locks,'open',
    open('shift-unsigned','cashier-1','2026-10-01T18:00:00Z'),grant('cashier-1')),/توقيع|موثوق/);
  assert.deepEqual(first.value.state,{});
  await first.close();
});

test('altering signed cashier or branch claims invalidates the offline grant',async()=>{
  const claims=grant('cashier-1');
  const signature=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},keys.privateKey,
    new TextEncoder().encode(JSON.stringify(claims)));
  const envelope={claims,signature:Buffer.from(signature).toString('base64url')};
  await assert.rejects(verifySignedOfflineGrant({...envelope,claims:{...claims,cashierId:'cashier-2'}},publicJwk),/توقيع/);
  await assert.rejects(verifySignedOfflineGrant({...envelope,claims:{...claims,branchIds:['branch-2']}},publicJwk),/توقيع/);
});
