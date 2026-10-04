import useReveal from '../../hooks/useReveal.js';

/** Wrapper that fades its content up as it scrolls into view. */
export default function Reveal({ as: Tag = 'div', className = '', delay = 0, children, ...props }) {
  const ref = useReveal();
  return (
    <Tag ref={ref} className={`reveal ${className}`} style={{ '--d': `${delay}ms` }} {...props}>
      {children}
    </Tag>
  );
}
