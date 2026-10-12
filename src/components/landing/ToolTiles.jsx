import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import useReveal from '../../hooks/useReveal.js';
import figmaLogo from '../../assets/logos/figma.png';
import youtubeLogo from '../../assets/logos/youtube.png';
import nngroupLogo from '../../assets/logos/nngroup.png';

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
    <div className="flex h-full flex-col justify-center gap-3 px-8 max-md:px-5">
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
      <Panel className="ml-10 py-3 max-md:ml-6">
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

/* Two employers from the sample data, with the logo tile colours the Employer
   fit page uses and the support each one reports. Counted against four
   priorities: flexible work, childcare, parental support, returning to work. */
const EMPLOYERS = [
  {
    name: 'PETRONAS',
    place: 'Kuala Lumpur',
    logo: { bg: '#00a19c', fg: '#ffffff' },
    met: 3,
    shows: ['Flexible Work', 'Returner programme'],
  },
  {
    name: 'Maybank',
    place: 'Kuala Lumpur',
    logo: { bg: '#ffcc00', fg: '#1f2a44' },
    met: 2,
    shows: ['Flexible Work', 'Childcare'],
  },
];

function EmployerPreview() {
  return (
    <div className="flex h-full flex-col justify-center gap-2.5 px-7">
      {EMPLOYERS.map((employer) => (
        <Panel key={employer.name} className="py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                style={{ backgroundColor: employer.logo.bg, color: employer.logo.fg }}
                className="flex h-10 w-14 shrink-0 items-center justify-center rounded-xl px-1 text-[0.5625rem] font-bold tracking-[0.02em] shadow-[inset_0_0_0_1px_rgb(44_33_66/0.06)]"
              >
                {employer.name}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{employer.name}</p>
                <p className="text-xs text-ink-faint">{employer.place}</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-ink tabular">{employer.met} of 4</span>
          </div>
          <div className="mt-2.5 flex gap-3 text-xs text-ink-soft">
            {employer.shows.map((item) => (
              <span key={item} className="flex items-center gap-1">
                <Tick /> {item}
              </span>
            ))}
          </div>
        </Panel>
      ))}
    </div>
  );
}

/* The first three courses from the sample learning plan, with their providers'
   logos as the Learning page shows them. */
const COURSES = [
  { title: 'AI features in Figma', meta: 'Figma Learn · Article', logo: figmaLogo },
  { title: 'Midjourney for product design', meta: 'YouTube · Video', logo: youtubeLogo },
  { title: 'AI in UX practice', meta: 'Nielsen Norman Group · Article', logo: nngroupLogo },
];

function LearningPreview() {
  return (
    <div className="flex h-full flex-col justify-center px-7">
      <Panel className="py-2">
        <ul className="divide-y divide-line">
          {COURSES.map((course, index) => (
            <li key={course.title} className="flex items-center gap-3 py-2.5">
              <span className="relative shrink-0">
                <img
                  src={course.logo}
                  alt=""
                  width="32"
                  height="32"
                  loading="lazy"
                  decoding="async"
                  className="size-8 rounded-lg object-contain shadow-[0_0_0_1px_rgb(44_33_66/0.06)]"
                />
                {/* The first course is marked done. */}
                {index === 0 && (
                  <span className="absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full bg-verify text-[0.5rem] text-white ring-2 ring-surface">
                    ✓
                  </span>
                )}
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

/* The CV builder's two update tools: suggested rewording for a line, and
   skills from the user's profile that are not on the CV yet. */
const CV_SKILLS = ['Time Management', 'Coordination', 'Design Systems'];

function CvPreview() {
  return (
    <div className="flex h-full items-center justify-center gap-3 px-7">
      <Panel className="w-[58%] max-md:w-full">
        <p className="text-xs text-ink-faint">Experience · Senior UX Designer</p>
        <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink-soft">
          Designed screens for the mobile banking app.
        </p>
        <div className="mt-2.5 rounded-xl bg-pink-100 p-2.5 shadow-[inset_0_0_0_1px_rgb(190_63_108/0.15)]">
          <p className="text-[0.6875rem] font-semibold text-pink-600">Suggested wording</p>
          <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink">
            Led the design of mobile banking screens, from user research to developer handoff.
          </p>
          <div className="mt-2 flex gap-1.5">
            <span className="rounded-full bg-ink px-2.5 py-1 text-[0.6875rem] font-semibold text-white">
              Use this
            </span>
            <span className="rounded-full px-2 py-1 text-[0.6875rem] font-medium text-ink-soft">
              Try another
            </span>
          </div>
        </div>
      </Panel>
      {/* Hidden on phones so the experience panel fits the preview's fixed height. */}
      <Panel className="w-[38%] self-center max-md:hidden">
        <p className="text-xs font-semibold text-ink">Add skills from your profile</p>
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {CV_SKILLS.map((skill) => (
            <li
              key={skill}
              className="rounded-full bg-canvas-sunk px-2.5 py-1 text-[0.6875rem] font-medium text-ink"
            >
              <span className="text-pink-600">+</span> {skill}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

const TOOLS = [
  {
    id: 'interview',
    tone: 'pink',
    span: 'lg:col-span-7',
    tool: 'Interview practice',
    title: 'Rehearse out loud, without the pressure',
    body: 'Answer each question by voice, get feedback on what worked, and try again until it feels right.',
    Preview: InterviewPreview,
  },
  {
    id: 'employers',
    tone: 'indigo',
    span: 'lg:col-span-5',
    tool: 'Employer fit',
    title: 'Employers who fit your life',
    body: 'Malaysian listed companies, checked for what you need against the reports they publish.',
    Preview: EmployerPreview,
  },
  {
    id: 'learning',
    tone: 'amber',
    span: 'lg:col-span-5',
    tool: 'Learning plan',
    title: 'Learning that fits around life',
    body: 'Courses for each focus area, with the time, cost and format shown up front.',
    Preview: LearningPreview,
  },
  {
    id: 'cv',
    tone: 'violet',
    span: 'lg:col-span-7',
    tool: 'CV builder',
    title: 'Bring your CV up to date',
    body: 'Add the skills we named for you, and let AI suggest stronger wording, line by line. Nothing changes until you accept it.',
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
          data-tone={tool.tone}
          className="land-well m-2 mb-0 h-72 overflow-hidden rounded-[calc(2rem-0.875rem)]"
        >
          <motion.div className="h-full" style={reduce ? undefined : { y: previewY }}>
            <div className="land-lift h-full">
              <tool.Preview />
            </div>
          </motion.div>
        </div>

        <div className="px-7 pt-6 pb-8 max-md:px-5 max-md:pt-5 max-md:pb-6">
          <p
            data-tone={tool.tone}
            className="land-tag flex items-center gap-2 text-sm font-semibold"
          >
            <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
            {tool.tool}
          </p>
          <h3 className="mt-1.5 font-display text-2xl font-bold tracking-[-0.02em] text-ink max-md:text-xl">
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
    /* Below lg a single column; minmax(0, 1fr) keeps wide previews from
       stretching the grid past the screen. */
    <div className="grid gap-5 [perspective:1800px] lg:grid-cols-12 max-lg:grid-cols-1">
      {TOOLS.map((tool, index) => (
        <Tile key={tool.id} tool={tool} index={index} />
      ))}
    </div>
  );
}
