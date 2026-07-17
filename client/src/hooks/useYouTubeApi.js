/**
 * useYouTubeApi — lazily injects the YouTube IFrame API script exactly once.
 *
 * Returns a Promise that resolves to `window.YT` when the API is ready.
 * Safe to call concurrently from multiple components — they share one injection.
 */

let apiReady = false;
let pendingResolvers = [];

function onYouTubeIframeAPIReady() {
  apiReady = true;
  pendingResolvers.forEach((resolve) => resolve(window.YT));
  pendingResolvers = [];
}

// Expose globally so YouTube can call it
if (typeof window !== 'undefined') {
  const prev = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    if (prev) prev();
    onYouTubeIframeAPIReady();
  };
}

let injected = false;

export function loadYouTubeApi() {
  return new Promise((resolve) => {
    if (apiReady) {
      return resolve(window.YT);
    }

    pendingResolvers.push(resolve);

    if (!injected) {
      injected = true;
      const script = document.createElement('script');
      script.src   = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.head.appendChild(script);
    }
  });
}
