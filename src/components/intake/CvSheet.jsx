import { Check } from '@phosphor-icons/react';

const LINES_TOP = ['92%', '78%'];
const LINES_BOTTOM = ['88%', '64%', '80%'];

/**
 * Drawn CV page beside the upload copy. Its pink chips stand for the skills
 * read from the CV. `state` is idle, dragging (lifts and straightens),
 * reading (a scan line passes and the chips light in turn) or done (ticked).
 */
export default function CvSheet({ state = 'idle' }) {
  return (
    <span aria-hidden="true" className="cv-sheet" data-state={state}>
      <span className="cv-sheet-back" />
      <span className="cv-sheet-front">
        <span className="cv-sheet-head">
          <span className="cv-sheet-avatar" />
          <span className="flex-1 space-y-1">
            <span className="cv-sheet-line cv-sheet-line-strong w-[70%]" />
            <span className="cv-sheet-line w-[45%]" />
          </span>
        </span>
        {LINES_TOP.map((width) => (
          <span key={width} className="cv-sheet-line" style={{ width }} />
        ))}
        <span className="cv-sheet-skills">
          <span className="cv-sheet-skill w-[38%]" />
          <span className="cv-sheet-skill w-[28%]" />
          <span className="cv-sheet-skill w-[22%]" />
        </span>
        {LINES_BOTTOM.map((width) => (
          <span key={width} className="cv-sheet-line" style={{ width }} />
        ))}
        <span className="cv-sheet-scan" />
      </span>
      <span className="cv-sheet-tick">
        <Check weight="bold" className="size-3.5" />
      </span>
    </span>
  );
}
