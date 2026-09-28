/**
 * Descriptions are optional ESCO-backed data. Keeping this lookup small and
 * shared lets every skill surface respect the same "do not invent" rule.
 */
export function getSkillDefinition(skill) {
  return [skill?.definition, skill?.description, skill?.short_description].find(
    (value) => typeof value === 'string' && value.trim().length > 0
  );
}
