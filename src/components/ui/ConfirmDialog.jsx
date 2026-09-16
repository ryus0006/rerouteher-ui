import { useEffect, useRef } from 'react';

/**
 * A short, destructive yes-or-no question asked over the current screen.
 *
 * Focus lands on the cancel button, so a stray Enter keeps her work rather
 * than clearing it. Escape and the backdrop cancel too; Tab stays inside the
 * panel, and focus goes back to whatever opened it on close.
 */
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) {
  const panelRef = useRef(null);
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const opener = document.activeElement;
    cancelRef.current?.focus();

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        onCancel();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll('button');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label={cancelLabel}
        tabIndex={-1}
        onClick={onCancel}
        data-no-press
        className="account-sheet-backdrop absolute inset-0 bg-ink/35 backdrop-blur-[2px]"
      />

      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-body"
        className="account-sheet-panel relative w-full max-w-[24rem] overflow-hidden rounded-3xl border border-line bg-surface shadow-sheet"
      >
        {/* The warning band carries the colour so the buttons below can stay
            plain: the danger is named once, at the top, before she reads on. */}
        <div className="flex items-center gap-3 border-b border-pink-600/15 bg-pink-100 px-6 py-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-pink-600 text-white">
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="size-[18px]"
            >
              <path d="M8.6 3.4 2.3 14.5A1.6 1.6 0 0 0 3.7 17h12.6a1.6 1.6 0 0 0 1.4-2.5L11.4 3.4a1.6 1.6 0 0 0-2.8 0Z" />
              <path d="M10 8v3.4" />
              <path d="M10 14.1h.01" />
            </svg>
          </span>
          <h2
            id="confirm-dialog-title"
            className="font-display text-lg font-bold tracking-[-0.01em] text-ink"
          >
            {title}
          </h2>
        </div>

        <div className="px-6 pb-6 pt-4">
          <div id="confirm-dialog-body" className="text-sm leading-relaxed text-ink-soft">
            {children}
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              ref={cancelRef}
              type="button"
              onClick={onCancel}
              className="rounded-full border border-line-strong bg-surface px-5 py-2.5 text-sm font-semibold text-ink hover:border-ink/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-full bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
