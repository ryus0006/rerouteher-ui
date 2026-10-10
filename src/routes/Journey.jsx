import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowUpRight,
  BookOpenText,
  Buildings,
  ChatsCircle,
  Check,
  FileText,
  Microphone,
} from '@phosphor-icons/react';
import useSmoothNavigate from '../hooks/useSmoothNavigate.js';
import Header from '../components/layout/Header.jsx';
import { RequirementSegments } from '../components/gap/MatchPanel.jsx';
import { MAX_FOCUS_AREAS } from '../components/gap/FocusAreaList.jsx';
import GradientButton from '../components/ui/GradientButton.jsx';
import CardIllustration from '../components/ui/CardIllustration.jsx';
import ProviderMark from '../components/learning/ProviderMark.jsx';
import PriorityIcon from '../components/employers/PriorityIcon.jsx';
import { LogoTile, MatchMeter } from '../components/employers/MatchVisuals.jsx';
import { matchLabel } from '../lib/matchLabel.js';
import { PRIORITY_NAMES } from '../config/employerPriorities.js';
import { FOCUS_TONES, pickFocusAreas, planFocusAreas } from '../lib/focusAreas.js';
import { statusOf, upNext } from '../lib/learningProgress.js';
import { journeyProgress } from '../lib/journeyProgress.js';
import { openCvBook } from '../lib/cvDraft.js';
import { computeGap } from '../api/gap.js';
import {
  PRACTICE_FOCUS,
  QUESTIONS_PER_SET,
  focusLabel,
  getSession,
  listSessions,
} from '../api/interview.js';
import { recommendLearning } from '../api/learning.js';
import { matchEmployers } from '../api/employers.js';
import { resolveDisplayName } from '../api/account.js';
import { useAccountStore } from '../store/accountStore.js';
import { useIntakeStore } from '../store/intakeStore.js';
import journeyPath from '../assets/page-illustrations/journey-path.png';

const EASE = [0.32, 0.72, 0, 1];

/** Fade-up entry, staggered by `step`. */
const rise = (step) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay: step * 0.07, ease: EASE },
});

/** "n thing(s)" with the right plural. */
const count = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/* Label for the featured resource, by its status, as on the learning plan. */
const LEAD = {
  started: 'Pick up where you left off',
  saved: 'From your saved list',
  none: 'Start here',
};

/** Round arrow nested in a link, nudged on hover. */
function ArrowMark({ className = 'bg-canvas-sunk text-ink' }) {
  return (
    <span
      className={`flex size-7 shrink-0 items-center justify-center rounded-full transition-transform duration-500 ease-spring group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${className}`}
    >
      <ArrowUpRight aria-hidden="true" size={13} weight="bold" />
    </span>
  );
}

/**
 * Role pills for the snapshot's recommended roles, on the dark target-role
 * card. Index 0 is the previous occupation and carries the "Closest match"
 * marker.
 */
function RoleSwitch({ roles, selected, busy, onSelect }) {
  return (
    <fieldset disabled={Boolean(busy)}>
      <legend className="sr-only">Choose the role you are aiming at</legend>

      <ul className="flex flex-wrap gap-2">
        {roles.map((role, index) => {
          const checked = role.role_id === selected?.role_id;

          return (
            <li key={role.role_id}>
              <label
                className={[
                  'inline-flex cursor-pointer items-center gap-2 rounded-full px-3.5 py-1.5 text-sm transition-colors duration-300 ease-spring',
                  'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-white',
                  checked
                    ? 'bg-white font-semibold text-ink'
                    : 'bg-white/8 text-on-plane-soft hover:bg-white/14 hover:text-white',
                  busy && !checked ? 'opacity-50' : '',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="journey-target-role"
                  value={role.role_id}
                  checked={checked}
                  onChange={() => onSelect(role)}
                  className="sr-only"
                />
                {role.role}
                {index === 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      checked ? 'bg-canvas-sunk text-ink-soft' : 'bg-white/10 text-on-plane-soft'
                    }`}
                  >
                    Closest match
                  </span>
                )}
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

/**
 * One locked step on the path, shown before a target role is chosen. The
 * steps open once the gap result exists.
 */
function LockedStep({ number, step, last, delay }) {
  return (
    <motion.li className="relative flex gap-4" {...rise(delay)}>
      {/* Rail joining the step markers. */}
      {!last && (
        <span
          aria-hidden="true"
          className="absolute top-[3.25rem] bottom-[-0.5rem] left-[2.3125rem] w-0.5 rounded-full bg-ink/8"
        />
      )}
      <div className="mb-3 flex flex-1 items-center gap-4 px-5 py-3">
        <span className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-xl bg-canvas-sunk font-display text-sm font-bold text-ink-faint tabular">
          {number}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[1.0625rem] font-bold tracking-[-0.01em] text-ink-faint">
            {step.title}
          </span>
          <span className="mt-0.5 block text-sm text-ink-soft">Built around your target role</span>
        </span>
      </div>
    </motion.li>
  );
}

/**
 * The next thing to do, with the four steps as a tracker beside it. Each
 * stop opens its tool; the current one is marked with a pulse.
 */
function NextStep({ steps, currentIndex }) {
  const allDone = currentIndex === -1;
  const current = steps[currentIndex];
  const doneCount = steps.filter((step) => step.done).length;

  return (
    <motion.section
      aria-label="Your next step"
      className="lp-hero mt-8 grid gap-8 px-9 py-7 lg:grid-cols-12 lg:items-center max-md:mt-6 max-md:p-6"
      {...rise(1)}
    >
      <div className="lg:col-span-5">
        <p className="lp-eyebrow">{allDone ? 'Every step done' : 'Up next'}</p>
        <h2 className="mt-3 font-display text-[2rem] leading-[1.1] font-bold tracking-[-0.03em] text-ink max-md:text-[1.625rem]">
          {allDone ? 'You’re ready to apply' : current.title}
        </h2>
      </div>

      <div className="lg:col-span-7">
        <div className="flex items-baseline justify-between gap-4 px-1">
          <p className="lp-eyebrow">Your path back to work</p>
          <p className="text-sm font-medium text-ink-soft tabular">
            {doneCount} of {steps.length} done
          </p>
        </div>

        <ol
          className="journey-track mt-5 grid grid-cols-4 max-md:grid-cols-2 max-md:gap-y-3"
          style={{ '--journey-fill': allDone ? 1 : currentIndex / (steps.length - 1) }}
        >
          {steps.map((step, index) => {
            const state = step.done ? 'done' : index === currentIndex ? 'current' : 'upcoming';
            const Icon = step.icon;
            return (
              <li key={step.id}>
                <div
                  data-state={state}
                  data-tone={step.tone}
                  aria-current={state === 'current' ? 'step' : undefined}
                  className="journey-stop lp-tone"
                >
                  <span aria-hidden="true" className="journey-stop-mark">
                    {state === 'done' ? (
                      <Check weight="bold" className="size-5" />
                    ) : (
                      <Icon weight="duotone" className="size-[1.375rem]" />
                    )}
                  </span>
                  <span className="mt-3 block text-[0.6875rem] font-semibold tracking-[0.12em] text-ink-faint uppercase">
                    Step {index + 1}
                  </span>
                  <span className="mt-0.5 block text-sm font-semibold leading-snug text-ink">
                    {step.tool}
                  </span>
                  <span className="mt-1 block text-xs leading-snug text-ink-soft">
                    {step.status}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </motion.section>
  );
}

/** "Done" or "Up next" beside a widget's title; nothing for later steps. */
function StatePill({ state }) {
  if (state === 'done') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-verify px-2.5 py-1 text-[0.6875rem] font-semibold text-white">
        <Check weight="bold" className="size-3" aria-hidden="true" />
        Done
      </span>
    );
  }
  if (state === 'current') {
    return (
      <span className="rounded-full bg-pink-600 px-2.5 py-1 text-[0.6875rem] font-semibold text-white">
        Up next
      </span>
    );
  }
  return null;
}

/**
 * Dashboard tile for one tool: its icon, name and step, a preview of what the
 * tool shows, and a link into it. The current step's tile is tinted in its tone.
 */
function Widget({ step, number, state, link, className = '', delay, children }) {
  const Icon = step.icon;
  const titleId = `journey-${step.id}-title`;

  return (
    <motion.section
      id={`journey-${step.id}`}
      aria-labelledby={titleId}
      data-tone={step.tone}
      data-state={state}
      className={`journey-widget lp-tone flex scroll-mt-8 flex-col p-6 max-md:p-5 ${className}`}
      {...rise(delay)}
    >
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="lp-area-icon lp-area-icon-sm">
          <Icon weight="duotone" className="size-[1.125rem]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.6875rem] font-semibold tracking-[0.12em] text-ink-faint uppercase">
            Step {number}
          </p>
          <h2 id={titleId} className="font-display text-lg leading-tight font-bold text-ink">
            {step.tool}
          </h2>
        </div>
        <StatePill state={state} />
      </div>

      <div className="mt-5 flex-1">{children}</div>

      <Link
        to={step.to}
        className="group mt-6 inline-flex items-center gap-2.5 self-start rounded-full py-0.5 text-sm font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        {link}
        <ArrowMark />
      </Link>
    </motion.section>
  );
}

/** A large figure with its label underneath. */
function Figure({ value, of, label }) {
  return (
    <div>
      <p className="font-display text-[2.5rem] leading-none font-bold tracking-[-0.04em] text-ink tabular">
        {value}
        {of !== undefined && <span className="text-ink/25"> / {of}</span>}
      </p>
      <p className="mt-2 text-sm text-ink-soft">{label}</p>
    </div>
  );
}

/**
 * Learning plan preview: the same progress figure, focus areas and featured
 * resource the learning plan opens with.
 */
function LearningPreview({
  plan,
  loading,
  areas,
  featured,
  featuredArea,
  progress,
  role,
  fallback,
}) {
  if (loading) {
    return <p className="text-sm text-ink-soft">Finding resources for your focus areas…</p>;
  }

  const gapAreas = areas.filter((area) => !area.refresher && area.resources.length > 0);
  const done = gapAreas.reduce((sum, area) => sum + area.done, 0);
  const total = gapAreas.reduce((sum, area) => sum + area.resources.length, 0);
  if (!plan || total === 0) return <p className="text-sm text-ink-soft">{fallback}</p>;
  // The area the featured resource belongs to, else the first unfinished one.
  const nextArea =
    (featuredArea && !featuredArea.refresher ? featuredArea : null) ??
    gapAreas.find((area) => !area.complete);
  // At most three unfinished areas, the next one first.
  const unfinished = gapAreas.filter((area) => !area.complete);
  const ordered = nextArea
    ? [nextArea, ...unfinished.filter((area) => area !== nextArea)]
    : unfinished;
  const shownAreas = ordered.slice(0, 3);
  const moreCount = ordered.length - shownAreas.length;
  const finishedCount = gapAreas.length - unfinished.length;
  const status = featured ? (statusOf(progress, featured.id) ?? 'none') : null;

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,19rem)]">
      <div>
        <Figure value={done} of={total} label={`resources finished towards ${role}`} />
        <span aria-hidden="true" data-tone="pink" className="lp-tone lp-hero-meter mt-4">
          <span className="lp-meter-fill" style={{ transform: `scaleX(${done / total})` }} />
        </span>

        {/* Names only, and only the next few unfinished areas: the full list and
            per-area progress live on the learning plan. */}
        <p className="lp-eyebrow mt-7">Learning now</p>
        {shownAreas.length > 0 ? (
          <ul aria-label="Focus areas in progress" className="mt-3 space-y-2.5">
            {shownAreas.map((area) => {
              const next = area.skill_id === nextArea?.skill_id;
              return (
                <li
                  key={area.skill_id}
                  data-tone={area.tone}
                  className="lp-tone flex items-center gap-2.5 text-sm"
                >
                  <span
                    aria-hidden="true"
                    className="ml-1 size-2 shrink-0 rounded-full bg-[var(--tone)]"
                  />
                  <span
                    className={`min-w-0 truncate ${next ? 'font-semibold text-ink' : 'text-ink-soft'}`}
                  >
                    {area.skill}
                  </span>
                  {next && (
                    <span className="shrink-0 rounded-full bg-[var(--tone-soft)] px-2 py-0.5 text-[0.6875rem] font-semibold text-[var(--tone-ink)]">
                      Next
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-soft">Every focus area is finished.</p>
        )}
        {(finishedCount > 0 || moreCount > 0) && (
          <p className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
            {finishedCount > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className="lp-done-tick size-4">
                  <Check weight="bold" className="size-2.5" />
                </span>
                {finishedCount} finished
              </span>
            )}
            {moreCount > 0 && <span>+{moreCount} more in your plan</span>}
          </p>
        )}
      </div>

      {featured && (
        /* The learning plan's featured resource, as a preview; it is opened from the plan. */
        <section
          aria-labelledby="journey-featured-title"
          data-tone={featuredArea?.tone}
          className="lp-feature lp-tone self-start p-6"
        >
          <h3 id="journey-featured-title" className="lp-eyebrow text-[var(--tone-ink)]">
            {LEAD[status]}
          </h3>
          <div className="mt-4 flex items-start gap-3">
            <ProviderMark logo={featured.logo} provider={featured.provider} className="size-11" />
            <div className="min-w-0">
              <p className="lp-area-tag truncate">{featuredArea?.skill}</p>
              <p className="mt-0.5 font-display text-xl font-bold leading-snug text-ink">
                {featured.title}
              </p>
              <p className="mt-1 text-xs text-ink-faint">
                {featured.provider} · {featured.format}
              </p>
            </div>
          </div>
          <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-ink-soft">{featured.why}</p>
        </section>
      )}
    </div>
  );
}

/**
 * What the CV for the target role has and still needs, section by section.
 */
function CvChecklist({ status, sections }) {
  if (!sections) {
    return (
      <div>
        <p className="font-display text-xl font-bold tracking-[-0.02em] text-ink">{status}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          The CV builder starts a draft from your CV, your career break and your skills.
        </p>
      </div>
    );
  }

  const filled = sections.filter((section) => section.done).length;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-xl font-bold tracking-[-0.02em] text-ink">{status}</p>
        <p className="text-xs text-ink-faint tabular">
          {filled} of {sections.length} sections filled
        </p>
      </div>

      <ul
        aria-label="CV sections"
        className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 max-sm:grid-cols-1"
      >
        {sections.map((section) => (
          <li key={section.label} className="flex items-center gap-2.5 text-sm">
            {section.done ? (
              <span aria-hidden="true" className="lp-done-tick size-5">
                <Check weight="bold" className="size-3" />
              </span>
            ) : (
              <span aria-hidden="true" className="size-5 shrink-0 rounded-full bg-ink/8" />
            )}
            <span className={section.done ? 'text-ink' : 'text-ink-faint'}>{section.label}</span>
            <span className="sr-only">{section.done ? ', filled' : ', still empty'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Interview practice as a short exchange: the next question from her latest
 * unfinished set, her turn to answer, and how far into the set she is. A
 * finished latest set shows the totals instead; with no practice yet, the
 * kinds of set she can choose from.
 */
function PracticeSummary({ sessions, completed, answered, role }) {
  const latest = [...sessions].sort((a, b) =>
    String(b.updated_at ?? '').localeCompare(String(a.updated_at ?? ''))
  )[0];
  const open = latest && latest.status !== 'completed' ? latest : null;
  const step = Math.min(open?.progress ?? 0, QUESTIONS_PER_SET - 1);

  // The question text lives on the session detail, fetched for the open set only.
  const [question, setQuestion] = useState(null);
  const openId = open?.session_id;
  useEffect(() => {
    if (!openId) return undefined;
    let live = true;
    getSession(openId)
      .then((detail) => {
        if (!live) return;
        const slot = detail?.questions?.find((entry) => entry.sequence_no === step + 1);
        setQuestion(slot?.question_text ?? null);
      })
      .catch(() => live && setQuestion(null));
    return () => {
      live = false;
    };
  }, [openId, step]);

  if (sessions.length === 0) {
    return (
      <div>
        <ul aria-label="Kinds of practice" className="flex flex-wrap gap-1.5">
          {PRACTICE_FOCUS.map((focus) => (
            <li
              key={focus.id}
              className="rounded-full bg-[var(--tone-soft)] px-3 py-1 text-xs font-semibold text-[var(--tone-ink)]"
            >
              {focus.label}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Rehearse interview questions for {role} and get feedback on every answer.
        </p>
      </div>
    );
  }

  if (open && question) {
    return (
      <div>
        <p className="text-xs text-ink-faint">
          {focusLabel(open.practice_focus)} set, question {step + 1} of {QUESTIONS_PER_SET}
        </p>

        <div className="mt-3 space-y-2">
          <p className="journey-bubble journey-bubble-them">{question}</p>
          <p className="journey-bubble journey-bubble-me">
            <Microphone weight="duotone" className="size-4 shrink-0" aria-hidden="true" />
            Your answer
          </p>
        </div>

        <span aria-hidden="true" className="mt-5 flex gap-1">
          {Array.from({ length: QUESTIONS_PER_SET }, (_, index) => (
            <span
              key={index}
              className={`h-1.5 flex-1 rounded-full ${
                index < (open.progress ?? 0) ? 'bg-[var(--tone)]' : 'bg-ink/8'
              }`}
            />
          ))}
        </span>
        <p className="mt-2 text-xs text-ink-faint tabular">
          {open.progress ?? 0} of {QUESTIONS_PER_SET} answered
          {completed > 0 && `, ${completed} ${completed === 1 ? 'set' : 'sets'} done before`}
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-10">
      <Figure value={completed} label={completed === 1 ? 'set completed' : 'sets completed'} />
      <Figure
        value={answered}
        label={answered === 1 ? 'question answered' : 'questions answered'}
      />
    </div>
  );
}

/** One employer as a compact row: logo, name, opening, and match strength. */
function EmployerRow({ employer }) {
  const total = employer.met.length + employer.unmet.length;
  const label = matchLabel(employer.met.length, total);

  return (
    <li className="flex items-center gap-3.5 py-2.5">
      <LogoTile logo={employer.logo} logoUrl={employer.logo_url} name={employer.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink">{employer.name}</p>
        {employer.job ? (
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-ink-soft">
            <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-verify" />
            Hiring: {employer.job.title}
          </p>
        ) : (
          <p className="mt-0.5 truncate text-xs text-ink-faint">{employer.industry}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className={`text-xs font-semibold ${label.tone}`}>{label.text}</span>
        <MatchMeter met={employer.met.length} total={total} />
      </div>
    </li>
  );
}

/**
 * Employer fit preview: the priorities matched on, and the shortlist, or the
 * top matches until something is saved.
 */
function EmployerPreview({ priorities, employers, error, shortlist }) {
  if (priorities.length === 0) {
    return (
      <p className="max-w-[46ch] text-sm leading-relaxed text-ink-soft">
        Pick what matters to you in a workplace, and see which employers have published it.
      </p>
    );
  }

  const known = priorities.filter((id) => PRIORITY_NAMES[id]);
  const list = shortlist.length > 0 ? shortlist : (employers ?? []);

  return (
    <div>
      <ul aria-label="Priorities you chose" className="flex flex-wrap gap-1.5">
        {known.map((id) => (
          <li
            key={id}
            className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 py-1 pr-3 pl-2 text-xs font-medium text-blue-600"
          >
            <PriorityIcon id={id} className="size-3.5 shrink-0" />
            {PRIORITY_NAMES[id]}
          </li>
        ))}
      </ul>

      {!employers && !error && shortlist.length === 0 && (
        <p className="mt-5 text-sm text-ink-soft">Reading company disclosures…</p>
      )}

      {list.length > 0 && (
        <>
          <div className="mt-6 flex items-baseline justify-between gap-3">
            <p className="lp-eyebrow">{shortlist.length > 0 ? 'Your shortlist' : 'Top matches'}</p>
            <p className="text-xs text-ink-faint tabular">
              {employers && count(employers.length, 'company', 'companies')} found
              {shortlist.length > 0 && ` · ${shortlist.length} saved`}
            </p>
          </div>
          <ul className="mt-1">
            {list.slice(0, 3).map((employer) => (
              <EmployerRow key={employer.id} employer={employer} />
            ))}
          </ul>
        </>
      )}

      {employers?.length === 0 && shortlist.length === 0 && (
        <p className="mt-5 max-w-[46ch] text-sm leading-relaxed text-ink-soft">
          No company in our set has published anything about what you chose yet.
        </p>
      )}
    </div>
  );
}

/**
 * Journey dashboard for signed-in users: the next thing to do, the target
 * role, and a tile per tool showing what that tool shows.
 *
 * Results live on their own pages (skills on the snapshot, gaps on the gap
 * page). Each tile previews its tool in that tool's own visuals and links to
 * it; this page adds the order and progress.
 */
export default function Journey() {
  const navigate = useSmoothNavigate();
  const user = useAccountStore((state) => state.user);

  const cvParsed = useIntakeStore((state) => state.cvParsed);
  const careerBreak = useIntakeStore((state) => state.break);
  const employerPriorities = useIntakeStore((state) => state.employerPriorities);
  const employerMatches = useIntakeStore((state) => state.employerMatches);
  const setEmployerMatches = useIntakeStore((state) => state.setEmployerMatches);
  const learningProgress = useIntakeStore((state) => state.learningProgress);
  const learnedSkills = useIntakeStore((state) => state.learnedSkills);
  const addedFocusAreas = useIntakeStore((state) => state.addedFocusAreas);
  const refreshAreas = useIntakeStore((state) => state.refreshAreas);
  const cvDraft = useIntakeStore((state) => state.cvDraft);
  const cvDownloaded = useIntakeStore((state) => state.cvDownloaded);
  const employerShortlist = useIntakeStore((state) => state.employerShortlist);
  const snapshot = useIntakeStore((state) => state.snapshot);
  const selectedRole = useIntakeStore((state) => state.selectedRole);
  const gapResult = useIntakeStore((state) => state.gapResult);

  /* Role whose gap is being computed, if any. Current results stay displayed
     until the new result arrives. */
  const [switching, setSwitching] = useState(null);
  const [switchError, setSwitchError] = useState(null);

  /* Interview sessions live on the server, so they are fetched here rather
     than read from the plan. On failure the step reads as not started. */
  const [sessions, setSessions] = useState([]);
  const hasGap = Boolean(gapResult);
  useEffect(() => {
    if (!user || !hasGap) return undefined;
    let live = true;
    listSessions()
      .then((list) => live && setSessions(list ?? []))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [user, hasGap]);

  /* The learning plan, fetched for the same focus areas as the learning page
     so the preview shows the same resources. */
  const roleId = selectedRole?.role_id;
  const planAreas = planFocusAreas(
    gapResult,
    addedFocusAreas?.[roleId],
    refreshAreas?.[roleId],
    MAX_FOCUS_AREAS
  );
  const skillKey = planAreas.map((gap) => gap.skill_id).join('|');
  const [plan, setPlan] = useState(null);
  const [planError, setPlanError] = useState(null);
  useEffect(() => {
    if (!user || !hasGap || !selectedRole || skillKey === '') return undefined;
    let live = true;
    recommendLearning({
      skillIds: skillKey.split('|'),
      targetRoleId: selectedRole.role_id,
      targetRole: selectedRole.role,
    })
      .then((result) => {
        if (!live) return;
        setPlan(result);
        setPlanError(null);
      })
      .catch((cause) => live && setPlanError(cause.message));
    return () => {
      live = false;
    };
  }, [user, hasGap, selectedRole, skillKey]);

  /* Employer matches for the chosen priorities, as on the employer fit page. */
  const priorityKey = (employerPriorities ?? []).join('|');
  const [employers, setEmployers] = useState(employerMatches?.length ? employerMatches : null);
  const [employerError, setEmployerError] = useState(null);
  useEffect(() => {
    if (!user || !hasGap || priorityKey === '') return undefined;
    let live = true;
    matchEmployers({ priorities: priorityKey.split('|'), targetRoleId: roleId })
      .then((result) => {
        if (!live) return;
        setEmployers(result.employers);
        setEmployerMatches(result.employers);
        setEmployerError(null);
      })
      .catch((cause) => live && setEmployerError(cause.message));
    return () => {
      live = false;
    };
  }, [user, hasGap, priorityKey, roleId, setEmployerMatches]);

  const activities = careerBreak?.activities ?? [];
  const displayName = user ? resolveDisplayName(user) : null;
  const progress = journeyProgress({
    cvParsed,
    activities,
    employerPriorities,
    snapshot,
    gapResult,
  });

  // Account-only route.
  if (!user) return <Navigate to="/" replace />;

  /* Hero copy for the next incomplete screen, keyed by step id so a
     partially complete chapter describes the remaining step. */
  const upNextCopy = {
    'upload-cv': 'Your CV first, then what filled your break.',
    'career-break': 'What filled your break — the part a CV leaves out.',
    'work-priorities': 'Pick what matters most to you in a workplace.',
    'skill-snapshot': 'Your CV and your break, read together and named as skills.',
    'target-role-gap': 'Pick a role, and see how much of it you can already do.',
  };

  /* Resume button labels, keyed by step id (chapters can span several screens). */
  const resumeCta = {
    'upload-cv': 'Start your story',
    'career-break': 'Continue your story',
    'work-priorities': 'Choose your work priorities',
    'skill-snapshot': 'See your skills',
    'target-role-gap': 'Choose your target role',
  };

  const byId = Object.fromEntries(progress.chapters.map((chapter) => [chapter.id, chapter]));
  const roles = snapshot?.recommended_roles ?? [];

  function switchRole(role) {
    if (switching || role.role_id === selectedRole?.role_id) return;

    setSwitching(role.role_id);
    computeGap(snapshot, role, useIntakeStore.getState().confirmedSkills)
      .then((result) => {
        /* Single write: `setSelectedRole` alone clears the gap result, which would
           empty the readout while the request is in flight. */
        useIntakeStore.setState({ selectedRole: role, gapResult: result });
        setSwitchError(null);
      })
      .catch((cause) => setSwitchError(cause.message))
      .finally(() => setSwitching(null));
  }

  // Match in the gap page's terms: requirements met out of the role's total.
  const have = gapResult?.skills_have?.length ?? 0;
  const total = have + (gapResult?.gaps.length ?? 0);
  const focusAreas = gapResult ? pickFocusAreas(gapResult.gaps, MAX_FOCUS_AREAS) : [];

  // Progress per step, from what each tool has saved.
  const isLearned = (gap) =>
    (learnedSkills ?? []).some((s) => s.skill?.toLowerCase() === gap.skill.toLowerCase());
  const learned = focusAreas.filter(isLearned).length;
  const hasDraft = Boolean(selectedRole && openCvBook(cvDraft).drafts[selectedRole.role_id]);
  const downloaded = Boolean(selectedRole && cvDownloaded?.[selectedRole.role_id]);
  const shortlist = (selectedRole && employerShortlist?.[selectedRole.role_id]) || [];
  const shortlisted = shortlist.length;
  const matched = employers?.length ?? 0;

  // A set is completed once every question in it has feedback.
  const practice = sessions.filter((s) => s.role?.role_id === selectedRole?.role_id);
  const completedSets = practice.filter((s) => s.status === 'completed').length;
  const answered = Math.max(0, ...practice.map((s) => s.progress ?? 0));
  // Every set is a new set of questions, so answers add up across them.
  const answeredTotal = practice.reduce((sum, s) => sum + (s.progress ?? 0), 0);

  const steps = [
    {
      id: 'learning',
      tool: 'Learning plan',
      icon: BookOpenText,
      tone: 'pink',
      title: 'Build your top skills',
      to: '/plan/learning',
      done: focusAreas.length === 0 || learned === focusAreas.length,
      status:
        focusAreas.length === 0
          ? 'No skills missing for this role.'
          : `${learned} of ${count(focusAreas.length, 'skill')} learned`,
    },
    {
      id: 'cv',
      tool: 'CV builder',
      icon: FileText,
      tone: 'slate',
      title: 'Tailor your CV',
      to: '/plan/cv',
      // Done once downloaded; a draft alone may never have been finished.
      done: downloaded,
      status: downloaded ? 'CV downloaded' : hasDraft ? 'Draft saved' : 'Not started',
    },
    {
      id: 'interview',
      tool: 'Interview practice',
      icon: ChatsCircle,
      tone: 'violet',
      title: 'Practise interviews',
      to: '/interview-practice',
      done: completedSets > 0,
      status:
        completedSets > 0
          ? `${count(completedSets, 'set')} completed`
          : answered > 0
            ? `${count(answered, 'question')} answered`
            : 'Not started',
    },
    {
      id: 'employers',
      tool: 'Employer fit',
      icon: Buildings,
      tone: 'indigo',
      title: 'Find employers that fit',
      to: '/plan/employers/matches',
      // Done once an employer is saved; matches alone only mean results loaded.
      done: shortlisted > 0,
      status:
        shortlisted > 0
          ? `${count(shortlisted, 'employer')} saved`
          : matched > 0
            ? `${count(matched, 'match', 'matches')}`
            : 'Not started',
    },
  ];

  const currentIndex = steps.findIndex((step) => !step.done);
  const stateOf = (index) => {
    if (steps[index].done) return 'done';
    return index === currentIndex ? 'current' : 'upcoming';
  };
  const [learningStep, cvStep, interviewStep, employerStep] = steps;

  // Learning plan areas with their resources and progress, toned as on the plan.
  const resources = plan?.resources ?? [];
  const areas = planAreas.map((gap, index) => {
    const own = resources.filter((resource) => resource.skill_id === gap.skill_id);
    const statuses = own.map((resource) => statusOf(learningProgress, resource.id));
    const done = statuses.filter((entry) => entry === 'done').length;
    return {
      ...gap,
      icon: plan?.groups?.find((entry) => entry.skill_id === gap.skill_id)?.icon,
      tone: gap.refresher ? 'refresh' : FOCUS_TONES[index % FOCUS_TONES.length],
      resources: own,
      statuses,
      done,
      complete: own.length > 0 && done === own.length,
    };
  });
  const featured =
    upNext(resources, learningProgress)[0] ??
    areas
      .filter((area) => !area.refresher)
      .flatMap((area) => area.resources)
      .find((resource) => statusOf(learningProgress, resource.id) !== 'done');
  const featuredArea = featured && areas.find((area) => area.skill_id === featured.skill_id);

  // The CV for this role, section by section, once a draft exists.
  const cvBook = openCvBook(cvDraft);
  const draft = roleId ? cvBook.drafts[roleId] : null;
  const cvSections = draft && [
    { label: 'Summary', done: Boolean(draft.summary?.trim()) },
    { label: 'Skills', done: (draft.skills?.length ?? 0) > 0 },
    { label: 'Experience', done: (draft.experiences?.length ?? 0) > 0 },
    { label: 'Career break', done: Boolean(draft.careerBreak) },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="page-shell max-w-[1200px] flex-1 pt-14 pb-28 max-md:pt-8 max-md:pb-12">
        <motion.div {...rise(0)}>
          <h1 className="font-display text-3xl font-bold leading-[1.1] tracking-[-0.02em] text-ink sm:text-4xl">
            Welcome back, {displayName}
          </h1>
          <p className="mt-2 max-w-[56ch] text-sm leading-relaxed text-ink-soft sm:text-base">
            {gapResult
              ? 'Here’s where you are, and the one thing to do next.'
              : progress.completed === 0
                ? 'Nothing here yet. Five steps, and about ten minutes in total.'
                : 'Pick up where you left off.'}
          </p>
        </motion.div>

        {gapResult ? (
          <>
            <NextStep steps={steps} currentIndex={currentIndex} />

            {/* Sidebar with the target role; the four steps in order beside it. */}
            <div className="mt-6 grid grid-cols-12 items-start gap-6 max-lg:grid-cols-1 max-md:gap-5">
              {/* Target role: the one dark surface on the page. */}
              <motion.section
                className="relative col-span-4 self-start overflow-hidden rounded-[1.75rem] bg-plane p-7 text-on-plane shadow-plane lg:sticky lg:top-8 max-lg:col-span-full max-md:p-6"
                {...rise(2)}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-28 -right-24 size-72 rounded-full bg-pink-500/25 blur-3xl"
                />

                <div className={`relative transition-opacity ${switching ? 'opacity-50' : ''}`}>
                  <p className="eyebrow text-on-plane-soft">Working towards</p>
                  <h2 className="mt-1.5 font-display text-[1.5rem] leading-tight font-bold tracking-[-0.02em] text-white">
                    {selectedRole?.role ?? 'Your target role'}
                  </h2>

                  <p className="mt-7 font-display text-[2.5rem] leading-none font-bold tracking-[-0.03em] text-white tabular">
                    {have} <span className="text-on-plane-soft">of {total}</span>
                  </p>
                  <p className="mt-2.5 text-sm text-on-plane-soft">requirements you already have</p>

                  {total > 0 && (
                    <div className="mt-6">
                      <RequirementSegments have={have} total={total} delay={0.3} />
                    </div>
                  )}
                </div>

                {roles.length > 1 && (
                  <div className="relative mt-7">
                    <p className="mb-2.5 text-xs text-on-plane-soft">Switch role</p>
                    <RoleSwitch
                      roles={roles}
                      selected={selectedRole}
                      busy={switching}
                      onSelect={switchRole}
                    />
                  </div>
                )}

                {switchError && (
                  <p role="alert" className="relative mt-3 text-sm font-medium text-pink-100">
                    {switchError}
                  </p>
                )}
                {switching && (
                  <p role="status" className="relative mt-3 text-sm text-on-plane-soft">
                    Working out your match for this role…
                  </p>
                )}

                {/* The gap page holds the full breakdown, skill edits and the snapshot link. */}
                <Link
                  to="/diagnostic/gap"
                  className="group relative mt-7 inline-flex items-center gap-3 rounded-full bg-white/10 py-1.5 pr-1.5 pl-4 text-sm font-semibold text-white transition-[background-color,scale] duration-500 ease-spring hover:bg-white/16 active:scale-[0.98]"
                >
                  View full breakdown
                  <ArrowMark className="bg-white/14 text-white" />
                </Link>
              </motion.section>

              <div className="col-span-8 grid gap-6 max-lg:col-span-full max-md:gap-5">
                <Widget
                  step={learningStep}
                  number={1}
                  state={stateOf(0)}
                  link="Open your learning plan"
                  delay={3}
                >
                  <LearningPreview
                    plan={plan}
                    loading={!plan && !planError && skillKey !== ''}
                    areas={areas}
                    featured={featured}
                    featuredArea={featuredArea}
                    progress={learningProgress}
                    role={selectedRole?.role ?? 'your target role'}
                    fallback={learningStep.status}
                  />
                </Widget>

                {/* The two smaller steps side by side, the same height. */}
                <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1 max-md:gap-5">
                  <Widget
                    step={cvStep}
                    number={2}
                    state={stateOf(1)}
                    link={hasDraft ? 'Open your CV' : 'Open CV builder'}
                    delay={4}
                  >
                    <CvChecklist status={cvStep.status} sections={cvSections} />
                  </Widget>

                  <Widget
                    step={interviewStep}
                    number={3}
                    state={stateOf(2)}
                    link={answered > 0 ? 'Continue practising' : 'Start practising'}
                    delay={5}
                  >
                    <PracticeSummary
                      sessions={practice}
                      completed={completedSets}
                      answered={answeredTotal}
                      role={selectedRole?.role ?? 'your target role'}
                    />
                  </Widget>
                </div>

                <Widget
                  step={employerStep}
                  number={4}
                  state={stateOf(3)}
                  link={employerPriorities?.length ? 'See all matches' : 'Choose your priorities'}
                  delay={6}
                >
                  <EmployerPreview
                    priorities={employerPriorities ?? []}
                    employers={employers}
                    error={employerError}
                    shortlist={shortlist}
                  />
                </Widget>
              </div>
            </div>
          </>
        ) : (
          /* Role card beside the step list; one column on phones. */
          <div className="mt-9 grid grid-cols-12 items-start gap-8 max-md:mt-7 max-md:grid-cols-1 max-md:gap-6">
            {/* Diagnostic incomplete: progress and a single resume action. */}
            <motion.section
              className="journey-hero card-with-illustration col-span-5 rounded-[1.75rem] max-md:col-span-full"
              {...rise(1)}
            >
              <CardIllustration src={journeyPath} />
              <div className="p-8 max-md:p-6">
                <p className="eyebrow">{`${progress.completed} of ${progress.total} steps`}</p>
                <h2 className="mt-1 font-display text-[1.625rem] font-bold tracking-[-0.015em] text-ink">
                  {byId[progress.next.chapter].name}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  {upNextCopy[progress.next.id]}
                </p>

                <div
                  role="progressbar"
                  aria-valuenow={progress.percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Journey progress"
                  className="mt-5 h-1.5 w-full max-w-[18rem] overflow-hidden rounded-full bg-ink/10"
                >
                  <div
                    className="h-full rounded-full bg-ink transition-[width] duration-500 ease-spring"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>

                <GradientButton className="mt-6" onClick={() => navigate(progress.next.to)}>
                  {resumeCta[progress.next.id]}
                </GradientButton>
              </div>
            </motion.section>

            <section className="col-span-7 max-md:col-span-full">
              <motion.div className="flex items-baseline justify-between gap-4" {...rise(2)}>
                <h2 className="font-display text-xl font-bold tracking-[-0.015em] text-ink">
                  Your path back to work
                </h2>
                <p className="text-sm text-ink-soft">Opens once you choose a target role</p>
              </motion.div>

              <ol className="mt-5">
                {steps.map((step, index) => (
                  <LockedStep
                    key={step.id}
                    number={index + 1}
                    step={step}
                    last={index === steps.length - 1}
                    delay={3 + index}
                  />
                ))}
              </ol>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
