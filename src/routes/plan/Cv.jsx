import { useEffect, useMemo, useState } from 'react';
import Header from '../../components/layout/Header.jsx';
import GradientButton from '../../components/ui/GradientButton.jsx';
import CvRail from '../../components/cv/CvRail.jsx';
import CvSheet from '../../components/cv/CvSheet.jsx';
import { CaretDown } from '@phosphor-icons/react';
import { improveCvText } from '../../api/cv.js';
import { computeGap } from '../../api/gap.js';
import useSmoothNavigate from '../../hooks/useSmoothNavigate.js';
import {
  createCvDraft,
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
            Sign in to use the CV builder. It writes a first draft from your journey and saves every
            edit to your account, so it needs an account to keep it in.
          </p>
          <p className="mt-2 max-w-[50ch] text-sm leading-relaxed text-ink-soft">
            New here? Creating an account keeps the journey you have done as a guest.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <GradientButton size="md" onClick={() => openSheet('signIn', '/plan/cv')}>
              Sign in
            </GradientButton>
            <GradientButton
              variant="secondary"
              size="md"
              onClick={() => openSheet('create', '/plan/cv')}
            >
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
  const cv = useIntakeStore((state) => state.cv);
  const cvParsed = useIntakeStore((state) => state.cvParsed);
  const careerBreak = useIntakeStore((state) => state.break);
  const snapshot = useIntakeStore((state) => state.snapshot);
  const selectedRole = useIntakeStore((state) => state.selectedRole);
  const gapResult = useIntakeStore((state) => state.gapResult);
  const confirmedSkills = useIntakeStore((state) => state.confirmedSkills);
  const storedBook = useIntakeStore((state) => state.cvDraft);
  const setCvDraft = useIntakeStore((state) => state.setCvDraft);

  const [suggestion, setSuggestion] = useState(null);
  const [downloadError, setDownloadError] = useState(null);
  // Role whose gap result is being fetched before its draft is created.
  const [tailoring, setTailoring] = useState(null);
  const [roleError, setRoleError] = useState(null);

  const ready = Boolean(user && snapshot && selectedRole);
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

  const generated = useMemo(
    () =>
      ready
        ? createCvDraft({
            cv,
            careerBreak,
            snapshot,
            selectedRole: activeRole,
            gapResult: roleGap,
            confirmedSkills,
          })
        : null,
    [ready, cv, careerBreak, snapshot, activeRole, roleGap, confirmedSkills]
  );
  const saved = roleId ? book.drafts[roleId] : undefined;
  const base = ready ? normaliseDraft(saved, generated) : null;
  const draft = base && { ...base, personal: book.personal };

  // Persist a newly generated draft immediately so it is reused on return.
  useEffect(() => {
    if (!base || (book === storedBook && base === saved)) return;
    setCvDraft({ ...book, drafts: { ...book.drafts, [roleId]: base } });
  }, [base, saved, book, storedBook, roleId, setCvDraft]);

  if (!user) return <SignInRequired />;

  const missing = missingForCv({ cvParsed, snapshot, selectedRole });
  if (missing.length > 0 || !draft) return <MissingInformation missing={missing} />;

  const supported = supportedSkills({ snapshot, confirmedSkills });
  const suggestedSkills = supported
    .filter((skill) => !draft.skills.some((s) => s.toLowerCase() === skill.toLowerCase()))
    .map((skill) => ({ skill, relevant: roleRelevant(skill, roleGap) }))
    .sort((a, b) => Number(b.relevant) - Number(a.relevant));

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

    const open = (gaps) => {
      const latest = openCvBook(useIntakeStore.getState().cvDraft);
      setCvDraft({ ...latest, activeRoleId: nextId, gaps: gaps ?? latest.gaps });
    };

    if (nextId === selectedRole.role_id || book.drafts[nextId] || book.gaps[nextId]) {
      open();
      return;
    }
    setTailoring(role.role);
    computeGap(snapshot, role)
      .then((gap) => {
        const latest = openCvBook(useIntakeStore.getState().cvDraft);
        open({ ...latest.gaps, [nextId]: gap });
      })
      .catch((cause) =>
        setRoleError(`A CV for ${role.role} could not be prepared (${cause.message}). Try again.`)
      )
      .finally(() => setTailoring(null));
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
        role: activeRole.role,
        skills: supported,
        previous,
      });
      setSuggestion({ field, source, previous, text, loading: false });
    } catch (cause) {
      setSuggestion({
        field,
        source,
        previous,
        error: `Wording help is unavailable right now (${cause.message}).`,
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
      const blob = buildCvPdf(draft, {
        title: `${draft.personal.name.trim() || 'CV'} – ${activeRole.role}`,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = cvFileName(draft.personal.name);
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
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
              disabled={Boolean(tailoring)}
              onChange={chooseRole}
            />
          </p>
          <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-ink-soft">
            Built from your CV and career break. Click any text to edit it.
            {roles.length > 1 && ' Each role keeps its own draft.'}
          </p>
          {roleError && (
            <p role="alert" className="mt-3 text-sm text-pink-600">
              {roleError}
            </p>
          )}
        </div>

        <div className="mt-12 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="cv-stage cv-rise" style={{ '--i': 1 }} aria-busy={Boolean(tailoring)}>
            {tailoring && (
              <p role="status" className="cv-tailoring">
                <span className="iv-shimmer">Writing your CV for {tailoring}</span>
              </p>
            )}
            <div key={roleId} className="cv-swap" data-dimmed={Boolean(tailoring) || undefined}>
              <CvSheet
                draft={draft}
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
                onCareerBreak={(change) =>
                  update((current) => ({
                    ...current,
                    careerBreak: { ...current.careerBreak, ...change },
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
            role={activeRole.role}
            suggestedSkills={suggestedSkills}
            downloadError={downloadError}
            disabled={Boolean(tailoring)}
            onDownload={download}
            onCareerBreakChoice={(include) =>
              update((current) => ({
                ...current,
                careerBreak: { ...current.careerBreak, include },
              }))
            }
            onAddSkill={(skill) =>
              update((current) => ({ ...current, skills: [...current.skills, skill] }))
            }
          />
        </div>
      </main>
    </div>
  );
}
