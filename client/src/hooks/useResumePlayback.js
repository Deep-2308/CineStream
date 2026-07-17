import { useCallback } from 'react';
import { useAuthStore } from '../store/authStore.js';

/**
 * useResumePlayback — localStorage-backed resume-point hook.
 *
 * Phase 8 will swap the storage layer for the interactions API
 * without changing this hook's external signature.
 *
 * @param {string}  originalId      MongoDB _id of the Original
 * @param {number}  durationSeconds Total runtime (used to detect "finished")
 *
 * @returns {{ resumeAt: number, saveProgress: (currentTime: number) => void }}
 *   - resumeAt: seconds to seek to on load (0 = start from beginning)
 *   - saveProgress: throttled writer; call on timeupdate, pause, and unmount
 */
export function useResumePlayback(originalId, durationSeconds = 0) {
  const { user } = useAuthStore();
  const userId   = user?.id ?? 'anon';
  const storageKey = `resume:${userId}:${originalId}`;

  // --- read ---
  let resumeAt = 0;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw !== null) {
      const saved = parseFloat(raw);
      // "finished" threshold: within last 2 minutes → restart
      const finishedThreshold = durationSeconds > 0 ? Math.max(0, durationSeconds - 120) : Infinity;
      resumeAt = (!isNaN(saved) && saved > 0 && saved < finishedThreshold) ? saved : 0;
    }
  } catch {
    // localStorage unavailable (private browsing, security policy) — ignore
    resumeAt = 0;
  }

  // --- write (throttled) ---
  let lastSaved  = 0;
  const THROTTLE = 5; // seconds between saves during playback

  const saveProgress = useCallback((currentTime) => {
    if (!originalId) return;
    const now = Date.now() / 1000;
    if (now - lastSaved < THROTTLE) return; // eslint-disable-line react-hooks/exhaustive-deps
    lastSaved = now;

    // Clear record if effectively finished
    const finishedThreshold = durationSeconds > 0 ? Math.max(0, durationSeconds - 120) : Infinity;
    try {
      if (currentTime >= finishedThreshold) {
        localStorage.removeItem(storageKey);
      } else {
        localStorage.setItem(storageKey, String(currentTime));
      }
    } catch {
      // Ignore write failures
    }
  }, [originalId, durationSeconds, storageKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return { resumeAt, saveProgress };
}
