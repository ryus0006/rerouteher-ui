import { ACTIVITY_LABELS } from '../../config/activityTaxonomy.js';
import { getSkillDefinition } from '../../lib/skillDefinition.js';
import SkillDefinitionPopover from '../skills/SkillDefinitionPopover.jsx';

/**
 * A single skill rendered as a compact pill. A supplied ESCO definition opens
 * in a small floating card on hover or focus. Without a definition the pill is
 * a plain label, with its evidence in the native title.
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
  const pill = [
    'inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors',
    fromBreak ? 'border-verify/25 bg-verify-soft text-verify' : 'border-line bg-canvas text-ink',
  ].join(' ');

  if (!definition) {
    return (
      <li title={title} className={pill}>
        {skill.skill}
      </li>
    );
  }

  return (
    <li className="inline-flex">
      <SkillDefinitionPopover
        definition={definition}
        label={skill.skill}
        tone={fromBreak ? 'verify' : 'pink'}
      >
        {(triggerProps) => (
          <button
            type="button"
            {...triggerProps}
            className={`${pill} cursor-default ${
              fromBreak ? 'hover:border-verify/50' : 'hover:border-line-strong hover:bg-surface'
            }`}
          >
            {skill.skill}
          </button>
        )}
      </SkillDefinitionPopover>
    </li>
  );
}
