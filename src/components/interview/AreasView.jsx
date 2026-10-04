import InterviewIcon from './InterviewIcon.jsx';
import PillButton from './PillButton.jsx';

const answers = (count) => `${count} ${count === 1 ? 'answer' : 'answers'}`;

/* Above this many answers, the dot row is replaced by a proportional bar. */
const MAX_DOTS = 12;

/**
 * Frequency of a theme: one dot per answer, filled where the theme appeared.
 * `total` is the busiest theme's count, so the most frequent theme fills the row.
 */
function Frequency({ count, total, tone, size = 'sm' }) {
  if (total > MAX_DOTS) {
    return (
      <span className="iv-freq-bar" data-tone={tone} aria-hidden="true">
        <span style={{ '--share': count / total }} />
      </span>
    );
  }
  return (
    <span className="iv-freq" data-tone={tone} data-size={size} aria-hidden="true">
      {Array.from({ length: total }, (_, at) => (
        <span key={at} data-on={at < count || undefined} style={{ '--i': at }} />
      ))}
    </span>
  );
}

/** Highlighted card for the most frequent improvement theme. */
function Focus({ theme, total }) {
  return (
    <div className="iv-bezel iv-reveal" style={{ '--i': 1 }}>
      <div className="iv-bezel-core iv-focus">
        <span className="iv-focus-tag">
          <InterviewIcon name="target" weight="bold" className="size-3.5" />
          Your main focus
        </span>
        <h3 className="iv-focus-title">{theme.title}</h3>
        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Frequency count={theme.response_count} total={total} tone="improve" size="lg" />
          <p className="text-sm text-ink-soft">
            <span className="font-semibold text-ink tabular">
              Came up in {answers(theme.response_count)}
            </span>
            {total <= MAX_DOTS && (
              <span className="block text-xs">Each mark is one answer you gave</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Ranked row for an improvement theme: rank, name, frequency. */
function ThemeRow({ theme, total, rank, order }) {
  return (
    <li className="iv-theme-row iv-reveal" style={{ '--i': order }}>
      <span className="iv-theme-rank tabular" aria-hidden="true">
        {String(rank).padStart(2, '0')}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <h4 className="font-display text-lg font-bold text-ink">{theme.title}</h4>
          <span className="flex items-center gap-3">
            <Frequency count={theme.response_count} total={total} tone="improve" />
            <span className="text-xs font-semibold text-ink-soft tabular">
              {theme.response_count}
            </span>
          </span>
        </div>
      </div>
    </li>
  );
}

/**
 * Server-aggregated interview themes: the most frequent improvement area is
 * highlighted, the rest are ranked below it, and strengths are listed alongside.
 * Each theme carries a title and a response_count; the aggregate has no per-area
 * detail text.
 */
export default function AreasView({ areas, onBack }) {
  const improvements = areas?.improvements ?? [];
  const strengths = areas?.strengths ?? [];
  const [focus, ...rest] = improvements;
  const total = Math.max(
    1,
    ...improvements.map((a) => a.response_count),
    ...strengths.map((a) => a.response_count)
  );

  return (
    <section aria-labelledby="interview-areas-title">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="iv-reveal" style={{ '--i': 0 }}>
          <h2
            id="interview-areas-title"
            className="font-display text-4xl font-bold tracking-[-0.03em] text-ink"
          >
            Areas to improve
          </h2>
          <p className="mt-2 max-w-[60ch] text-base leading-relaxed text-ink-soft">
            Recurring themes from your feedback across your practice, ranked by how often they
            appear. Each question counts once, based on your most recent attempt.
          </p>
        </div>
        <PillButton icon="left" iconSide="start" onClick={onBack}>
          Back to practice
        </PillButton>
      </div>

      <div className="mt-12 grid items-start gap-x-14 gap-y-14 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div>
          {focus ? (
            <Focus theme={focus} total={total} />
          ) : (
            <p className="iv-reveal text-base text-ink-soft" style={{ '--i': 1 }}>
              Nothing to improve came up yet. Keep practising to see patterns.
            </p>
          )}

          {rest.length > 0 && (
            <div className="mt-14">
              <div className="iv-reveal" style={{ '--i': 2 }}>
                <h3 className="font-display text-lg font-bold text-ink">Also worth working on</h3>
                <p className="mt-1 text-sm text-ink-soft">
                  Other themes from your feedback, most common first.
                </p>
              </div>
              <ol className="mt-2">
                {rest.map((theme, at) => (
                  <ThemeRow
                    key={theme.criterion_id ?? theme.title}
                    theme={theme}
                    total={total}
                    rank={at + 2}
                    order={at + 3}
                  />
                ))}
              </ol>
            </div>
          )}
        </div>

        <aside className="iv-strengths iv-reveal" style={{ '--i': 2 }}>
          <h3 className="flex items-center gap-2.5 font-display text-lg font-bold text-ink">
            <span className="iv-list-mark bg-verify" aria-hidden="true">
              <InterviewIcon name="check" weight="bold" className="size-3" />
            </span>
            What you’re doing well
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Strengths your feedback pointed out. Keep doing these in a real interview.
          </p>
          {strengths.length > 0 ? (
            <ul className="mt-6 space-y-6">
              {strengths.map((theme) => (
                <li key={theme.criterion_id ?? theme.title}>
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-ink">{theme.title}</span>
                    <span className="text-xs font-semibold text-verify tabular">
                      {theme.response_count}
                    </span>
                  </div>
                  <span className="mt-2.5 block">
                    <Frequency count={theme.response_count} total={total} tone="good" />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-ink-soft">
              Strengths will appear as you answer more questions.
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}
