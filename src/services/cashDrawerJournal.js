import { openShift, postCashEvent, closeShift } from './cashShiftEngine.js';
import { assertVerifiedOfflineGrant } from './verifiedOfflineGrant.js';

const SHIFT_KEY = 'khodar_pos_cash_shifts_v1';
const part = value => encodeURIComponent(value);
const keyFor = ({ tenantId, branchId, drawerId, deviceId }) =>
  `braka:${part(tenantId)}:${part(branchId)}:${part(drawerId)}:${part(deviceId)}:cash_drawer_journal_v1`;

// Staged core only. Callers must cryptographically verify the server grant;
// this module is not yet wired to login, sales, sync, or the UI.
export async function commitDrawerShiftDurable(store, durable, locks, operation, input, verifiedClaims) {
  if (!store?.durable || store.durable !== durable || !durable?.commitBatch || !locks?.request)
    throw new Error('الحفظ الدائم المشترك أو قفل الدرج غير متاح');
  if (!input || input.actorId !== store.user?.id)
    throw new Error('هوية المحاسب لا تطابق صاحب السجل المالي');
  const owned = store.read(SHIFT_KEY) ?? [];
  const ownShift = operation === 'open' ? null : owned.find(row => row.id === input.shiftId);
  if (operation !== 'open' && !ownShift)
    throw new Error('الوردية لا تخص هذا المحاسب في السجل المحلي');
  const scope = operation === 'open'
    ? { tenantId:input.tenantId, branchId:input.branchId, drawerId:input.drawerId, deviceId:input.offlineDeviceId }
    : { tenantId:ownShift.tenantId, branchId:ownShift.branchId, drawerId:ownShift.drawerId, deviceId:ownShift.offlineDeviceId };
  if (Object.values(scope).some(value => typeof value !== 'string' || !value))
    throw new Error('هوية الدرج والجهاز غير صالحة');
  if (scope.tenantId !== store.user.tenantId || (operation !== 'open' && input.deviceId !== scope.deviceId))
    throw new Error('الدرج أو الجهاز لا يخص هذا السجل');
  if (operation === 'open')
    assertVerifiedOfflineGrant(verifiedClaims, { tenantId:scope.tenantId, cashierId:store.user.id,
      deviceId:scope.deviceId, branchId:scope.branchId }, input.at);
  const key = keyFor(scope);
  return locks.request(key, { ifAvailable:true }, async lock => {
    if (!lock) throw new Error('الدرج قيد الاستخدام على نافذة أخرى');
    const saved = await durable.read(key);
    if (saved && (saved.tenantId !== scope.tenantId || saved.branchId !== scope.branchId ||
        saved.drawerId !== scope.drawerId || saved.deviceId !== scope.deviceId ||
        !Number.isSafeInteger(saved.revision) || !Array.isArray(saved.shifts)))
      throw new Error('سجل الدرج المشترك غير صالح؛ لم تُحفظ العملية');
    const previous = saved?.shifts ?? [];
    if (ownShift && JSON.stringify(previous.find(row => row.id === ownShift.id)) !== JSON.stringify(ownShift))
      throw new Error('وردية المحاسب تختلف عن سجل الدرج؛ يلزم فحص البيانات قبل المتابعة');
    let shifts;
    if (operation === 'open') shifts = openShift(previous,input);
    else if (operation === 'cash') shifts = postCashEvent(previous,input);
    else if (operation === 'close') shifts = closeShift(previous,{...input,mode:'local',pendingEventCount:store.current.outbox.length});
    else throw new Error('عملية الوردية غير معروفة');
    const shiftId = operation === 'open' ? input.id : input.shiftId;
    const shift = shifts.find(row => row.id === shiftId);
    const nextJournal = { revision:(saved?.revision ?? -1)+1, ...scope, shifts };
    const eventId = operation === 'open' ? `cash-shift:${shiftId}:open` :
      operation === 'cash' ? `cash-shift:${shiftId}:cash:${input.id}` : `cash-shift:${shiftId}:close`;
    const wrapper = { commit:async (userKey,snapshot,expectedRevision) => {
      const [committed] = await durable.commitBatch([
        { key:userKey, snapshot, expectedRevision },
        { key, snapshot:nextJournal, expectedRevision:saved?.revision ?? null }
      ]);
      return committed;
    } };
    return store.transactDurable(() => {
      const local = store.read(SHIFT_KEY) ?? [];
      store.set(SHIFT_KEY,operation === 'open' ? [...local,shift] : local.map(row => row.id === shiftId ? shift : row));
      store.enqueue({ id:eventId, tenantId:scope.tenantId, branchId:scope.branchId,
        entityType:'cash_shift', entityId:shiftId, action:operation === 'open' ? 'create' : 'update',
        payload:shift, timestamp:Date.parse(input.at) });
      return shift;
    },wrapper);
  });
}
