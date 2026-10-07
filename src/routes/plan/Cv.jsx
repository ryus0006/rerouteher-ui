import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Header from '../../components/layout/Header.jsx';
import GradientButton from '../../components/ui/GradientButton.jsx';
import CvRail from '../../components/cv/CvRail.jsx';
import CvSheet from '../../components/cv/CvSheet.jsx';
import { CaretDown } from '@phosphor-icons/react';
import { generateCv, improveCvText } from '../../api/cv.js';
import useSmoothNavigate from '../../hooks/useSmoothNavigate.js';
import {
  careerBreakSection,
  missingForCv,
  normaliseDraft,
  openCvBook,
  roleRelevant,
  supportedSkills,
} from '../../lib/cvDraft.js';
import { buildCvPdf, cvFileName } from '../../lib/cvPdf.js';
import { useAccountStore } from '../../store/accountStore.js';
import { useIntakeStore } from '../../store/intakeStore.js';

function Notice({ title, children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="page-shell max-w-[760px] flex-1 py-16">
        <h1 className="font-display text-3xl font-bold tracking-[-0.02em] text-ink">{title}</h1>
        {children}
      </main>
    </div>
  );
}

/** Skeleton CV page shown behind the sign-in gate. */
function SheetOutline() {
  const line = (width, strong = false) => (
    <span className={`cv-outline-line ${strong ? 'cv-outline-strong' : ''}`} style={{ width }} />
  );
  return (
    <div className="cv-outline" aria-hidden="true">
      {line('55%', true)}
      <div className="mt-3 flex gap-3">
        {line('28%')}
        {line('20%')}
        {line('22%')}
      </div>
      <span className="cv-outline-rule" />
      {['Professional summary', 'Core skills', 'Work experience'].map((title, at) => (
        <div key={title} className="mt-7">
          {line('34%', true)}
          <div className="mt-3 space-y-2">
            {line('100%')}
            {line(at === 1 ? '70%' : '92%')}
            {at !== 1 && line('64%')}
          </div>
        </div>
      ))}
    </div>
  );
}

function SignInRequired() {
  const openSheet = useAccountStore((state) => state.openSheet);
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="page-shell grid max-w-[1080px] flex-1 items-center gap-16 py-16 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-[-0.03em] text-ink">
            CV builder
          </h1>
          <p className="mt-3 max-w-[50ch] text-base leading-relaxed text-ink-soft">
            Create a free account to use the CV builder. It writes a first draft from your journey
            and saves every edit you make.
          </p>
          <p className="mt-2 max-w-[50ch] text-sm leading-relaxed text-ink-soft">
            Everything you have done so far as a guest comes with you.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <GradientButton size="md" onClick={() => openSheet('create', '/plan/cv')}>
              Create an account
            </GradientButton>
          </div>
        </div>
        <SheetOutline />
      </main>
    </div>
  );
}

function MissingInformation({ missing }) {
  const navigate = useSmoothNavigate();
  return (
    <Notice title="A little more before your CV">
      <p className="mt-3 max-w-[58ch] text-sm leading-relaxed text-ink-soft">
        Your CV is written only from what your journey holds, so these need to be in place first.
      </p>
      <ul className="mt-6 space-y-3">
        {missing.map((item) => (
          <li key={item.label} className="cv-missing">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{item.label}</p>
              <p className="mt-0.5 text-sm text-ink-soft">{item.detail}</p>
            </div>
            <GradientButton variant="secondary" size="sm" onClick={() => navigate(item.to)}>
              Complete this
            </GradientButton>
          </li>
        ))}
      </ul>
    </Notice>
  );
}

function GenerationNotice({ role, error, onRetry }) {
  return (
    <Notice title={error ? 'Your CV is still available' : 'Preparing your CV'}>
      <p
        className="mt-3 max-w-[58ch] text-sm leading-relaxed text-ink-soft"
        role={error ? 'alert' : 'status'}
      >
        {error ??
          `We are preparing a professional CV for ${role}. Your saved journey stays unchanged while it is being prepared.`}
      </p>
      {error && (
        <GradientButton className="mt-6" variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </GradientButton>
      )}
    </Notice>
  );
}

/**
 * Role selector for the CV: a styled pill over a native select, keeping native
 * keyboard and screen reader behaviour.
 */
function RolePicker({ roles, value, targetId, disabled, onChange }) {
  const current = roles.find((role) => role.role_id === value);
  if (roles.length < 2) return <span className="cv-role-pill">{current?.role}</span>;

  return (
    <span className="cv-role-pill cv-role-pill-picker" data-disabled={disabled || undefined}>
      {current?.role}
      <span className="cv-role-pill-icon" aria-hidden="true">
        <CaretDown weight="bold" className="size-3.5" />
      </span>
      <select
        aria-label="Role this CV is for"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {roles.map((role) => (
          <option key={role.role_id} value={role.role_id}>
            {role.role}
            {role.role_id === targetId ? ' (your target role)' : ''}
          </option>
        ))}
      </select>
    </span>
  );
}

export default function Cv() {
  const user = useAccountStore((state) => state.user);
  const cvParsed = useIntakeStore((state) => state.cvParsed);
  const snapshot = useIntakeStore((state) => state.snapshot);
  const selectedRole = useIntakeStore((state) => state.selectedRole);
  const gapResult = useIntakeStore((state) => state.gapResult);
  const careerBreakInput = useIntakeStore((state) => state.break);
  const confirmedSkills = useIntakeStore((state) => state.confirmedSkills);
  const learnedSkills = useIntakeStore((state) => state.learnedSkills);
  const storedBook = useIntakeStore((state) => state.cvDraft);
  const setCvDraft = useIntakeStore((state) => state.setCvDraft);
  const markCvDownloaded = useIntakeStore((state) => state.markCvDownloaded);

  const [suggestion, setSuggestion] = useState(null);
  const [downloadError, setDownloadError] = useState(null);
  const [roleError, setRoleError] = useState(null);
  const [generatingRole, setGeneratingRole] = useState(null);
  const [generationError, setGenerationError] = useState(null);
  const generationRequests = useRef(new Set());

  const ready = Boolean(user && cvParsed && snapshot && selectedRole);
  const book = useMemo(() => openCvBook(storedBook), [storedBook]);

  const roles = useMemo(() => {
    const recommended = snapshot?.recommended_roles ?? [];
    if (!selectedRole || recommended.some((role) => role.role_id === selectedRole.role_id))
      return recommended;
    return [selectedRole, ...recommended];
  }, [snapshot, selectedRole]);

  const activeRole = roles.find((role) => role.role_id === book.activeRoleId) ?? selectedRole;
  const roleId = activeRole?.role_id;
  const roleGap = roleId === selectedRole?.role_id ? gapResult : (book.gaps[roleId] ?? null);
  const saved = roleId ? book.drafts[roleId] : undefined;
  const draft = ready && saved ? normaliseDraft(saved) : null;

  const storeGeneratedDraft = useCallback(
    (targetRoleId, result) => {
      const generated = normaliseDraft(result.draft);
      if (!generated) return;
      const latest = openCvBook(useIntakeStore.getState().cvDraft);
      setCvDraft({
        ...latest,
        activeRoleId: targetRoleId,
        drafts: { ...latest.drafts, [targetRoleId]: generated },
      });
    },
    [setCvDraft]
  );

  const requestDraft = useCallback(
    async (targetRoleId, regenerate = false) => {
      setGenerationError(null);
      setGeneratingRole(targetRoleId);
      try {
        const result = await generateCv({ roleId: targetRoleId, regenerate });
        storeGeneratedDraft(targetRoleId, result);
        return true;
      } catch (cause) {
        setGenerationError(
          cause.status === 503
            ? 'The CV service is temporarily unavailable due to an internal service problem. Your current journey is safe; please try again later.'
            : 'The CV could not be prepared from the saved journey yet. Please complete the required journey steps and try again.'
        );
        return false;
      } finally {
        setGeneratingRole((current) => (current === targetRoleId ? null : current));
      }
    },
    [storeGeneratedDraft]
  );

  useEffect(() => {
    if (!ready || !roleId || saved || generationRequests.current.has(roleId)) return;
    generationRequests.current.add(roleId);
    requestDraft(roleId).then((ok) => {
      if (!ok) generationRequests.current.delete(roleId);
    });
  }, [ready, roleId, saved, requestDraft]);

  if (!user) return <SignInRequired />;

  const missing = missingForCv({ cvParsed, snapshot, selectedRole });
  if (missing.length > 0) return <MissingInformation missing={missing} />;
  if (!draft) {
    return (
      <GenerationNotice
        role={activeRole?.role ?? 'your target role'}
        error={generationError}
        onRetry={() => {
          generationRequests.current.delete(roleId);
          requestDraft(roleId);
        }}
      />
    );
  }

  const supported = supportedSkills({ snapshot, confirmedSkills });
  // Derived from the journey (not the draft) so it always reflects the break and
  // shows for backend-generated drafts, which do not carry a career break.
  const careerBreak = careerBreakSection(careerBreakInput, snapshot);
  const onCv = (skill) => draft.skills.some((s) => s.toLowerCase() === skill.toLowerCase());
  // Focus areas finished on the learning plan come first.
  const learned = learnedSkills
    .map((entry) => entry.skill)
    .filter((skill) => !onCv(skill) && !supported.includes(skill));
  const suggestedSkills = [
    ...learned.map((skill) => ({ skill, relevant: false, learned: true })),
    ...supported
      .filter((skill) => !onCv(skill))
      .map((skill) => ({ skill, relevant: roleRelevant(skill, roleGap), learned: false }))
      .sort((a, b) => Number(b.relevant) - Number(a.relevant)),
  ];

  /** Applies an edit: contact fields to the shared details, everything else to the active role's draft. */
  const update = (change) => {
    const { personal, ...rest } = change(draft);
    setCvDraft({ ...book, personal, drafts: { ...book.drafts, [roleId]: rest } });
    setDownloadError(null);
  };

  const setExperience = (at, change) =>
    update((current) => ({
      ...current,
      experiences: current.experiences.map((item, index) =>
        index === at ? { ...item, ...change } : item
      ),
    }));

  /**
   * Switches to another role's CV. The target role and previously opened roles
   * load immediately; other roles first fetch their gap result so the draft can
   * prioritise role-relevant skills.
   */
  function chooseRole(nextId) {
    const role = roles.find((item) => item.role_id === nextId);
    if (!role || nextId === roleId) return;
    setSuggestion(null);
    setRoleError(null);
    setDownloadError(null);
    setGenerationError(null);
    const latest = openCvBook(useIntakeStore.getState().cvDraft);
    setCvDraft({ ...latest, activeRoleId: nextId });
  }

  const textFor = (field) =>
    field === 'summary'
      ? draft.summary
      : draft.experiences[Number(field.replace('experience-', ''))]?.description;

  async function improve(field, source, another = false) {
    if (!source?.trim()) {
      setSuggestion({
        field,
        source,
        previous: [],
        error: 'Write something here first, then ask for clearer wording.',
      });
      return;
    }
    const previous =
      another && suggestion?.field === field
        ? [...suggestion.previous, suggestion.text].filter(Boolean)
        : [];
    setSuggestion({
      field,
      source,
      previous,
      text: another ? suggestion?.text : null,
      loading: true,
    });
    try {
      const { suggestion: text } = await improveCvText({
        section: field === 'summary' ? 'summary' : 'experience',
        text: source,
        roleId,
        experienceIndex: field === 'summary' ? undefined : Number(field.replace('experience-', '')),
        previous,
      });
      setSuggestion({ field, source, previous, text, loading: false });
    } catch (cause) {
      setSuggestion({
        field,
        source,
        previous,
        error:
          cause.status === 503
            ? 'Wording help is temporarily unavailable due to an internal service problem. Your current text is unchanged.'
            : 'Wording help is unavailable right now. Your current text is unchanged.',
      });
    }
  }

  function acceptSuggestion() {
    if (!suggestion?.text) return;
    if (suggestion.field === 'summary')
      update((current) => ({ ...current, summary: suggestion.text }));
    else
      setExperience(Number(suggestion.field.replace('experience-', '')), {
        description: suggestion.text,
      });
    setSuggestion(null);
  }

  function download() {
    try {
      const blob = buildCvPdf(
        { ...draft, careerBreak },
        { title: `${draft.personal.name.trim() || 'CV'} - ${activeRole.role}` }
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = cvFileName(draft.personal.name);
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      markCvDownloaded(activeRole.role_id);
    } catch {
      setDownloadError('The PDF could not be created. Try again.');
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="page-shell max-w-[1200px] flex-1 pt-14 pb-24">
        {/* Visually hidden; the active nav item labels the page. */}
        <h1 className="sr-only">CV builder</h1>
        <div className="cv-rise" style={{ '--i': 0 }}>
          <p className="font-display text-[2rem] leading-[1.25] font-bold tracking-[-0.025em] text-ink">
            Your CV for{' '}
            <RolePicker
              roles={roles}
              value={roleId}
              targetId={selectedRole.role_id}
              disabled={Boolean(generatingRole)}
              onChange={chooseRole}
            />
          </p>
          <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-ink-soft">
            Built from your saved experience and skills. Click any text to edit it.
            {roles.length > 1 && ' Each role keeps its own draft.'}
          </p>
          {roleError && (
            <p role="alert" className="mt-3 text-sm text-pink-600">
              {roleError}
            </p>
          )}
        </div>

        <div className="mt-12 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <div
            className="cv-stage cv-rise"
            style={{ '--i': 1 }}
            aria-busy={Boolean(generatingRole)}
          >
            {generatingRole && (
              <p role="status" className="cv-tailoring">
                <span className="iv-shimmer">
                  {draft ? 'Refreshing' : 'Preparing'} your CV for{' '}
                  {roles.find((role) => role.role_id === generatingRole)?.role ?? activeRole.role}
                </span>
              </p>
            )}
            <div
              key={roleId}
              className="cv-swap"
              data-dimmed={Boolean(generatingRole) || undefined}
            >
              <CvSheet
                draft={draft}
                careerBreak={careerBreak}
                suggestion={
                  suggestion && textFor(suggestion.field) !== undefined ? suggestion : null
                }
                onPersonal={(key, value) =>
                  update((current) => ({
                    ...current,
                    personal: { ...current.personal, [key]: value },
                  }))
                }
                onSummary={(summary) => update((current) => ({ ...current, summary }))}
                onExperience={setExperience}
                onRemoveExperience={(at) => {
                  setSuggestion(null);
                  update((current) => ({
                    ...current,
                    experiences: current.experiences.filter((_, index) => index !== at),
                  }));
                }}
                onAddExperience={() =>
                  update((current) => ({
                    ...current,
                    experiences: [
                      ...current.experiences,
                      { title: '', organisation: '', start: '', end: '', description: '' },
                    ],
                  }))
                }
                onRemoveSkill={(skill) =>
                  update((current) => ({
                    ...current,
                    skills: current.skills.filter((s) => s !== skill),
                  }))
                }
                onImprove={improve}
                onAccept={acceptSuggestion}
                onDismiss={() => setSuggestion(null)}
              />
            </div>
          </div>
          <CvRail
            draft={draft}
            suggestedSkills={suggestedSkills}
            downloadError={downloadError}
            disabled={Boolean(generatingRole)}
            onDownload={download}
            onAddSkill={(skill) =>
              update((current) => ({ ...current, skills: [...current.skills, skill] }))
            }
          />
        </div>
      </main>
    </div>
  );
}
