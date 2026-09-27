import { useId, useState } from 'react';
import { ACTIVITY_LABELS } from '../../config/activityTaxonomy.js';

function getSkillDefinition(skill) {
  return [skill.definition, skill.description, skill.short_description].find(
    (value) => typeof value === 'string' && value.trim().length > 0,
  );
}

/**
 * A single skill rendered as a compact pill. A supplied ESCO definition is
 * revealed on hover, focus or tap. If the dataset has no definition, the skill
 * deliberately remains a label only.
 */
export default function SkillChip({ skill }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const definitionId = useId();
  const fromBreak = skill.source === 'break';
  const activityLabel = fromBreak
    ? (ACTIVITY_LABELS[skill.from_activity] ?? skill.from_activity)
    : null;
  const title = fromBreak
    ? activityLabel
      ? `from ${activityLabel}`
      : undefined
    : skill.evidence || undefined;

  const definition = getSkillDefinition(skill);
  const definitionOpen = isHovered || isFocused;

  return (
    <li
      title={definition ? undefined : title}
      className={[
        'rounded-xl border px-3 py-2 text-sm transition-colors',
        definition && 'focus-within:border-pink-300 hover:border-pink-200',
        fromBreak
          ? 'border-verify/25 bg-verify-soft text-verify'
          : 'border-line bg-canvas text-ink',
      ].join(' ')}
      onMouseEnter={definition ? () => setIsHovered(true) : undefined}
      onMouseLeave={definition ? () => setIsHovered(false) : undefined}
    >
      {definition ? (
        <button
          type="button"
          aria-expanded={definitionOpen}
          aria-describedby={definitionId}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full cursor-help text-left font-medium outline-none focus-visible:underline focus-visible:decoration-pink-400 focus-visible:decoration-2 focus-visible:underline-offset-4"
        >
          {skill.skill}
        </button>
      ) : (
        <p className="font-medium">{skill.skill}</p>
      )}
      {definition && (
        <p
          id={definitionId}
          className={[
            'grid transition-[grid-template-rows,margin,opacity] duration-200 ease-out',
            definitionOpen ? 'mt-1 grid-rows-[1fr] opacity-75' : 'mt-0 grid-rows-[0fr] opacity-0',
          ].join(' ')}
        >
          <span className="min-h-0 overflow-hidden text-xs leading-relaxed">{definition}</span>
        </p>
      )}
    </li>
  );
}
