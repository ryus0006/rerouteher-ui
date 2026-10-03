const SIZES = {
  sm: 'size-8 text-sm',
  lg: 'size-12 text-lg',
};

/**
 * Initial-letter avatar.
 *
 * Always rendered next to the user's name, so it is hidden from assistive
 * technology by default.
 */
export default function Avatar({ name, size = 'sm' }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-blue-600 font-semibold uppercase text-white ${SIZES[size]}`}
    >
      {name.slice(0, 1)}
    </span>
  );
}
