/**
 * Returns the first non-empty definition field on the skill (ESCO-backed),
 * or undefined. Definitions are never generated client-side.
 */
export function getSkillDefinition(skill) {
  return [skill?.definition, skill?.description, skill?.short_description].find(
    (value) => typeof value === 'string' && value.trim().length > 0
  );
}
