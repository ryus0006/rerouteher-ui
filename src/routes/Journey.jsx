import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import useSmoothNavigate from '../hooks/useSmoothNavigate.js';
import Header from '../components/layout/Header.jsx';
import ReadinessGauge from '../components/gap/ReadinessGauge.jsx';
import { MAX_FOCUS_AREAS } from '../components/gap/FocusAreaList.jsx';
import GradientButton from '../components/ui/GradientButton.jsx';
import CardIllustration from '../components/ui/CardIllustration.jsx';
import JourneyIcon from '../components/journey/JourneyIcon.jsx';
import SkillChip from '../components/snapshot/SkillChip.jsx';
import { pickFocusAreas } from '../lib/focusAreas.js';
import { markersFor } from '../lib/readiness.js';
import { formatUplift } from '../lib/formatters.js';
import { journeyProgress } from '../lib/journeyProgress.js';
import { computeGap } from '../api/gap.js';
import { resolveDisplayName } from '../api/account.js';
import { useAccountStore } from '../store/accountStore.js';
import { useIntakeStore } from '../store/intakeStore.js';
import journeyPath from '../assets/page-illustrations/journey-path.png';

const CARD = 'mt-4 rounded-2xl border border-line bg-surface p-5 sm:p-6';

/**
 * Role chips for the snapshot's recommended roles, with the target role
 * selected. The only interactive control in the readiness section. Index 0 is
 * the previous occupation and carries the "Closest match" marker.
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
                  'inline-flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition duration-200 ease-spring',
                  'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-blue-600',
                  checked
                    ? 'border-blue-600 bg-blue-600 font-semibold text-white'
                    : 'border-line-strong bg-surface text-ink-soft hover:border-blue-600/45 hover:text-ink',
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
                      checked ? 'bg-white text-blue-600' : 'bg-canvas-sunk text-ink-soft'
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

/** Section header: title, intro text and an optional aside. */
function SectionHead({ title, intro, aside }) {
  return (
    <div className="mt-11 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
      <div className="min-w-0">
        <h2 className="font-display text-xl font-bold tracking-[-0.015em] text-ink sm:text-2xl">
          {title}
        </h2>
        <p className="mt-1 max-w-[62ch] text-sm text-ink-soft">{intro}</p>
      </div>
      {aside && <p className="shrink-0 text-sm text-ink-soft">{aside}</p>}
    </div>
  );
}

/** Square icon tile identifying a dashboard panel. */
function IconTile({ name, tone = 'bg-canvas-sunk text-ink-soft' }) {
  return (
    <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${tone}`}>
      <JourneyIcon name={name} className="size-5" />
    </span>
  );
}

/**
 * Journey dashboard for signed-in users: diagnostic progress and a read-only
 * summary of results.
 *
 * Answers are edited from the profile, not here. The only forward actions are
 * the learning plan and employer matches unlocked by the gap result.
 */
export default function Journey() {
  const navigate = useSmoothNavigate();
  const user = useAccountStore((state) => state.user);

  const cvParsed = useIntakeStore((state) => state.cvParsed);
  const careerBreak = useIntakeStore((state) => state.break);
  const employerPriorities = useIntakeStore((state) => state.employerPriorities);
  const snapshot = useIntakeStore((state) => state.snapshot);
  const selectedRole = useIntakeStore((state) => state.selectedRole);
  const gapResult = useIntakeStore((state) => state.gapResult);

  /* Role whose gap is being computed, if any. Current results stay displayed
     until the new result arrives. */
  const [switching, setSwitching] = useState(null);
  const [switchError, setSwitchError] = useState(null);

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

  const focusAreas = gapResult ? pickFocusAreas(gapResult.gaps, MAX_FOCUS_AREAS) : [];
  const markers = gapResult ? markersFor(gapResult.readiness, focusAreas) : [];
  const projected = markers.length > 0 ? markers[markers.length - 1].at : null;

  /* Hero copy for the next incomplete screen, keyed by step id so a
     partially complete chapter describes the remaining step. Panel status copy
     is defined separately to avoid repeating the same text. */
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

  /* Placeholder copy for incomplete chapters, constant across steps. */
  const placeholder = {
    skills: 'Your skills will appear here.',
    'next-move': 'Your target role and focus areas will appear here.',
  };

  const byId = Object.fromEntries(progress.chapters.map((chapter) => [chapter.id, chapter]));
  const roles = snapshot?.recommended_roles ?? [];

  function switchRole(role) {
    if (switching || role.role_id === selectedRole?.role_id) return;

    setSwitching(role.role_id);
    computeGap(snapshot, role)
      .then((result) => {
        /* Single write: `setSelectedRole` alone clears the gap result, which would
           empty the readout while the request is in flight. */
        useIntakeStore.setState({ selectedRole: role, gapResult: result });
        setSwitchError(null);
      })
      .catch((cause) => setSwitchError(cause.message))
      .finally(() => setSwitching(null));
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="page-shell max-w-[1200px] flex-1 pt-14 pb-20">
        <h1 className="font-display text-3xl font-bold leading-[1.1] tracking-[-0.02em] text-ink sm:text-4xl">
          Welcome back, {displayName}
        </h1>

        {progress.completed === 0 && (
          <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-ink-soft sm:text-base">
            Nothing here yet. Five steps, and about ten minutes in total.
          </p>
        )}

        {/* Hero band: readiness when available, otherwise diagnostic progress. */}
        <section className="journey-hero card-with-illustration mt-7 rounded-3xl">
          <CardIllustration src={journeyPath} />
          <div className="grid gap-6 p-7 sm:p-8 md:grid-cols-[minmax(0,1fr)_15rem] md:items-center">
            {gapResult && (
              <div className="md:order-2">
                <ReadinessGauge value={gapResult.readiness} markers={markers} tone="light" />
              </div>
            )}

            <div className="md:order-1">
              <p className="eyebrow">
                {gapResult ? 'Working towards' : `${progress.completed} of ${progress.total} steps`}
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-[-0.015em] text-ink sm:text-[2rem]">
                {gapResult
                  ? (selectedRole?.role ?? 'Your target role')
                  : byId[progress.next.chapter].name}
              </h2>

              <p className="mt-3 max-w-[38ch] text-sm leading-relaxed text-ink-soft">
                {gapResult
                  ? projected > gapResult.readiness
                    ? `${gapResult.readiness}% ready today. Closing your ${focusAreas.length} focus ${
                        focusAreas.length === 1 ? 'area' : 'areas'
                      } takes you to ${projected}%.`
                    : `${gapResult.readiness}% ready today.`
                  : upNext[progress.next.id]}
              </p>

              {/* Resume action, shown only while the diagnostic is incomplete. */}
              {!gapResult && (
                <>
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
                </>
              )}
            </div>
          </div>
        </section>

        <SectionHead
          title="Your skills"
          intro="What your CV and your time away add up to, named the way an employer reads them."
        />

        <section className={CARD}>
          <div className="flex flex-wrap items-start gap-4 sm:flex-nowrap">
            <IconTile name="skills" />

            <div className="min-w-0 flex-1">
              {byId.skills.done ? (
                <>
                  {/* Legend for the chip colours: core vs. transferable skills. */}
                  <ul className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-ink-soft">
                    <li className="flex items-center gap-1.5">
                      <span aria-hidden="true" className="size-2 rounded-full bg-ink/45" />
                      Core skills
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span aria-hidden="true" className="size-2 rounded-full bg-verify" />
                      Transferable skills
                    </li>
                  </ul>

                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {[
                      ...(snapshot?.professional_skills ?? []),
                      ...(snapshot?.reframed_skills ?? []),
                    ].map((skill) => (
                      <SkillChip key={skill.skill} skill={skill} />
                    ))}
                  </ul>
                </>
              ) : (
                <p className="pt-1.5 text-sm italic text-ink-faint">{placeholder.skills}</p>
              )}
            </div>
          </div>
        </section>

        <SectionHead
          title="Your next move"
          intro="Explore roles that match your background, and see which skills make the biggest difference."
          aside={roles.length > 1 ? `${roles.length} roles matched your snapshot` : null}
        />

        {byId['next-move'].done ? (
          <>
            {roles.length > 1 && (
              <div className="mt-4">
                <RoleSwitch
                  roles={roles}
                  selected={selectedRole}
                  busy={switching}
                  onSelect={switchRole}
                />
              </div>
            )}

            {switchError && (
              <p role="alert" className="mt-3 text-sm font-medium text-pink-600">
                {switchError}
              </p>
            )}

            {switching && (
              <p role="status" className="mt-3 text-sm text-ink-soft">
                Working out your readiness for this role…
              </p>
            )}

            {/* Ordered list: focus areas are ranked by uplift. */}
            <ol
              className={`mt-4 overflow-hidden rounded-2xl border border-line bg-surface transition-opacity ${
                switching ? 'opacity-40' : ''
              }`}
            >
              {focusAreas.map((gap, index) => (
                <li
                  key={gap.skill}
                  className="flex items-center gap-4 border-t border-line px-5 py-4 first:border-t-0 sm:px-6"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-canvas-sunk text-xs font-semibold tabular text-ink-soft">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-medium text-ink">{gap.skill}</span>
                  <span className="shrink-0 text-sm tabular text-ink-soft">
                    {formatUplift(gap.uplift)}
                  </span>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p className={`${CARD} text-sm italic text-ink-faint`}>{placeholder['next-move']}</p>
        )}

        {gapResult && (
          <>
            <SectionHead
              title="What your gap opens"
              intro="Turn your experience into opportunity. Here are two ways to move forward."
            />

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <section className="flex flex-col rounded-2xl border border-pink-600/15 bg-pink-100/50 p-5 sm:p-6">
                <IconTile name="learning" tone="bg-surface text-pink-600" />
                <h3 className="mt-4 font-display text-lg font-bold tracking-[-0.01em] text-ink">
                  Your learning plan
                </h3>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-ink-soft">
                  Resources for each focus area, with the time and cost of every one.
                </p>
                <GradientButton
                  size="md"
                  className="mt-5 self-start"
                  onClick={() => navigate('/plan/learning')}
                >
                  View learning plan
                </GradientButton>
              </section>

              <section className="flex flex-col rounded-2xl border border-pink-600/15 bg-pink-100/50 p-5 sm:p-6">
                <IconTile name="employers" tone="bg-surface text-pink-600" />
                <h3 className="mt-4 font-display text-lg font-bold tracking-[-0.01em] text-ink">
                  Employer fit finder
                </h3>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-ink-soft">
                  Pick what matters most, and see which companies have published it.
                </p>
                <GradientButton
                  size="md"
                  className="mt-5 self-start"
                  onClick={() => navigate('/plan/employers/matches')}
                >
                  See employer matches
                </GradientButton>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
