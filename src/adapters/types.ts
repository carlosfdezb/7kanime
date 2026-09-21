/**
 * Sync Adapter Contract
 *
 * The HTTP adapters (favorites/watched/preferences) implement this same
 * interface so the stores can stay agnostic of the backend.
 */

export interface SyncAdapter<T> {
  getAll(): T[];
  upsert(item: T): void;
  remove(id: string | number): void;
  hydrate(): Promise<void>;
  isEnabled(): boolean;
}

export interface WithId {
  id: number;
}

export interface WithStringId {
  id: string;
}
