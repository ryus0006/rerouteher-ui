import { useId, useState } from 'react';
import { PRACTICE_FOCUS } from '../../api/interview.js';
import PillButton from './PillButton.jsx';

/**
 * Selects the target role and practice focus for a session. Choices are held in
 * local state until confirmed, so closing the panel discards them. Confirming
 * creates (or opens) the server session for that role and focus.
 */
export default function SetupPanel({
  roles,
  setup,
  pending,
  error,
  onConfirm,
  onCancel,
  canCancel,
}) {
  const [roleId, setRoleId] = useState(setup.role.role_id);
  const [focus, setFocus] = useState(setup.focus);
  const roleFieldId = useId();

  return (
    <section className="iv-bezel" aria-labelledby="interview-setup-title">
      <div className="iv-bezel-core">
        <h2 id="interview-setup-title" className="font-display text-xl font-bold text-ink">
          Set up your practice
        </h2>
        <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-ink-soft">
          Five questions, answered out loud. You get feedback after each one and can try any
          question again. Your answers and feedback are saved, so you can come back to this set
          later.
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
            disabled={pending}
            onClick={() => onConfirm({ roleId, focus })}
          >
            {pending ? 'Preparing questions' : 'Start practice'}
          </PillButton>
          {canCancel && (
            <PillButton disabled={pending} onClick={onCancel}>
              Cancel
            </PillButton>
          )}
        </div>
      </div>
    </section>
  );
}
