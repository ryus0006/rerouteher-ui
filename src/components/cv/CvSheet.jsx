import { Plus, Sparkle, X } from '@phosphor-icons/react';
import { PERSONAL_FIELDS, formatMonth } from '../../lib/cvDraft.js';
import AiSuggestion from './AiSuggestion.jsx';

function ImproveButton({ busy, onClick, label }) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className="cv-improve"
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
  suggestion,
  onPersonal,
  onSummary,
  onExperience,
  onRemoveExperience,
  onAddExperience,
  onRemoveSkill,
  onImprove,
  onAccept,
  onDismiss,
}) {
  const [nameField, ...contactFields] = PERSONAL_FIELDS;
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

      <Section
        title="Professional summary"
        action={
          <ImproveButton
            busy={Boolean(suggestion?.loading)}
            label="Improve the wording of your professional summary"
            onClick={() => onImprove('summary', draft.summary)}
          />
        }
      >
        <textarea
          aria-label="Professional summary"
          value={draft.summary}
          onChange={(event) => onSummary(event.target.value)}
          placeholder="A few lines on who you are and the role you are aiming for."
          className="cv-edit cv-prose"
        />
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
                  <ImproveButton
                    busy={Boolean(suggestion?.loading)}
                    label={`Improve the wording for ${item.title || `role ${at + 1}`}`}
                    onClick={() => onImprove(`experience-${at}`, item.description)}
                  />
                </div>
              </div>
            </div>
            <textarea
              aria-label={`What you did, role ${at + 1}`}
              value={item.description}
              onChange={(event) => onExperience(at, { description: event.target.value })}
              placeholder="What you were responsible for and what you achieved."
              className="cv-edit cv-prose"
            />
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
