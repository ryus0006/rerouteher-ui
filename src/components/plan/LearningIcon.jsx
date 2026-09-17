const PATHS = {
  spark: (
    <>
      <path d="M12 4.5 13.6 9l4.4 1.6L13.6 12l-1.6 4.5L10.4 12 6 10.6 10.4 9Z" />
      <path d="M18 4v3M16.5 5.5h3M6.5 16v2.5M5.25 17.25h2.5" />
    </>
  ),
  layers: (
    <>
      <path d="m12 4 8 4-8 4-8-4Z" />
      <path d="m4 12 8 4 8-4M4 16l8 4 8-4" />
    </>
  ),
  flow: (
    <>
      <rect x="3.5" y="4.5" width="6" height="5" rx="1.5" />
      <rect x="14.5" y="14.5" width="6" height="5" rx="1.5" />
      <path d="M9.5 7h4a3 3 0 0 1 3 3v4.5M6.5 9.5v5a3 3 0 0 0 3 3h5" />
    </>
  ),
  case: (
    <>
      <rect x="3.5" y="7.5" width="17" height="12" rx="2" />
      <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 12.5h17" />
    </>
  ),
};

/**
 * A focus area's mark on the learning plan.
 *
 * Line glyphs rather than filled shapes, to sit at the same weight as the
 * hairline cards they head. `case` is the fallback, so a focus area the
 * fixture has no icon for still gets a tile rather than a hole.
 */
export default function LearningIcon({ name, className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS[name] ?? PATHS.case}
    </svg>
  );
}
