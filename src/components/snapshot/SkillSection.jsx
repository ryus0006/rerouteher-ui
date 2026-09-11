import { useState } from 'react';
import GlassCard from '../ui/GlassCard.jsx';
import SkillChip from './SkillChip.jsx';

// how many skill chips to show before collapsing the rest behind a toggle
const INITIAL_VISIBLE = 12;

/**
 * One labelled column of skills, rendered as compact chips. An empty list shows
 * `emptyMessage`. Long lists are collapsed to the top chips (the list arrives
 * strongest-first) with a "Show all" toggle to reveal the rest.
 */
export default function SkillSection({ title, note, skills, emptyMessage }) {
  const [expanded, setExpanded] = useState(false);

  const isEmpty = skills.length === 0;
  const canCollapse = skills.length > INITIAL_VISIBLE;
  const visible = expanded || !canCollapse ? skills : skills.slice(0, INITIAL_VISIBLE);

  return (
    <GlassCard className="p-6">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {!isEmpty && <span className="text-xs text-ink-faint">{skills.length}</span>}
      </div>
      {note && <p className="mt-1 text-xs text-ink-soft">{note}</p>}

      {isEmpty ? (
        <p className="mt-4 text-sm italic text-ink-faint">{emptyMessage}</p>
      ) : (
        <>
          <ul className="mt-4 flex flex-wrap gap-2">
            {visible.map((skill) => (
              <SkillChip key={`${skill.source}-${skill.skill}`} skill={skill} />
            ))}
          </ul>

          {canCollapse && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-3 rounded-lg text-sm font-semibold text-pink-600 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {expanded ? 'Show fewer' : `Show all ${skills.length}`}
            </button>
          )}
        </>
      )}
    </GlassCard>
  );
}
