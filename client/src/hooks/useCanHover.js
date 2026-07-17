import { useState, useEffect } from 'react';

/**
 * Detects if the device has a primary pointer with hover capability.
 * This is more reliable than screen width for determining if touch interactions
 * (like hiding hover elements) should be used.
 */
export function useCanHover() {
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    setCanHover(mediaQuery.matches);

    const listener = (e) => setCanHover(e.matches);
    // Use the modern API (addEventListener) if available, fallback for older browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(listener);
      return () => mediaQuery.removeListener(listener);
    }
  }, []);

  return canHover;
}
