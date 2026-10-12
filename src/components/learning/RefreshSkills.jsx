import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowCounterClockwise, CaretDown } from '@phosphor-icons/react';

const EASE = [0.32, 0.72, 0, 1];

/**
 * Rows shown before the rest of the list is folded behind "Show more". A
 * single extra row is shown rather than folded.
 */
const VISIBLE = 3;

/**
 * Skills the user already has for the target role, shown as a tab of More
 * skills. Any of them can be added back to the plan as a refresher, which
 * fetches a few resources for it. A skill stays listed while its refresher
 * loads, or when none was found.
 */
export default function RefreshSkills({ skills, stateOf, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const hidden = skills.length > VISIBLE + 1 ? skills.length - VISIBLE : 0;
  const shown = expanded || hidden === 0 ? skills : skills.slice(0, VISIBLE);

  return (
    <>
      <p className="text-sm text-ink-soft">
        Skills you already have. If one feels rusty after your break, add a short refresher.
      </p>

      <ul id="refresh-list" className="mt-4 space-y-1">
        <AnimatePresence initial={false}>
          {shown.map((entry) => {
            const state = stateOf(entry);
            return (
              <motion.li
                key={entry.skill_id}
                className="lp-later-row"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                <span aria-hidden="true" className="lp-refresh-dot" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-[1.375rem] font-bold leading-tight tracking-[-0.02em] text-ink">
                    {entry.skill}
                  </h3>
                  {state === 'none' && (
                    <p className="mt-1.5 text-xs text-ink-faint">
                      No refresher resources for this skill yet.
                    </p>
                  )}
                </div>
                {state === 'loading' && (
                  <p role="status" className="shrink-0 text-sm text-ink-faint">
                    Finding a refresher…
                  </p>
                )}
                {state === 'idle' && (
                  <button
                    type="button"
                    onClick={() => onRefresh(entry)}
                    className="lp-ghost shrink-0"
                  >
                    <ArrowCounterClockwise weight="bold" className="size-3.5" aria-hidden="true" />
                    Refresh
                    <span className="sr-only">: {entry.skill}</span>
                  </button>
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          aria-controls="refresh-list"
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
