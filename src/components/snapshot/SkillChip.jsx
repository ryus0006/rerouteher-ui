import { ACTIVITY_LABELS } from '../../config/activityTaxonomy.js';

/**
 * A single skill rendered as a compact pill. Evidence (or the source activity
 * for break skills) is moved to the hover title so long lists stay scannable.
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

  return (
    <li
      title={title}
      className={[
        'inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium',
        fromBreak
          ? 'border-verify/25 bg-verify-soft text-verify'
          : 'border-line bg-canvas text-ink',
      ].join(' ')}
    >
      {skill.skill}
    </li>
  );
}
