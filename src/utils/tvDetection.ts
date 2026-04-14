/**
 * Detects if the current browser is a TV-based browser
 * based on User-Agent analysis.
 */
export const isTVBrowser = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();

  return (
    ua.includes('tv') ||
    ua.includes('smarttv') ||
    ua.includes('googletv') ||
    ua.includes('apple-tv') ||
    ua.includes('hbbtv') ||
    // LG WebOS
    ua.includes('webos') ||
    // Samsung Tizen
    ua.includes('tizen') ||
    // PlayStation
    ua.includes('playstation') ||
    // Xbox
    ua.includes('xbox')
  );
};
