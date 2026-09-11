const PATHS = {
  // Tray with a downward arrow — experience being taken in.
  intake: 'M12 3v10m0 0 4-4m-4 4-4-4M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4',
  // Clock — readiness measured at a point in time.
  clock: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  // Rising line — a short, ranked climb rather than a wall.
  climb: 'M4 18l5-5 3 3 7-7m0 0h-4m4 0v4',
};

/** Badge glyph on the landing value cards. */
export default function ValueIcon({ name }) {
  return (
    <span className="flex size-10 items-center justify-center rounded-xl border border-line bg-surface">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5 text-blue-600"
      >
        <path d={PATHS[name]} />
      </svg>
    </span>
  );
}
