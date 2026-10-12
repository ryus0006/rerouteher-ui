const RADIUS = 84;
const STROKE = 10;
const CENTER = RADIUS + STROKE;

// `pathLength` normalises the arc to 100 units, so dash lengths map directly to
// readiness percentages.
const PATH_LENGTH = 100;

// Gap between adjacent segments, in path units.
const GAP = 0.7;

/* Colour sets per background. Only the segments, track and label change. */
const TONES = {
  plane: {
    track: 'text-white/12',
    steps: ['rgb(255 255 255 / 0.72)', 'rgb(255 255 255 / 0.54)', 'rgb(255 255 255 / 0.38)'],
    value: 'text-white',
    label: 'text-on-plane-soft',
  },
  light: {
    track: 'text-ink/10',
    steps: ['rgb(44 33 66 / 0.26)', 'rgb(44 33 66 / 0.17)', 'rgb(44 33 66 / 0.11)'],
    value: 'text-ink',
    label: 'text-ink-faint',
  },
};

/**
 * Readiness arc gauge.
 *
 * The gradient arc shows current readiness. Each following segment represents
 * one focus area, sized by the readiness it would add. Segments are used
 * instead of point markers because closely spaced markers overlap.
 *
 * Segments are unlabelled; the adjacent focus-area list names them in the same
 * order.
 *
 * @param {{ value: number, label?: string, tone?: 'plane' | 'light', markers?: { at: number, skill: string }[] }} props
 */
export default function ReadinessGauge({
  value,
  label = 'Ready today',
  tone = 'plane',
  markers = [],
}) {
  const palette = TONES[tone];
  const clamped = Math.min(100, Math.max(0, value));
  const arc = `M ${STROKE} ${CENTER} A ${RADIUS} ${RADIUS} 0 0 1 ${CENTER * 2 - STROKE} ${CENTER}`;

  // Each segment spans from the previous cumulative readiness to its own.
  const steps = markers.map((marker, index) => {
    const from = index === 0 ? clamped : markers[index - 1].at;
    return { ...marker, from, width: Math.max(0, Math.min(100, marker.at) - from) };
  });

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-[15rem]">
        <svg
          viewBox={`0 0 ${CENTER * 2} ${CENTER + STROKE}`}
          className="w-full"
          role="img"
          aria-label={`${clamped}% ${label}`}
        >
          {/* Track: the remaining arc. */}
          <path
            d={arc}
            pathLength={PATH_LENGTH}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            strokeLinecap="round"
            className={palette.track}
          />

          {/* One segment per focus area, sized by its uplift. */}
          {steps.map((step, index) =>
            step.width > GAP ? (
              <path
                key={step.skill}
                d={arc}
                pathLength={PATH_LENGTH}
                fill="none"
                stroke={palette.steps[index] ?? palette.steps[palette.steps.length - 1]}
                strokeWidth={STROKE - 2}
                strokeDasharray={`${step.width - GAP} ${PATH_LENGTH}`}
                strokeDashoffset={-(step.from + GAP / 2)}
              />
            ) : null
          )}

          {/* Current readiness. Drawn last so its round cap renders above the segments. */}
          <path
            d={arc}
            pathLength={PATH_LENGTH}
            fill="none"
            stroke="url(#readiness-gradient)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${clamped} ${PATH_LENGTH}`}
            className="transition-[stroke-dasharray] duration-700 ease-spring"
          />

          <defs>
            <linearGradient id="readiness-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f2a0be" />
              <stop offset="52%" stopColor="#c3b1e4" />
              <stop offset="100%" stopColor="#93a0dd" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute inset-x-0 bottom-1 flex flex-col items-center">
          <p
            aria-hidden="true"
            className={`font-display text-[3.25rem] font-bold leading-none tracking-[-0.03em] tabular ${palette.value}`}
          >
            {clamped}
            <span className="align-top text-[1.75rem]">%</span>
          </p>
          <p aria-hidden="true" className={`eyebrow mt-1 ${palette.label}`}>
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}
