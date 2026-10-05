import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, PencilSimple } from '@phosphor-icons/react';
import SkillDefinitionPopover from '../skills/SkillDefinitionPopover.jsx';
import { pickFocusAreas } from '../../lib/focusAreas.js';
import { getSkillDefinition } from '../../lib/skillDefinition.js';

export const MAX_FOCUS_AREAS = 3;

const BAND_LABELS = {
  role: 'Role skill',
  ai_usage: 'AI literacy',
};

const GROUP_LABEL = 'eyebrow';

const EASE = [0.32, 0.72, 0, 1];

const ROW_CLASS =
  'relative flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left shadow-card transition-[background-color,box-shadow,translate] duration-500 ease-spring';

const CHIP_CLASS =
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-left text-[0.8125rem] shadow-[0_1px_2px_rgb(44_33_66/0.05)] transition-colors duration-300 ease-spring';

/** Fade-up entry, staggered by `step` after `delay` (seconds). */
const rise = (delay, step) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay: delay + step * 0.12, ease: EASE },
});

/** Short fade for elements that appear while the card is in use. */
const swap = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
  transition: { duration: 0.45, ease: EASE },
};

/** Round tick shown on selectable skills; filled when picked. */
function PickMark({ picked }) {
  return (
    <span
      aria-hidden="true"
      className={[
        'flex size-6 shrink-0 items-center justify-center rounded-full transition-[background-color,color,scale] duration-300 ease-spring',
        picked ? 'scale-100 bg-verify text-white' : 'scale-95 bg-canvas-sunk text-transparent',
      ].join(' ')}
    >
      <Check size={13} weight="bold" />
    </span>
  );
}

/** One ranked skill: its number, the skill and its band. Selectable while reviewing. */
function FocusAreaRow({ gap, index, delay, reviewing, picked, onToggle }) {
  const definition = getSkillDefinition(gap);
  // The badge animates once, not again when the row switches modes.
  const [entered, setEntered] = useState(false);

  const content = (
    <>
      <motion.span
        className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-plane font-display text-sm font-bold tabular text-white shadow-[inset_0_1px_1px_rgb(255_255_255/0.18)]"
        initial={entered ? false : { scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: delay + index * 0.12, ease: EASE }}
        onAnimationComplete={() => setEntered(true)}
      >
        {index + 1}
      </motion.span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-[0.9375rem] font-semibold text-ink">{gap.skill}</span>
        <span className="mt-0.5 block text-xs text-ink-faint">{BAND_LABELS[gap.band]}</span>
      </span>
    </>
  );

  let row;
  if (reviewing) {
    row = (
      <button
        type="button"
        aria-pressed={picked}
        onClick={onToggle}
        className={`${ROW_CLASS} ${picked ? 'bg-verify-soft' : 'bg-surface hover:-translate-y-0.5 hover:shadow-card-hover'} active:scale-[0.99]`}
      >
        {content}
        <PickMark picked={picked} />
      </button>
    );
  } else if (!definition) {
    row = <div className={`${ROW_CLASS} bg-surface`}>{content}</div>;
  } else {
    row = (
      <SkillDefinitionPopover definition={definition} label={gap.skill}>
        {(triggerProps) => (
          <button
            type="button"
            {...triggerProps}
            className={`${ROW_CLASS} bg-surface hover:-translate-y-0.5 hover:shadow-card-hover focus-visible:shadow-card-hover`}
          >
            {content}
          </button>
        )}
      </SkillDefinitionPopover>
    );
  }

  return <motion.li {...rise(delay, index)}>{row}</motion.li>;
}

/** A skill for later: a quiet chip on the card's tinted footer. Selectable while reviewing. */
function LaterSkill({ gap, reviewing, picked, onToggle }) {
  const definition = getSkillDefinition(gap);

  if (reviewing) {
    return (
      <li>
        <button
          type="button"
          aria-pressed={picked}
          onClick={onToggle}
          className={`${CHIP_CLASS} ${picked ? 'bg-verify-soft font-medium text-verify' : 'bg-surface text-ink-soft hover:text-ink'}`}
        >
          {picked && <Check aria-hidden="true" size={12} weight="bold" />}
          {gap.skill}
        </button>
      </li>
    );
  }

  const rowClass = `${CHIP_CLASS} bg-surface/80 text-ink-soft`;

  if (!definition) return <li className={rowClass}>{gap.skill}</li>;

  return (
    <li>
      <SkillDefinitionPopover definition={definition} label={gap.skill}>
        {(triggerProps) => (
          <button
            type="button"
            {...triggerProps}
            className={`${rowClass} cursor-default hover:bg-surface hover:text-ink focus-visible:text-ink`}
          >
            {gap.skill}
          </button>
        )}
      </SkillDefinitionPopover>
    </li>
  );
}

/**
 * Lists the role requirements the user does not yet meet. The highest-impact
 * gaps are ranked; the rest are listed unranked. Ranking follows the backend's
 * uplift order; uplift values are not shown.
 *
 * A CV can be out of date, so the user can mark gaps they already have.
 * `onAddSkills(gaps)` saves them and recomputes the gap; `onUndo(skillNames)`
 * removes the last batch. Both return promises; `updating` is true meanwhile.
 *
 * `delay` offsets the entry animation (seconds).
 */
export default function FocusAreaList({
  gaps,
  delay = 0,
  updating = false,
  onAddSkills,
  onUndo,
}) {
  const [reviewing, setReviewing] = useState(false);
  const [picked, setPicked] = useState([]);
  // Last saved batch, kept so it can be undone.
  const [added, setAdded] = useState(null);
  // Rows that appear after an update skip the page-entry delay.
  const [updated, setUpdated] = useState(false);
  const rowDelay = updated ? 0 : delay + 0.25;

  const focusAreas = pickFocusAreas(gaps, MAX_FOCUS_AREAS);
  const alsoMissing = gaps.filter((gap) => !focusAreas.includes(gap));
  const canReview = gaps.length > 0 && Boolean(onAddSkills);

  // Gaps are keyed by name; the gap response carries no skill id.
  const toggle = (skill) =>
    setPicked((current) =>
      current.includes(skill) ? current.filter((name) => name !== skill) : [...current, skill]
    );

  function startReview() {
    setAdded(null);
    setPicked([]);
    setReviewing(true);
  }

  function cancelReview() {
    setPicked([]);
    setReviewing(false);
  }

  function save() {
    const chosen = gaps.filter((gap) => picked.includes(gap.skill));
    setUpdated(true);
    onAddSkills(chosen)
      .then(() => {
        setAdded(chosen);
        setPicked([]);
        setReviewing(false);
      })
      .catch(() => {}); // The page shows the error; the selection is kept for a retry.
  }

  function undo() {
    setUpdated(true);
    onUndo(added.map((gap) => gap.skill))
      .then(() => setAdded(null))
      .catch(() => {});
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      <section className="flex flex-col overflow-hidden rounded-[1.75rem] bg-surface shadow-card">
        <div className="focus-wash relative flex-1 p-7">
          <div className="flex min-h-7 items-center justify-between gap-3">
            <h2 className="eyebrow text-ink-soft">
              Missing for this role
              {gaps.length > 0 && (
                <>
                  <span aria-hidden="true" className="text-ink-faint">
                    {' '}
                    · {gaps.length}
                  </span>
                  <span className="sr-only">
                    , {gaps.length} {gaps.length === 1 ? 'requirement' : 'requirements'}
                  </span>
                </>
              )}
            </h2>

            {canReview &&
              (reviewing ? (
                <button
                  type="button"
                  onClick={cancelReview}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-soft transition-colors duration-300 ease-spring hover:bg-surface/70 hover:text-ink"
                >
                  Cancel
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startReview}
                  className="group flex items-center gap-2 rounded-full bg-surface py-1 pr-3.5 pl-1 text-xs font-semibold text-ink shadow-card transition-[box-shadow,translate,scale] duration-500 ease-spring hover:-translate-y-px hover:shadow-card-hover active:scale-[0.98]"
                >
                  <span className="flex size-5.5 items-center justify-center rounded-full bg-canvas-sunk text-ink transition-transform duration-500 ease-spring group-hover:scale-110">
                    <PencilSimple aria-hidden="true" size={11} weight="bold" />
                  </span>
                  Edit skills
                </button>
              ))}
          </div>

          {gaps.length === 0 ? (
            <p className="mt-4 text-sm italic text-ink-faint">
              No gaps were found for this role — you are covered on every skill we checked.
            </p>
          ) : (
            <>
              <p className="mt-3 font-display text-2xl font-bold tracking-[-0.015em] text-ink">
                {reviewing
                  ? 'Which of these do you already have?'
                  : `Your top ${focusAreas.length} to start with`}
              </p>
              <p className="mt-1.5 text-sm text-ink-soft">
                {reviewing
                  ? 'Select any skills your CV leaves out. Your match updates when you add them.'
                  : 'The skills this role relies on most.'}
              </p>

              <AnimatePresence initial={false}>
                {added && !reviewing && (
                  <motion.p
                    role="status"
                    className="mt-4 flex items-center gap-3 rounded-2xl bg-verify-soft px-4 py-2.5 text-sm text-verify"
                    {...swap}
                  >
                    <Check aria-hidden="true" size={14} weight="bold" className="shrink-0" />
                    <span className="flex-1">
                      Added {added.length} {added.length === 1 ? 'skill' : 'skills'} to your
                      profile. Your match is updated.
                    </span>
                    <button
                      type="button"
                      onClick={undo}
                      disabled={updating}
                      className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors duration-300 ease-spring hover:bg-verify/10 disabled:opacity-50"
                    >
                      Undo
                    </button>
                  </motion.p>
                )}
              </AnimatePresence>

              <ol aria-label="Your top skills to build" className="relative mt-5 space-y-2.5">
                {focusAreas.map((gap, index) => (
                  <FocusAreaRow
                    key={gap.skill}
                    gap={gap}
                    index={index}
                    delay={rowDelay}
                    reviewing={reviewing}
                    picked={picked.includes(gap.skill)}
                    onToggle={() => toggle(gap.skill)}
                  />
                ))}
              </ol>
            </>
          )}
        </div>

        {alsoMissing.length > 0 && (
          /* Remaining gaps, listed so the total count matches, but unranked. */
          <motion.div
            className="bg-canvas-sunk/70 px-7 py-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: delay + 0.6, ease: EASE }}
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className={GROUP_LABEL}>For later</p>
              <p className="text-xs text-ink-faint">
                {alsoMissing.length} more {alsoMissing.length === 1 ? 'skill' : 'skills'}
              </p>
            </div>

            <ul className="mt-3 flex flex-wrap gap-2">
              {alsoMissing.map((gap) => (
                <LaterSkill
                  key={gap.skill}
                  gap={gap}
                  reviewing={reviewing}
                  picked={picked.includes(gap.skill)}
                  onToggle={() => toggle(gap.skill)}
                />
              ))}
            </ul>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {reviewing && (
            <motion.div
              className="flex items-center justify-between gap-4 bg-surface px-7 py-4"
              {...swap}
            >
              <p className="text-sm text-ink-soft" aria-live="polite">
                {picked.length === 0
                  ? 'Nothing selected yet'
                  : `${picked.length} ${picked.length === 1 ? 'skill' : 'skills'} selected`}
              </p>
              <button
                type="button"
                onClick={save}
                disabled={picked.length === 0 || updating}
                className="group flex items-center gap-3 rounded-full bg-ink py-1.5 pr-1.5 pl-5 text-sm font-semibold text-white shadow-card transition-[opacity,scale,box-shadow] duration-500 ease-spring hover:shadow-card-hover active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
              >
                {updating ? 'Updating…' : 'Add to my skills'}
                <span className="flex size-8 items-center justify-center rounded-full bg-white/12 transition-transform duration-500 ease-spring group-enabled:group-hover:scale-105">
                  <Check aria-hidden="true" size={14} weight="bold" />
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </motion.div>
  );
}
