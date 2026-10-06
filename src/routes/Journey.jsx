import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, ArrowUpRight, Check } from '@phosphor-icons/react';
import useSmoothNavigate from '../hooks/useSmoothNavigate.js';
import Header from '../components/layout/Header.jsx';
import { RequirementSegments } from '../components/gap/MatchPanel.jsx';
import { MAX_FOCUS_AREAS } from '../components/gap/FocusAreaList.jsx';
import GradientButton from '../components/ui/GradientButton.jsx';
import CardIllustration from '../components/ui/CardIllustration.jsx';
import { pickFocusAreas } from '../lib/focusAreas.js';
import { journeyProgress } from '../lib/journeyProgress.js';
import { openCvBook } from '../lib/cvDraft.js';
import { computeGap } from '../api/gap.js';
import { listSessions } from '../api/interview.js';
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
 * One step on the path. The current step is expanded with its action; the
 * others are compact rows that open their tool too, so any step can be picked
 * from here as well as from the header. Locked steps are not links.
 */
function PathStep({ number, step, state, last, delay }) {
  const current = state === 'current';
  const done = state === 'done';
  const locked = state === 'locked';

  const marker = (
    <span
      className={[
        'relative z-10 flex size-9 shrink-0 items-center justify-center rounded-xl font-display text-sm font-bold tabular',
        done && 'bg-verify text-white',
        current && 'bg-plane text-white shadow-[inset_0_1px_1px_rgb(255_255_255/0.18)]',
        !done && !current && 'bg-canvas-sunk text-ink-faint',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {done ? <Check aria-hidden="true" size={15} weight="bold" /> : number}
    </span>
  );

  const text = (
    <span className="min-w-0 flex-1">
      <span
        className={`block font-display text-[1.0625rem] font-bold tracking-[-0.01em] ${
          locked ? 'text-ink-faint' : 'text-ink'
        }`}
      >
        {step.title}
      </span>
      <span className="mt-0.5 block text-sm text-ink-soft">{step.status}</span>
    </span>
  );

  return (
    <motion.li className="relative flex gap-4" {...rise(delay)}>
      {/* Rail joining the step markers. */}
      {!last && (
        <span
          aria-hidden="true"
          className={`absolute bottom-[-0.5rem] left-[2.3125rem] w-0.5 rounded-full ${
            current ? 'top-[calc(100%-0.5rem)]' : 'top-[3.25rem]'
          } ${done ? 'bg-verify/30' : 'bg-ink/8'}`}
        />
      )}

      {current ? (
        <div className="mb-3 flex flex-1 gap-4 rounded-[1.5rem] bg-surface p-5 shadow-card">
          {marker}
          <div className="min-w-0 flex-1">
            <p className="eyebrow text-pink-600">
              Up next <span className="text-ink-faint">· {step.status}</span>
            </p>
            <h3 className="mt-1 font-display text-xl font-bold tracking-[-0.015em] text-ink">
              {step.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{step.detail}</p>
            <GradientButton size="md" className="mt-5" onClick={step.onStart}>
              {step.action}
            </GradientButton>
          </div>
        </div>
      ) : locked ? (
        <div className="mb-3 flex flex-1 items-center gap-4 px-5 py-3">
          {marker}
          {text}
        </div>
      ) : (
        <Link
          to={step.to}
          className="group mb-3 flex flex-1 items-center gap-4 rounded-[1.25rem] px-5 py-3 transition duration-500 ease-spring hover:bg-surface hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          {marker}
          {text}
          <ArrowRight
            aria-hidden="true"
            weight="bold"
            className="size-4 shrink-0 text-ink-faint transition duration-500 ease-spring group-hover:translate-x-0.5 group-hover:text-ink"
          />
        </Link>
      )}
    </motion.li>
  );
}

/**
 * Journey dashboard for signed-in users: the target role, and the path from
 * the gap to applying, in order, with where she is on it.
 *
 * Results live on their own pages (skills on the snapshot, gaps on the gap
 * page). Each step links to its tool, as the header does; this page adds the
 * order and progress.
 */
export default function Journey() {
  const navigate = useSmoothNavigate();
  const user = useAccountStore((state) => state.user);

  const cvParsed = useIntakeStore((state) => state.cvParsed);
  const careerBreak = useIntakeStore((state) => state.break);
  const employerPriorities = useIntakeStore((state) => state.employerPriorities);
  const employerMatches = useIntakeStore((state) => state.employerMatches);
  const learningProgress = useIntakeStore((state) => state.learningProgress);
  const learnedSkills = useIntakeStore((state) => state.learnedSkills);
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
  const upNext = {
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
  const nextSkill = focusAreas.find((gap) => !isLearned(gap));
  const started = Object.values(learningProgress ?? {}).some(
    (entry) => entry.status === 'started' || entry.status === 'done'
  );
  const hasDraft = Boolean(selectedRole && openCvBook(cvDraft).drafts[selectedRole.role_id]);
  const downloaded = Boolean(selectedRole && cvDownloaded?.[selectedRole.role_id]);
  const matched = employerMatches?.length ?? 0;
  const shortlisted = (selectedRole && employerShortlist?.[selectedRole.role_id]?.length) || 0;

  // A set is completed once every question in it has feedback.
  const practice = sessions.filter((s) => s.role?.role_id === selectedRole?.role_id);
  const completedSets = practice.filter((s) => s.status === 'completed').length;
  const answered = Math.max(0, ...practice.map((s) => s.progress ?? 0));

  const steps = [
    {
      title: 'Build your top skills',
      to: '/plan/learning',
      done: focusAreas.length === 0 || learned === focusAreas.length,
      status:
        focusAreas.length === 0
          ? 'No skills missing for this role.'
          : `${learned} of ${count(focusAreas.length, 'skill')} learned`,
      detail:
        focusAreas.length > 0
          ? `${learned > 0 ? 'Next up' : 'Start with'}: ${nextSkill?.skill ?? focusAreas[0].skill}. Short, free resources.`
          : '',
      action: started ? 'Continue learning' : 'Start learning',
    },
    {
      title: 'Tailor your CV',
      to: '/plan/cv',
      // Done once downloaded; a draft alone may never have been finished.
      done: downloaded,
      status: downloaded
        ? 'CV downloaded'
        : hasDraft
          ? 'Draft saved. Download it when it’s ready.'
          : 'A CV written for this role',
      detail: `Rewrite your CV around this role, using the skills you already have and the ones you build.`,
      action: 'Open CV builder',
    },
    {
      title: 'Practise interviews',
      to: '/interview-practice',
      done: completedSets > 0,
      status:
        completedSets > 0
          ? `${count(completedSets, 'practice set')} completed`
          : answered > 0
            ? `${count(answered, 'question')} answered so far`
            : 'Questions for this role, with feedback on each answer',
      detail: 'Answer questions an interviewer for this role would ask, and get feedback on each one.',
      action: answered > 0 ? 'Continue practising' : 'Start practising',
    },
    {
      title: 'Find employers that fit',
      to: '/plan/employers/matches',
      // Done once an employer is saved; matches alone only mean results loaded.
      done: shortlisted > 0,
      status:
        shortlisted > 0
          ? `${count(shortlisted, 'employer')} shortlisted`
          : matched > 0
            ? `${count(matched, 'employer')} matched. Save the ones you like.`
            : 'Employers that publish what matters to you',
      detail: 'See which employers hiring for this role have published the support you need.',
      action: 'See employer matches',
    },
  ];

  const currentIndex = steps.findIndex((step) => !step.done);
  const stateOf = (index) => {
    if (!gapResult) return 'locked';
    if (steps[index].done) return 'done';
    return index === currentIndex ? 'current' : 'upcoming';
  };
  const doneCount = steps.filter((step) => step.done).length;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="page-shell max-w-[1100px] flex-1 pt-14 pb-24">
        <motion.div {...rise(0)}>
          <h1 className="font-display text-3xl font-bold leading-[1.1] tracking-[-0.02em] text-ink sm:text-4xl">
            Welcome back, {displayName}
          </h1>
          {!gapResult && (
            <p className="mt-2 max-w-[56ch] text-sm leading-relaxed text-ink-soft sm:text-base">
              {progress.completed === 0
                ? 'Nothing here yet. Five steps, and about ten minutes in total.'
                : 'Pick up where you left off.'}
            </p>
          )}
        </motion.div>

        <div className="mt-9 grid grid-cols-12 items-start gap-8">
          {gapResult ? (
            /* Target role: the one dark surface on the page. */
            <motion.section
              className="relative col-span-5 overflow-hidden rounded-[1.75rem] bg-plane p-8 text-on-plane shadow-plane"
              {...rise(1)}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-28 -right-24 size-72 rounded-full bg-pink-500/25 blur-3xl"
              />

              <div className={`relative transition-opacity ${switching ? 'opacity-50' : ''}`}>
                <p className="eyebrow text-on-plane-soft">Working towards</p>
                <h2 className="mt-1.5 font-display text-[1.625rem] leading-tight font-bold tracking-[-0.02em] text-white">
                  {selectedRole?.role ?? 'Your target role'}
                </h2>

                <p className="mt-8 font-display text-[2.6rem] leading-none font-bold tracking-[-0.03em] text-white tabular">
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
                <div className="relative mt-8">
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
                className="group relative mt-8 inline-flex items-center gap-3 rounded-full bg-white/10 py-1.5 pr-1.5 pl-4 text-sm font-semibold text-white transition-[background-color,scale] duration-500 ease-spring hover:bg-white/16 active:scale-[0.98]"
              >
                View full breakdown
                <ArrowMark className="bg-white/14 text-white" />
              </Link>
            </motion.section>
          ) : (
            /* Diagnostic incomplete: progress and a single resume action. */
            <motion.section
              className="journey-hero card-with-illustration col-span-5 rounded-[1.75rem]"
              {...rise(1)}
            >
              <CardIllustration src={journeyPath} />
              <div className="p-8">
                <p className="eyebrow">{`${progress.completed} of ${progress.total} steps`}</p>
                <h2 className="mt-1 font-display text-[1.625rem] font-bold tracking-[-0.015em] text-ink">
                  {byId[progress.next.chapter].name}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  {upNext[progress.next.id]}
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
          )}

          <section className="col-span-7">
            <motion.div className="flex items-baseline justify-between gap-4" {...rise(2)}>
              <h2 className="font-display text-xl font-bold tracking-[-0.015em] text-ink">
                Your path back to work
              </h2>
              <p className="text-sm text-ink-soft">
                {gapResult
                  ? doneCount === steps.length
                    ? 'All done — you’re ready to apply'
                    : `${doneCount} of ${steps.length} done`
                  : 'Opens once you choose a target role'}
              </p>
            </motion.div>

            <ol className="mt-5">
              {steps.map((step, index) => (
                <PathStep
                  key={step.title}
                  number={index + 1}
                  step={{
                    ...step,
                    status: gapResult ? step.status : 'Built around your target role',
                    onStart: () => navigate(step.to),
                  }}
                  state={stateOf(index)}
                  last={index === steps.length - 1}
                  delay={3 + index}
                />
              ))}
            </ol>
          </section>
        </div>
      </main>
    </div>
  );
}
