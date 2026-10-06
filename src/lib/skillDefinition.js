/**
 * Returns the first non-empty definition field on the skill (ESCO-backed),
 * or undefined. Definitions are never generated client-side.
 */
export function getSkillDefinition(skill) {
  return [skill?.definition, skill?.description, skill?.short_description].find(
    (value) => typeof value === 'string' && value.trim().length > 0
  );
}

/**
 * Definitions keyed by lower-cased skill name, for lists that carry names only
 * (e.g. a gap result's `skills_have`). Each entry may name its skill as `skill`
 * or `skill_name`; the first definition found for a name is kept.
 */
export function definitionsByName(entries) {
  const byName = new Map();
  for (const entry of entries) {
    const name = (entry?.skill ?? entry?.skill_name)?.toLowerCase();
    const definition = getSkillDefinition(entry);
    if (name && definition && !byName.has(name)) byName.set(name, definition);
  }
  return byName;
}
