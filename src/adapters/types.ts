/**
 * Sync Adapter Contract
 *
 * All sync adapters (localStorage and Supabase) MUST implement this interface.
 * The adapter intercepts mutations so stores remain agnostic to the backend.
 */

export interface BatchQueueConfig {
  /** Debounce flush interval in ms */
  debounceMs: number;
  /** Max queue size before immediate flush */
  maxQueue: number;
}

export const DEFAULT_BATCH_CONFIG: BatchQueueConfig = {
  debounceMs: 5000,
  maxQueue: 10,
};

export interface SyncAdapter<T> {
  /**
   * Retrieve all items from the backend.
   * For localStorage adapter: reads from localStorage.
   * For Supabase adapter: fetches from remote and hydrates local state.
   */
  getAll(): T[];

  /**
   * Insert or update a single item.
   * For guest mode (localStorage): writes directly.
   * For authenticated (Supabase): writes to remote table.
   */
  upsert(item: T): void;

  /**
   * Remove an item by its unique identifier.
   * @param id - The item's id (string or number)
   */
  remove(id: string | number): void;

  /**
   * Fetch all remote data and merge into local state.
   * Only meaningful for remote (Supabase) adapters.
   * No-op for localStorage adapters.
   */
  hydrate(): Promise<void>;

  /**
   * Returns true when the adapter is active and able to perform remote operations.
   * For localStorage adapter: always true.
   * For Supabase adapter: true when authenticated and client available.
   */
  isEnabled(): boolean;
}

/**
 * Represents an item with a numeric id field.
 * Used to type-guard adapter operations.
 */
export interface WithId {
  id: number;
}

/**
 * Represents an item with a string id field.
 */
export interface WithStringId {
  id: string;
}