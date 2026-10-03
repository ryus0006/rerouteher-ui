const BASE = 'relative rounded-2xl border border-line bg-surface shadow-card';

const INTERACTIVE =
  'transition duration-200 ease-spring hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card-hover';

/**
 * Standard card surface: opaque background with a hairline border.
 */
export default function GlassCard({
  as: Tag = 'div',
  interactive = false,
  className = '',
  children,
  ...props
}) {
  return (
    <Tag className={`${BASE} ${interactive ? INTERACTIVE : ''} ${className}`} {...props}>
      {children}
    </Tag>
  );
}
