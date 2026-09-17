/** Formats a byte count the way a file manager would: "1.8 MB", "640 KB". */
function formatSize(bytes) {
  if (!Number.isFinite(bytes)) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Accepted-CV row with a control to clear it and pick another file. */
export default function UploadedFileChip({ fileName, fileSize, onRemove }) {
  const size = formatSize(fileSize);

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-verify/30 bg-verify-soft px-4 py-3">
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface text-verify"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5"
        >
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
          <path d="M14 3v5h5" />
        </svg>
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{fileName}</p>
        <p className="text-xs font-semibold text-verify">
          {size ? `${size} · Verified` : 'Verified'}
        </p>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 rounded-full border border-line-strong bg-surface px-3.5 py-1.5 text-xs font-semibold text-ink-soft transition hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        Remove
      </button>
    </div>
  );
}
