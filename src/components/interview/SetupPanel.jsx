import { useId, useState } from 'react';
import { PRACTICE_FOCUS } from '../../api/interview.js';
import PillButton from './PillButton.jsx';

/**
 * Selects the target role and practice focus used to generate questions.
 *
 * Changes are held in local state until confirmed, so closing the panel
 * discards them. `upcoming` is the number of unanswered questions a confirmed
 * change would replace; zero means a new set starts.
 */
export default function SetupPanel({
  roles,
  setup,
  midSet,
  upcoming,
  pending,
  error,
  onConfirm,
  onCancel,
}) {
  const [roleId, setRoleId] = useState(setup.role.role_id);
  const [focus, setFocus] = useState(setup.focus);
  const roleFieldId = useId();

  const role = roles.find((candidate) => candidate.role_id === roleId) ?? setup.role;
  const unchanged = roleId === setup.role.role_id && focus === setup.focus;

  let action = 'Start practice';
  if (midSet) {
    action =
      upcoming > 0
        ? `Use for the next ${upcoming === 1 ? 'question' : `${upcoming} questions`}`
        : 'Start a new set';
  }

  return (
    <section className="iv-bezel" aria-labelledby="interview-setup-title">
      <div className="iv-bezel-core">
        <h2 id="interview-setup-title" className="font-display text-xl font-bold text-ink">
          {!midSet
            ? 'Set up your practice'
            : upcoming > 0
              ? 'Change your setup'
              : 'Set up your next set'}
        </h2>
        <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-ink-soft">
          {!midSet
            ? 'Five questions, answered out loud. You get feedback after each one and can try any question again.'
            : upcoming > 0
              ? 'Questions you have answered keep their transcript and feedback. Only the questions still ahead change.'
              : 'Five new questions you have not had before. Feedback from earlier sets still counts towards your areas to improve.'}
        </p>

        <div className="mt-8 grid gap-8">
          <div>
            <label htmlFor={roleFieldId} className="text-sm font-semibold text-ink">
              Target role
            </label>
            <select
              id={roleFieldId}
              value={roleId}
              onChange={(event) => setRoleId(event.target.value)}
              className="interview-select mt-2"
            >
              {roles.map((candidate) => (
                <option key={candidate.role_id} value={candidate.role_id}>
                  {candidate.role}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">
              {roles.length > 1
                ? `The ${roles.length} roles matched in your journey.`
                : 'The role matched in your journey.'}
            </p>
          </div>

          <fieldset>
            <legend className="text-sm font-semibold text-ink">Practice focus</legend>
            <div className="mt-2 grid gap-2 md:grid-cols-3">
              {PRACTICE_FOCUS.map((option) => (
                <label key={option.id} className="interview-focus-option">
                  <input
                    type="radio"
                    name="practice-focus"
                    value={option.id}
                    checked={focus === option.id}
                    onChange={() => setFocus(option.id)}
                    className="sr-only"
                  />
                  <span className="font-semibold text-ink">{option.label}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-ink-soft">
                    {option.blurb}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {error && (
          <p role="alert" className="mt-5 text-sm text-pink-600">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <PillButton
            tone="accent"
            icon="right"
            disabled={pending || (midSet && upcoming > 0 && unchanged)}
            onClick={() => onConfirm({ role, focus })}
          >
            {pending ? 'Preparing questions' : action}
          </PillButton>
          {midSet && (
            <PillButton disabled={pending} onClick={onCancel}>
              {upcoming > 0 ? 'Keep current setup' : 'Cancel'}
            </PillButton>
          )}
        </div>
      </div>
    </section>
  );
}
