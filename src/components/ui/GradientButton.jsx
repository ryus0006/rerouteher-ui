const SIZES = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-2.5 text-sm',
  lg: 'px-7 py-3 text-base',
};

// Each variant defines its own focus-ring colour so the ring stays visible on dark backgrounds.
const VARIANTS = {
  // Solid fill so the primary action stays distinct on gradient backgrounds.
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
 * Standard action button. See `VARIANTS` for the available styles.
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
        // `group` lets an icon inside respond to hovering the whole button.
        'group transition duration-200 ease-spring hover:-translate-y-px active:translate-y-0 active:scale-[0.97]',
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
