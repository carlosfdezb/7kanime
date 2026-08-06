const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://animeav1-api-server.vercel.app';

export function isHlsStream(url: string): boolean {
  return url.includes('.m3u8') || url.includes('/m3u8/') || url.includes('/hls/playlist');
}

export function getStreamUrl(url: string): string {
  // Zilla segments reject cross-site requests (Sec-Fetch-Site check),
  // so route the playlist through the backend proxy which rewrites segments too
  if (/^https?:\/\/player\.zilla-networks\.com\/m3u8\//.test(url)) {
    return `${API_BASE}/hls/playlist?url=${encodeURIComponent(url)}`;
  }
  return url;
}
