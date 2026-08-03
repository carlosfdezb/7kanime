export function isHlsStream(url: string): boolean {
  return url.includes('.m3u8') || url.includes('/m3u8/');
}
