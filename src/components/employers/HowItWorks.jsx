const STEPS = [
  'You pick the workplace priorities that matter to you',
  'We read the ESG and sustainability reports Malaysian listed companies publish',
  'You get the employers whose reports actually mention them',
];

/**
 * Where an employer match comes from, said before she is asked to trust one.
 *
 * It sits with the question rather than the answer: asked mid-diagnostic, "what
 * matters most for your return" has no visible consequence yet, and this is
 * what tells her the answer is read against published documents rather than
 * filed away.
 */
export default function HowItWorks() {
  return (
    <section className="rounded-2xl border border-line bg-canvas-sunk px-5 py-4">
      <h2 className="text-sm font-semibold text-ink">How it works</h2>

      {/* Numbered because it genuinely is a sequence, and laid across rather
          than down because the three steps are one sentence between them. */}
      <ol className="mt-2.5 grid gap-3 sm:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step} className="flex items-start gap-2.5">
            <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-pink-600 text-xs font-semibold tabular text-white">
              {index + 1}
            </span>
            <span className="text-sm leading-snug text-ink-soft">{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
