import { X } from '@phosphor-icons/react';
import { getSkillDefinition } from '../../lib/skillDefinition.js';
import SkillDefinitionPopover from '../skills/SkillDefinitionPopover.jsx';

/**
 * Chips for skills the user added herself (e.g. ones her CV leaves out), each
 * removable. A definition kept from the gap list opens on hover or focus, as on
 * the other skill chips. Rendered as list items inside a skill section's chip
 * list.
 */
export default function AddedSkills({ skills, onRemove }) {
  return skills.map((skill) => (
    <li
      key={skill.skill_id ?? skill.skill_name}
      className="inline-flex items-center gap-1 rounded-full border border-transparent bg-canvas-sunk py-1 pr-1 pl-3 text-sm font-medium text-ink"
    >
      <SkillDefinitionPopover definition={getSkillDefinition(skill)} label={skill.skill_name}>
        {(triggerProps) =>
          triggerProps.ref ? (
            <button type="button" {...triggerProps} className="cursor-default">
              {skill.skill_name}
            </button>
          ) : (
            <span title="Added by you">{skill.skill_name}</span>
          )
        }
      </SkillDefinitionPopover>
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
