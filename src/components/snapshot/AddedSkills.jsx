import { X } from '@phosphor-icons/react';

/**
 * Chips for skills the user added herself (e.g. ones her CV leaves out), each
 * removable. Rendered as list items inside a skill section's chip list.
 */
export default function AddedSkills({ skills, onRemove }) {
  return skills.map((skill) => (
    <li
      key={skill.skill_id ?? skill.skill_name}
      title="Added by you"
      className="inline-flex items-center gap-1 rounded-full border border-transparent bg-canvas-sunk py-1 pr-1 pl-3 text-sm font-medium text-ink"
    >
      {skill.skill_name}
      <button
        type="button"
        onClick={() => onRemove(skill)}
        aria-label={`Remove ${skill.skill_name}`}
        className="flex size-5 items-center justify-center rounded-full text-ink-faint transition-colors duration-300 ease-spring hover:bg-ink/8 hover:text-ink"
      >
        <X aria-hidden="true" size={11} weight="bold" />
      </button>
    </li>
  ));
}
