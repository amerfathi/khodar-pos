/**
 * Cloudflare Edge Synchronization Service
 * ----------------------------------------------------
 * High-performance real-time background sync between Local POS (IndexedDB/LocalStorage)
 * and Cloudflare Edge (Workers & D1 Database).
 * 
 * Key Principles:
 * 1. Zero UI blocking: Cashier operations execute locally in <5ms.
 * 2. Real-time parity: Rapid delta polling (4s) + instant on-focus triggers.
 * 3. Offline-First: If network drops, mutations queue safely in LocalStorage.
 * 4. Automatic Recovery: Instant flush and pull once connectivity returns.
 * 5. Multi-Tenant isolation: Per-tenant sync cursor and state partitioning.
 */

import { getApiBaseUrl } from '../config/appVersion';

const QUEUE_STORAGE_KEY = 'khodar_offline_sync_queue';
const getTenantSyncKey = (tenantId) => `khodar_last_sync_timestamp_${tenantId || 'default'}`;

class CloudflareSyncService {
  constructor() {
    this.isSyncing = false;
    this.syncIntervalId = null;
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.listeners = new Set();
    this.updateHandler = null;
    this.currentTenantId = null;
    this.focusListenerAttached = false;

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notifyListeners('online');
        this.flushQueue();
        if (this.currentTenantId) {
          this.pullUpdates(this.currentTenantId, this.updateHandler);
        }
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
        this.flushQueue();
        this.pullUpdates(this.currentTenantId, this.updateHandler);
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
    return () => this.listeners.delete(callback);
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
    try {
      const data = localStorage.getItem(QUEUE_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  getQueueLength() {
    return this.getQueue().length;
  }

  saveQueue(queue) {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.warn('Failed to persist sync queue to localStorage:', e);
    }
  }

  // Record an action to sync (e.g. new invoice, expense, product, customer, stock change)
  recordMutation(tenantId, branchId, entityType, entityId, action, payload) {
    const queue = this.getQueue();
    const eventId = payload?.idempotencyKey 
      ? `evt_${tenantId}_${entityType}_${payload.idempotencyKey}_${action}`
      : `evt_${tenantId}_${entityType}_${entityId}_${action}`;

    // Prevent duplicate entries in local sync queue
    if (queue.some(e => e.id === eventId)) {
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
    this.saveQueue(queue);
    this.notifyListeners('queued', { event });

    // Attempt instant background flush if online
    if (this.isOnline && !this.isSyncing) {
      this.flushQueue();
    }
  }

  // Flush queued mutations to Cloudflare
  async flushQueue() {
    if (this.isSyncing || !this.isOnline) return;

    const queue = this.getQueue();
    if (queue.length === 0) return;

    this.isSyncing = true;
    this.notifyListeners('syncing');

    try {
      const tenantId = queue[0].tenantId;
      const branchId = queue[0].branchId;
      const batch = queue.slice(0, 100); // Process in batches of 100

      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/sync/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          branchId,
          events: batch
        })
      });

      if (response.ok) {
        // Remove processed events from queue
        const remainingQueue = this.getQueue().slice(batch.length);
        this.saveQueue(remainingQueue);
        this.notifyListeners('synced_batch', { count: batch.length });

        // If more items remain, flush next batch
        if (remainingQueue.length > 0) {
          setTimeout(() => this.flushQueue(), 100);
        } else {
          // Immediately pull to stay completely in lockstep with cloud
          if (tenantId) {
            this.pullUpdates(tenantId, this.updateHandler);
          }
        }
      } else {
        console.warn('Cloudflare sync returned non-200 status:', response.status);
      }
    } catch (err) {
      // Network error or offline
      console.warn('Cloudflare sync failed (will retry automatically):', err.message);
    } finally {
      this.isSyncing = false;
      this.notifyListeners('idle');
    }
  }

  // Pull latest updates from Cloudflare edge
  async pullUpdates(tenantId, onUpdatesReceived = null, forceSince = null) {
    if (!this.isOnline || !tenantId) return 0;

    const syncKey = getTenantSyncKey(tenantId);
    const lastSync = forceSince !== null ? forceSince : parseInt(localStorage.getItem(syncKey) || '0', 10);
    const callback = onUpdatesReceived || this.updateHandler;

    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/sync/pull?tenantId=${encodeURIComponent(tenantId)}&since=${lastSync}`);
      if (!res.ok) return 0;

      const data = await res.json();
      if (data.success && Array.isArray(data.events) && data.events.length > 0) {
        localStorage.setItem(syncKey, String(data.latestTimestamp || Date.now()));
        if (typeof callback === 'function') {
          callback(data.events);
        }
        this.notifyListeners('synced_inbound', { count: data.events.length });
        return data.events.length;
      }
      return 0;
    } catch (err) {
      console.warn('Cloudflare pull error:', err.message);
      return 0;
    }
  }

  // Fetch the latest full snapshot backup from Cloudflare D1
  async fetchLatestSnapshot(tenantId) {
    if (!this.isOnline || !tenantId) return null;

    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/backup?tenantId=${encodeURIComponent(tenantId)}&latest=true`);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          snapshot: fullSnapshotData,
          version: '2.6.1'
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

    this.notifyListeners('syncing');
    await this.flushQueue();
    const pulled = await this.pullUpdates(targetTenant, onUpdatesReceived || this.updateHandler);
    this.notifyListeners('idle', { pulledCount: pulled });
    return { success: true, pulledCount: pulled };
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
      this.flushQueue();
      this.pullUpdates(tenantId, this.updateHandler);
    }

    this.syncIntervalId = setInterval(() => {
      if (this.isOnline && this.currentTenantId) {
        this.flushQueue();
        this.pullUpdates(this.currentTenantId, this.updateHandler);
      }
    }, intervalMs);
  }

  stopAutoSync() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }
}

export const cloudflareSync = new CloudflareSyncService();
