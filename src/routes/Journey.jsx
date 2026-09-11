import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import useSmoothNavigate from '../hooks/useSmoothNavigate.js';
import Header from '../components/layout/Header.jsx';
import ReadinessGauge from '../components/gap/ReadinessGauge.jsx';
import { MAX_FOCUS_AREAS } from '../components/gap/FocusAreaList.jsx';
import GradientButton from '../components/ui/GradientButton.jsx';
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

const CARD = 'mt-4 rounded-2xl border border-line bg-surface p-5 sm:p-6';

/**
 * The roles her snapshot matched, with the one she is aiming at marked.
 *
 * The exception to the rule that nothing on this page is a control. Choosing a
 * different target is not correcting an answer — it is the question the whole
 * readout answers, so it belongs beside the answer rather than one screen away.
 * Index 0 is her previous occupation, which is why it carries the marker.
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

/** A section title, what the section is for, and an optional figure beside it. */
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

/** The square glyph that tells one panel from the next at a glance. */
function IconTile({ name, tone = 'bg-canvas-sunk text-ink-soft' }) {
  return (
    <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${tone}`}>
      <JourneyIcon name={name} className="size-5" />
    </span>
  );
}

/**
 * Where a returning visitor lands: how far she has come, and everything she has
 * told us, read back to her.
 *
 * A dashboard, not a table of contents. The intake screens ask the questions
 * once; this one only reports the answers, so corrections go to the profile and
 * the only forward controls are the two the gap opened. Anything else would put
 * her back in the form she has already finished.
 */
export default function Journey() {
  const navigate = useSmoothNavigate();
  const user = useAccountStore((state) => state.user);

  const cv = useIntakeStore((state) => state.cv);
  const careerBreak = useIntakeStore((state) => state.break);
  const snapshot = useIntakeStore((state) => state.snapshot);
  const selectedRole = useIntakeStore((state) => state.selectedRole);
  const gapResult = useIntakeStore((state) => state.gapResult);

  /* The role being worked out, if any. The old numbers stay on screen until
     the new ones arrive, so switching never blanks the page she is reading. */
  const [switching, setSwitching] = useState(null);
  const [switchError, setSwitchError] = useState(null);

  const activities = careerBreak?.activities ?? [];
  const displayName = user ? resolveDisplayName(user) : null;
  const progress = journeyProgress({ cv, activities, snapshot, gapResult });

  // The journey belongs to an account. A guest has no saved journey to open.
  if (!user) return <Navigate to="/" replace />;

  const focusAreas = gapResult ? pickFocusAreas(gapResult.gaps, MAX_FOCUS_AREAS) : [];
  const markers = gapResult ? markersFor(gapResult.readiness, focusAreas) : [];
  const projected = markers.length > 0 ? markers[markers.length - 1].at : null;

  /* The band says what she gets out of the next chapter; the panel below says
     only where that chapter stands. Sharing one string put the same sentence on
     screen twice, a few centimetres apart. */
  const upNext = {
    story: 'Your CV, and what filled your break. About five minutes.',
    skills: 'We read your CV and your time away, and name the skills in both.',
    'next-move': 'Pick a role, and see how much of it you can already do.',
  };

  /* An open chapter says what to do; a blocked one says what it is waiting for.
     Using one string for both told her the story was missing while a tick sat
     beside it. */
  const ready = {
    story: 'Not started yet',
    skills: 'Ready to build from your story',
    'next-move': 'Pick a role and see how ready you already are',
  };

  const blocked = {
    story: null,
    skills: 'Ready once your story is in',
    'next-move': 'Ready once your skills are named',
  };

  const pending = (chapter) => (chapter.available ? ready[chapter.id] : blocked[chapter.id]);
  const byId = Object.fromEntries(progress.chapters.map((chapter) => [chapter.id, chapter]));
  const roles = snapshot?.recommended_roles ?? [];

  function switchRole(role) {
    if (switching || role.role_id === selectedRole?.role_id) return;

    setSwitching(role.role_id);
    computeGap(snapshot, role)
      .then((result) => {
        /* Committed in one write: setting the role on its own clears the gap,
           which would empty the readout for as long as the request takes. */
        useIntakeStore.setState({ selectedRole: role, gapResult: result });
        setSwitchError(null);
      })
      .catch((cause) => setSwitchError(cause.message))
      .finally(() => setSwitching(null));
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto w-full max-w-[900px] flex-1 px-5 py-10 sm:px-6 sm:py-12">
        <h1 className="font-display text-3xl font-bold leading-[1.1] tracking-[-0.02em] text-ink sm:text-4xl">
          Welcome back, {displayName}
        </h1>

        <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-ink-soft sm:text-base">
          {progress.completed === 0
            ? 'Nothing here yet. Three chapters, and the first one takes about five minutes.'
            : 'Everything is where you left it.'}
        </p>

        {/* The page's one banded surface, and the one bold element on it: her
            readiness once it exists, and until then the distance to it. */}
        <section className="journey-hero mt-7 overflow-hidden rounded-3xl">
          <div className="grid gap-6 p-7 sm:p-8 md:grid-cols-[minmax(0,1fr)_15rem] md:items-center">
            {gapResult && (
              <div className="md:order-2">
                <ReadinessGauge value={gapResult.readiness} markers={markers} tone="light" />
              </div>
            )}

            <div className="md:order-1">
              <p className="eyebrow">
                {gapResult
                  ? 'Working towards'
                  : `${progress.completed} of ${progress.total} chapters`}
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-[-0.015em] text-ink sm:text-[2rem]">
                {gapResult ? (selectedRole?.role ?? 'Your target role') : progress.next.name}
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

              {/* Only while the diagnostic is unfinished. Once the gap exists the
                  band is a reading, and the two cards at the foot of the page
                  are where the next move actually is. */}
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
                    {progress.completed === 0
                      ? 'Start your story'
                      : `Continue: ${progress.next.name.toLowerCase()}`}
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
                  {/* Two colours are already doing work in the chips below, so
                      the legend says what they mean rather than leaving her to
                      infer that green is the half she earned while away. */}
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
                <p className="pt-1.5 text-sm italic text-ink-faint">{pending(byId.skills)}</p>
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

            {/* Ranked because they genuinely are a sequence: the first one buys
                the most readiness per evening spent on it. */}
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
          <p className={`${CARD} text-sm italic text-ink-faint`}>{pending(byId['next-move'])}</p>
        )}

        {gapResult && (
          <>
            <SectionHead
              title="What your gap opens"
              intro="Turn your experience into opportunity. Here are two ways to move forward."
            />

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <section className="flex flex-col rounded-2xl border border-line bg-blue-100/60 p-5 sm:p-6">
                <IconTile name="learning" tone="bg-surface text-blue-600" />
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
                  View your learning plan
                  <span aria-hidden="true">→</span>
                </GradientButton>
              </section>

              <section className="flex flex-col rounded-2xl border border-line bg-verify-soft p-5 sm:p-6">
                <IconTile name="employers" tone="bg-surface text-verify" />
                <h3 className="mt-4 font-display text-lg font-bold tracking-[-0.01em] text-ink">
                  Employer fit finder
                </h3>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-ink-soft">
                  Pick what matters most, and see which companies have published it.
                </p>
                <GradientButton
                  size="md"
                  className="mt-5 self-start"
                  onClick={() => navigate('/plan/employers')}
                >
                  Find your next opportunity
                  <span aria-hidden="true">→</span>
                </GradientButton>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
