import { motion } from 'motion/react';

const EASE = [0.32, 0.72, 0, 1];

/**
 * Target-role cards. Index 0 is the previous occupation and always carries the
 * "Closest match" marker, regardless of the current selection.
 *
 * `pending` is a role whose result is still loading; it shows as selected with
 * a loading line until the result arrives.
 */
export default function RoleSelector({ roles, selected, pending = null, onSelect, delay = 0 }) {
  if (roles.length === 0) return null;

  const current = pending ?? selected;

  return (
    <fieldset disabled={Boolean(pending)}>
      {/* Visually hidden: the page heading serves as the visible label. */}
      <legend className="sr-only">Select your target role</legend>

      {/* One card per role in a row, stacked on phones. */}
      <div className="grid grid-cols-3 gap-1.5 rounded-[1.5rem] bg-ink/5 p-1.5 max-md:grid-cols-1">
        {roles.map((role, index) => {
          const checked = role.role_id === current?.role_id;
          const loading = role.role_id === pending?.role_id;

          return (
            <motion.label
              key={role.role_id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: delay + index * 0.07, ease: EASE }}
              className={[
                'group relative flex cursor-pointer items-center gap-3 rounded-[calc(1.5rem-0.375rem)] px-4 py-3.5',
                'transition-[background-color,box-shadow] duration-500 ease-spring',
                'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-blue-600',
                checked
                  ? 'bg-surface shadow-card-hover'
                  : 'bg-transparent hover:bg-surface/60',
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

              {/* Radio mark: the inner dot scales in when selected. */}
              <span
                aria-hidden="true"
                className={[
                  'flex size-4.5 shrink-0 items-center justify-center rounded-full border transition-colors duration-300',
                  checked ? 'border-blue-600' : 'border-line-strong group-hover:border-ink/35',
                ].join(' ')}
              >
                <span
                  className={[
                    'size-2.5 rounded-full bg-blue-600 transition-transform duration-300 ease-spring',
                    checked ? 'scale-100' : 'scale-0',
                  ].join(' ')}
                />
              </span>

              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-display text-[1.0625rem] leading-snug font-bold tracking-[-0.01em] text-ink">
                    {role.role}
                  </span>
                  {index === 0 && (
                    <span
                      className={[
                        'rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold transition-colors duration-300',
                        checked ? 'bg-blue-100 text-blue-600' : 'bg-canvas-sunk text-ink-soft',
                      ].join(' ')}
                    >
                      Closest match
                    </span>
                  )}
                </span>
                {loading && (
                  <span role="status" className="mt-0.5 block text-xs text-ink-faint">
                    Working it out…
                  </span>
                )}
              </span>
            </motion.label>
          );
        })}
      </div>
    </fieldset>
  );
}
