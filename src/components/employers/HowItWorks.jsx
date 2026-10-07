const STEPS = [
  'You pick the workplace priorities that matter to you',
  'We read the ESG and sustainability reports Malaysian listed companies publish',
  'You get the employers whose reports actually mention them',
];

/**
 * Three-step explanation of how employer matching works, shown alongside the
 * priority picker.
 *
 * `compact` renders the panel without the illustration.
 */
export default function HowItWorks({ compact = false }) {
  if (compact) {
    return (
      <section className="rounded-2xl border border-line bg-canvas-sunk px-5 py-4">
        <h2 className="text-sm font-semibold text-ink">How it works</h2>

        {/* Three columns, stacked into one on phones. */}
        <ol className="mt-2.5 grid grid-cols-3 gap-3 max-md:grid-cols-1">
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

  return (
    <section className="card-with-illustration rounded-2xl border border-line bg-canvas-sunk px-5 py-4">
      <CardIllustration src={journeyPath} />
      <h2 className="text-sm font-semibold text-ink">How it works</h2>

      {/* Ordered list: the steps are sequential. */}
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
import CardIllustration from '../ui/CardIllustration.jsx';
import journeyPath from '../../assets/page-illustrations/journey-path.png';
