import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Check, Plus, ReadCvLogo, X } from '@phosphor-icons/react';
import { duration } from '../../lib/learningProgress.js';

const EASE = [0.32, 0.72, 0, 1];

/** One segment per resource in the focus area; finished ones fill in turn. */
function AreaMeter({ done, total }) {
  return (
    <div aria-hidden="true" className="mt-4 flex gap-1.5">
      {Array.from({ length: total }, (_, at) => (
        <span key={at} className="lp-meter-track h-1.5 flex-1">
          <motion.span
            className="lp-meter-fill"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: at < done ? 1 : 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.15 + at * 0.08 }}
          />
        </span>
      ))}
    </div>
  );
}

/**
 * Adds the finished skill to the user's CV without leaving the plan, so they
 * can keep learning and build the CV later. Once added, it links to the CV builder.
 */
function CvTile({ skill, added, onAdd, onRemove }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {added ? (
        <motion.div
          key="added"
          data-added
          className="lp-next-tile"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <span className="lp-next-icon">
            <Check weight="bold" className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-ink">Added to your CV</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-ink-soft">
              {skill} is on your CV. Keep learning and build it whenever you’re ready.
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={onRemove} className="lp-tile-action">
              Remove
            </button>
            <Link to="/plan/cv" className="lp-tile-action">
              View CV
            </Link>
          </span>
        </motion.div>
      ) : (
        <motion.button
          key="add"
          type="button"
          onClick={onAdd}
          className="lp-next-tile group w-full text-left"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <span className="lp-next-icon">
            <ReadCvLogo weight="light" className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-ink">Add it to your CV</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-ink-soft">
              You stay here. Your CV keeps it until you’re ready to build it.
            </span>
          </span>
          <span className="lp-tile-plus" aria-hidden="true">
            <Plus weight="bold" className="size-3.5" />
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

function CheckIn({ resource, onYes, onNotYet }) {
  const time = duration(resource.minutes);
  return (
    <>
      <p className="lp-eyebrow">Welcome back</p>
      <h2 id="lp-panel-title" className="mt-2 font-display text-xl font-bold leading-snug text-ink">
        Did you finish “{resource.title}”?
      </h2>
      <p className="mt-1 text-sm text-ink-soft">
        {resource.provider}
        {time && ` · ${time}`}
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button type="button" onClick={onYes} className="lp-primary group">
          Yes, I finished it
          <span className="lp-primary-icon">
            <Check weight="bold" className="size-3.5" aria-hidden="true" />
          </span>
        </button>
        <button type="button" onClick={onNotYet} className="lp-ghost">
          Not yet
        </button>
        <span className="text-xs text-ink-faint">It stays in Up next either way.</span>
      </div>
    </>
  );
}

function AccountPrompt({ onAccount }) {
  return (
    <>
      <p className="lp-eyebrow">Keep your progress</p>
      <h2 id="lp-panel-title" className="mt-2 font-display text-xl font-bold leading-snug text-ink">
        Create a free account to save and track resources
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
        An account keeps what you save and finish, so it is still here next time. You can open any
        resource without one.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button type="button" onClick={onAccount} className="lp-primary group">
          Create an account
          <span className="lp-primary-icon">
            <ArrowUpRight weight="bold" className="size-3.5" aria-hidden="true" />
          </span>
        </button>
      </div>
    </>
  );
}

function AreaFinished({
  area,
  total,
  onCv,
  onAddToCv,
  onRemoveFromCv,
  profileSync,
  onRetry,
}) {
  // A refresher is a skill the user already has, so there is nothing to add.
  if (area.refresher) {
    return (
      <>
        <p className="lp-eyebrow text-verify">Refresher finished</p>
        <h2
          id="lp-panel-title"
          className="mt-2 font-display text-2xl font-bold leading-tight text-ink"
        >
          You’ve refreshed {area.skill}.
        </h2>
        <AreaMeter done={total} total={total} />
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          It was already one of your skills, so your CV stays as it is.
        </p>
      </>
    );
  }

  return (
    <>
      <p className="lp-eyebrow text-verify">Focus area finished</p>
      <h2
        id="lp-panel-title"
        className="mt-2 font-display text-2xl font-bold leading-tight text-ink"
      >
        You’ve finished {area.skill}.
      </h2>
      <AreaMeter done={total} total={total} />
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        Every resource picked for it is done. Put it to work while it’s fresh.
      </p>
      <div className="mt-5 grid gap-2">
        <CvTile skill={area.skill} added={onCv} onAdd={onAddToCv} onRemove={onRemoveFromCv} />
        {profileSync?.status === 'syncing' && (
          <p role="status" className="text-xs text-ink-faint">
            Adding this skill to your professional profile…
          </p>
        )}
        {profileSync?.status === 'success' && (
          <p role="status" className="text-xs text-verify">
            Added to your professional skills.
          </p>
        )}
        {profileSync?.status === 'error' && (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-pink-50 px-3 py-2">
            <p role="alert" className="text-xs text-pink-700">
              Profile synchronization is temporarily unavailable. Your learning progress is kept.
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="lp-tile-action shrink-0"
              aria-label="Retry profile synchronization"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/**
 * Floating panel at the bottom of the learning plan. It asks whether a
 * resource opened earlier was finished, offers to add a completed focus area
 * to the CV (a finished refresher only confirms it), and asks guests to create
 * an account before tracking progress.
 */
export default function FinishPanel({
  moment,
  resource,
  area,
  total,
  onCv,
  onAddToCv,
  onRemoveFromCv,
  onAccount,
  onYes,
  onNotYet,
  onClose,
  profileSync,
  onRetry,
}) {
  const show = Boolean(moment && resource && area);

  useEffect(() => {
    if (!show) return undefined;
    const onKey = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [show, onClose]);

  const view = moment?.kind;

  return (
    <AnimatePresence>
      {show && (
        <motion.section
          key="panel"
          role="region"
          aria-labelledby="lp-panel-title"
          aria-live="polite"
          className="lp-island fixed inset-x-0 bottom-6 z-30 mx-auto w-[min(34rem,calc(100%-2rem))]"
          initial={{ opacity: 0, y: 48, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 32, scale: 0.97 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <div className="lp-island-core relative p-6">
            <button type="button" onClick={onClose} className="lp-close" aria-label="Close">
              <X weight="bold" className="size-3.5" aria-hidden="true" />
            </button>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${view}-${resource?.id}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="pr-8"
              >
                {view === 'check' && (
                  <CheckIn resource={resource} onYes={onYes} onNotYet={onNotYet} />
                )}
                {view === 'account' && <AccountPrompt onAccount={onAccount} />}
                {view === 'area' && (
                  <AreaFinished
                    area={area}
                    total={total}
                    onCv={onCv}
                    onAddToCv={onAddToCv}
                    onRemoveFromCv={onRemoveFromCv}
                    profileSync={profileSync}
                    onRetry={onRetry}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
