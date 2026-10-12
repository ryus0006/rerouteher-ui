// @ts-check

/**
 * Selects focus areas from the backend's uplift-ranked gaps.
 *
 * AI-literacy gaps are common and would otherwise crowd out role skills, so at
 * most one slot is reserved for the highest-uplift AI-literacy gap and the rest
 * go to the highest-uplift role gaps. If there are too few role gaps, remaining
 * slots are backfilled from the other gaps. The result is sorted by uplift,
 * highest first.
 *
 * @param {import('../types/api.js').Gap[]} gaps  ranked by uplift (backend order)
 * @param {number} max  how many focus areas to surface
 * @returns {import('../types/api.js').Gap[]}
 */
export function pickFocusAreas(gaps, max) {
  const roleGaps = gaps.filter((g) => g.band !== 'ai_usage');
  const topAi = gaps.find((g) => g.band === 'ai_usage');

  const roleSlots = topAi ? max - 1 : max;
  const chosen = roleGaps.slice(0, roleSlots);
  if (topAi) chosen.push(topAi);

  // Backfill any slots left empty (too few role gaps) from the remaining gaps.
  if (chosen.length < max) {
    for (const gap of gaps) {
      if (chosen.length >= max) break;
      if (!chosen.includes(gap)) chosen.push(gap);
    }
  }

  return chosen.sort((a, b) => b.uplift - a.uplift);
}

/** Focus areas take the landing page's tool tones, in ranking order. */
export const FOCUS_TONES = ['pink', 'indigo', 'amber', 'violet'];

/**
 * Focus areas in a learning plan, in order: the first focus areas from the
 * gap result, then gaps added from Up later, then owned skills added back as
 * refreshers (marked `refresher: true`).
 *
 * @param {{ gaps: import('../types/api.js').Gap[] } | null} gapResult
 * @param {string[] | undefined} added  skill ids added from Up later
 * @param {{ skill_id: string, skill: string }[] | undefined} refreshed
 * @param {number} max  how many focus areas the gap result starts with
 */
export function planFocusAreas(gapResult, added, refreshed, max) {
  if (!gapResult) return [];
  const picked = pickFocusAreas(gapResult.gaps, max);
  const extra = (added ?? [])
    .map((skillId) => gapResult.gaps.find((gap) => gap.skill_id === skillId))
    .filter((gap) => gap && !picked.includes(gap));
  const refreshers = (refreshed ?? []).map((entry) => ({ ...entry, refresher: true }));
  return [...picked, ...extra, ...refreshers];
}
