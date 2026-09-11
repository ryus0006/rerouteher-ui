import { useState } from 'react';

/**
 * Drag-and-drop or browse for a single PDF. The whole box is the label, so a
 * click anywhere inside opens the file picker. Validation and upload are the
 * caller's responsibility; this component only surfaces the chosen file.
 */
export default function CvDropzone({ onSelect, disabled = false }) {
  const [dragging, setDragging] = useState(false);

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;

    const [file] = event.dataTransfer.files;
    if (file) onSelect(file);
  }

  function handleChange(event) {
    const [file] = event.target.files;
    if (file) onSelect(file);

    // Allows re-picking the same file after an error.
    event.target.value = '';
  }

  return (
    <label
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={[
        'block rounded-2xl border border-dashed p-8 text-center transition',
        'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-blue-600',
        dragging ? 'border-pink-500 bg-pink-100' : 'border-line-strong bg-canvas',
        disabled ? 'opacity-50' : 'cursor-pointer hover:border-ink/30 hover:bg-canvas-sunk',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-line bg-surface text-pink-600"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-6.5"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
          <path d="M14 2v6h6" />
          <path d="M12 18v-6" />
          <path d="m9 15 3-3 3 3" />
        </svg>
      </span>

      <span className="mt-3 block text-sm font-medium text-ink">
        Drag a file, or click to browse
      </span>
      <span className="mt-1 block text-xs text-ink-faint">PDF, up to 10 MB</span>

      <input
        type="file"
        accept="application/pdf,.pdf"
        disabled={disabled}
        onChange={handleChange}
        className="sr-only"
      />
    </label>
  );
}
