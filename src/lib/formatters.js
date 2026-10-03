/** Break duration in whole years, as shown beside the slider. */
export function formatYears(years) {
  if (years === 0) return 'Less than a year';
  return years === 1 ? '1 year' : `${years} years`;
}

/** Formats a gap's readiness uplift as returned by the backend. */
export function formatUplift(uplift) {
  return `+${uplift}% if learned`;
}

/** Confidence expressed as a whole percentage. */
export function formatConfidence(confidence) {
  return `${Math.round(confidence * 100)}%`;
}
