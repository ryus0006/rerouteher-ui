const BASE = 'relative rounded-2xl border border-line bg-surface shadow-card';

const INTERACTIVE =
  'transition duration-200 ease-spring hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card-hover';

/**
 * The standard surface: opaque, with a hairline edge.
 *
 * Opaque despite the name, which is kept because it is imported across every
 * screen: a card that shares its lightness with the page behind it has no edge
 * to read.
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
