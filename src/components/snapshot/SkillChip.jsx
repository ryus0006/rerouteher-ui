import { ACTIVITY_LABELS } from '../../config/activityTaxonomy.js';
import { getSkillDefinition } from '../../lib/skillDefinition.js';
import SkillDefinitionPopover from '../skills/SkillDefinitionPopover.jsx';

/**
 * A single skill rendered as a compact pill. A supplied ESCO definition is
 * revealed on hover, focus or tap. If the dataset has no definition, the skill
 * deliberately remains a label only.
 */
export default function SkillChip({ skill }) {
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
  const chipClass = [
    'rounded-xl border px-3 py-2 text-sm transition-colors',
    definition && 'hover:border-pink-200 focus-within:border-pink-300',
    fromBreak ? 'border-verify/25 bg-verify-soft text-verify' : 'border-line bg-canvas text-ink',
  ].join(' ');

  return (
    <li title={definition ? undefined : title} className={chipClass}>
      {definition ? (
        <SkillDefinitionPopover definition={definition} label={skill.skill}>
          {(triggerProps) => (
            <button
              type="button"
              {...triggerProps}
              className="w-full cursor-help text-left font-medium outline-none focus-visible:underline focus-visible:decoration-pink-400 focus-visible:decoration-2 focus-visible:underline-offset-4"
            >
              {skill.skill}
            </button>
          )}
        </SkillDefinitionPopover>
      ) : (
        <p className="font-medium">{skill.skill}</p>
      )}
    </li>
  );
}
