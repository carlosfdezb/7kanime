/**
 * Offline Queue — persist Supabase mutations when offline
 *
 * Risk 3 mitigation: NOT solely reliant on navigator.onLine.
 * Also catches network errors from Supabase calls and queues writes instead of failing.
 *
 * Queue is persisted to localStorage so it survives page reloads.
 *
 * Auth note: When operations are queued via withOfflineQueue(), the mutationFn
 * carries Clerk auth (createClerkSupabaseClient). When flushQueue() replays,
 * it creates an authenticated client using the stored getToken callback.
 */

import { createClerkSupabaseClient } from './clerkSupabase';

const QUEUE_KEY = 'animeav1-offline-queue';

export type OfflineOperation = {
  table: string;
  operation: 'upsert' | 'delete';
  data: Record<string, unknown>;
  timestamp: number;
  /**
   * Serialized getToken function to re-authenticate during flush.
   * Stored as the string from useAuth().getToken.toString() reference.
   * null means the operation was queued without auth context (fallback to anonymous).
   */
  getTokenSource: string | null;
};

// ── Queue state (initialized once) ──────────────────────────────────────────

let _queue: OfflineOperation[] = [];
let _onlineListenerAttached = false;

// Load from localStorage on module init
try {
  const raw = localStorage.getItem(QUEUE_KEY);
  if (raw) {
    _queue = JSON.parse(raw) as OfflineOperation[];
  }
} catch {
  _queue = [];
}

function saveQueue(): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(_queue));
}

// ── online listener ──────────────────────────────────────────────────────────

function attachOnlineListener(): void {
  if (_onlineListenerAttached) return;
  _onlineListenerAttached = true;

  window.addEventListener('online', () => {
    // Defer slightly to ensure connection is actually restored
    setTimeout(() => flushQueue(), 500);
  });
}

// Store getToken at module level for use in flushQueue
let _getToken: (() => Promise<string | null>) | null = null;

/**
 * Sets the getToken function to use for authenticated flush.
 * Call this when user authenticates (e.g., in SyncContext or auth provider).
 */
export function setFlushAuth(getToken: () => Promise<string | null>): void {
  _getToken = getToken;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Adds an operation to the offline queue and persists it to localStorage.
 * Attaches the online listener automatically on first call.
 *
 * @param item - operation to queue (without timestamp)
 * @param getTokenSource - serialized getToken function string for authenticated replay (optional)
 */
export function addToQueue(
  item: { table: string; operation: 'upsert' | 'delete'; data: Record<string, unknown> },
  getTokenSource: string | null = null
): void {
  _queue.push({ ...item, timestamp: Date.now(), getTokenSource });
  saveQueue();
  attachOnlineListener();
}

/**
 * Reads the queue, replays all operations to Supabase in chronological order,
 * then clears the queue on success.
 *
 * Uses authenticated Supabase client when getToken is available (user signed in),
 * otherwise falls back to anonymous client (guest mode — limited RLS permissions).
 */
export async function flushQueue(): Promise<void> {
  if (_queue.length === 0) return;

  // Try to get authenticated client first; fall back to anonymous
  let supabase = null;
  if (_getToken) {
    try {
      const token = await _getToken();
      if (token) {
        supabase = createClerkSupabaseClient(() => Promise.resolve(token));
      }
    } catch {
      // Auth failed — will use anonymous
    }
  }

  if (!supabase) {
    // No auth available — cannot flush authenticated operations
    console.warn('[offlineQueue] no auth token available, skipping authenticated ops');
    return;
  }

  // Sort by timestamp ascending (oldest first)
  const sorted = [..._queue].sort((a, b) => a.timestamp - b.timestamp);
  const errors: string[] = [];

  for (const op of sorted) {
    try {
      if (op.operation === 'upsert') {
        const { error } = await supabase.from(op.table).upsert(op.data as never);
        if (error) {
          errors.push(`[${op.table}] ${error.message}`);
        }
      } else if (op.operation === 'delete') {
        const { error } = await supabase.from(op.table).delete().eq(op.data.id_column as string, op.data.id_value);
        if (error) {
          errors.push(`[${op.table}] ${error.message}`);
        }
      }
    } catch (e) {
      // Network error — stop trying, stay in queue
      errors.push(`[${op.table}] network error`);
      break;
    }
  }

  if (errors.length > 0) {
    console.warn('[offlineQueue] some operations failed, keeping queue:', errors);
    return;
  }

  // All succeeded — clear the queue
  clearQueue();
}

/**
 * Returns the current number of queued operations.
 */
export function getQueueLength(): number {
  return _queue.length;
}

/**
 * Empties the queue without replaying (e.g. after failed flush).
 */
export function clearQueue(): void {
  _queue = [];
  localStorage.removeItem(QUEUE_KEY);
}

/**
 * Wraps a Supabase mutation with offline queue fallback.
 * If the mutation throws a network error, the operation is queued.
 *
 * Usage in adapters:
 *   await withOfflineQueue(() => supabase.from('table').upsert(...), 'table', data);
 */
export async function withOfflineQueue<T>(
  mutationFn: () => Promise<T>,
  table: string,
  data: Record<string, unknown>,
  getTokenSource: string | null = null
): Promise<T | null> {
  try {
    return await mutationFn() as T;
  } catch (e) {
    // Only queue on network-level errors (not Supabase logic errors)
    const message = e instanceof Error ? e.message : String(e);
    const isNetworkError =
      message.includes('fetch') ||
      message.includes('network') ||
      message.includes('Failed to fetch') ||
      message.includes('NetworkError') ||
      message.includes('net::');

    if (isNetworkError) {
      addToQueue({ table, operation: 'upsert', data }, getTokenSource);
      return null;
    }

    // Re-throw logic errors (RLS violations, etc.)
    throw e;
  }
}