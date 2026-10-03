import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Header from '../../components/layout/Header.jsx';
import BackLink from '../../components/intake/BackLink.jsx';
import TargetRoleSelect from '../../components/plan/TargetRoleSelect.jsx';
import Photo from '../../components/ui/Photo.jsx';
import LearningIcon from '../../components/plan/LearningIcon.jsx';
import CardIllustration from '../../components/ui/CardIllustration.jsx';
import { MAX_FOCUS_AREAS } from '../../components/gap/FocusAreaList.jsx';
import { pickFocusAreas } from '../../lib/focusAreas.js';
import { formatUplift } from '../../lib/formatters.js';
import { recommendLearning } from '../../api/learning.js';
import { useAccountStore } from '../../store/accountStore.js';
import { useIntakeStore } from '../../store/intakeStore.js';

import bannerWebp from '../../assets/learning-desk.webp';
import bannerJpg from '../../assets/learning-desk.jpg';
import figmaLogo from '../../assets/logos/figma.png';
import youtubeLogo from '../../assets/logos/youtube.png';
import nngroupLogo from '../../assets/logos/nngroup.png';
import openaiLogo from '../../assets/logos/openai.png';
import learningDeskIllustration from '../../assets/page-illustrations/learning-desk.png';

/* Provider logos are self-hosted to avoid third-party requests. */
const LOGOS = {
  figma: figmaLogo,
  youtube: youtubeLogo,
  nngroup: nngroupLogo,
  openai: openaiLogo,
};

const ALL = 'all';

/** Formats minutes as "30 min" below an hour, otherwise as hours (e.g. "1.5h"). */
function duration(minutes) {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
}

/**
 * Provider logo, falling back to initials. Hidden from assistive technology
 * because the provider name is rendered beside it.
 */
function ProviderMark({ logo, provider }) {
  const source = LOGOS[logo];

  if (source) {
    return (
      <img
        src={source}
        alt=""
        aria-hidden="true"
        width="32"
        height="32"
        loading="lazy"
        decoding="async"
        className="size-8 shrink-0 rounded-lg object-contain"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-canvas-sunk text-[0.625rem] font-bold leading-none text-ink-soft"
    >
      {provider.slice(0, 2)}
    </span>
  );
}

function Chip({ tone = 'neutral', children }) {
  const tones = {
    neutral: 'bg-canvas-sunk text-ink-soft',
    format: 'bg-blue-100 text-blue-600',
    free: 'bg-verify-soft text-verify',
  };

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

/**
 * Learning resource row: title, `why` (how it addresses the gap), and provider,
 * format, duration and cost.
 */
function Resource({ resource, completed, onToggle }) {
  return (
    <li
      className={[
        'flex flex-wrap items-start gap-x-4 gap-y-3 border-t border-line px-5 py-4 transition-colors sm:flex-nowrap sm:px-6',
        completed ? 'bg-verify-soft/60' : '',
      ].join(' ')}
    >
      <label className="flex cursor-pointer items-center pt-1">
        <input
          type="checkbox"
          checked={completed}
          onChange={onToggle}
          className="size-5 rounded border-line-strong accent-verify focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        />
        <span className="sr-only">Mark {resource.title} as completed</span>
      </label>
      <ProviderMark logo={resource.logo} provider={resource.provider} />

      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-ink">
          {resource.title}
          {/* Completed resources keep full-strength titles. */}
          {completed && (
            <span className="ml-2 inline-flex translate-y-[-1px] items-center gap-1 rounded-full bg-verify px-2 py-0.5 align-middle text-[0.6875rem] font-semibold text-white">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="size-3"
              >
                <path d="m5 12.5 4.1 4.1L19.5 6.5" />
              </svg>
              Completed
            </span>
          )}
        </h3>
        <p className="mt-0.5 text-xs text-ink-faint">{resource.provider}</p>
        <p className="mt-1.5 max-w-[62ch] text-sm leading-relaxed text-ink-soft">{resource.why}</p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Chip tone="format">{resource.format}</Chip>
        {duration(resource.minutes) && <Chip>{duration(resource.minutes)}</Chip>}
        <Chip tone={resource.free ? 'free' : 'neutral'}>{resource.cost}</Chip>
      </div>

      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded-full border border-line-strong px-4 py-2 text-sm font-semibold text-ink transition hover:bg-canvas-sunk focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        Open resource
        <span aria-hidden="true" className="ml-1 text-ink-faint">
          ↗
        </span>
        <span className="sr-only">
          {resource.title} at {resource.provider}, opens in a new tab
        </span>
      </a>
    </li>
  );
}

/**
 * Learning plan page. Resources are grouped by focus area, in the gap
 * result's ranking order.
 */
export default function Learning() {
  const snapshot = useIntakeStore((state) => state.snapshot);
  const selectedRole = useIntakeStore((state) => state.selectedRole);
  const user = useAccountStore((state) => state.user);
  const gapResult = useIntakeStore((state) => state.gapResult);

  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState(ALL);
  const [closed, setClosed] = useState([]);
  const completed = useIntakeStore((state) => state.learningCompleted);
  const toggleCompleted = useIntakeStore((state) => state.toggleLearningCompleted);

  const focusAreas = gapResult ? pickFocusAreas(gapResult.gaps, MAX_FOCUS_AREAS) : [];
  const skillIds = focusAreas.map((gap) => gap.skill_id);
  const skillKey = skillIds.join('|');

  useEffect(() => {
    if (!gapResult || !selectedRole) return undefined;

    // Ignore responses from a superseded request (e.g. after a target role change).
    let live = true;

    recommendLearning({
      skillIds: skillKey.split('|'),
      targetRoleId: selectedRole.role_id,
      targetRole: selectedRole.role,
    })
      .then((result) => {
        if (!live) return;
        setPlan(result);
        setError(null);
      })
      .catch((cause) => live && setError(cause.message));

    return () => {
      live = false;
    };
  }, [skillKey, gapResult, selectedRole]);

  /* Format filters, derived from the formats present so no filter yields an
     empty result. */
  const formats = useMemo(() => {
    const seen = [];
    for (const resource of plan?.resources ?? []) {
      if (!seen.includes(resource.format)) seen.push(resource.format);
    }
    return seen;
  }, [plan]);

  // All resources are free, so only the format filter applies.
  const matches = (resource) => filter === ALL || resource.format === filter;

  // Requires a gap result.
  if (!snapshot || !gapResult) return <Navigate to="/diagnostic/gap" replace />;

  const shown = (plan?.resources ?? []).filter(matches);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="page-shell max-w-[1200px] flex-1 pt-14 pb-20">
        {/* Back target: the journey for signed-in users, the gap screen for guests. */}
        {user ? (
          <BackLink to="/journey">Back to your journey</BackLink>
        ) : (
          <BackLink to="/diagnostic/gap">Back to your readiness</BackLink>
        )}

        <div className="mt-3 flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-bold leading-[1.1] tracking-[-0.02em] text-ink sm:text-4xl">
              Your learning plan
            </h1>
            <p className="mt-2.5 max-w-[58ch] text-sm leading-relaxed text-ink-soft sm:text-base">
              Personalised resources to help you build your skills and confidence for your next
              step.
            </p>
          </div>

          <TargetRoleSelect />
        </div>

        <section className="learning-banner card-with-illustration mt-6 grid rounded-3xl md:grid-cols-[1fr_1fr]">
          <CardIllustration src={learningDeskIllustration} />
          <div className="order-2 p-6 sm:p-8 md:order-1 md:self-center">
            <p className="eyebrow text-ink-faint">Learn at your own pace</p>
            <h2 className="mt-2 max-w-[16ch] font-display text-2xl font-bold leading-[1.12] tracking-[-0.02em] text-ink sm:text-3xl">
              Small steps, bigger possibilities.
            </h2>
            <p className="mt-3 max-w-[40ch] text-sm leading-relaxed text-ink-soft">
              Build new skills, rekindle your confidence, and create the next chapter on your terms.
            </p>
          </div>

          <div className="relative order-1 md:order-2">
            {/* Gradient overlay blending the text panel into the photograph. */}
            <div
              aria-hidden="true"
              className="learning-banner-blend pointer-events-none absolute inset-0 z-10"
            />
            <Photo
              webp={bannerWebp}
              jpg={bannerJpg}
              width={1672}
              height={941}
              alt="A sunlit desk with a stack of books, a notebook and pen, a mug of coffee and an open laptop."
              className="block h-44 w-full object-cover object-center sm:h-56 md:h-full"
            />
          </div>
        </section>

        {error && (
          <p role="alert" className="mt-8 text-sm font-medium text-pink-600">
            {error} Reload the page to try again.
          </p>
        )}

        {!plan && !error && (
          <p className="mt-8 text-sm text-ink-soft">Finding resources for your focus areas…</p>
        )}

        {plan && plan.resources.length > 0 && (
          <div className="mt-7 flex flex-wrap items-center gap-2">
            {[ALL, ...formats].map((value) => {
              const label = value === ALL ? 'All' : `${value}s`;
              const active = filter === value;

              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(value)}
                  className={[
                    'rounded-full border px-4 py-2 text-sm font-medium transition duration-200 ease-spring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
                    active
                      ? 'border-ink bg-ink text-white'
                      : 'border-line-strong bg-surface text-ink-soft hover:border-ink/30 hover:text-ink',
                  ].join(' ')}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {plan &&
          focusAreas.map((gap) => {
            const group = plan.groups?.find((entry) => entry.skill_id === gap.skill_id);
            const forGap = shown.filter((resource) => resource.skill_id === gap.skill_id);

            // Skip focus areas with no resources after filtering; counts reflect visible items.
            if (forGap.length === 0) return null;

            const count = forGap.length;
            const open = !closed.includes(gap.skill_id);
            const done = forGap.filter((resource) => completed.includes(resource.id)).length;

            return (
              <section
                key={gap.skill_id}
                className="mt-5 overflow-hidden rounded-2xl border border-line bg-surface"
              >
                <div className="flex flex-wrap items-center gap-x-4 gap-y-3 p-5 sm:px-6">
                  <span
                    aria-hidden="true"
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-canvas-sunk text-ink"
                  >
                    <LearningIcon name={group?.icon} className="size-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-lg font-bold tracking-[-0.015em] text-ink">
                      {gap.skill}
                    </h2>
                    {group?.blurb && <p className="mt-0.5 text-sm text-ink-soft">{group.blurb}</p>}
                  </div>

                  <p className="shrink-0 text-sm font-semibold tabular text-verify">
                    {formatUplift(gap.uplift)}
                  </p>
                  <p className="shrink-0 text-xs font-semibold text-ink-soft">
                    {done}/{count} complete
                  </p>

                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() =>
                      setClosed((current) =>
                        current.includes(gap.skill_id)
                          ? current.filter((id) => id !== gap.skill_id)
                          : [...current, gap.skill_id]
                      )
                    }
                    className="flex shrink-0 items-center gap-2 rounded-full px-2 py-1 text-sm text-ink-soft transition hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    {count} {count === 1 ? 'resource' : 'resources'}
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className={`size-4 transition-transform duration-200 ${open ? '' : 'rotate-180'}`}
                    >
                      <path d="m5 14 7-7 7 7" />
                    </svg>
                    <span className="sr-only">, {open ? 'hide' : 'show'} these resources</span>
                  </button>
                </div>

                {open && (
                  <ul>
                    {forGap.map((resource) => (
                      <Resource
                        key={resource.id}
                        resource={resource}
                        completed={completed.includes(resource.id)}
                        onToggle={() => toggleCompleted(resource.id)}
                      />
                    ))}
                  </ul>
                )}
              </section>
            );
          })}

        {plan?.resources.length === 0 && (
          <p className="mt-8 max-w-[56ch] text-sm leading-relaxed text-ink-soft">
            Nothing is listed for these focus areas yet. Your gap result still stands — the
            resources for it are being added.
          </p>
        )}

        {plan && plan.resources.length > 0 && shown.length === 0 && (
          <p className="mt-8 max-w-[56ch] text-sm leading-relaxed text-ink-soft">
            No {filter}s here for your focus areas. Select “All” to see everything.
          </p>
        )}
      </main>
    </div>
  );
}
