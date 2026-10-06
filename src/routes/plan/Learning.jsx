import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ArrowUpRight, BookmarkSimple } from '@phosphor-icons/react';
import Header from '../../components/layout/Header.jsx';
import GradientButton from '../../components/ui/GradientButton.jsx';
import BackLink from '../../components/intake/BackLink.jsx';
import TargetRoleSelect from '../../components/plan/TargetRoleSelect.jsx';
import ProviderMark from '../../components/learning/ProviderMark.jsx';
import UpNext from '../../components/learning/UpNext.jsx';
import FinishPanel from '../../components/learning/FinishPanel.jsx';
import LearningHero from '../../components/learning/LearningHero.jsx';
import AreaRail from '../../components/learning/AreaRail.jsx';
import UpLater from '../../components/learning/UpLater.jsx';
import FinishedAreas from '../../components/learning/FinishedAreas.jsx';
import RefreshSkills from '../../components/learning/RefreshSkills.jsx';
import MoreSkills from '../../components/learning/MoreSkills.jsx';
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
function Resource({ resource, status, onFinish, onUnfinish, onSave, onOpen }) {
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

/** Sign-in gate: the learning plan and its progress are saved per account. */
function SignInRequired() {
  const openSheet = useAccountStore((state) => state.openSheet);
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="page-shell max-w-[760px] flex-1 py-16">
        <h1 className="font-display text-4xl font-bold tracking-[-0.03em] text-ink">
          Your learning plan
        </h1>
        <p className="mt-3 max-w-[54ch] text-base leading-relaxed text-ink-soft">
          Create a free account to open your learning plan. It saves the resources you finish and
          your progress on each focus area.
        </p>
        <p className="mt-2 max-w-[54ch] text-sm leading-relaxed text-ink-soft">
          Everything you have done so far as a guest comes with you.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <GradientButton size="md" onClick={() => openSheet('create', '/plan/learning')}>
            Create an account
          </GradientButton>
        </div>
      </main>
    </div>
  );
}

/**
 * Learning plan page. Resources are grouped by focus area, in the gap
 * result's ranking order, and one focus area is shown at a time, picked from
 * the rail. Each resource can be saved for later, is marked started when
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
  const addedFocusAreas = useIntakeStore((state) => state.addedFocusAreas);
  const addFocusArea = useIntakeStore((state) => state.addFocusArea);
  const refreshAreas = useIntakeStore((state) => state.refreshAreas);
  const addRefreshArea = useIntakeStore((state) => state.addRefreshArea);
  const cvDraft = useIntakeStore((state) => state.cvDraft);
  const setCvDraft = useIntakeStore((state) => state.setCvDraft);

  const [plan, setPlan] = useState(null);
  // The skill ids the current plan was fetched for.
  const [planKey, setPlanKey] = useState(null);
  const [error, setError] = useState(null);
  // The floating panel: { kind: 'check' | 'area' | 'account', id }.
  const [moment, setMoment] = useState(null);
  // Resource opened in another tab, awaiting the user's return: { id, at }.
  const awaiting = useRef(null);
  // Focus area shown beside the rail; the first active one when unset.
  const [picked, setPicked] = useState(null);
  // Open More skills tab: 'later' | 'refresh' | 'finished'.
  const [moreTab, setMoreTab] = useState(null);
  const learningNow = useRef(null);
  // Area just added from Up later or Refresh; scrolled to and animated once its
  // resources load.
  const [entering, setEntering] = useState(null);
  const scrolledTo = useRef(null);
  // Finished focus areas opened to show their resources.
  const [openFinished, setOpenFinished] = useState([]);

  const roleId = selectedRole?.role_id;
  const added = addedFocusAreas?.[roleId];
  const refreshed = refreshAreas?.[roleId];
  // The first focus areas from the gap result, then any added from Up later,
  // then owned skills added back as refreshers.
  const focusAreas = useMemo(() => {
    if (!gapResult) return [];
    const picked = pickFocusAreas(gapResult.gaps, MAX_FOCUS_AREAS);
    const extra = (added ?? [])
      .map((skillId) => gapResult.gaps.find((gap) => gap.skill_id === skillId))
      .filter((gap) => gap && !picked.includes(gap));
    const refreshers = (refreshed ?? []).map((entry) => ({ ...entry, refresher: true }));
    return [...picked, ...extra, ...refreshers];
  }, [gapResult, added, refreshed]);
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
        setPlanKey(skillKey);
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
    // Refreshers are skills the user already has, so they never count as learned.
    const gaps = focusAreas.filter((area) => !area.refresher);
    const next = learnedSkillsFor(gaps, resources, progress, learnedSkills);
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

  // Guest progress would be lost with the session, so tracking asks for an account.
  const askToSignIn = (resource) => setMoment({ kind: 'account', id: resource.id });

  // Once an added area's resources arrive, bring its section into view.
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
    setPicked(gap.skill_id);
  };

  const addRefresher = (entry) => {
    addRefreshArea(roleId, entry);
    setEntering(entry.skill_id);
    setPicked(entry.skill_id);
  };

  const open = (resource) => {
    if (!user) return;
    if (statusOf(progress, resource.id) !== 'done') setStatus(resource.id, 'started');
    awaiting.current = { id: resource.id, at: Date.now() };
    setMoment(null);
  };

  // Ticking a resource needs no panel; only finishing a whole focus area does.
  // Finishing a gap area keeps it in the plan so it moves to Finished; it is not
  // auto-added to the professional profile (the panel offers adding it to the CV).
  const finish = (resource) => {
    if (!user) return askToSignIn(resource);
    setStatus(resource.id, 'done');
    const completesArea = resources
      .filter((other) => other.skill_id === resource.skill_id && other.id !== resource.id)
      .every((other) => statusOf(progress, other.id) === 'done');
    setMoment(completesArea ? { kind: 'area', id: resource.id } : null);
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

  // The learning plan tracks finished resources per account, so it requires sign in.
  if (!user) return <SignInRequired />;

  // Requires a gap result.
  if (!snapshot || !gapResult) return <Navigate to="/diagnostic/gap" replace />;

  // Refreshers share one green tone; gaps cycle through the palette.
  const toneOf = (skillId) => {
    const index = focusAreas.findIndex((gap) => gap.skill_id === skillId);
    if (focusAreas[index]?.refresher) return 'refresh';
    return TONES[Math.max(0, index) % TONES.length];
  };

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

  // Progress counts gap resources only; refreshers brush up on skills already held.
  const gapResources = resources.filter((resource) => !areaOf(resource.skill_id)?.refresher);
  const finishedCount = gapResources.filter(
    (resource) => statusOf(progress, resource.id) === 'done'
  ).length;
  // Refreshers are counted on their own, and time left is split the same way.
  const refreshResources = resources.filter((resource) => areaOf(resource.skill_id)?.refresher);
  const unfinished = (list) =>
    list.filter((resource) => statusOf(progress, resource.id) !== 'done');
  const timeLeft = totalTime(unfinished(gapResources));

  // Shows a focus area in place of the current one, bringing the top of the
  // list back into view when it has scrolled past.
  const showArea = (skillId) => {
    setPicked(skillId);
    const top = learningNow.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) learningNow.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToMore = (scrollId = 'more-skills') =>
    requestAnimationFrame(() =>
      document.getElementById(scrollId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    );

  // Data for the floating panel.
  const momentResource = moment && resources.find((resource) => resource.id === moment.id);
  const momentArea = momentResource && areaOf(momentResource.skill_id);

  // A finished area moves to the Finished tab, except the one just finished: it
  // stays in place while its panel is open.
  const holding = moment?.kind === 'area' ? momentArea?.skill_id : null;
  const activeAreas = withResources.filter((area) => !area.complete || area.skill_id === holding);
  const finishedAreas = withResources.filter((area) => area.complete && area.skill_id !== holding);
  const shownArea = activeAreas.find((area) => area.skill_id === picked) ?? activeAreas[0];

  // Owned skills for this role. The gap result carries each held skill's id, so
  // refreshers can be fetched deterministically. Refreshers already in the plan
  // above (with resources) leave this list.
  const ownedSkills = (gapResult.skills_have ?? [])
    .map((entry) => ({ skill_id: entry.skill_id, skill: entry.skill }))
    .filter((entry) => {
      const area = areaOf(entry.skill_id);
      return !area || (area.refresher && area.resources.length === 0);
    });
  const refreshStateOf = (entry) => {
    if (!areaOf(entry.skill_id)) return 'idle';
    return planKey === skillKey ? 'none' : 'loading';
  };

  const showFinished = (skillId) => {
    setOpenFinished((ids) => (ids.includes(skillId) ? ids : [...ids, skillId]));
    setMoreTab('finished');
    scrollToMore(`finished-${skillId}`);
  };

  const resourceRows = (area) =>
    area.resources.map((resource) => (
      <Resource
        key={resource.id}
        resource={resource}
        status={statusOf(progress, resource.id)}
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
        {/* Guests have no journey, so they get a way back to the gap screen. */}
        {!user && <BackLink to="/diagnostic/gap">Back to your readiness</BackLink>}

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
            done={finishedCount}
            total={gapResources.length}
            timeLeft={timeLeft}
            refreshDone={refreshResources.length - unfinished(refreshResources).length}
            refreshTotal={refreshResources.length}
            refreshTimeLeft={totalTime(unfinished(refreshResources))}
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
          <div className="mt-14 grid gap-10 lg:grid-cols-[16.5rem_minmax(0,1fr)] lg:gap-14">
            <aside>
              <AreaRail
                areas={activeAreas.filter((area) => !area.refresher)}
                active={shownArea?.skill_id}
                onSelect={showArea}
                laterCount={laterGaps.length}
                onLater={() => {
                  setMoreTab('later');
                  scrollToMore();
                }}
                refreshing={activeAreas.filter((area) => area.refresher)}
                finished={finishedAreas}
                onSelectFinished={showFinished}
              />
            </aside>

            <section ref={learningNow} aria-label="All resources" className="min-w-0 scroll-mt-8">
              {activeAreas.length > 0 && (
                <div className="mb-8">
                  <ChapterLabel>
                    {shownArea?.refresher ? 'Refreshing' : 'Learning now'}
                  </ChapterLabel>
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

              {shownArea && (
                <section
                  key={shownArea.skill_id}
                  id={`area-${shownArea.skill_id}`}
                  data-tone={shownArea.tone}
                  data-complete={shownArea.complete || undefined}
                  data-entering={shownArea.skill_id === entering || undefined}
                  className="lp-area lp-tone lp-swap"
                >
                  <h2 className="flex flex-wrap items-center gap-x-3 gap-y-1 font-display text-[1.75rem] font-bold leading-tight tracking-[-0.03em] text-ink">
                    {shownArea.skill}
                    {shownArea.refresher && <span className="lp-refresh-tag">Refresher</span>}
                  </h2>
                  {shownArea.blurb && (
                    <p className="mt-1 text-sm text-ink-soft">{shownArea.blurb}</p>
                  )}

                  <ul className="mt-4 space-y-1">{resourceRows(shownArea)}</ul>
                </section>
              )}

              <MoreSkills
                current={moreTab}
                onSelect={setMoreTab}
                tabs={[
                  laterGaps.length > 0 && {
                    id: 'later',
                    label: 'Up later',
                    count: laterGaps.length,
                    panel: <UpLater gaps={laterGaps} role={selectedRole?.role} onAdd={addToPlan} />,
                  },
                  ownedSkills.length > 0 && {
                    id: 'refresh',
                    label: 'Refresh',
                    count: ownedSkills.length,
                    panel: (
                      <RefreshSkills
                        skills={ownedSkills}
                        stateOf={refreshStateOf}
                        onRefresh={addRefresher}
                      />
                    ),
                  },
                  finishedAreas.length > 0 && {
                    id: 'finished',
                    label: 'Finished',
                    count: finishedAreas.length,
                    panel: (
                      <FinishedAreas
                        areas={finishedAreas}
                        open={openFinished}
                        onToggle={(skillId) =>
                          setOpenFinished((ids) =>
                            ids.includes(skillId)
                              ? ids.filter((id) => id !== skillId)
                              : [...ids, skillId]
                          )
                        }
                        signedIn={Boolean(user)}
                        onCv={(area) => skillOnCv(cvDraft, roleId, area.skill)}
                        onAddToCv={(area) =>
                          setCvDraft(addSkillToCv(useIntakeStore.getState(), area.skill))
                        }
                        renderResources={resourceRows}
                      />
                    ),
                  },
                ].filter(Boolean)}
              />
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
      />
    </div>
  );
}
