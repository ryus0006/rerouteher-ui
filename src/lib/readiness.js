/**
 * Running readiness after each focus area, in the order they are ranked.
 *
 * Shared by the gap screen and the journey page so both draw the same arc from
 * the same numbers.
 */
export function markersFor(readiness, focusAreas) {
  let running = readiness;

  return focusAreas.map((gap) => {
    running = Math.round((running + gap.uplift) * 100) / 100;
    return { at: running, skill: gap.skill };
  });
}
