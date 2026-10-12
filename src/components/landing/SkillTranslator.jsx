import { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react';
import Reveal from './Reveal.jsx';
import ScrubWords from './ScrubWords.jsx';

/* Break activities from the activity taxonomy, paired with the O*NET skill
   the mock snapshot reads each one as. */
const PAIRS = [
  { did: 'Raising children', reads: 'Active Listening' },
  { did: 'Juggling family schedules', reads: 'Time Management' },
  { did: 'Organising day-to-day logistics', reads: 'Coordination' },
  { did: 'Running the household budget', reads: 'Management of Financial Resources' },
];

/* How long each pair stays up. The swap itself takes about 900ms of this. */
const CYCLE_MS = 2000;

const EASE = [0.32, 0.72, 0, 1];

const TITLE_LEAD = 'A career break looks like a gap on a CV.';
const TITLE_TURN = 'Here’s what it really shows.';

/**
 * Text that rolls when `id` changes: the old value slides up and out while
 * the new one rises in, both stacked in the same grid cell so there is no
 * blank frame between them. `className` must set a grid display. `delay`
 * staggers the arrival.
 */
function Roll({ id, delay = 0, className = '', children }) {
  const reduce = useReducedMotion();
  const hidden = reduce ? { opacity: 0 } : { opacity: 0, y: '70%', filter: 'blur(8px)' };

  return (
    <span className={`overflow-hidden ${className}`}>
      <AnimatePresence initial={false}>
        <motion.span
          key={id}
          className="block [grid-area:1/1]"
          initial={hidden}
          animate={{ opacity: 1, y: '0%', filter: 'blur(0px)' }}
          exit={{
            ...(reduce ? { opacity: 0 } : { opacity: 0, y: '-55%', filter: 'blur(6px)' }),
            transition: { duration: 0.45, ease: EASE },
          }}
          transition={{ duration: 0.8, ease: EASE, delay }}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** The two large columns showing one pair. */
function PairDisplay({ index }) {
  const pair = PAIRS[index];

  return (
    <>
      <ul className="sr-only">
        {PAIRS.map((item) => (
          <li key={item.did}>
            {item.did} is recognised as {item.reads}.
          </li>
        ))}
      </ul>

      <div
        aria-hidden="true"
        className="grid items-start gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.15fr)]"
      >
        <div>
          <p className="text-[0.9375rem] font-medium text-ink-faint">What you did</p>
          <Roll
            id={`did-${index}`}
            className="mt-3 grid min-h-[2.2em] font-display text-[3.25rem] font-bold leading-[1.05] tracking-[-0.035em] text-ink"
          >
            {pair.did}
          </Roll>
        </div>

        <span
          key={`arrow-${index}`}
          className="swap-arrow mt-[2.35rem] hidden font-display text-5xl leading-none text-ink-faint lg:block"
        >
          →
        </span>

        <div>
          <p className="text-[0.9375rem] font-medium text-ink-faint">What we recognise</p>
          <Roll
            id={`reads-${index}`}
            delay={0.14}
            className="mt-3 grid min-h-[2.2em] font-display text-[3.25rem] font-bold leading-[1.05] tracking-[-0.035em] text-pink-600"
          >
            {pair.reads}
          </Roll>
        </div>
      </div>
    </>
  );
}

/**
 * One segment of the progress rail. Only the current pair's segment is
 * coloured: a pink track, with `fill` (a MotionValue) running across it as
 * the countdown.
 */
function RailSegment({ at, fill, active, onSelect }) {
  const pair = PAIRS[at];

  return (
    <button
      type="button"
      aria-label={`Show example: ${pair.did}, recognised as ${pair.reads}`}
      aria-pressed={active}
      onClick={onSelect}
      className="group flex h-6 flex-1 items-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <span
        className={`relative block h-[3px] w-full overflow-hidden rounded-full transition-colors duration-300 ${
          active ? 'bg-pink-600/25' : 'bg-ink/10 group-hover:bg-ink/20'
        }`}
      >
        {active && (
          <motion.span
            className="absolute inset-0 origin-left rounded-full bg-pink-600"
            style={{ scaleX: fill }}
          />
        )}
      </span>
    </button>
  );
}

/**
 * Animated version: a tinted panel that scrolls like any other
 * section while the pairs advance on a timer, so scroll speed never decides
 * which pairs are seen. The current pair's rail segment fills as its
 * countdown. The timer runs only while the panel is mostly in view, and holds
 * while keyboard focus is on the rail. Selecting a segment jumps to that pair
 * and restarts its countdown.
 */
function AnimatedTranslator() {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);
  /* Bumped on selection so the countdown restarts even on the same pair. */
  const [restart, setRestart] = useState(0);

  const inView = useInView(stageRef, { amount: 0.6 });
  const countdown = useMotionValue(0);
  const running = inView && !held;

  useEffect(() => {
    if (!running) return undefined;
    const controls = animate(countdown, 1, {
      duration: (CYCLE_MS / 1000) * (1 - countdown.get()),
      ease: 'linear',
      onComplete: () => {
        countdown.jump(0);
        setIndex((at) => (at + 1) % PAIRS.length);
      },
    });
    return () => controls.stop();
  }, [running, index, restart, countdown]);

  const { scrollYProgress: arrival } = useScroll({
    target: sectionRef,
    offset: ['start 0.85', 'start 0.1'],
  });

  /* The panel grows from its top edge as it arrives, finishing as that edge
     reaches the top of the viewport. Anchoring at the top keeps that edge
     moving at scroll speed, so the panel never outruns the page. */
  const { scrollYProgress: approach } = useScroll({
    target: sectionRef,
    offset: ['start end', 'start start'],
  });
  const stageScale = useTransform(approach, [0, 1], [0.94, 1]);

  function select(at) {
    countdown.jump(0);
    setIndex(at);
    setRestart((count) => count + 1);
  }

  return (
    <section ref={sectionRef} id="how-it-works" aria-labelledby="translate-title" className="p-5">
      <motion.div
        ref={stageRef}
        className="land-translate mx-auto max-w-[1440px] origin-top overflow-hidden rounded-[2.5rem]"
        style={{ scale: stageScale }}
      >
        <div className="mx-auto w-full max-w-[1200px] px-8 py-16">
          <div className="flex items-start justify-between gap-8">
            <h2
              id="translate-title"
              tabIndex={-1}
              className="max-w-[34ch] font-display text-[2rem] font-bold leading-[1.15] tracking-[-0.025em] text-ink"
            >
              <ScrubWords text={TITLE_LEAD} progress={arrival} range={[0, 0.55]} />{' '}
              <ScrubWords
                text={TITLE_TURN}
                progress={arrival}
                range={[0.45, 1]}
                className="block text-pink-600"
              />
            </h2>
            <p
              aria-hidden="true"
              className="font-display text-sm font-semibold text-ink-faint tabular"
            >
              <Roll id={index} className="inline-grid align-bottom text-ink">
                {String(index + 1).padStart(2, '0')}
              </Roll>
              {' / '}
              {String(PAIRS.length).padStart(2, '0')}
            </p>
          </div>

          <div className="mt-14">
            <PairDisplay index={index} />
          </div>

          {/* Tabbing into the rail holds the current pair. Hover and mouse
              clicks do not: the rail scrolls under a resting pointer, and a
              click already restarts the countdown on the chosen pair. */}
          <div
            className="mt-12 flex gap-6"
            onFocus={(event) => {
              if (event.target.matches(':focus-visible')) setHeld(true);
            }}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setHeld(false);
            }}
          >
            {PAIRS.map((item, at) => (
              <RailSegment
                key={item.did}
                at={at}
                fill={countdown}
                active={at === index}
                onSelect={() => select(at)}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/**
 * Reduced-motion version: a still section that does not cycle. Every pair
 * stays reachable through the selector.
 */
function StaticTranslator() {
  const [index, setIndex] = useState(0);

  return (
    <section id="how-it-works" aria-labelledby="translate-title" className="py-32">
      <div className="mx-auto w-full max-w-[1200px] px-8">
        <Reveal>
          <h2
            id="translate-title"
            tabIndex={-1}
            className="max-w-[26ch] text-xl leading-relaxed text-ink-soft"
          >
            {TITLE_LEAD} <span className="font-semibold text-ink">{TITLE_TURN}</span>
          </h2>
        </Reveal>
        <Reveal className="mt-12" delay={120}>
          <PairDisplay index={index} />
          <div className="mt-10 flex items-center gap-2">
            {PAIRS.map((item, at) => (
              <button
                key={item.did}
                type="button"
                aria-label={`Show example: ${item.did}`}
                aria-pressed={at === index}
                onClick={() => setIndex(at)}
                className={`h-1.5 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                  at === index ? 'w-10 bg-pink-600' : 'w-4 bg-ink/15 hover:bg-ink/30'
                }`}
              />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/**
 * Two-column statement showing break activities and the skills they are read
 * as. Animated and timer-driven by default; a still section under reduced
 * motion.
 */
export default function SkillTranslator() {
  const reduce = useReducedMotion();
  return reduce ? <StaticTranslator /> : <AnimatedTranslator />;
}
