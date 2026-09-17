import { useId, useState } from 'react';
import { computeGap } from '../../api/gap.js';
import { useIntakeStore } from '../../store/intakeStore.js';

/** The concentric target that marks the chosen role wherever it is shown. */
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
 * The target role, and the way to change it without leaving the page.
 *
 * A native select rather than a custom menu: it is one choice from a short
 * known list, and the platform control is the one she can already drive with a
 * keyboard, a screen reader and a thumb.
 *
 * Switching recomputes the gap, because the plan below is built from it. The
 * old role stays on screen until the new numbers land, so the page never blanks
 * while she waits.
 *
 * With nothing to switch between it renders as the readout it replaces.
 */
export default function TargetRoleSelect() {
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

    computeGap(snapshot, role)
      .then((result) => {
        /* Committed in one write: setting the role on its own clears the gap,
           which would empty the plan for as long as the request takes. */
        useIntakeStore.setState({ selectedRole: role, gapResult: result });
        setError(null);
      })
      .catch((cause) => setError(cause.message))
      .finally(() => setSwitching(false));
  }

  return (
    <div className="shrink-0">
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
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
