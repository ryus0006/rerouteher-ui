import { useState } from 'react';
import { motion } from 'motion/react';
import SkillChip from './SkillChip.jsx';

// Number of skill chips shown when a long list is collapsed.
const INITIAL_VISIBLE = 18;
// Lists up to this length are shown in full; collapsing would hide only a few.
const COLLAPSE_AFTER = 22;

// Fades the last rows of a collapsed list so it reads as continuing.
const FADE_MASK = 'linear-gradient(to bottom, black 62%, transparent)';

const EASE = [0.32, 0.72, 0, 1];

/**
 * One source of skills: a headline count, then the skills as chips. An empty
 * list shows `emptyMessage`.
 * Long lists are collapsed to the top chips (the list arrives strongest-first)
 * with a toggle to reveal the rest.
 * `delay` staggers the entry animation (seconds).
 *
 * `leadingChips` are extra chips placed before the skills and never collapsed;
 * `leadingCount` is how many there are, included in the headline count.
 * `countNote` is a line under the count, e.g. a breakdown by source.
 */
export default function SkillSection({
  title,
  countLabel,
  skills,
  emptyMessage,
  delay = 0,
  leadingChips = null,
  leadingCount = 0,
  countNote = null,
}) {
  const [expanded, setExpanded] = useState(false);

  const isEmpty = skills.length === 0;
  const canCollapse = skills.length > COLLAPSE_AFTER;
  const collapsed = canCollapse && !expanded;
  const visible = collapsed ? skills.slice(0, INITIAL_VISIBLE) : skills;

  return (
    <motion.section
      className="cv-card flex flex-col"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      <h2 className="eyebrow">{title}</h2>

      {!isEmpty && (
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-display text-[2.5rem] font-bold leading-none tracking-[-0.03em] tabular text-ink">
            {skills.length + leadingCount}
          </span>
          <span className="text-sm text-ink-soft">{countLabel}</span>
        </div>
      )}

      {!isEmpty && countNote && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-ink-soft">
          {countNote}
        </div>
      )}

      {isEmpty ? (
        <>
          <p className="mt-4 text-sm italic text-ink-faint">{emptyMessage}</p>
          {leadingChips && <ul className="mt-4 flex flex-wrap gap-2">{leadingChips}</ul>}
        </>
      ) : (
        <>
          <ul
            className="mt-6 flex flex-wrap gap-2"
            style={collapsed ? { maskImage: FADE_MASK, WebkitMaskImage: FADE_MASK } : undefined}
          >
            {leadingChips}
            {visible.map((skill) => (
              <SkillChip key={`${skill.source}-${skill.skill}`} skill={skill} />
            ))}
          </ul>

          {canCollapse && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-4 self-start rounded-lg text-sm font-semibold text-pink-600 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {expanded ? 'Show fewer' : `Show all ${skills.length + leadingCount}`}
            </button>
          )}
        </>
      )}
    </motion.section>
  );
}
