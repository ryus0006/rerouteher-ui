import { Plus, Sparkle, X } from '@phosphor-icons/react';
import { PERSONAL_FIELDS, formatMonth } from '../../lib/cvDraft.js';
import AiSuggestion from './AiSuggestion.jsx';

function ImproveButton({ busy, hidden = false, onClick, label }) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      className={`cv-improve ${hidden ? 'invisible' : ''}`}
      aria-label={label}
    >
      <Sparkle weight="light" className="size-3.5" aria-hidden="true" />
      Improve wording
    </button>
  );
}

function Section({ title, action, children }) {
  return (
    <section className="cv-section">
      <div className="cv-section-head">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/**
 * Inline-editable CV preview. Typography and spacing match the generated PDF.
 */
export default function CvSheet({
  draft,
  careerBreak,
  suggestion,
  onPersonal,
  onSummary,
  onCareerBreak,
  onExperience,
  onRemoveExperience,
  onAddExperience,
  onRemoveSkill,
  onImprove,
  onAccept,
  onDismiss,
}) {
  const [nameField, ...contactFields] = PERSONAL_FIELDS;
  // The wording action sits beside the text it rewrites, the same for every block,
  // and is hidden (keeping its space) while that block's suggestion is open.
  const improve = (field, source, label) => (
    <ImproveButton
      busy={Boolean(suggestion?.loading)}
      hidden={suggestion?.field === field}
      label={label}
      onClick={() => onImprove(field, source)}
    />
  );
  const suggestionFor = (field) =>
    suggestion?.field === field && (
      <AiSuggestion
        state={suggestion}
        onAccept={onAccept}
        onAnother={() => onImprove(field, suggestion.source, true)}
        onDismiss={onDismiss}
      />
    );

  return (
    <article className="cv-paper" aria-label="Your CV">
      <header>
        <input
          id="cv-field-name"
          aria-label={nameField.label}
          autoComplete={nameField.autoComplete}
          placeholder={nameField.placeholder}
          value={draft.personal.name}
          onChange={(event) => onPersonal('name', event.target.value)}
          className="cv-edit cv-name"
        />
        <div className="cv-contact">
          {contactFields.map((field) => (
            <input
              key={field.key}
              id={`cv-field-${field.key}`}
              type={field.type ?? 'text'}
              aria-label={field.label}
              autoComplete={field.autoComplete}
              placeholder={field.placeholder}
              value={draft.personal[field.key]}
              onChange={(event) => onPersonal(field.key, event.target.value)}
              className="cv-edit"
            />
          ))}
        </div>
      </header>

      <Section title="Professional summary">
        <div className="cv-text-row">
          <textarea
            aria-label="Professional summary"
            value={draft.summary}
            onChange={(event) => onSummary(event.target.value)}
            placeholder="A few lines on who you are and the role you are aiming for."
            className="cv-edit cv-prose"
          />
          {improve('summary', draft.summary, 'Improve the wording of your professional summary')}
        </div>
        {suggestionFor('summary')}
      </Section>

      <Section title="Core skills">
        {draft.skills.length > 0 ? (
          <ul className="cv-skills">
            {draft.skills.map((skill) => (
              <li key={skill}>
                {skill}
                <button
                  type="button"
                  onClick={() => onRemoveSkill(skill)}
                  aria-label={`Remove ${skill} from your CV`}
                  className="cv-skill-remove"
                >
                  <X weight="bold" className="size-3" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="cv-empty">No skills on this CV. Add some from your profile on the right.</p>
        )}
      </Section>

      <Section title="Work experience">
        {/* The career break is the most recent entry, so it leads the list. */}
        {careerBreak && (
          <div className="cv-role">
            <div className="cv-role-head items-center">
              <h3 className="cv-role-title cv-break-text min-w-0 flex-1">Career break</h3>
              <div className="cv-role-dates">
                <input
                  aria-label="Career break dates"
                  placeholder="Dates"
                  value={careerBreak.duration ?? ''}
                  onChange={(event) => onCareerBreak({ duration: event.target.value })}
                  className="cv-edit"
                />
              </div>
            </div>
            <div className="cv-text-row">
              <textarea
                aria-label="Career break"
                value={careerBreak.description}
                onChange={(event) => onCareerBreak({ description: event.target.value })}
                placeholder="What you focused on during your career break, one point per line."
                className="cv-edit cv-prose"
              />
              {improve(
                'careerBreak',
                careerBreak.description,
                'Improve the wording of your career break'
              )}
            </div>
            {suggestionFor('careerBreak')}
          </div>
        )}
        {draft.experiences.length === 0 && (
          <p className="cv-empty">
            Your journey has no past roles on record, so none were added. Add one below if you would
            like to.
          </p>
        )}
        {draft.experiences.map((item, at) => (
          <div key={at} className="cv-role">
            <div className="cv-role-head">
              <div className="min-w-0 flex-1">
                <input
                  aria-label={`Job title, role ${at + 1}`}
                  placeholder="Job title"
                  value={item.title}
                  onChange={(event) => onExperience(at, { title: event.target.value })}
                  className="cv-edit cv-role-title"
                />
                <input
                  aria-label={`Employer, role ${at + 1}`}
                  placeholder="Employer"
                  value={item.organisation}
                  onChange={(event) => onExperience(at, { organisation: event.target.value })}
                  className="cv-edit cv-role-org"
                />
              </div>
              <div className="cv-role-side">
                <div className="cv-role-dates">
                  <input
                    aria-label={`Start date, role ${at + 1}`}
                    placeholder="Start"
                    value={formatMonth(item.start)}
                    onChange={(event) => onExperience(at, { start: event.target.value })}
                    className="cv-edit"
                  />
                  <span aria-hidden="true">–</span>
                  <input
                    aria-label={`End date, role ${at + 1}`}
                    placeholder="End"
                    value={formatMonth(item.end)}
                    onChange={(event) => onExperience(at, { end: event.target.value })}
                    className="cv-edit"
                  />
                </div>
                <div className="cv-role-tools">
                  <button type="button" onClick={() => onRemoveExperience(at)} className="cv-quiet">
                    Remove role
                  </button>
                </div>
              </div>
            </div>
            <div className="cv-text-row">
              <textarea
                aria-label={`What you did, role ${at + 1}`}
                value={item.description}
                onChange={(event) => onExperience(at, { description: event.target.value })}
                placeholder="What you were responsible for and what you achieved."
                className="cv-edit cv-prose"
              />
              {improve(
                `experience-${at}`,
                item.description,
                `Improve the wording for ${item.title || `role ${at + 1}`}`
              )}
            </div>
            {suggestionFor(`experience-${at}`)}
          </div>
        ))}
        <button type="button" onClick={onAddExperience} className="cv-quiet cv-add">
          <Plus weight="bold" className="size-3" aria-hidden="true" />
          Add a role
        </button>
      </Section>
    </article>
  );
}
