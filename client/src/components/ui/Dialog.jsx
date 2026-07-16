import { useEffect, useRef, useCallback } from 'react';
import { cn } from '../../lib/utils.js';

export default function Dialog({ open, onClose, title, children, className }) {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    }

    // Focus trap
    if (e.key === 'Tab' && dialogRef.current) {
      const focusable = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }, [onClose]);

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement;
      document.body.style.overflow = 'hidden';
      // Focus the dialog itself
      setTimeout(() => dialogRef.current?.focus(), 0);
    } else {
      document.body.style.overflow = '';
      // Return focus to the trigger element
      previousFocusRef.current?.focus();
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative z-10 w-full max-w-lg rounded-modal bg-surface p-6 shadow-2xl',
          'outline-none',
          className
        )}
      >
        {title && (
          <h2 className="mb-4 text-xl font-semibold text-txt">{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
}
