/**
 * Line icon for each journey dashboard panel, keyed by panel id. Drawn with
 * the same stroke weight as the other product icons.
 */
const PATHS = {
  // Pen over a line.
  story: (
    <>
      <path d="M4 20h16" />
      <path d="M14.5 4.5a2.1 2.1 0 0 1 3 3L9 16l-4 1 1-4Z" />
    </>
  ),
  // Stacked layers.
  skills: (
    <>
      <path d="m12 3 9 4.5-9 4.5-9-4.5Z" />
      <path d="m3 12.5 9 4.5 9-4.5" />
      <path d="m3 17 9 4.5 9-4.5" />
    </>
  ),
  // Mortarboard.
  learning: (
    <>
      <path d="m12 4 10 4.5-10 4.5L2 8.5Z" />
      <path d="M6 10.8V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.2" />
    </>
  ),
  // Office building.
  employers: (
    <>
      <path d="M4 21V5.5A1.5 1.5 0 0 1 5.5 4h8A1.5 1.5 0 0 1 15 5.5V21" />
      <path d="M15 10h3.5A1.5 1.5 0 0 1 20 11.5V21" />
      <path d="M3 21h18M7.5 8h4M7.5 12h4M7.5 16h4" />
    </>
  ),
};

export default function JourneyIcon({ name, className = 'size-5' }) {
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
      {PATHS[name]}
    </svg>
  );
}
