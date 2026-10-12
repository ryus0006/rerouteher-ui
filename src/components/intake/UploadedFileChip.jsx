import CvSheet from './CvSheet.jsx';

/** Formats a byte count the way a file manager would: "1.8 MB", "640 KB". */
function formatSize(bytes) {
  if (!Number.isFinite(bytes)) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Accepted CV in the same frame as the dropzone: the ticked sheet, the file
 * name and size, and a control to clear it and pick another file.
 */
export default function UploadedFileChip({ fileName, fileSize, onRemove }) {
  const size = formatSize(fileSize);

  return (
    <div className="cv-drop" data-done="">
      <CvSheet state="done" />

      <div className="min-w-0">
        <p className="truncate font-display text-xl font-bold tracking-[-0.015em] text-ink">
          {fileName}
        </p>
        <p className="mt-1.5 text-sm font-semibold text-verify">
          {size ? `${size} · Verified` : 'Verified'}
        </p>
        <button type="button" onClick={onRemove} className="cv-drop-remove">
          Remove
        </button>
      </div>
    </div>
  );
}
