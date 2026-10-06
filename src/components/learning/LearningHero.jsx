import { Link } from 'react-router-dom';
import { ArrowUpRight, BookmarkSimple, Check, Plus } from '@phosphor-icons/react';
import ProviderMark from './ProviderMark.jsx';
import { duration, statusOf } from '../../lib/learningProgress.js';

/* Label for the featured resource, by its status. */
const LEAD = {
  started: 'Pick up where you left off',
  saved: 'From your saved list',
  none: 'Start here',
};

function formatReadiness(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(1).replace(/\.0$/, '') : '0';
}

function Stat({ value, label }) {
  return (
    <div>
      <p className="font-display text-2xl font-bold tracking-[-0.02em] text-ink tabular">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-ink-soft">{label}</p>
    </div>
  );
}

/**
 * Top of the learning plan: progress across every focus area, and the one
 * resource to do next. Once everything is finished, the next gap not yet in
 * the plan takes its place.
 */
export default function LearningHero({
  progress,
  done,
  total,
  timeLeft,
  upliftLeft,
  role,
  featured,
  queueSize,
  featuredArea,
  nextGap,
  onAddNext,
  onOpen,
  onFinish,
  onSave,
}) {
  const status = featured ? (statusOf(progress, featured.id) ?? 'none') : null;
  const time = featured && duration(featured.minutes);

  return (
    <section aria-label="Your progress" className="lp-hero mt-8 grid gap-6 p-3 lg:grid-cols-12">
      <div className="flex flex-col justify-center px-5 pt-6 pb-4 lg:col-span-7 lg:px-7 lg:py-8">
        <p className="lp-eyebrow">Your progress</p>
        <p className="mt-3 font-display text-[3.5rem] font-bold leading-none tracking-[-0.04em] text-ink tabular">
          {done}
          <span className="text-ink/25"> / {total}</span>
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          skills ready for {role ?? 'your target role'}
        </p>

        <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
          <Stat value={timeLeft ?? '0 min'} label="of learning left" />
          <Stat value={`+${formatReadiness(upliftLeft)}%`} label="readiness still on offer" />
        </div>
      </div>

      <div className="lg:col-span-5">
        {featured ? (
          <section
            aria-labelledby="lp-featured-title"
            data-tone={featuredArea?.tone}
            className="lp-feature lp-tone flex h-full flex-col p-6"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="lp-featured-title" className="lp-eyebrow text-[var(--tone-ink)]">
                {LEAD[status]}
              </h2>
              {status !== 'none' && queueSize > 1 && (
                <p className="text-xs font-medium text-ink-faint tabular">1 of {queueSize}</p>
              )}
            </div>
            <div className="mt-4 flex items-start gap-3">
              <ProviderMark logo={featured.logo} provider={featured.provider} className="size-11" />
              <div className="min-w-0">
                <p className="lp-area-tag truncate">{featuredArea?.skill}</p>
                <p className="mt-0.5 font-display text-xl font-bold leading-snug text-ink">
                  {featured.title}
                </p>
                <p className="mt-1 text-xs text-ink-faint">
                  {featured.provider} · {featured.format}
                  {time && ` · ${time}`}
                </p>
              </div>
            </div>
            <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-ink-soft">
              {featured.why}
            </p>

            <div className="mt-auto flex flex-wrap items-center gap-2 pt-6">
              <a
                href={featured.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onOpen(featured)}
                className="lp-primary group"
              >
                {status === 'started' ? 'Continue' : 'Start'}
                <span className="lp-primary-icon">
                  <ArrowUpRight weight="bold" className="size-3.5" aria-hidden="true" />
                </span>
                <span className="sr-only">
                  {featured.title} at {featured.provider}, opens in a new tab
                </span>
              </a>
              {status === 'started' ? (
                <button type="button" onClick={() => onFinish(featured)} className="lp-ghost">
                  <Check weight="bold" className="size-3.5" aria-hidden="true" />
                  Mark finished
                  <span className="sr-only">: {featured.title}</span>
                </button>
              ) : (
                <button type="button" onClick={() => onSave(featured)} className="lp-ghost">
                  <BookmarkSimple
                    weight={status === 'saved' ? 'fill' : 'light'}
                    className="size-4"
                    aria-hidden="true"
                  />
                  {status === 'saved' ? 'Remove from saved' : 'Save for later'}
                  <span className="sr-only">: {featured.title}</span>
                </button>
              )}
            </div>
          </section>
        ) : nextGap ? (
          <section
            aria-labelledby="lp-featured-title"
            className="lp-feature flex h-full flex-col p-6"
          >
            <h2 id="lp-featured-title" className="lp-eyebrow text-verify">
              Everything here is finished
            </h2>
            <p className="mt-4 text-sm font-medium text-ink-soft">Ready for the next skill?</p>
            <p className="mt-1 font-display text-xl font-bold leading-snug text-ink">
              {nextGap.skill}
            </p>
            {nextGap.uplift != null && (
              <p className="mt-2 text-xs font-semibold text-verify tabular">
                +{nextGap.uplift}% readiness if learned
              </p>
            )}
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Add it and its resources join your plan below.
            </p>
            <div className="mt-auto flex flex-wrap items-center gap-2 pt-6">
              <button type="button" onClick={() => onAddNext(nextGap)} className="lp-primary group">
                Add to plan
                <span className="lp-primary-icon">
                  <Plus weight="bold" className="size-3.5" aria-hidden="true" />
                </span>
                <span className="sr-only">: {nextGap.skill}</span>
              </button>
              <Link to="/plan/cv" className="lp-ghost">
                View your CV
              </Link>
            </div>
          </section>
        ) : (
          <section
            aria-labelledby="lp-featured-title"
            className="lp-feature flex h-full flex-col p-6"
          >
            <h2 id="lp-featured-title" className="lp-eyebrow text-verify">
              Everything here is finished
            </h2>
            <p className="mt-3 font-display text-xl font-bold leading-snug text-ink">
              Every resource in your plan is done.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              The focus areas you finished are waiting in your CV builder, ready to add.
            </p>
            <div className="mt-auto pt-6">
              <Link to="/plan/cv" className="lp-primary group">
                Open your CV builder
                <span className="lp-primary-icon">
                  <ArrowUpRight weight="bold" className="size-3.5" aria-hidden="true" />
                </span>
              </Link>
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
