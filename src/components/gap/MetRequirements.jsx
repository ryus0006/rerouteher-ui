import { useId, useState } from 'react';

/**
 * The requirements this role asks for that she already covers. Collapsed by
 * default: the count is what moves when she switches role, the names are detail.
 *
 * `onPlane` recolours it for the dark readiness rail — same component, both
 * grounds, so the colours always come from the surface behind it.
 */
export default function MetRequirements({ skills, total, onPlane = false }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

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
          You meet {skills.length} of {total} requirements
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
        {skills.map((skill) => (
          <li
            key={skill}
            className={[
              'rounded-xl border px-3 py-2 text-xs',
              onPlane
                ? 'border-white/12 bg-white/8 text-on-plane-soft'
                : 'border-verify/20 bg-verify-soft text-verify',
            ].join(' ')}
          >
            {skill}
          </li>
        ))}
      </ul>
    </div>
  );
}
