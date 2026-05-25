export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  return (
    /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function shouldUseNativePdfIframe(): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  if (isIosDevice()) {
    return false;
  }
  return window.matchMedia("(min-width: 1024px)").matches;
}
