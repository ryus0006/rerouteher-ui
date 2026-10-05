import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ArrowUpRight, BookmarkSimple } from '@phosphor-icons/react';
import Header from '../../components/layout/Header.jsx';
import BackLink from '../../components/intake/BackLink.jsx';
import TargetRoleSelect from '../../components/plan/TargetRoleSelect.jsx';
import ProviderMark from '../../components/learning/ProviderMark.jsx';
import UpNext from '../../components/learning/UpNext.jsx';
import FinishPanel from '../../components/learning/FinishPanel.jsx';
import LearningHero from '../../components/learning/LearningHero.jsx';
import AreaRail from '../../components/learning/AreaRail.jsx';
import UpLater from '../../components/learning/UpLater.jsx';
import FinishedAreas from '../../components/learning/FinishedAreas.jsx';
import ChapterLabel from '../../components/learning/ChapterLabel.jsx';
import { MAX_FOCUS_AREAS } from '../../components/gap/FocusAreaList.jsx';
import { pickFocusAreas } from '../../lib/focusAreas.js';
import {
  duration,
  learnedSkillsFor,
  totalTime,
  sameLearned,
  statusOf,
  upNext,
} from '../../lib/learningProgress.js';
import { addSkillToCv, removeSkillFromCv, skillOnCv } from '../../lib/cvDraft.js';
import { addProfessionalSkill } from '../../api/account.js';
import { recommendLearning } from '../../api/learning.js';
import { useAccountStore } from '../../store/accountStore.js';
import { useIntakeStore } from '../../store/intakeStore.js';

/* Focus areas take the landing page's tool tones, in ranking order. */
const TONES = ['pink', 'indigo', 'amber', 'violet'];

/* Time away from the tab before returning asks whether a resource was
   finished, so a quick switch back does not prompt. */
const CHECK_IN_AFTER_MS = 4000;

const STATUS_LABEL = { saved: 'Saved', started: 'In progress', done: 'Finished' };

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

/** Status ring: empty until finished, then filled with a tick. */
function StatusRing({ status, title, onClick }) {
  const done = status === 'done';
  return (
    <button
      type="button"
      onClick={onClick}
      data-status={status ?? 'none'}
      aria-label={done ? `Mark ${title} as not finished` : `Mark ${title} as finished`}
      className="lp-ring group"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6">
        <circle cx="12" cy="12" r="10" className="lp-ring-track" />
        <circle cx="12" cy="12" r="10" className="lp-ring-fill" />
        <path d="m7.5 12.3 3 3 6-6.3" className="lp-ring-tick" />
      </svg>
    </button>
  );
}

/**
 * Learning resource row: title, `why` (how it addresses the gap), provider,
 * format, duration and cost, with its status and a bookmark for later.
 */
function Resource({ resource, status, step, total, onFinish, onUnfinish, onSave, onOpen }) {
  const saved = status === 'saved' || status === 'started';
  const done = status === 'done';

  return (
    <li data-status={status ?? 'none'} className="lp-row">
      <StatusRing
        status={status}
        title={resource.title}
        onClick={() => (done ? onUnfinish(resource) : onFinish(resource))}
      />
      <ProviderMark logo={resource.logo} provider={resource.provider} />

      <div className="min-w-0 flex-1">
        <p className="mb-1 text-xs font-semibold text-ink-faint">
          Step {step} of {total}
        </p>
        <h3 className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold text-ink">
          {resource.title}
          {status && (
            <span className="lp-status" data-status={status}>
              {STATUS_LABEL[status]}
            </span>
          )}
        </h3>
        <p className="mt-0.5 text-xs text-ink-faint">{resource.provider}</p>
        <p className="mt-1.5 max-w-[62ch] text-sm leading-relaxed text-ink-soft">{resource.why}</p>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Chip tone="format">{resource.format}</Chip>
          {duration(resource.minutes) && <Chip>{duration(resource.minutes)}</Chip>}
          <Chip tone={resource.free ? 'free' : 'neutral'}>{resource.cost}</Chip>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => onSave(resource)}
          aria-pressed={saved}
          aria-label={`Save ${resource.title} for later`}
          className={`lp-icon-button ${done ? 'invisible' : ''}`}
          tabIndex={done ? -1 : undefined}
        >
          <BookmarkSimple
            weight={saved ? 'fill' : 'light'}
            className="size-[1.125rem]"
            aria-hidden="true"
          />
        </button>
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onOpen(resource)}
          className="lp-open group"
        >
          {status === 'started' ? 'Continue' : done ? 'Revisit' : 'Open resource'}
          <span className="lp-open-icon">
            <ArrowUpRight weight="bold" className="size-3" aria-hidden="true" />
          </span>
          <span className="sr-only">
            {resource.title} at {resource.provider}, opens in a new tab
          </span>
        </a>
      </div>
    </li>
  );
}

/**
 * Learning plan page. Resources are grouped by focus area, in the gap
 * result's ranking order. Each can be saved for later, is marked started when
 * opened, and on return the user is asked whether it was finished.
 */
export default function Learning() {
  const snapshot = useIntakeStore((state) => state.snapshot);
  const selectedRole = useIntakeStore((state) => state.selectedRole);
  const user = useAccountStore((state) => state.user);
  const gapResult = useIntakeStore((state) => state.gapResult);
  const progress = useIntakeStore((state) => state.learningProgress);
  const setStatus = useIntakeStore((state) => state.setLearningStatus);
  const openSheet = useAccountStore((state) => state.openSheet);
  const learnedSkills = useIntakeStore((state) => state.learnedSkills);
  const setLearnedSkills = useIntakeStore((state) => state.setLearnedSkills);
  const applyProfileSkillUpdate = useIntakeStore((state) => state.applyProfileSkillUpdate);
  const addedFocusAreas = useIntakeStore((state) => state.addedFocusAreas);
  const addFocusArea = useIntakeStore((state) => state.addFocusArea);
  const cvDraft = useIntakeStore((state) => state.cvDraft);
  const setCvDraft = useIntakeStore((state) => state.setCvDraft);

  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);
  // The floating panel: { kind: 'check' | 'area' | 'account', id }.
  const [moment, setMoment] = useState(null);
  // Resource opened in another tab, awaiting the user's return: { id, at }.
  const awaiting = useRef(null);
  // Focus area in view, highlighted in the rail.
  const [active, setActive] = useState(null);
  // Gap just added from Up later; scrolled to and animated once its resources load.
  const [entering, setEntering] = useState(null);
  const scrolledTo = useRef(null);
  // Finished focus areas opened to show their resources.
  const [openFinished, setOpenFinished] = useState([]);
  const [profileSync, setProfileSync] = useState(null);

  const roleId = selectedRole?.role_id;
  const added = addedFocusAreas?.[roleId];
  // Active focus areas are the role's current gaps. Skills already learned that are
  // requirements of this role (covered, so in skills_have) are finished - shown at the
  // end, never taking an active slot, whether or not they have fetched material.
  const focusAreas = useMemo(() => {
    if (!gapResult) return [];
    const currentIds = new Set(gapResult.gaps.map((gap) => gap.skill_id));
    const covered = new Set(gapResult.skills_have ?? []);
    const finishedLearned = learnedSkills
      .filter(
        (entry) =>
          entry?.skill_id && !currentIds.has(entry.skill_id) && covered.has(entry.skill)
      )
      .map((entry) => ({ band: 'role', importance: 0, uplift: entry.uplift ?? 0, ...entry, learned: true }));
    const picked = pickFocusAreas(gapResult.gaps, MAX_FOCUS_AREAS);
    const extra = (added ?? [])
      .map((skillId) => gapResult.gaps.find((gap) => gap.skill_id === skillId))
      .filter((gap) => gap && !picked.includes(gap));
    return [...picked, ...extra, ...finishedLearned];
  }, [gapResult, added, learnedSkills]);
  const laterGaps = gapResult ? gapResult.gaps.filter((gap) => !focusAreas.includes(gap)) : [];
  const skillKey = focusAreas.map((gap) => gap.skill_id).join('|');

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

  const resources = useMemo(() => plan?.resources ?? [], [plan]);

  // Keep the CV builder's learned skills in step with finished focus areas.
  useEffect(() => {
    if (!plan) return;
    const next = learnedSkillsFor(focusAreas, resources, progress, learnedSkills);
    if (!sameLearned(next, learnedSkills)) setLearnedSkills(next);
  }, [plan, focusAreas, resources, progress, learnedSkills, setLearnedSkills]);

  // On returning to the tab after opening a resource, ask whether it was finished.
  useEffect(() => {
    const onReturn = () => {
      const opened = awaiting.current;
      if (!opened || document.visibilityState !== 'visible') return;
      awaiting.current = null;
      if (Date.now() - opened.at < CHECK_IN_AFTER_MS) return;
      if (statusOf(useIntakeStore.getState().learningProgress, opened.id) === 'done') return;
      setMoment({ kind: 'check', id: opened.id });
    };
    document.addEventListener('visibilitychange', onReturn);
    window.addEventListener('focus', onReturn);
    return () => {
      document.removeEventListener('visibilitychange', onReturn);
      window.removeEventListener('focus', onReturn);
    };
  }, []);

  // Highlight the focus area whose resources are in the middle of the viewport.
  useEffect(() => {
    if (!plan || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActive(visible.target.dataset.area);
      },
      { rootMargin: '-35% 0px -55% 0px' }
    );
    document.querySelectorAll('[data-area]').forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [plan]);

  // Guest progress would be lost with the session, so tracking asks for an account.
  const askToSignIn = (resource) => setMoment({ kind: 'account', id: resource.id });

  // Once an added gap's resources arrive, bring its section into view.
  useEffect(() => {
    if (!entering || scrolledTo.current === entering) return;
    if (!plan?.resources.some((resource) => resource.skill_id === entering)) return;
    scrolledTo.current = entering;
    document
      .getElementById(`area-${entering}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [entering, plan]);

  const addToPlan = (gap) => {
    addFocusArea(roleId, gap.skill_id);
    setEntering(gap.skill_id);
  };

  // Record a finished focus area as a learned skill right away. Finishing also
  // removes the skill from gapResult.gaps, and focusAreas is built from gaps plus
  // learnedSkills; seeding it here keeps the skill visible instead of falling
  // through the gap between the two.
  const recordLearnedArea = (area) => {
    const current = useIntakeStore.getState().learnedSkills;
    if (current.some((entry) => entry.skill_id === area.skill_id)) return;
    setLearnedSkills([
      ...current,
      {
        skill_id: area.skill_id,
        skill: area.skill,
        uplift: area.uplift,
        importance: area.importance,
        definition: area.definition,
        roleId,
      },
    ]);
  };

  const syncProfileSkill = async (area) => {
    setProfileSync({ area, status: 'syncing' });
    try {
      const update = await addProfessionalSkill(area.skill_id);
      applyProfileSkillUpdate(update);
      setProfileSync({ area, status: 'success' });
    } catch (cause) {
      setProfileSync({ area, status: 'error', message: cause.message });
    }
  };

  const open = (resource) => {
    if (!user) return;
    if (statusOf(progress, resource.id) !== 'done') setStatus(resource.id, 'started');
    awaiting.current = { id: resource.id, at: Date.now() };
    setMoment(null);
  };

  // Ticking a resource needs no panel; only finishing a whole focus area does.
  const finish = (resource) => {
    if (!user) return askToSignIn(resource);
    setStatus(resource.id, 'done');
    const completesArea = resources
      .filter((other) => other.skill_id === resource.skill_id && other.id !== resource.id)
      .every((other) => statusOf(progress, other.id) === 'done');
    const area = areaOf(resource.skill_id);
    setMoment(completesArea ? { kind: 'area', id: resource.id } : null);
    if (completesArea && area) {
      recordLearnedArea(area);
      void syncProfileSkill(area);
    }
  };

  // Restores the status held before it was finished; entries without `from`
  // fall back to started.
  const unfinish = (resource) => {
    const entry = progress[resource.id];
    setStatus(resource.id, entry && 'from' in entry ? entry.from : 'started');
    if (moment?.id === resource.id) setMoment(null);
  };

  const toggleSave = (resource) => {
    if (!user) return askToSignIn(resource);
    const status = statusOf(progress, resource.id);
    setStatus(resource.id, status === 'saved' || status === 'started' ? null : 'saved');
  };

  const closePanel = useCallback(() => setMoment(null), []);

  // Requires a gap result.
  if (!snapshot || !gapResult) return <Navigate to="/diagnostic/gap" replace />;

  const toneOf = (skillId) =>
    TONES[
      Math.max(
        0,
        focusAreas.findIndex((gap) => gap.skill_id === skillId)
      ) % TONES.length
    ];

  // Every focus area with its resources and progress, in ranking order.
  const areas = focusAreas.map((gap) => {
    const own = resources.filter((resource) => resource.skill_id === gap.skill_id);
    const statuses = own.map((resource) => statusOf(progress, resource.id));
    const done = statuses.filter((status) => status === 'done').length;
    return {
      ...gap,
      icon: plan?.groups?.find((entry) => entry.skill_id === gap.skill_id)?.icon,
      blurb: plan?.groups?.find((entry) => entry.skill_id === gap.skill_id)?.blurb,
      tone: toneOf(gap.skill_id),
      resources: own,
      statuses,
      done,
      complete: own.length > 0 && done === own.length,
    };
  });
  const withResources = areas.filter((area) => area.resources.length > 0);
  const areaOf = (skillId) => areas.find((area) => area.skill_id === skillId);

  // The one resource featured at the top: the latest started, then saved,
  // then the first unfinished one in ranking order.
  const queue = upNext(resources, progress);
  const featured =
    queue[0] ??
    withResources
      .flatMap((area) => area.resources)
      .find((resource) => statusOf(progress, resource.id) !== 'done');
  const shelf = queue.filter((resource) => resource.id !== featured?.id);

  // Progress is skill-based: skills the user owns for this role (from their CV or
  // finished learning, i.e. covered requirements) out of the role's total skills.
  const skillsOwned = gapResult?.skills_have?.length ?? 0;
  const totalRoleSkills = skillsOwned + (gapResult?.gaps?.length ?? 0);
  const timeLeft = totalTime(
    resources.filter((resource) => statusOf(progress, resource.id) !== 'done')
  );
  const upliftLeft = withResources
    .filter((area) => !area.complete)
    .reduce((sum, area) => sum + (area.uplift ?? 0), 0);

  const jumpTo = (skillId) => {
    document
      .getElementById(`area-${skillId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Data for the floating panel.
  const momentResource = moment && resources.find((resource) => resource.id === moment.id);
  const momentArea = momentResource && areaOf(momentResource.skill_id);

  // A skill moves to Owned once finished, except the one just finished: it stays in
  // place while its panel is open.
  const holding = moment?.kind === 'area' ? momentArea?.skill_id : null;
  // Active: gaps with material still to finish (plus the one whose panel is open).
  const activeAreas = areas.filter(
    (area) =>
      area.skill_id === holding ||
      (!area.learned && !area.complete && area.resources.length > 0)
  );

  // Owned: every skill the user has for this role (the covered requirements), so the
  // Owned list matches the progress count. Resolve an id + resources where we know
  // them (learned in a plan or in the profile); a skill with no fetched material just
  // shows as owned, with no learning resources to reveal.
  const idByName = new Map();
  for (const entry of [
    ...(snapshot?.professional_skills ?? []),
    ...(snapshot?.reframed_skills ?? []),
    ...learnedSkills,
    ...(gapResult?.gaps ?? []),
  ]) {
    if (entry?.skill && entry?.skill_id && !idByName.has(entry.skill)) {
      idByName.set(entry.skill, entry.skill_id);
    }
  }
  const ownedAreas = (gapResult?.skills_have ?? [])
    .map((name, index) => {
      const skillId = idByName.get(name) ?? name;
      return {
        skill_id: skillId,
        skill: name,
        tone: TONES[index % TONES.length],
        icon: plan?.groups?.find((entry) => entry.skill_id === skillId)?.icon,
        resources: resources.filter((resource) => resource.skill_id === skillId),
      };
    })
    .filter((area) => area.skill_id !== holding);

  const showFinished = (skillId) => {
    setOpenFinished((ids) => (ids.includes(skillId) ? ids : [...ids, skillId]));
    document
      .getElementById(`finished-${skillId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const resourceRows = (area) =>
    area.resources.map((resource, index) => (
      <Resource
        key={resource.id}
        resource={resource}
        status={statusOf(progress, resource.id)}
        step={index + 1}
        total={area.resources.length}
        onFinish={(item) => finish(item)}
        onUnfinish={unfinish}
        onSave={toggleSave}
        onOpen={open}
      />
    ));

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="page-shell max-w-[1200px] flex-1 pt-14 pb-40">
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

        {error && (
          <p role="alert" className="mt-8 text-sm font-medium text-pink-600">
            {error} Reload the page to try again.
          </p>
        )}

        {!plan && !error && (
          <p className="mt-8 text-sm text-ink-soft">Finding resources for your focus areas…</p>
        )}

        {plan && resources.length > 0 && (
          <LearningHero
            progress={progress}
            done={skillsOwned}
            total={totalRoleSkills}
            timeLeft={timeLeft}
            upliftLeft={upliftLeft}
            role={selectedRole?.role}
            featured={featured}
            queueSize={queue.length}
            featuredArea={featured && areaOf(featured.skill_id)}
            nextGap={laterGaps[0]}
            onAddNext={addToPlan}
            onOpen={open}
            onFinish={(resource) => finish(resource)}
            onSave={toggleSave}
          />
        )}

        {shelf.length > 0 && (
          <UpNext
            items={shelf}
            progress={progress}
            areaName={(skillId) => areaOf(skillId)?.skill ?? ''}
            toneOf={toneOf}
            onOpen={open}
            onFinish={(resource) => finish(resource)}
            onRemove={(resource) => setStatus(resource.id, null)}
          />
        )}

        {plan && resources.length > 0 && (
          <div className="mt-14 grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
            <aside>
              <AreaRail
                areas={activeAreas}
                active={active}
                onSelect={jumpTo}
                laterCount={laterGaps.length}
                onLater={() =>
                  document
                    .getElementById('up-later')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
                finished={ownedAreas}
                onSelectFinished={showFinished}
              />
            </aside>

            <section aria-label="All resources" className="min-w-0">
              {activeAreas.length > 0 && (
                <div className="mb-8">
                  <ChapterLabel>Learning now</ChapterLabel>
                </div>
              )}
              {queue.length === 0 && activeAreas.length > 0 && (
                <p className="-mt-5 mb-8 flex items-center gap-1.5 text-sm text-ink-faint">
                  <BookmarkSimple weight="light" className="size-4" aria-hidden="true" />
                  {user
                    ? 'Save anything for later and it waits at the top of this page.'
                    : 'Create a free account to save resources and track what you finish.'}
                </p>
              )}

              {activeAreas.map((area) => (
                <section
                  key={area.skill_id}
                  id={`area-${area.skill_id}`}
                  data-area={area.skill_id}
                  data-tone={area.tone}
                  data-complete={area.complete || undefined}
                  data-entering={area.skill_id === entering || undefined}
                  className="lp-area lp-tone"
                >
                  <h2 className="font-display text-[1.75rem] font-bold leading-tight tracking-[-0.03em] text-ink">
                    {area.skill}
                  </h2>
                  {area.blurb && <p className="mt-1 text-sm text-ink-soft">{area.blurb}</p>}
                  {area.uplift != null && (
                    <p className="mt-2.5 text-xs font-semibold text-verify tabular">
                      +{area.uplift}% readiness if learned
                    </p>
                  )}

                  <ul className="mt-4 space-y-1">{resourceRows(area)}</ul>
                </section>
              ))}

              {laterGaps.length > 0 && (
                <UpLater gaps={laterGaps} role={selectedRole?.role} onAdd={addToPlan} />
              )}

              {ownedAreas.length > 0 && (
                <FinishedAreas
                  areas={ownedAreas}
                  open={openFinished}
                  onToggle={(skillId) =>
                    setOpenFinished((ids) =>
                      ids.includes(skillId) ? ids.filter((id) => id !== skillId) : [...ids, skillId]
                    )
                  }
                  signedIn={Boolean(user)}
                  onCv={(area) => skillOnCv(cvDraft, roleId, area.skill)}
                  onAddToCv={(area) =>
                    setCvDraft(addSkillToCv(useIntakeStore.getState(), area.skill))
                  }
                  renderResources={resourceRows}
                />
              )}
            </section>
          </div>
        )}

        {plan?.resources.length === 0 && (
          <p className="mt-8 max-w-[56ch] text-sm leading-relaxed text-ink-soft">
            Nothing is listed for these focus areas yet. Your gap result still stands — the
            resources for it are being added.
          </p>
        )}
      </main>

      <FinishPanel
        moment={moment}
        resource={momentResource}
        area={momentArea}
        total={momentArea?.resources.length ?? 0}
        onAccount={() => {
          closePanel();
          openSheet('create', '/plan/learning');
        }}
        onYes={() => momentResource && finish(momentResource)}
        onNotYet={closePanel}
        onCv={Boolean(momentArea && skillOnCv(cvDraft, roleId, momentArea.skill))}
        onAddToCv={() => setCvDraft(addSkillToCv(useIntakeStore.getState(), momentArea.skill))}
        onRemoveFromCv={() => setCvDraft(removeSkillFromCv(cvDraft, roleId, momentArea.skill))}
        onClose={closePanel}
        profileSync={
          profileSync?.area?.skill_id === momentArea?.skill_id ? profileSync : null
        }
        onRetry={() => profileSync?.area && syncProfileSkill(profileSync.area)}
      />
    </div>
  );
}
