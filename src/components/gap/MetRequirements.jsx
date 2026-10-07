import { useId, useState } from 'react';
import { definitionsByName, getSkillDefinition } from '../../lib/skillDefinition.js';
import { useIntakeStore } from '../../store/intakeStore.js';
import SkillDefinitionPopover from '../skills/SkillDefinitionPopover.jsx';

/**
 * Collapsible list of role requirements the user already meets, collapsed to
 * a count by default. The requirements arrive as `{ skill_id, skill }`, so each
 * definition is looked up by name from the user's own skills and opens on hover
 * or focus where known.
 *
 * `onPlane` switches to the colour scheme for the dark readiness panel.
 */
export default function MetRequirements({ skills, total, onPlane = false }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const snapshot = useIntakeStore((state) => state.snapshot);
  const confirmedSkills = useIntakeStore((state) => state.confirmedSkills);
  const definitions = definitionsByName([
    ...(snapshot?.professional_skills ?? []),
    ...(snapshot?.reframed_skills ?? []),
    ...(confirmedSkills ?? []),
  ]);

  if (skills.length === 0) {
    return (
      <p className={`text-sm italic ${onPlane ? 'text-on-plane-soft' : 'text-ink-faint'}`}>
        None of your skills matched this role&rsquo;s requirements yet.
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={panelId}
        className={[
          'flex w-full items-center gap-2 rounded-xl text-left text-sm font-semibold transition',
          'focus-visible:outline-2 focus-visible:outline-offset-2',
          onPlane
            ? 'text-white hover:text-white/80 focus-visible:outline-white'
            : 'text-verify hover:text-ink focus-visible:outline-blue-600',
        ].join(' ')}
      >
        <span aria-hidden="true">✓</span>
        <span className="flex-1">
          {/* `total` is the role's requirement count, read out for screen readers. */}
          See the {skills.length} you already have
          <span className="sr-only"> out of {total} requirements</span>
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`size-3.5 shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        >
          <path d="m6 3 5 5-5 5" />
        </svg>
      </button>

      <ul id={panelId} hidden={!open} className="mt-3 space-y-1.5">
        {skills.map((held) => {
          const name = held.skill;
          // Prefer the definition the gap result carries; fall back to a name
          // match against the user's own skills for older plans without it.
          const definition = getSkillDefinition(held) ?? definitions.get(name.toLowerCase());
          const itemClass = [
            'block w-full rounded-xl border px-3 py-2 text-left text-xs transition-colors',
            onPlane
              ? 'border-white/12 bg-white/8 text-on-plane-soft'
              : 'border-verify/20 bg-verify-soft text-verify',
          ].join(' ');
          return (
            <li key={held.skill_id}>
              <SkillDefinitionPopover definition={definition} label={name} tone="verify">
                {(triggerProps) =>
                  definition ? (
                    <button
                      type="button"
                      {...triggerProps}
                      className={`${itemClass} cursor-default ${
                        onPlane ? 'hover:bg-white/14 hover:text-white' : 'hover:border-verify/40'
                      }`}
                    >
                      {name}
                    </button>
                  ) : (
                    <span className={itemClass}>{name}</span>
                  )
                }
              </SkillDefinitionPopover>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
