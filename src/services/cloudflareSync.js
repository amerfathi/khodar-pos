/**
 * Cloudflare Edge Synchronization Service
 * ----------------------------------------------------
 * High-performance background sync between Local POS (IndexedDB/LocalStorage)
 * and Cloudflare Edge (Workers & D1 Database).
 * 
 * Key Principles:
 * 1. Zero UI blocking: Cashier operations always execute in <5ms locally.
 * 2. Offline-First: If network drops, events queue safely in LocalStorage.
 * 3. Automatic Recovery: Flushes queue immediately once internet returns.
 */

const QUEUE_STORAGE_KEY = 'khodar_offline_sync_queue';
const LAST_SYNC_KEY = 'khodar_last_sync_timestamp';

class CloudflareSyncService {
  constructor() {
    this.isSyncing = false;
    this.syncIntervalId = null;
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.listeners = new Set();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notifyListeners('online');
        this.flushQueue();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notifyListeners('offline');
      });
    }
  }

  // Subscribe to sync status changes (for UI indicators)
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(status, details = {}) {
    for (const cb of this.listeners) {
      try {
        cb({ status, isOnline: this.isOnline, queueLength: this.getQueueLength(), ...details });
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

  // Record an action to sync (e.g. new invoice, expense, stock change)
  recordMutation(tenantId, branchId, entityType, entityId, action, payload) {
    const queue = this.getQueue();
    const event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
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

      const response = await fetch('/api/sync/push', {
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
  async pullUpdates(tenantId, onUpdatesReceived) {
    if (!this.isOnline || !tenantId) return;

    const lastSync = parseInt(localStorage.getItem(LAST_SYNC_KEY) || '0', 10);

    try {
      const res = await fetch(`/api/sync/pull?tenantId=${encodeURIComponent(tenantId)}&since=${lastSync}`);
      if (!res.ok) return;

      const data = await res.json();
      if (data.success && Array.isArray(data.events) && data.events.length > 0) {
        localStorage.setItem(LAST_SYNC_KEY, String(data.latestTimestamp || Date.now()));
        if (typeof onUpdatesReceived === 'function') {
          onUpdatesReceived(data.events);
        }
      }
    } catch (err) {
      console.warn('Cloudflare pull error:', err.message);
    }
  }

  // Automated full snapshot backup to Cloudflare R2 / D1
  async uploadBackupSnapshot(tenantId, fullSnapshotData) {
    if (!tenantId || !fullSnapshotData) return false;

    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          snapshot: fullSnapshotData,
          version: '2.5.0'
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

  // Start periodic sync daemon (runs every 30 seconds)
  startAutoSync(tenantId, intervalMs = 30000) {
    this.stopAutoSync();
    this.syncIntervalId = setInterval(() => {
      this.flushQueue();
      if (tenantId) {
        this.pullUpdates(tenantId);
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
