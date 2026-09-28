/**
 * Cloudflare Edge Synchronization Service
 * ----------------------------------------------------
 * Background sync between the local POS aggregate and Cloudflare Edge.
 * and Cloudflare Edge (Workers & D1 Database).
 * 
 * Key Principles:
 * 1. A server push is acknowledged locally only after the aggregate queue commit.
 * 2. Rapid delta polling (4s) + instant on-focus triggers.
 * 3. Pending mutations remain in the aggregate across retryable network failures.
 * 4. Flush and pull resume once connectivity returns.
 * 5. Multi-Tenant isolation: Per-tenant sync cursor and state partitioning.
 */

import { getApiBaseUrl } from '../config/appVersion.js';

const QUEUE_STORAGE_KEY = 'khodar_offline_sync_queue';
const getTenantSyncKey = (tenantId) => `braka_sync_cursor_v2_${tenantId}_${getSessionUser()?.id || 'none'}`;
import { getSessionToken, getSessionUser } from './authSession.js';
const authHeaders = () => {
  const token = getSessionToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export function selectSyncBatch(queue) {
  let count = Math.min(queue.length, 100);
  if (count < queue.length && queue[count - 1].groupId && queue[count - 1].groupId === queue[count].groupId) {
    const splitGroup = queue[count].groupId;
    while (count > 0 && queue[count - 1].groupId === splitGroup) count--;
  }
  if (count === 0) throw new Error('Sync group exceeds server batch limit');
  return queue.slice(0, count);
}

export class CloudflareSyncService {
  constructor() {
    this.isSyncing = false;
    this.isPulling = false;
    this.generation = 0;
    this.lastError = null;
    this.syncIntervalId = null;
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.listeners = new Set();
    this.repository = null;
    this.updateHandler = null;
    this.currentTenantId = null;
    this.focusListenerAttached = false;

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notifyListeners('online');
        this.flushQueue().then(clear=>{ if (clear && this.currentTenantId) this.pullUpdates(this.currentTenantId, this.updateHandler); });
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notifyListeners('offline');
      });

      this.setupFocusListeners();
    }
  }

  setupFocusListeners() {
    if (this.focusListenerAttached || typeof window === 'undefined') return;

    const onWindowActive = () => {
      if (this.isOnline && this.currentTenantId && !this.isSyncing) {
        this.flushQueue().then(clear=>{ if(clear) this.pullUpdates(this.currentTenantId, this.updateHandler); });
      }
    };

    window.addEventListener('focus', onWindowActive);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        onWindowActive();
      }
    });

    this.focusListenerAttached = true;
  }

  // Subscribe to sync status changes (for UI indicators)
  subscribe(callback) {
    this.listeners.add(callback);
    return () => { this.listeners.delete(callback); };
  }

  notifyListeners(status, details = {}) {
    for (const cb of this.listeners) {
      try {
        cb({ 
          status, 
          isOnline: this.isOnline, 
          queueLength: this.getQueueLength(), 
          lastSyncTime: Date.now(),
          ...details 
        });
      } catch (err) {
        console.error('Error in sync listener:', err);
      }
    }
  }

  getQueue() {
    if (this.repository) return this.repository.current.outbox;
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    const queue = raw === null ? [] : JSON.parse(raw);
    if (!Array.isArray(queue) || queue.some(event => !event || typeof event.id !== 'string')) {
      throw new Error('Invalid sync queue; original storage has been preserved for recovery');
    }
    return queue;
  }

  getQueueLength() {
    return this.getQueue().filter(event => event.tenantId === getSessionUser()?.tenantId).length;
  }

  saveQueue(queue) {
    // Quota/corruption must never be mistaken for an empty, successfully saved queue.
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  }

  // Record an action to sync (e.g. new invoice, expense, product, customer, stock change)
  recordMutation(tenantId, branchId, entityType, entityId, action, payload) {
    const queue = [...this.getQueue()];
    const eventId = payload?.idempotencyKey 
      ? `evt_${tenantId}_${entityType}_${payload.idempotencyKey}_${action}`
      : `evt_${crypto.randomUUID()}`;

    // Prevent duplicate entries in local sync queue
    if (!this.repository && queue.some(e => e.id === eventId)) {
      return;
    }

    const event = {
      id: eventId,
      tenantId,
      branchId,
      entityType,
      entityId,
      action,
      payload,
      timestamp: Date.now()
    };

    queue.push(event);
    if (this.repository) {
      // Do not flush uncommitted draft state. The periodic sync sees only the commit.
      this.repository.enqueue(event);
      return;
    }
    this.saveQueue(queue);
    this.notifyListeners('queued', { event });

    // Attempt instant background flush if online
    if (this.isOnline && !this.isSyncing) {
      this.flushQueue();
    }
  }

  // Flush queued mutations to Cloudflare
  async flushQueue({ pullAfterFlush = true } = {}) {
    if (this.isSyncing || !this.isOnline || !getSessionToken() || !this.currentTenantId) return false;

    const queue = this.getQueue().filter(event => event.tenantId === this.currentTenantId);
    if (queue.length === 0) return true;

    const token = getSessionToken();
    const generation = this.generation;
    this.isSyncing = true;
    this.notifyListeners('syncing');

    try {
      const tenantId = queue[0].tenantId;
      // Preserve commit order across branch and tenant-level events. Never split
      // a local aggregate transaction across two server transactions.
      const batch = selectSyncBatch(queue);

      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/sync/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          tenantId,
          events: batch
        })
      });

      if (token !== getSessionToken() || generation !== this.generation) return;
      if (response.ok) {
        // Remove processed events from queue
        const result = await response.json();
        if (!result.success || !Array.isArray(result.acceptedIds)) throw new Error('Server did not acknowledge mutations');
        const accepted = new Set(result.acceptedIds);
        if (accepted.size !== batch.length || result.acceptedIds.length !== batch.length ||
            batch.some(event => !accepted.has(event.id)))
          throw new Error('Server returned incomplete or unrelated mutation acknowledgement');
        const remainingQueue = this.getQueue().filter(event => !accepted.has(event.id));
        if (this.repository?.durable) await this.repository.acknowledgeDurable(accepted);
        else if (this.repository) this.repository.acknowledge(accepted);
        else this.saveQueue(remainingQueue);
        this.lastError = null;
        this.notifyListeners('synced_batch', { count: batch.length });

        // If more items remain, flush next batch
        if (remainingQueue.length > 0) {
          setTimeout(() => this.flushQueue(), 100);
        } else {
          // Immediately pull to stay completely in lockstep with cloud
          if (tenantId && pullAfterFlush) {
            this.pullUpdates(tenantId, this.updateHandler);
          }
        }
        return remainingQueue.length === 0;
      } else {
        const details=await response.json().catch(()=>null);
        throw new Error(response.status===409
          ? 'تعارض بين جهازين: لم تُرفع الحركة المحلية. زامن وراجع الحركة قبل إعادة المحاولة'
          : details?.error || `Sync push failed: HTTP ${response.status}`);
      }
    } catch (err) {
      this.lastError = err.message;
      this.notifyListeners('error', { error: err.message });
      console.warn('Cloudflare sync failed (will retry automatically):', err.message);
      return false;
    } finally {
      this.isSyncing = false;
      if (!this.lastError) this.notifyListeners('idle');
    }
  }

  // Pull latest updates from Cloudflare edge
  async pullUpdates(tenantId, onUpdatesReceived = null, forceSince = null) {
    if (!this.isOnline || !tenantId || !getSessionToken() || this.isPulling) return 0;
    if (this.repository?.current.outbox.some(event=>event.tenantId===tenantId)) return 0;
    const token = getSessionToken();
    const generation = this.generation;
    this.isPulling = true;

    const syncKey = getTenantSyncKey(tenantId);
    const lastSync = forceSince !== null ? forceSince : this.repository ? this.repository.current.cursor : parseInt(localStorage.getItem(syncKey) || '0', 10);
    const callback = onUpdatesReceived || this.updateHandler;

    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/sync/pull?tenantId=${encodeURIComponent(tenantId)}&cursor=${lastSync}`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Sync pull failed: HTTP ${res.status}`);
      if (token !== getSessionToken() || generation !== this.generation) return 0;

      const data = await res.json();
      if (token !== getSessionToken() || generation !== this.generation) return 0;
      if (data.success && Array.isArray(data.events)) {
        // CRITICAL FIX: only advance cursor using the real server_timestamp from D1.
        // NEVER use Date.now() fallback — it jumps the cursor into the future and
        // causes any events pushed from Desktop/Mobile to be permanently skipped.
        if (typeof callback !== 'function') throw new Error('No durable sync receiver');
        await callback(data.events, data.nextCursor, data.conflictHeads);
        if (token !== getSessionToken() || generation !== this.generation) return 0;
        if (!this.repository && Number.isSafeInteger(data.nextCursor)) localStorage.setItem(syncKey, String(data.nextCursor));
        this.notifyListeners('synced_inbound', { count: data.events.length });
        return data.events.length;
      }

      throw new Error('Invalid sync response');
    } catch (err) {
      this.lastError = err.message;
      this.notifyListeners('error', { error: err.message });
      console.warn('Cloudflare pull error:', err.message);
      return 0;
    } finally {
      this.isPulling = false;
    }
  }

  // Fetch the latest full snapshot backup from Cloudflare D1
  async fetchLatestSnapshot(tenantId) {
    if (!this.isOnline || !tenantId) return null;

    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/backup?tenantId=${encodeURIComponent(tenantId)}&latest=true`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.backup?.snapshot) {
          return data.backup.snapshot;
        }
      }
      return null;
    } catch (err) {
      console.warn('Failed to fetch latest cloud snapshot:', err);
      return null;
    }
  }

  // Automated full snapshot backup to Cloudflare R2 / D1
  async uploadBackupSnapshot(tenantId, fullSnapshotData) {
    if (!tenantId || !fullSnapshotData) return false;

    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/backup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          tenantId,
          snapshot: fullSnapshotData,
          version: '2.6.4'
        })
      });

      if (res.ok) {
        const result = await res.json();
        return result.success;
      }
      return false;
    } catch (err) {
      console.warn('Automated cloud backup failed:', err);
      return false;
    }
  }

  // Trigger immediate bidirectional sync on demand
  async syncNow(tenantId, onUpdatesReceived = null) {
    const targetTenant = tenantId || this.currentTenantId;
    if (!targetTenant) return { success: false, error: 'No active tenant' };

    if (!this.isOnline || !getSessionToken()) return { success: false, error: 'Offline or unauthenticated' };
    if (this.isSyncing || this.isPulling) return { success: false, error: 'Sync already in progress' };
    this.lastError = null;
    this.notifyListeners('syncing');
    const clear = await this.flushQueue({ pullAfterFlush: false });
    if (!clear && !this.lastError) {
      this.lastError = 'لم تكتمل مزامنة العمليات المعلقة؛ أعد المحاولة';
      this.notifyListeners('error', { error: this.lastError });
    }
    const pulled = clear ? await this.pullUpdates(targetTenant, onUpdatesReceived || this.updateHandler) : 0;
    if (!this.lastError) this.notifyListeners('idle', { pulledCount: pulled });
    return { success: clear && !this.lastError, pulledCount: pulled, ...(this.lastError ? { error: this.lastError } : {}) };
  }

  // Set handler for applying inbound synced events to local store
  setUpdateHandler(handler) {
    this.updateHandler = handler;
  }

  // Start periodic sync daemon (default: rapid 4-second polling for real-time experience)
  startAutoSync(tenantId, onUpdatesReceived = null, intervalMs = 4000) {
    this.currentTenantId = tenantId;
    if (onUpdatesReceived) {
      this.updateHandler = onUpdatesReceived;
    }
    this.stopAutoSync();

    // Immediate initial sync (do not wait for first timer tick!)
    if (tenantId && this.isOnline) {
      this.flushQueue().then(clear=>{ if(clear) this.pullUpdates(tenantId, this.updateHandler); });
    }

    this.syncIntervalId = setInterval(() => {
      if (this.isOnline && this.currentTenantId) {
        this.flushQueue().then(clear=>{ if(clear) this.pullUpdates(this.currentTenantId, this.updateHandler); });
      }
    }, intervalMs);
  }

  stopAutoSync() {
    this.generation++;
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }
}

export const cloudflareSync = new CloudflareSyncService();
