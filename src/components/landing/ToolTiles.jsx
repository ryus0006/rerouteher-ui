import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import useReveal from '../../hooks/useReveal.js';

function Tick() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0 text-verify" aria-hidden="true">
      <circle cx="8" cy="8" r="8" fill="currentColor" opacity="0.14" />
      <path
        d="M4.75 8.25 7 10.5l4.25-4.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* Static bar heights for the voice-answer waveform. */
const WAVE = [5, 9, 15, 8, 18, 12, 6, 14, 20, 10, 6, 13, 17, 8, 11, 15, 5, 9, 13, 7, 16, 10];

/** Small surface card used inside the previews. */
function Panel({ className = '', children }) {
  return <div className={`land-chip rounded-2xl bg-surface p-4 ${className}`}>{children}</div>;
}

function InterviewPreview() {
  return (
    <div className="flex h-full flex-col justify-center gap-3 px-8">
      <Panel>
        <p className="text-xs text-ink-faint">Question 2 of 8</p>
        <p className="mt-1.5 font-display text-lg font-semibold leading-snug text-ink">
          “Walk me through your career break and what you did during that time.”
        </p>
        <div aria-hidden="true" className="mt-4 flex h-6 items-center gap-[3px]">
          <span className="mr-2 size-2 rounded-full bg-pink-500" />
          {WAVE.map((height, index) => (
            <span
              key={index}
              className="land-wave w-[3px] rounded-full bg-pink-500/55"
              style={{ height, '--d': `${index * 50}ms` }}
            />
          ))}
          <span className="ml-2 text-xs text-ink-faint tabular">1:12</span>
        </div>
      </Panel>
      <Panel className="ml-10 py-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-verify">
          <Tick />
          Confident about your break
        </p>
        <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-soft">
          You mentioned it plainly and moved on, without apologising.
        </p>
      </Panel>
    </div>
  );
}

const EMPLOYERS = [
  { name: 'Listed bank', place: 'Kuala Lumpur', met: 3 },
  { name: 'Energy group', place: 'Kuala Lumpur', met: 4 },
];

function EmployerPreview() {
  return (
    <div className="flex h-full flex-col justify-center gap-2.5 px-7">
      {EMPLOYERS.map((employer) => (
        <Panel key={employer.name} className="py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-lg bg-canvas-sunk text-xs font-bold text-ink-soft">
                {employer.name[0]}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{employer.name}</p>
                <p className="text-xs text-ink-faint">{employer.place}</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-ink tabular">{employer.met} of 4</span>
          </div>
          <div className="mt-2.5 flex gap-3 text-xs text-ink-soft">
            <span className="flex items-center gap-1">
              <Tick /> Flexible Work
            </span>
            <span className="flex items-center gap-1">
              <Tick /> Childcare
            </span>
          </div>
        </Panel>
      ))}
    </div>
  );
}

const COURSES = [
  { title: 'AI features in Figma', meta: 'Article · 30 min' },
  { title: 'Variables and modes in Figma', meta: 'Article · 60 min' },
  { title: 'Design tokens and theming', meta: 'Video · 2 hr' },
];

function LearningPreview() {
  return (
    <div className="flex h-full flex-col justify-center px-7">
      <Panel className="py-2">
        <ul className="divide-y divide-line">
          {COURSES.map((course, index) => (
            <li key={course.title} className="flex items-center gap-3 py-2.5">
              <span
                className={`flex size-5 shrink-0 items-center justify-center rounded-full border text-[0.625rem] ${
                  index === 0
                    ? 'border-verify bg-verify text-white'
                    : 'border-line-strong text-transparent'
                }`}
              >
                ✓
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">{course.title}</span>
                <span className="block text-xs text-ink-faint">{course.meta}</span>
              </span>
              <span className="rounded-full bg-verify-soft px-2 py-0.5 text-[0.6875rem] font-semibold text-verify">
                Free
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function CvPreview() {
  return (
    <div className="flex h-full items-center justify-center gap-4 px-8">
      <Panel className="w-[45%] self-center opacity-80">
        <p className="text-xs text-ink-faint">Before</p>
        <p className="mt-2 text-sm font-semibold text-ink tabular">2018 – 2025</p>
        <p className="mt-0.5 text-sm text-ink-faint italic">Career break</p>
      </Panel>
      <span aria-hidden="true" className="font-display text-2xl text-ink-faint">
        →
      </span>
      <Panel className="w-[50%]">
        <p className="text-xs text-pink-600">Tailored for Senior UX/UI Designer</p>
        <p className="mt-2 text-sm font-semibold text-ink tabular">2018 – 2025 · Career break</p>
        <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-soft">
          Full-time caregiving. Managed family schedules and the household budget.
        </p>
        <p className="mt-2 text-[0.8125rem] text-ink">Time Management · Coordination</p>
      </Panel>
    </div>
  );
}

const TOOLS = [
  {
    id: 'interview',
    span: 'lg:col-span-7',
    tool: 'Interview practice',
    title: 'Rehearse out loud, without the pressure',
    body: 'Answer each question by voice, get feedback on what worked, and try again until it feels right.',
    Preview: InterviewPreview,
  },
  {
    id: 'employers',
    span: 'lg:col-span-5',
    tool: 'Employer fit',
    title: 'Employers who fit your life',
    body: 'Malaysian listed companies, checked for what you need against the reports they publish.',
    Preview: EmployerPreview,
  },
  {
    id: 'learning',
    span: 'lg:col-span-5',
    tool: 'Learning plan',
    title: 'Learning that fits around life',
    body: 'Courses for each focus area, with the time, cost and format shown up front.',
    Preview: LearningPreview,
  },
  {
    id: 'cv',
    span: 'lg:col-span-7',
    tool: 'CV builder',
    title: 'A CV that tells your break straight',
    body: 'Reworded for the role you want, with your break written as experience. It only uses what you told us.',
    Preview: CvPreview,
  },
];

/**
 * One tool tile. While it travels up the viewport it tilts from lying back
 * to upright, with tiles on the left and right leaning in from opposite
 * sides, and its preview drifts inside the well for depth. All of it follows
 * the scroll position, so scrolling back reverses it.
 */
function Tile({ tool, index }) {
  const ref = useReveal();
  const reduce = useReducedMotion();
  const side = index % 2 === 0 ? -1 : 1;

  const { scrollYProgress: entry } = useScroll({
    target: ref,
    offset: ['start end', 'start 0.55'],
  });
  const { scrollYProgress: pass } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const rotateX = useTransform(entry, [0, 1], [26, 0]);
  const rotateY = useTransform(entry, [0, 1], [side * 8, 0]);
  const y = useTransform(entry, [0, 1], [160, 0]);
  const scale = useTransform(entry, [0, 1], [0.86, 1]);
  const opacity = useTransform(entry, [0, 0.45], [0, 1]);
  const previewY = useTransform(pass, [0, 1], [36, -36]);

  return (
    <motion.article
      ref={ref}
      className={`land-shell origin-bottom ${tool.span}`}
      style={reduce ? undefined : { rotateX, rotateY, y, scale, opacity }}
    >
      <div className="land-core group flex h-full flex-col overflow-hidden">
        <div
          aria-hidden="true"
          className="land-well m-2 mb-0 h-72 overflow-hidden rounded-[calc(2rem-0.875rem)]"
        >
          <motion.div className="h-full" style={reduce ? undefined : { y: previewY }}>
            <tool.Preview />
          </motion.div>
        </div>

        <div className="px-7 pt-6 pb-8">
          <p className="text-sm font-semibold text-pink-600">{tool.tool}</p>
          <h3 className="mt-1.5 font-display text-2xl font-bold tracking-[-0.02em] text-ink">
            {tool.title}
          </h3>
          <p className="mt-2 max-w-[46ch] text-[0.9375rem] leading-relaxed text-ink-soft">
            {tool.body}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

/** Four illustrated tiles, one per tool that builds on the readiness result. */
export default function ToolTiles() {
  return (
    <div className="grid gap-5 [perspective:1800px] lg:grid-cols-12">
      {TOOLS.map((tool, index) => (
        <Tile key={tool.id} tool={tool} index={index} />
      ))}
    </div>
  );
}
