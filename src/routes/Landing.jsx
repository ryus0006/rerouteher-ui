import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import useSmoothNavigate from '../hooks/useSmoothNavigate.js';
import useResumePoint from '../hooks/useResumePoint.js';
import Header from '../components/layout/Header.jsx';
import SkillTranslator from '../components/landing/SkillTranslator.jsx';
import ToolTiles from '../components/landing/ToolTiles.jsx';
import HeroVisual from '../components/landing/HeroVisual.jsx';
import Reveal from '../components/landing/Reveal.jsx';
import ScrubWords from '../components/landing/ScrubWords.jsx';
import HeraChatDemo from '../components/landing/HeraChatDemo.jsx';
import HeraBot from '../components/companion/HeraBot.jsx';
import { JOURNEY_STAGES } from '../config/journeyStages.js';
import { useAccountStore } from '../store/accountStore.js';
import { useCompanionStore } from '../store/companionStore.js';
import logoWebp from '../assets/logo-full.webp';

let scrollFrame;

function scrollToHowItWorks(event) {
  event.preventDefault();

  const section = document.getElementById('how-it-works');
  if (!section) return;

  const heading = section.querySelector('h2');
  const start = window.scrollY;
  const destination = start + section.getBoundingClientRect().top;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.history.pushState(null, '', '#how-it-works');
  cancelAnimationFrame(scrollFrame);

  if (reduceMotion) {
    window.scrollTo(0, destination);
    heading?.focus({ preventScroll: true });
    return;
  }

  const startedAt = performance.now();
  const duration = 900;

  function move(now) {
    const progress = Math.min((now - startedAt) / duration, 1);
    const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;

    window.scrollTo(0, start + (destination - start) * eased);

    if (progress < 1) {
      scrollFrame = requestAnimationFrame(move);
    } else {
      heading?.focus({ preventScroll: true });
    }
  }

  scrollFrame = requestAnimationFrame(move);
}

/** Primary call to action. The arrow sits in its own circle and nudges on hover. */
function StartButton({ resume, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex items-center gap-3 rounded-full bg-ink py-2 pr-2 pl-6 text-base font-semibold text-white shadow-card transition duration-300 ease-spring hover:bg-plane-2 hover:shadow-card-hover active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      {resume.label}
      <span
        aria-hidden="true"
        className="flex size-9 items-center justify-center rounded-full bg-white/12 transition duration-300 ease-spring group-hover:translate-x-1 group-hover:-translate-y-px group-hover:scale-105 group-hover:bg-white/20"
      >
        →
      </span>
    </button>
  );
}

/** Secondary call to action that opens Hera. Her avatar sits in its own circle. */
function HeraButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex items-center gap-3 rounded-full bg-surface py-2 pr-2 pl-6 text-base font-semibold text-ink shadow-[0_0_0_1px_rgb(44_33_66/0.08),0_12px_28px_-16px_rgb(44_33_66/0.3)] transition duration-300 ease-spring hover:shadow-[0_0_0_1px_rgb(44_33_66/0.12),0_18px_36px_-16px_rgb(44_33_66/0.4)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      Chat with Hera
      <span
        aria-hidden="true"
        className="flex size-9 items-center justify-center rounded-full bg-pink-100 transition duration-300 ease-spring group-hover:translate-x-1 group-hover:-translate-y-px group-hover:scale-105"
      >
        <HeraBot className="size-7" waving />
      </span>
    </button>
  );
}

/** One headline line that rises out of its own clipped box on arrival. */
function MaskLine({ delay, className = '', children }) {
  return (
    <span className="block overflow-hidden pb-[0.1em] -mb-[0.1em]">
      <span className={`land-line block ${className}`} style={{ '--d': `${delay}ms` }}>
        {children}
      </span>
    </span>
  );
}

/**
 * One journey step. Its number lights up and the card settles into place as
 * the rail's fill reaches it; the connector below fills towards the next step.
 */
function Step({ stage, index, count, progress, reduce }) {
  const at = index / count;
  const next = (index + 1) / count;

  const lit = useTransform(progress, [at, at + 0.08], [0, 1]);
  const settle = useTransform(progress, [at - 0.12, at + 0.06], [0.35, 1]);
  const x = useTransform(progress, [at - 0.12, at + 0.06], [40, 0]);
  const fill = useTransform(progress, [at + 0.04, next], [0, 1]);

  return (
    <motion.li className="land-shell relative" style={reduce ? undefined : { opacity: settle, x }}>
      <div className="land-core flex gap-5 p-6">
        <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-pink-100 font-display text-lg font-bold text-pink-600 tabular">
          {index + 1}
          {!reduce && (
            <motion.span
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center rounded-full bg-pink-600 text-white shadow-[0_8px_20px_-6px_rgb(190_63_108/0.6)]"
              style={{ opacity: lit, scale: lit }}
            >
              {index + 1}
            </motion.span>
          )}
        </span>
        <div className="pt-1.5">
          <h3 className="font-display text-xl font-bold tracking-[-0.015em] text-ink">
            {stage.label}
          </h3>
          <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink-soft">{stage.blurb}</p>
        </div>
      </div>

      {/* Connector from this number down to the next one. */}
      {index < count - 1 && (
        <span
          aria-hidden="true"
          className="absolute top-[4.375rem] left-[3.0625rem] h-[calc(100%-3.125rem)] w-0.5 overflow-hidden rounded-full bg-pink-600/12"
        >
          {!reduce && (
            <motion.span
              className="absolute inset-0 origin-top rounded-full bg-pink-600"
              style={{ scaleY: fill }}
            />
          )}
        </span>
      )}
    </motion.li>
  );
}

const CLOSING_TITLE = 'Your next move starts with what you already have.';

export default function Landing() {
  const navigate = useSmoothNavigate();
  const openSheet = useAccountStore((state) => state.openSheet);
  const user = useAccountStore((state) => state.user);
  const resume = useResumePoint();

  const start = () => navigate(resume.to);

  /* Opens Hera in build mode on the first intake step, where she lives. The
     keep-open flag stops the route change from closing her on arrival. */
  const openCompanion = useCompanionStore((state) => state.openCompanion);
  const holdOpenAcrossNav = useCompanionStore((state) => state.holdOpenAcrossNav);
  const chatWithHera = () => {
    holdOpenAcrossNav();
    openCompanion('build');
    navigate('/diagnostic/background');
  };

  const reduce = useReducedMotion();
  const heroRef = useRef(null);
  const stepsRef = useRef(null);
  const closingRef = useRef(null);

  /* Hero scroll-out: the stage recedes while its copy lifts away. */
  const { scrollYProgress: heroOut } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const stageScale = useTransform(heroOut, [0, 1], [1, 0.9]);
  const copyY = useTransform(heroOut, [0, 1], [0, -140]);
  const copyOpacity = useTransform(heroOut, [0, 0.75], [1, 0]);

  /* How it works: steps light in sequence as the list crosses the viewport. */
  const { scrollYProgress: stepsProgress } = useScroll({
    target: stepsRef,
    offset: ['start 0.8', 'end 0.45'],
  });

  /* Closing: the panel opens up to full size and the headline inks in. */
  const { scrollYProgress: closingIn } = useScroll({
    target: closingRef,
    offset: ['start end', 'end end'],
  });
  const closingScale = useTransform(closingIn, [0, 0.55], [0.86, 1]);
  const closingY = useTransform(closingIn, [0, 0.55], [120, 0]);

  const motionStyle = (style) => (reduce ? undefined : style);

  return (
    <div className="flex min-h-svh flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero: headline on the left, an example annotated CV on the right. */}
        <section ref={heroRef} className="px-5 pt-5">
          <motion.div
            className="land-stage land-stage-in relative mx-auto max-w-[1440px] origin-top overflow-hidden rounded-[2.5rem]"
            style={motionStyle({ scale: stageScale })}
          >
            <div className="relative mx-auto grid min-h-[min(46rem,calc(100svh-7rem))] max-w-[1200px] items-center gap-12 px-8 py-20 lg:grid-cols-[minmax(0,1fr)_34rem]">
              <motion.div style={motionStyle({ y: copyY, opacity: copyOpacity })}>
                <h1 className="font-display text-[4rem] font-bold leading-[1] tracking-[-0.045em] text-ink xl:text-[4.75rem]">
                  <MaskLine delay={80}>Return to work</MaskLine>{' '}
                  <MaskLine delay={190}>with a plan,</MaskLine>{' '}
                  <MaskLine delay={300} className="text-pink-600">
                    not a guess.
                  </MaskLine>
                </h1>

                <p
                  className="land-step mt-7 max-w-[44ch] text-lg leading-relaxed text-ink-soft"
                  style={{ '--d': '520ms' }}
                >
                  A career break can feel like starting from zero. It is not. We turn your past work
                  and your time away into a plan.
                </p>

                <div
                  className="land-step mt-9 flex flex-wrap items-center gap-6"
                  style={{ '--d': '640ms' }}
                >
                  {/* Label and target depend on progress (see useResumePoint). */}
                  <StartButton resume={resume} onClick={start} />
                  <a
                    href="#how-it-works"
                    onClick={scrollToHowItWorks}
                    className="rounded-full px-1 py-1 text-[0.9375rem] font-medium text-ink-soft underline decoration-ink/25 underline-offset-4 transition hover:text-ink hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    How it works
                  </a>
                </div>

                {!resume.started && (
                  <p className="land-step mt-6 text-sm text-ink-faint" style={{ '--d': '760ms' }}>
                    Free · About ten minutes · No CV or account needed
                  </p>
                )}
              </motion.div>

              <div className="hidden lg:block">
                <HeroVisual progress={heroOut} />
              </div>
            </div>
          </motion.div>
        </section>

        {/* The core idea, told as a live translation. */}
        <SkillTranslator />

        {/* Building a profile through chat, for anyone without a CV. */}
        <section aria-labelledby="hera-title" className="py-28">
          <div className="mx-auto grid max-w-[1200px] items-center gap-16 px-8 lg:grid-cols-[minmax(0,1fr)_40rem]">
            <Reveal>
              <h2
                id="hera-title"
                className="font-display text-5xl font-bold leading-[1.02] tracking-[-0.035em] text-ink"
              >
                No CV? <span className="block text-pink-600">Just talk to Hera.</span>
              </h2>
              <p className="mt-6 max-w-[44ch] text-lg leading-relaxed text-ink-soft">
                Tell Hera, our AI guide, about the work you did and your time away, in your own
                words. She drafts your profile as you chat, and nothing is used until you confirm
                it.
              </p>
              <div className="mt-9">
                <HeraButton onClick={chatWithHera} />
              </div>
            </Reveal>

            <div className="hidden lg:block">
              <HeraChatDemo />
            </div>
          </div>
        </section>

        <section aria-labelledby="how-it-works-title" className="px-5 pb-32">
          <Reveal className="land-stage relative mx-auto max-w-[1440px] overflow-hidden rounded-[2.5rem]">
            <div className="relative mx-auto grid max-w-[1200px] gap-14 px-8 py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
              <h2
                id="how-it-works-title"
                className="max-w-[14ch] font-display text-5xl font-bold leading-[1.02] tracking-[-0.035em] text-ink"
              >
                Three steps. About ten minutes.
              </h2>

              <ol ref={stepsRef} className="space-y-5">
                {JOURNEY_STAGES.map((stage, index) => (
                  <Step
                    key={stage.id}
                    stage={stage}
                    index={index}
                    count={JOURNEY_STAGES.length}
                    progress={stepsProgress}
                    reduce={reduce}
                  />
                ))}
              </ol>
            </div>
          </Reveal>
        </section>

        <section aria-labelledby="tools-title" className="pb-32">
          <div className="mx-auto w-full max-w-[1200px] px-8">
            <Reveal className="mb-14 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end">
              <h2
                id="tools-title"
                className="max-w-[16ch] font-display text-5xl font-bold leading-[1.02] tracking-[-0.035em] text-ink"
              >
                Then everything works from your result.
              </h2>
              <p className="max-w-[44ch] text-lg leading-relaxed text-ink-soft lg:justify-self-end">
                Your target role and the skills to build carry into four tools, so each one already
                knows what you have and where you are heading.
              </p>
            </Reveal>
            <ToolTiles />
          </div>
        </section>

        <section ref={closingRef} aria-labelledby="closing-title" className="px-5 pb-5">
          <motion.div
            className="land-closing relative mx-auto max-w-[1440px] origin-bottom overflow-hidden rounded-[2.5rem]"
            style={motionStyle({ scale: closingScale, y: closingY })}
          >
            <div className="relative mx-auto max-w-[1200px] px-8 py-28">
              <h2
                id="closing-title"
                className="max-w-[15ch] font-display text-[3.75rem] font-bold leading-[1] tracking-[-0.04em] text-ink"
              >
                <ScrubWords text={CLOSING_TITLE} progress={closingIn} range={[0.3, 0.9]} />
              </h2>
              <p className="mt-6 max-w-[44ch] text-lg leading-relaxed text-ink-soft">
                {user
                  ? 'Your plan saves as you go, and opens on any device you sign in on.'
                  : 'Free, and no account needed. Your plan stays in this tab. Sign up only if you want to keep it.'}
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-6">
                {/* Same progress-aware action as the hero button. */}
                <StartButton resume={resume} onClick={start} />

                {/* Guest-only sign-up prompt. Sign-in is available from the header. */}
                {!user && (
                  <button
                    type="button"
                    onClick={() => openSheet('create')}
                    className="rounded-full px-1 py-1 text-[0.9375rem] font-medium text-ink-soft underline decoration-ink/25 underline-offset-4 transition hover:text-ink hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    Sign up
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-4 px-8 py-10 text-sm text-ink-faint">
        <img src={logoWebp} alt="ReRouteHer" width={752} height={192} className="h-7 w-auto" />
        <p>For women returning to work in Malaysia.</p>
      </footer>
    </div>
  );
}
