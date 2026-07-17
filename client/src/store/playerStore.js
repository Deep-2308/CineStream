import { create } from 'zustand';

/**
 * playerStore — global singleton for video preview state.
 *
 * Rules:
 *  - Only one hover preview may exist at a time.
 *  - Opening TrailerModal or navigating away calls stopAll().
 *  - PosterCard subscribes: if activePreviewId !== its own id, it tears down.
 */
export const usePlayerStore = create((set) => ({
  /** _id of the movie whose inline hover-preview is currently live */
  activePreviewId: null,

  /**
   * Claim ownership of the preview slot.
   * The previous owner's PosterCard will see activePreviewId change and destroy itself.
   */
  setActivePreview: (id) => set({ activePreviewId: id }),

  /**
   * Kill any live preview (called on modal-open and route change).
   */
  stopAll: () => set({ activePreviewId: null }),
}));
