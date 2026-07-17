import { useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore.js';
import { interactionApi } from '../services/interactionApi.js';
import { queryKeys } from '../lib/queryKeys.js';

const THROTTLE_SECONDS = 10;       // max one API save per 10 seconds
const COMPLETION_PCT   = 0.95;     // >95% → mark complete and remove
const LS_PREFIX        = 'resume'; // localStorage fallback key prefix

/**
 * useResumePlayback — API-backed resume hook (Phase 8).
 *
 * Authenticated users: reads from /api/continue-watching, writes to
 * /api/watch-progress (throttled to 10s), removes on >95% completion.
 *
 * Anonymous users: localStorage fallback (Phase 7 behaviour, unchanged).
 *
 * External signature is identical to Phase 7:
 *   const { resumeAt, saveProgress } = useResumePlayback(contentId, durationSeconds)
 *
 * @param {string} contentId       MongoDB _id of the Movie or Original
 * @param {number} durationSeconds Total runtime in seconds
 * @param {string} [contentType]   'movie' | 'original'  (default 'movie')
 */
export function useResumePlayback(contentId, durationSeconds = 0, contentType = 'movie') {
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const lastSaved   = useRef(0);

  // ── Anonymous fallback ──────────────────────────────────────
  const lsKey = `${LS_PREFIX}:${user?.id ?? 'anon'}:${contentId}`;

  // ── Authenticated: read saved progress from continue-watching query ─
  // We use the list query that is already fetched for the Continue Watching row;
  // no extra network request if already in cache.
  const { data: continueWatchingData } = useQuery({
    queryKey: queryKeys.continueWatching({ limit: 20 }),
    queryFn:  () => interactionApi.getContinueWatching(20),
    enabled:  !!isAuthenticated && !!contentId,
    staleTime: 60_000,
  });

  // ── Compute resumeAt ────────────────────────────────────────
  let resumeAt = 0;

  if (isAuthenticated && continueWatchingData?.items) {
    const match = continueWatchingData.items.find(
      item => item._id?.toString() === contentId?.toString()
    );
    const saved = match?._progressSeconds ?? 0;
    const finishedThreshold = durationSeconds > 0
      ? durationSeconds * COMPLETION_PCT
      : Infinity;
    resumeAt = (saved > 0 && saved < finishedThreshold) ? saved : 0;
  } else if (!isAuthenticated) {
    // localStorage fallback
    try {
      const raw = localStorage.getItem(lsKey);
      if (raw !== null) {
        const saved = parseFloat(raw);
        const finishedThreshold = durationSeconds > 0
          ? durationSeconds * COMPLETION_PCT
          : Infinity;
        resumeAt = (!isNaN(saved) && saved > 0 && saved < finishedThreshold) ? saved : 0;
      }
    } catch { resumeAt = 0; }
  }

  // ── saveProgress — throttled writer ─────────────────────────
  const saveProgress = useCallback((currentTime) => {
    if (!contentId) return;

    // Throttle
    const nowSec = Date.now() / 1000;
    if (nowSec - lastSaved.current < THROTTLE_SECONDS) return;
    lastSaved.current = nowSec;

    const isComplete = durationSeconds > 0 && currentTime / durationSeconds >= COMPLETION_PCT;

    if (isAuthenticated) {
      if (isComplete) {
        interactionApi.removeProgress(contentId).then(() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.continueWatching({ limit: 20 }) });
        }).catch(() => {});
      } else {
        interactionApi.saveProgress(contentId, contentType, currentTime, durationSeconds)
          .then(() => {
            // Optimistically update the cache so Continue Watching row refreshes
            queryClient.invalidateQueries({ queryKey: queryKeys.continueWatching({ limit: 20 }) });
          })
          .catch(() => {});
      }
    } else {
      // Anonymous localStorage
      try {
        if (isComplete) {
          localStorage.removeItem(lsKey);
        } else {
          localStorage.setItem(lsKey, String(currentTime));
        }
      } catch { /* ignore */ }
    }
  }, [contentId, contentType, durationSeconds, isAuthenticated, lsKey, queryClient]);

  return { resumeAt, saveProgress };
}
