import { AnimatePresence, motion } from 'motion/react';
import { CaretDown, Check, Plus } from '@phosphor-icons/react';
import ChapterLabel from './ChapterLabel.jsx';

const EASE = [0.32, 0.72, 0, 1];

/**
 * Focus areas whose resources are all finished, one line each at the end of
 * the plan. A line opens to its resources for revisiting, and offers to add the
 * skill to the CV if it is not there yet.
 */
export default function FinishedAreas({
  areas,
  open,
  onToggle,
  onCv,
  onAddToCv,
  signedIn,
  renderResources,
}) {
  return (
    <section id="finished" aria-labelledby="finished-title" className="lp-area lp-later">
      <ChapterLabel as="h2" id="finished-title">
        Owned
      </ChapterLabel>
      <p className="mt-3 text-sm text-ink-soft">
        {areas.length === 1 ? 'A skill' : 'Skills'} you already have for this role, from your CV or
        finished learning. Open one with resources to revisit them.
      </p>

      <ul className="mt-4 space-y-1">
        <AnimatePresence initial={false}>
          {areas.map((area) => {
            const expanded = open.includes(area.skill_id);
            const panelId = `finished-${area.skill_id}-resources`;
            return (
              <motion.li
                key={area.skill_id}
                id={`finished-${area.skill_id}`}
                data-tone={area.tone}
                data-open={expanded || undefined}
                className="lp-done-area lp-tone"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.7, ease: EASE }}
              >
                <div className="flex items-center gap-4">
                  <span aria-hidden="true" className="lp-done-tick">
                    <Check weight="bold" className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-[1.375rem] font-bold leading-tight tracking-[-0.02em] text-ink">
                      {area.skill}
                    </h3>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-faint">
                      {area.resources.length > 0
                        ? `${area.resources.length} ${
                            area.resources.length === 1 ? 'resource' : 'resources'
                          } finished`
                        : 'Already in your skills'}
                      {signedIn && onCv(area) && (
                        <span className="font-semibold text-verify">· On your CV</span>
                      )}
                    </p>
                  </div>
                  {signedIn && !onCv(area) && (
                    <button
                      type="button"
                      onClick={() => onAddToCv(area)}
                      className="lp-tile-action inline-flex items-center gap-1"
                    >
                      <Plus weight="bold" className="size-3" aria-hidden="true" />
                      Add to CV
                      <span className="sr-only">: {area.skill}</span>
                    </button>
                  )}
                  {area.resources.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onToggle(area.skill_id)}
                      aria-label={`${expanded ? 'Hide' : 'Show'} resources for ${area.skill}`}
                      aria-expanded={expanded}
                      aria-controls={panelId}
                      className="lp-tile-action inline-flex items-center gap-1"
                    >
                      {expanded ? 'Hide' : 'Show'}
                      <CaretDown weight="bold" className="lp-done-caret size-3" aria-hidden="true" />
                    </button>
                  )}
                </div>

                <AnimatePresence initial={false}>
                  {expanded && area.resources.length > 0 && (
                    <motion.ul
                      key="resources"
                      id={panelId}
                      className="mt-3 space-y-1"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.4, ease: EASE }}
                    >
                      {renderResources(area)}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </section>
  );
}
