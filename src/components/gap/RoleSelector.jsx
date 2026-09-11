/**
 * Target-role chips. Index 0 is her previous occupation and carries the
 * "Closest match" marker, which stays on that role whatever she selects.
 */
export default function RoleSelector({ roles, selected, onSelect, disabled = false }) {
  if (roles.length === 0) return null;

  return (
    <fieldset disabled={disabled}>
      {/* The page heading already asks the question, so this labels the group
          for assistive tech only. */}
      <legend className="sr-only">Select your target role</legend>

      <div className="flex flex-wrap gap-2">
        {roles.map((role, index) => {
          const checked = role.role_id === selected?.role_id;

          return (
            <label
              key={role.role_id}
              className={[
                'cursor-pointer rounded-full border px-4 py-2 text-sm transition duration-200 ease-spring',
                'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-blue-600',
                checked
                  ? 'border-blue-600 bg-blue-600 font-semibold text-white shadow-card'
                  : 'border-line-strong bg-surface text-ink-soft hover:border-blue-600/45 hover:text-ink',
              ].join(' ')}
            >
              <input
                type="radio"
                name="target-role"
                value={role.role_id}
                checked={checked}
                onChange={() => onSelect(role)}
                className="sr-only"
              />
              {role.role}
              {index === 0 && (
                <span
                  className={[
                    'ml-2 rounded-full px-2 py-0.5 text-xs font-medium',
                    checked ? 'bg-white text-blue-600' : 'bg-canvas-sunk text-ink-soft',
                  ].join(' ')}
                >
                  Closest match
                </span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
