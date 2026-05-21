/**
 * Batch Queue — debounce rapid-fire writes to avoid excessive Supabase calls
 *
 * Auto-mark behaviors (episode watched timer, chapter read 50%) fire rapidly.
 * This queue batches writes: flush every 5s OR when queue reaches 10 items.
 *
 * Risk 4 mitigation:
 *   - Listens for `visibilitychange` → flush immediately when tab hidden/closed
 *   - Listens for `beforeunload` → synchronous flush via sendBeacon before page unload
 */

import { getSupabase } from './supabase';

export interface BatchQueueConfig {
  debounceMs: number;
  maxQueue: number;
}

export const DEFAULT_BATCH_CONFIG: BatchQueueConfig = {
  debounceMs: 5000,
  maxQueue: 10,
};

// ── Internal state ────────────────────────────────────────────────────────────

interface QueuedWrite {
  writeFn: () => Promise<void>;
  timestamp: number;
}

let _queue: QueuedWrite[] = [];
let _timer: ReturnType<typeof setTimeout> | null = null;
let _config: BatchQueueConfig = DEFAULT_BATCH_CONFIG;
let _flushListenerAttached = false;

// ── Flush logic ────────────────────────────────────────────────────────────────

async function flush(): Promise<void> {
  if (_queue.length === 0) return;

  const writes = [..._queue];
  _queue = [];

  if (_timer !== null) {
    clearTimeout(_timer);
    _timer = null;
  }

  const supabase = getSupabase();
  if (!supabase) return;

  // Execute all writes in order, best-effort (non-blocking per write)
  for (const { writeFn } of writes) {
    try {
      await writeFn();
    } catch (e) {
      console.warn('[batchQueue] write failed:', e);
    }
  }
}

/**
 * Synchronous flush for beforeunload scenarios.
 * Replaces the async flush() with a synchronous sendBeacon approach.
 */
function flushSync(): void {
  if (_queue.length === 0) return;

  // Capture current queue
  const writes = [..._queue];
  _queue = [];

  if (_timer !== null) {
    clearTimeout(_timer);
    _timer = null;
  }

  // Serialize writes for sendBeacon
  const payload = new Blob([JSON.stringify({ writes })], { type: 'application/json' });
  navigator.sendBeacon('/api/batch', payload);
}

// ── Listeners ────────────────────────────────────────────────────────────────

function attachVisibilityListener(): void {
  if (_flushListenerAttached) return;
  _flushListenerAttached = true;

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flush();
    }
  });

  window.addEventListener('beforeunload', () => {
    // Use sendBeacon for synchronous flush before page unloads
    flushSync();
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Configure the batch queue (must be called before addToQueue for config to take effect).
 */
export function configureBatchQueue(config: Partial<BatchQueueConfig>): void {
  _config = { ..._config, ...config };
}

/**
 * Add a write function to the batch queue.
 * Triggers immediate flush if queue reaches maxQueue.
 * Otherwise resets the debounce timer.
 */
export function addToQueue(writeFn: () => Promise<void>): void {
  attachVisibilityListener();

  _queue.push({ writeFn, timestamp: Date.now() });

  if (_queue.length >= _config.maxQueue) {
    flush();
    return;
  }

  if (_timer !== null) {
    clearTimeout(_timer);
  }

  _timer = setTimeout(() => {
    flush();
  }, _config.debounceMs);
}

/**
 * Flush all pending writes immediately (bypasses debounce timer).
 */
export async function flushNow(): Promise<void> {
  await flush();
}

/**
 * Returns the number of pending writes in the queue.
 */
export function getPendingCount(): number {
  return _queue.length;
}

/**
 * Resets the queue without flushing (use with caution).
 */
export function clearBatchQueue(): void {
  _queue = [];
  if (_timer !== null) {
    clearTimeout(_timer);
    _timer = null;
  }
}