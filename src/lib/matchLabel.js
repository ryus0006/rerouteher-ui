/**
 * Text label for match strength. A percentage is avoided because the score is
 * only a count of met priorities.
 */
export function matchLabel(met, total) {
  if (met === total) return { text: 'Strong match', tone: 'text-verify' };
  if (met * 2 >= total) return { text: 'Good match', tone: 'text-verify' };
  return { text: 'Partial match', tone: 'text-ink-soft' };
}
