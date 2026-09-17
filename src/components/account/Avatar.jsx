const SIZES = {
  sm: 'size-8 text-sm',
  lg: 'size-12 text-lg',
};

/**
 * Her initial, standing in for a photograph she has not been asked for.
 *
 * Decorative wherever her name is already on screen beside it, which is every
 * current use, so it stays out of the accessibility tree by default.
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
