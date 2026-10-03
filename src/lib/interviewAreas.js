/**
 * Aggregates feedback across answered questions into recurring themes.
 *
 * Only the latest attempt with feedback is used for each question. Themes are
 * matched case-insensitively on `area` and counted at most once per question.
 * Results are sorted by frequency; ties keep first-seen order.
 *
 * @param {{ id: string }[]} questions every question that may hold attempts
 * @param {Record<string, { feedback: { worked_well: { area: string, detail: string }[], to_improve: { area: string, detail: string }[] } | null }[]>} attempts
 * @returns {{ answered: number, improve: Theme[], strengths: Theme[] }}
 *
 * @typedef {{ area: string, count: number, detail: string }} Theme
 */
export function summariseFeedback(questions, attempts) {
  const latest = questions
    .map((question) => (attempts[question.id] ?? []).filter((a) => a.feedback).at(-1))
    .filter(Boolean)
    .map((attempt) => attempt.feedback);

  return {
    answered: latest.length,
    improve: tally(latest.map((feedback) => feedback.to_improve ?? [])),
    strengths: tally(latest.map((feedback) => feedback.worked_well ?? [])),
  };
}

function tally(perAnswer) {
  const themes = new Map();

  for (const items of perAnswer) {
    const seen = new Set();
    for (const { area, detail } of items) {
      const key = area?.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);

      const theme = themes.get(key);
      // Keep the most recent detail text.
      if (theme) themes.set(key, { ...theme, count: theme.count + 1, detail });
      else themes.set(key, { area: area.trim(), count: 1, detail });
    }
  }

  return [...themes.values()].sort((a, b) => b.count - a.count);
}
