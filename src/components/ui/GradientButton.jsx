const SIZES = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-2.5 text-sm',
  lg: 'px-7 py-3 text-base',
};

// Each variant carries its own focus-ring colour, so a button on a dark ground
// gets a ring that is actually visible against it.
const VARIANTS = {
  // Solid ink rather than a gradient: on a gradient page a gradient fill has
  // nothing to sit against, and the one primary action on a screen needs a hard
  // edge and real weight.
  primary:
    'bg-ink text-white shadow-card hover:bg-plane-2 hover:shadow-card-hover disabled:hover:bg-ink focus-visible:outline-blue-600',
  accent:
    'bg-pink-600 text-white shadow-card hover:bg-pink-500 hover:shadow-card-hover disabled:hover:bg-pink-600 focus-visible:outline-blue-600',
  secondary:
    'border border-line-strong bg-surface text-ink shadow-card hover:border-ink/35 hover:shadow-card-hover focus-visible:outline-blue-600',
  onPlane:
    'bg-white text-ink shadow-card hover:shadow-card-hover disabled:hover:bg-white focus-visible:outline-white',
};

/**
 * The primary action control.
 *
 * Solid despite the name, which is kept because it is imported across every
 * screen.
 */
export default function GradientButton({
  size = 'lg',
  variant = 'primary',
  type = 'button',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold',
        'transition duration-200 ease-spring hover:-translate-y-px',
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:pointer-events-none disabled:opacity-40',
        VARIANTS[variant],
        SIZES[size],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}
