import { useEffect, useMemo, useState } from 'react';
import Header from '../../components/layout/Header.jsx';
import BackLink from '../../components/intake/BackLink.jsx';
import CardIllustration from '../../components/ui/CardIllustration.jsx';
import GradientButton from '../../components/ui/GradientButton.jsx';
import { useAccountStore } from '../../store/accountStore.js';
import { useIntakeStore } from '../../store/intakeStore.js';
import cvStationery from '../../assets/page-illustrations/cv-stationery.png';

const PERSONAL_FIELDS = [
  { key: 'name', label: 'Full name', required: true, autoComplete: 'name' },
  { key: 'email', label: 'Email', required: true, autoComplete: 'email' },
  { key: 'phone', label: 'Phone', required: true, autoComplete: 'tel' },
  { key: 'location', label: 'Location', autoComplete: 'address-level2' },
  { key: 'linkedin', label: 'LinkedIn', autoComplete: 'url' },
];

function sourceSkills(snapshot) {
  return [
    ...(snapshot?.professional_skills ?? []),
    ...(snapshot?.reframed_skills ?? []),
  ].map((skill) => skill.skill);
}

function createDraft({ cv, snapshot, selectedRole }) {
  const professionalSkills = (snapshot?.professional_skills ?? []).map((skill) => skill.skill);
  const reframedSkills = (snapshot?.reframed_skills ?? []).map((skill) => skill.skill);
  const strongestSkills = professionalSkills.slice(0, 4);
  const summary = [
    `Targeting a ${selectedRole.role} role.`,
    strongestSkills.length > 0 && `Brings recognised strengths in ${strongestSkills.join(', ')}.`,
    reframedSkills.length > 0 && 'Also brings transferable strengths identified from a career break.',
  ]
    .filter(Boolean)
    .join(' ');

  return {
    personal: { name: '', email: '', phone: '', location: '', linkedin: '' },
    summary,
    skills: professionalSkills,
    experiences: (cv?.experiences ?? []).map((experience) => ({
      title: experience.title ?? '',
      organisation: experience.organisation ?? '',
      start: experience.start ?? '',
      end: experience.end ?? '',
      description: experience.description ?? '',
    })),
    // A career break is never presented as employment by default.
    includeCareerBreak: false,
  };
}

function suggestionFor(text, variant) {
  const trimmed = text.trim();
  if (!trimmed) return '';

  // A local mock only reframes the supplied wording. It never adds claims.
  return `${variant % 2 === 0 ? 'Relevant experience: ' : 'Professional profile: '}${trimmed}`;
}

function Field({ field, value, onChange }) {
  return (
    <label className="block min-w-0">
      <span className="cv-field-label">
        {field.label}
        {field.required && <span aria-hidden="true"> *</span>}
      </span>
      <input
        type={field.key === 'email' ? 'email' : field.key === 'phone' ? 'tel' : 'text'}
        name={field.key}
        autoComplete={field.autoComplete}
        value={value}
        onChange={(event) => onChange(field.key, event.target.value)}
        className="cv-field-input"
      />
    </label>
  );
}

function AiSuggestion({ suggestion, onAccept, onDismiss, onTryAnother }) {
  if (!suggestion) return null;

  return (
    <aside className="cv-ai-suggestion" aria-live="polite">
      <p className="text-xs font-semibold text-pink-600">AI wording suggestion</p>
      <p className="mt-1 text-sm leading-relaxed text-ink">{suggestion.text}</p>
      <p className="mt-1 text-xs leading-relaxed text-ink-soft">
        It only reframes text already in your draft. No new achievements or experience are added.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={onAccept} className="cv-small-button cv-small-button-primary">
          Use suggestion
        </button>
        <button type="button" onClick={onTryAnother} className="cv-small-button">
          Try another
        </button>
        <button type="button" onClick={onDismiss} className="cv-small-button">
          Dismiss
        </button>
      </div>
    </aside>
  );
}

export default function Cv() {
  const user = useAccountStore((state) => state.user);
  const openSheet = useAccountStore((state) => state.openSheet);
  const snapshot = useIntakeStore((state) => state.snapshot);
  const selectedRole = useIntakeStore((state) => state.selectedRole);
  const cv = useIntakeStore((state) => state.cv);
  const storedDraft = useIntakeStore((state) => state.cvDraft);
  const setCvDraft = useIntakeStore((state) => state.setCvDraft);
  const [downloadErrors, setDownloadErrors] = useState([]);
  const [suggestion, setSuggestion] = useState(null);

  const generatedDraft = useMemo(
    () => (snapshot && selectedRole ? createDraft({ cv, snapshot, selectedRole }) : null),
    [cv, selectedRole, snapshot],
  );
  const draft = storedDraft ?? generatedDraft;

  // Persist the generated first draft as well as subsequent manual changes so
  // returning to the builder restores the same version on the account.
  useEffect(() => {
    if (user && !storedDraft && generatedDraft) setCvDraft(generatedDraft);
  }, [generatedDraft, setCvDraft, storedDraft, user]);

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-[760px] flex-1 px-5 py-16 sm:px-6">
          <p className="eyebrow text-pink-600">CV Builder</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.02em] text-ink">
            Sign in to build and save your CV
          </h1>
          <p className="mt-3 max-w-[58ch] text-sm leading-relaxed text-ink-soft">
            Your draft is built from your saved Journey and kept with your account. Sign in to
            generate, edit and download it.
          </p>
          <GradientButton className="mt-6" onClick={() => openSheet('signIn', '/plan/cv')}>
            Sign in to continue
          </GradientButton>
        </main>
      </div>
    );
  }

  if (!snapshot || !selectedRole || !draft) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-[760px] flex-1 px-5 py-16 sm:px-6">
          <p className="eyebrow text-pink-600">CV Builder</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink">
            Your CV will be ready after two steps
          </h1>
          <p className="mt-3 max-w-[58ch] text-sm leading-relaxed text-ink-soft">
            Complete your Skill Snapshot and choose a target role first. We’ll then create a CV
            from only the information saved in your journey.
          </p>
          <a
            href="/diagnostic/background"
            className="mt-6 inline-flex rounded-full bg-pink-600 px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-pink-500"
          >
            Continue your journey
          </a>
        </main>
      </div>
    );
  }

  const suggestedSkills = sourceSkills(snapshot).filter((skill) => !draft.skills.includes(skill));

  function updateDraft(change) {
    setCvDraft(change(draft));
    setDownloadErrors([]);
  }

  function updatePersonal(key, value) {
    updateDraft((current) => ({ ...current, personal: { ...current.personal, [key]: value } }));
  }

  function updateExperience(index, description) {
    updateDraft((current) => ({
      ...current,
      experiences: current.experiences.map((experience, experienceIndex) =>
        experienceIndex === index ? { ...experience, description } : experience,
      ),
    }));
  }

  function requestSuggestion(field, source, variant = 0) {
    const text = suggestionFor(source, variant);
    if (text) setSuggestion({ field, source, variant, text });
  }

  function acceptSuggestion() {
    if (!suggestion) return;
    if (suggestion.field === 'summary') {
      updateDraft((current) => ({ ...current, summary: suggestion.text }));
    } else {
      updateExperience(Number(suggestion.field.replace('experience-', '')), suggestion.text);
    }
    setSuggestion(null);
  }

  function validateForDownload() {
    const missing = PERSONAL_FIELDS.filter((field) => field.required && !draft.personal[field.key].trim()).map(
      (field) => field.label,
    );
    setDownloadErrors(missing);
    if (missing.length === 0) window.print();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-[1080px] flex-1 px-5 py-8 sm:px-6 sm:py-10">
        <div className="cv-builder-controls">
          <BackLink to="/journey">Back to your journey</BackLink>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="eyebrow text-pink-600">Refreshed CV</p>
              <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.02em] text-ink sm:text-4xl">
                A CV built from your journey
              </h1>
              <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-ink-soft">
                Your first draft is tailored to {selectedRole.role}. Edit it freely; changes save
                to your account automatically.
              </p>
            </div>
            <GradientButton variant="accent" size="md" onClick={validateForDownload}>
              Download PDF
            </GradientButton>
          </div>
          {downloadErrors.length > 0 && (
            <p role="alert" className="mt-4 rounded-xl border border-pink-600/25 bg-pink-100/60 px-4 py-3 text-sm text-ink">
              Add your {downloadErrors.join(', ')} before downloading your CV.
            </p>
          )}
        </div>

        <article className="cv-sheet card-with-illustration mt-8 bg-white p-7 shadow-card sm:p-10">
          <CardIllustration src={cvStationery} />
          <div className="border-b-2 border-ink pb-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="cv-heading">Personal details</p>
                <p className="mt-1 text-xs text-ink-soft">Entered by you only — never used for AI wording help.</p>
              </div>
              <p className="cv-builder-meta text-xs font-medium text-verify">Saved to your account</p>
            </div>
            <div className="mt-5 grid gap-x-5 gap-y-4 sm:grid-cols-2">
              {PERSONAL_FIELDS.map((field) => (
                <Field key={field.key} field={field} value={draft.personal[field.key]} onChange={updatePersonal} />
              ))}
            </div>
          </div>

          <section className="mt-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="cv-heading">Professional summary</h2>
              <button type="button" onClick={() => requestSuggestion('summary', draft.summary)} className="cv-ai-button">
                Improve with AI
              </button>
            </div>
            <textarea value={draft.summary} onChange={(event) => updateDraft((current) => ({ ...current, summary: event.target.value }))} className="cv-textarea mt-3" aria-label="Professional summary" rows={4} />
            {suggestion?.field === 'summary' && <AiSuggestion suggestion={suggestion} onAccept={acceptSuggestion} onDismiss={() => setSuggestion(null)} onTryAnother={() => requestSuggestion('summary', suggestion.source, suggestion.variant + 1)} />}
          </section>

          <section className="mt-7">
            <h2 className="cv-heading">Core skills</h2>
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">These are supported by your Journey. Remove any that are not useful for this application.</p>
            {draft.skills.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {draft.skills.map((skill) => (
                  <li key={skill}><button type="button" onClick={() => updateDraft((current) => ({ ...current, skills: current.skills.filter((item) => item !== skill) }))} className="cv-skill-chip" aria-label={`Remove ${skill}`}>{skill} <span aria-hidden="true">×</span></button></li>
                ))}
              </ul>
            ) : <p className="mt-3 text-sm text-ink-soft">No skills selected for this version yet.</p>}
            {suggestedSkills.length > 0 && (
              <div className="mt-4 rounded-xl border border-verify/25 bg-verify-soft/70 p-4">
                <p className="text-sm font-semibold text-verify">Suggested from your Journey</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">Add only the supported strengths that fit this application.</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {suggestedSkills.map((skill) => (
                    <li key={skill}><button type="button" onClick={() => updateDraft((current) => ({ ...current, skills: [...current.skills, skill] }))} className="cv-suggested-skill">Add {skill}</button></li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="mt-7">
            <h2 className="cv-heading">Work experience</h2>
            {draft.experiences.length > 0 ? (
              <div className="mt-4 space-y-6">
                {draft.experiences.map((experience, index) => (
                  <article key={`${experience.title}-${experience.organisation}-${index}`}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-ink">{[experience.title, experience.organisation].filter(Boolean).join(' · ')}</h3>
                        {(experience.start || experience.end) && <p className="mt-1 text-xs text-ink-soft">{[experience.start, experience.end].filter(Boolean).join(' — ')}</p>}
                      </div>
                      <button type="button" onClick={() => requestSuggestion(`experience-${index}`, experience.description)} className="cv-ai-button">Improve with AI</button>
                    </div>
                    <textarea value={experience.description} onChange={(event) => updateExperience(index, event.target.value)} className="cv-textarea mt-3" aria-label={`Work experience description for ${experience.title || 'experience'}`} rows={3} />
                    {suggestion?.field === `experience-${index}` && <AiSuggestion suggestion={suggestion} onAccept={acceptSuggestion} onDismiss={() => setSuggestion(null)} onTryAnother={() => requestSuggestion(suggestion.field, suggestion.source, suggestion.variant + 1)} />}
                  </article>
                ))}
              </div>
            ) : <p className="mt-3 text-sm text-ink-soft">No work experience details are available in your Journey, so none have been added.</p>}
          </section>

          <section className="mt-7 border-t border-line pt-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="cv-heading">Career break</h2>
                <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-ink-soft">You choose whether to mention this. If included, it is shown only as a career break and supported transferable strengths — never as employment.</p>
              </div>
              <label className="cv-toggle"><input type="checkbox" checked={draft.includeCareerBreak} onChange={(event) => updateDraft((current) => ({ ...current, includeCareerBreak: event.target.checked }))} /><span>Include</span></label>
            </div>
            {draft.includeCareerBreak && (
              <div className="mt-4 rounded-xl border border-verify/25 bg-verify-soft/70 p-4">
                <p className="font-semibold text-ink">Career break</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">Transferable strengths identified in your Journey: {(snapshot.reframed_skills ?? []).map((skill) => skill.skill).join(' · ') || 'No transferable strengths were identified yet.'}</p>
              </div>
            )}
          </section>
        </article>
      </main>
    </div>
  );
}
