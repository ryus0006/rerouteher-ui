import { useId, useState } from 'react';

/**
 * A reusable inline disclosure for ESCO-backed skill data. The explanation
 * drops down beneath the skill on hover or keyboard focus, so it never covers
 * nearby content. No description means no disclosure.
 */
export default function SkillDefinitionPopover({ definition, label, children }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const descriptionId = useId();
  const isOpen = Boolean(definition) && (hovered || focused);

  if (!definition) return children({});

  const triggerProps = {
    'aria-label': `Show what ${label} means`,
    'aria-describedby': descriptionId,
    'aria-expanded': isOpen,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
  };

  return (
    <span
      className="block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children(triggerProps)}
      <span
        id={descriptionId}
        className={[
          'grid text-left transition-[grid-template-rows,margin,opacity] duration-200 ease-out',
          isOpen ? 'mt-2 grid-rows-[1fr] opacity-100' : 'mt-0 grid-rows-[0fr] opacity-0',
        ].join(' ')}
      >
        <span className="min-h-0 overflow-hidden rounded-xl border border-pink-200 bg-white/85 px-3 py-2 text-xs leading-relaxed text-ink-soft">
          {definition}
        </span>
      </span>
    </span>
  );
}
