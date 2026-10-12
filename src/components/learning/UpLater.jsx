import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CaretDown, Plus } from '@phosphor-icons/react';

const EASE = [0.32, 0.72, 0, 1];

/**
 * Rows shown before the rest of the list is folded behind "Show more". A
 * single extra row is shown rather than folded.
 */
const VISIBLE = 3;

/**
 * Gaps not yet in the learning plan, in ranking order, shown as a tab of More
 * skills. Each can be added to the plan, which fetches its resources and adds
 * it as a focus area. Only the first few are listed until the list is expanded.
 */
export default function UpLater({ gaps, role, onAdd }) {
  const [expanded, setExpanded] = useState(false);
  const count = `${gaps.length} more ${gaps.length === 1 ? 'skill' : 'skills'}`;
  const hidden = gaps.length > VISIBLE + 1 ? gaps.length - VISIBLE : 0;
  const shown = expanded || hidden === 0 ? gaps : gaps.slice(0, VISIBLE);

  return (
    <>
      <p className="text-sm text-ink-soft">
        {count} to close for {role ?? 'your target role'}. Add one to your plan when you’re ready.
      </p>

      <ul id="up-later-list" className="mt-4 space-y-1">
        <AnimatePresence initial={false}>
          {shown.map((gap, index) => (
            <motion.li
              key={gap.skill_id}
              className="lp-later-row"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <span aria-hidden="true" className="lp-later-dot" />
              <div className="min-w-0 flex-1">
                <h3 className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-display text-[1.375rem] font-bold leading-tight tracking-[-0.02em] text-ink">
                  {gap.skill}
                  {index === 0 && <span className="lp-later-next">Suggested next</span>}
                </h3>
              </div>
              <button type="button" onClick={() => onAdd(gap)} className="lp-ghost shrink-0">
                <Plus weight="bold" className="size-3.5" aria-hidden="true" />
                Add to plan
                <span className="sr-only">: {gap.skill}</span>
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          aria-controls="up-later-list"
          data-open={expanded || undefined}
          className="lp-later-more"
        >
          {expanded ? 'Show fewer' : `Show ${hidden} more skills`}
          <CaretDown weight="bold" className="lp-done-caret size-3" aria-hidden="true" />
        </button>
      )}
    </>
  );
}
