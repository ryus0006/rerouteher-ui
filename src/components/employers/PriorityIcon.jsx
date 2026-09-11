/**
 * One line icon per priority.
 *
 * Five cards of pure text read as a form; the glyph is what lets her find the
 * one she is looking for without reading all five. Drawn in the same hairline
 * stroke as the rest of the product rather than pulled from an icon set, so
 * they sit at the weight of the type beside them.
 */
const PATHS = {
  // A laptop: work that travels.
  flexible_work: <path d="M5 6h14v9H5zM3 18h18" />,
  // A small figure under a roof.
  childcare_support: (
    <>
      <path d="M4 11 12 5l8 6" />
      <path d="M6 11v8h12v-8" />
      <circle cx="12" cy="14.5" r="1.6" />
    </>
  ),
  // Two figures, one held close.
  parental_support: (
    <>
      <circle cx="9.5" cy="7" r="2.6" />
      <path d="M4.5 19v-1.5A5 5 0 0 1 9.5 12.5a5 5 0 0 1 5 5V19" />
      <circle cx="17" cy="12" r="1.8" />
      <path d="M14.6 19v-1.2a2.4 2.4 0 0 1 4.8 0V19" />
    </>
  ),
  // An arrow coming back round.
  returning_to_work: (
    <>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20 4v4h-4" />
    </>
  ),
  // Three abreast.
  inclusive_workplace: (
    <>
      <circle cx="12" cy="8" r="2.6" />
      <path d="M7 19a5 5 0 0 1 10 0" />
      <path d="M3.5 17.5a3.5 3.5 0 0 1 3-3.4M20.5 17.5a3.5 3.5 0 0 0-3-3.4" />
    </>
  ),
};

export default function PriorityIcon({ id, className = 'size-6' }) {
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
      {PATHS[id]}
    </svg>
  );
}
