import { motion, useReducedMotion, useTransform } from 'motion/react';
import ReadinessGauge from '../gap/ReadinessGauge.jsx';

/* Example data from the mock fixtures. */
const BREAK_SKILLS = ['Active Listening', 'Time Management', 'Coordination'];

const GAUGE_MARKERS = [
  { skill: 'AI Design Tools', at: 87 },
  { skill: 'Scalable Design Systems', at: 94 },
  { skill: 'Prompt Engineering for UX', at: 99 },
];

/** Grey placeholder line standing in for body text on the CV sheet. */
function Line({ width }) {
  return <span className="block h-1.5 rounded-full bg-ink/[0.08]" style={{ width }} />;
}

/**
 * Hero visual: an example CV whose career-break row is annotated with the
 * skills it is read as, and a readiness card resting on top. Built entirely in
 * markup so it stays sharp at any size.
 *
 * `progress` is the hero's 0–1 scroll-out position. The layers drift apart at
 * different depths as it advances: the sheet sinks back, the chips fan out and
 * the readiness card lifts towards the reader.
 */
export default function HeroVisual({ progress }) {
  const reduce = useReducedMotion();

  const sheetY = useTransform(progress, [0, 1], [0, 70]);
  const sheetRotate = useTransform(progress, [0, 1], [0, -3]);
  const sheetScale = useTransform(progress, [0, 1], [1, 0.94]);
  const chipsX = useTransform(progress, [0, 1], [0, 46]);
  const chipsY = useTransform(progress, [0, 1], [0, -60]);
  const cardY = useTransform(progress, [0, 1], [0, -170]);
  const cardRotate = useTransform(progress, [0, 1], [0, 4]);
  const cardScale = useTransform(progress, [0, 1], [1, 1.06]);

  const depth = (style) => (reduce ? undefined : style);

  return (
    <figure className="relative mx-auto h-[33rem] w-full max-w-[34rem]">
      {/* CV sheet */}
      <motion.div
        className="absolute top-4 left-0 w-[23rem] origin-bottom-left"
        style={depth({ y: sheetY, rotate: sheetRotate, scale: sheetScale })}
      >
        <div className="land-step land-shell" style={{ '--d': '150ms' }}>
          <div className="land-core p-7">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-pink-100 text-sm font-bold text-pink-600">
                CV
              </span>
              <div className="flex-1 space-y-2">
                <Line width="55%" />
                <Line width="35%" />
              </div>
            </div>

            <p className="mt-7 text-[0.6875rem] font-semibold text-ink-faint">Experience</p>

            <div className="mt-3 rounded-lg px-3 py-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[0.8125rem] font-semibold text-ink">Senior UX Designer</span>
                <span className="text-[0.6875rem] text-ink-faint tabular">2011 – 2018</span>
              </div>
              <div className="mt-2.5 space-y-1.5">
                <Line width="92%" />
                <Line width="78%" />
              </div>
            </div>

            {/* The break row, highlighted as the subject of the annotations. */}
            <div className="land-break relative mt-2 overflow-hidden rounded-lg px-3 py-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[0.8125rem] font-semibold text-pink-600">Career break</span>
                <span className="text-[0.6875rem] text-pink-600/80 tabular">2018 – 2025</span>
              </div>
              <p className="mt-1.5 text-[0.75rem] text-ink-soft">
                Childcare · Family schedules · Household budget
              </p>
            </div>

            <p className="mt-6 text-[0.6875rem] font-semibold text-ink-faint">Education</p>
            <div className="mt-3 space-y-1.5 px-3">
              <Line width="70%" />
              <Line width="45%" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Annotations pointing at the break row, drawn left to right. */}
      <motion.svg
        aria-hidden="true"
        viewBox="0 0 120 120"
        className="land-draw absolute top-[10.5rem] left-[21rem] h-[7.5rem] w-[7.5rem] overflow-visible text-pink-500/60"
        style={{ '--d': '620ms', ...depth({ y: sheetY }) }}
      >
        <path
          d="M0 66 C 40 66, 50 14, 104 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <path
          d="M0 66 C 40 66, 50 60, 104 60"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <path
          d="M0 66 C 40 66, 50 106, 104 106"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <circle cx="0" cy="66" r="3.5" fill="currentColor" />
      </motion.svg>

      <motion.ul
        className="absolute top-[10.6rem] left-[28rem] space-y-[1.6rem]"
        style={depth({ x: chipsX, y: chipsY })}
      >
        {BREAK_SKILLS.map((skill, index) => (
          <li
            key={skill}
            className="land-step land-chip w-max rounded-full bg-surface px-3.5 py-1.5 text-[0.8125rem] font-semibold text-pink-600"
            style={{ '--d': `${780 + index * 140}ms` }}
          >
            {skill}
          </li>
        ))}
      </motion.ul>

      {/* Readiness card resting over the sheet. */}
      <motion.div
        className="absolute right-0 bottom-0 w-[17.5rem]"
        style={depth({ y: cardY, rotate: cardRotate, scale: cardScale })}
      >
        <div className="land-step land-shell" style={{ '--d': '1250ms' }}>
          <div className="land-core p-5">
            <ReadinessGauge value={78} tone="light" markers={GAUGE_MARKERS} />
            <p className="mt-3 text-center text-sm text-ink-soft">
              Ready for <span className="font-semibold text-ink">Senior UX/UI Designer</span>
            </p>
          </div>
        </div>
      </motion.div>

      <figcaption className="sr-only">
        Example: a CV whose seven-year career break is read as Active Listening, Time Management and
        Coordination, giving 78% readiness for a Senior UX/UI Designer role.
      </figcaption>
    </figure>
  );
}
