/**
 * Cumulative readiness after each ranked focus area, used to draw the gauge
 * segments on the gap and journey pages.
 */
export function markersFor(readiness, focusAreas) {
  let running = readiness;

  return focusAreas.map((gap) => {
    running = Math.round((running + gap.uplift) * 100) / 100;
    return { at: running, skill: gap.skill };
  });
}
