import { useId, useState } from 'react';
import { computeGap } from '../../api/gap.js';
import { useIntakeStore } from '../../store/intakeStore.js';

/** Concentric-circle icon marking the selected target role. */
function TargetMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className="size-5 shrink-0 text-pink-600"
    >
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.75" fill="currentColor" />
    </svg>
  );
}

/**
 * Displays the target role with an inline control to change it.
 *
 * Uses a native select for built-in keyboard, screen reader and touch
 * support. Changing the role recomputes the gap; the current role stays
 * displayed until the new result arrives. With only one role available it
 * renders as plain text.
 *
 * `bare` omits the card border for use inside an existing surface.
 */
export default function TargetRoleSelect({ bare = false }) {
  const snapshot = useIntakeStore((state) => state.snapshot);
  const selectedRole = useIntakeStore((state) => state.selectedRole);

  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState(null);
  const labelId = useId();

  const roles = snapshot?.recommended_roles ?? [];
  const switchable = roles.length > 1;

  function switchRole(event) {
    const role = roles.find((candidate) => candidate.role_id === event.target.value);
    if (!role || role.role_id === selectedRole?.role_id) return;

    setSwitching(true);

    computeGap(snapshot, role, useIntakeStore.getState().confirmedSkills)
      .then((result) => {
        /* Single write: `setSelectedRole` alone clears the gap result, which would
           empty the page while the request is in flight. */
        useIntakeStore.setState({ selectedRole: role, gapResult: result });
        setError(null);
      })
      .catch((cause) => setError(cause.message))
      .finally(() => setSwitching(false));
  }

  return (
    <div className="shrink-0">
      <div
        className={
          bare
            ? 'flex items-center gap-3'
            : 'flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3'
        }
      >
        <TargetMark />

        <div className="min-w-0">
          <p id={labelId} className="text-xs text-ink-faint">
            {switching ? 'Working out your new plan…' : 'For your target role'}
          </p>

          {switchable ? (
            <div className="relative">
              <select
                aria-labelledby={labelId}
                value={selectedRole?.role_id ?? ''}
                disabled={switching}
                onChange={switchRole}
                className="w-full appearance-none rounded-md bg-transparent py-0.5 pr-6 font-semibold text-ink transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-55"
              >
                {roles.map((role) => (
                  <option key={role.role_id} value={role.role_id}>
                    {role.role}
                  </option>
                ))}
              </select>

              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="pointer-events-none absolute right-0 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
              >
                <path d="m4 6.5 4 4 4-4" />
              </svg>
            </div>
          ) : (
            <p className="font-semibold text-ink">{selectedRole?.role}</p>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-2 max-w-[18rem] text-sm font-medium text-pink-600">
          {error}
        </p>
      )}
    </div>
  );
}
