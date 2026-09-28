import { useId, useState } from 'react';

/**
 * A small, reusable description popover for ESCO-backed skill data. The
 * trigger is supplied by its parent so a compact chip and a ranked gap row can
 * use the same accessible interaction. No description means no popover.
 */
export default function SkillDefinitionPopover({ definition, label, children }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const descriptionId = useId();
  const isOpen = Boolean(definition) && (hovered || focused || pinned);

  if (!definition) return children({});

  const triggerProps = {
    'aria-label': `Show what ${label} means`,
    'aria-describedby': descriptionId,
    'aria-expanded': isOpen,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    onClick: () => setPinned((current) => !current),
    onKeyDown: (event) => {
      if (event.key === 'Escape') {
        setPinned(false);
        event.currentTarget.blur();
      }
    },
  };

  return (
    <span
      className="relative block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children(triggerProps)}
      <span
        id={descriptionId}
        role="tooltip"
        className={[
          'absolute left-0 top-full z-30 mt-2 w-[min(19rem,calc(100vw-3rem))] rounded-xl border border-pink-200 bg-white p-3 text-left text-xs leading-relaxed text-ink shadow-card transition duration-150 ease-smooth',
          isOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0',
        ].join(' ')}
      >
        <span className="mb-1 block font-semibold text-pink-600">What this skill means</span>
        {definition}
      </span>
    </span>
  );
}
