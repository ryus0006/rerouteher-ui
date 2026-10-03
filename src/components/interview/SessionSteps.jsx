const STEPS = [
  ['Answer out loud', 'Record your answer to each question, as you would say it in the room.'],
  ['Read your feedback', 'See what worked and what to strengthen, straight after each answer.'],
  ['Try again or move on', 'Retry any question. Your earlier attempts stay for comparison.'],
  ['Spot the patterns', 'See which themes come up most across all your answers.'],
];

/** Overview of the session steps, shown before a set starts. */
export default function SessionSteps() {
  return (
    <aside className="iv-rail pt-2" aria-labelledby="interview-steps-title">
      <h2 id="interview-steps-title" className="font-display text-base font-bold text-ink">
        How a session works
      </h2>
      <ol className="mt-4 space-y-4">
        {STEPS.map(([title, detail], at) => (
          <li key={title} className="flex gap-3">
            <span className="iv-rail-marker" aria-hidden="true">
              {at + 1}
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">{title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );
}
