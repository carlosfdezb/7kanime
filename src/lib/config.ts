/**
 * Runtime config — read once from Vite env vars.
 *
 * VITE_API_BASE: base URL of the lite backend. Defaults to the same host the
 *   front is served from on port 3000 (suitable for local dev).
 * VITE_CLERK_PUBLISHABLE_KEY: removed in the lite build.
 */

const inferredBase = (() => {
  if (typeof window === 'undefined') return '';
  const { protocol, hostname } = window.location;
  // When served from a non-standard port, assume the API lives on the same host
  // but port 3000. Production deployments should set VITE_API_BASE explicitly.
  return `${protocol}//${hostname}:3000`;
})();

export const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ?? inferredBase;

/**
 * Device id singleton. Generated once per browser, persisted in localStorage.
 * Used as the X-Device-Id header on every /api/* call.
 */

const DEVICE_ID_KEY = 'animeav1-device-id';

function uuidv4(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Fallback (very unlikely to run, but keeps TS happy)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'ssr-placeholder';
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}
