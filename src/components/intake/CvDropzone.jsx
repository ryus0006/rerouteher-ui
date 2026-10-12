import { useState } from 'react';
import CvSheet from './CvSheet.jsx';

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
      data-dragging={dragging || undefined}
      data-disabled={disabled || undefined}
      className="cv-drop"
    >
      <CvSheet state={disabled ? 'reading' : dragging ? 'dragging' : 'idle'} />

      <span className="min-w-0">
        <span className="block font-display text-xl font-bold tracking-[-0.015em] text-ink">
          Drag a file, or click to browse
        </span>
        <span className="cv-drop-note">PDF, up to 10 MB</span>
      </span>

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
