import InterviewIcon from './InterviewIcon.jsx';

/**
 * Pill button used on the interview page. Optional leading/trailing icons sit
 * in their own circle and nudge in their direction on hover.
 *
 * `tone`: 'solid' for the next step, 'accent' for starting something new,
 * 'quiet' for secondary actions.
 */
export default function PillButton({
  tone = 'quiet',
  icon,
  iconSide = 'end',
  className = '',
  children,
  ...props
}) {
  const badge = icon && (
    <span className="iv-pill-icon" data-side={iconSide} aria-hidden="true">
      <InterviewIcon name={icon} weight="bold" className="size-3.5" />
    </span>
  );

  return (
    <button
      type="button"
      className={`iv-pill iv-pill-${tone} ${icon ? `iv-pill-has-${iconSide}` : ''} ${className}`}
      {...props}
    >
      {iconSide === 'start' && badge}
      <span>{children}</span>
      {iconSide === 'end' && badge}
    </button>
  );
}
