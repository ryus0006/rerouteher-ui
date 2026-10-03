import useSmoothNavigate from '../hooks/useSmoothNavigate.js';
import Header from '../components/layout/Header.jsx';
import GlassCard from '../components/ui/GlassCard.jsx';
import GradientButton from '../components/ui/GradientButton.jsx';
import Photo from '../components/ui/Photo.jsx';
import CardIllustration from '../components/ui/CardIllustration.jsx';
import JourneyRail from '../components/landing/JourneyRail.jsx';
import ValueIcon from '../components/landing/ValueIcon.jsx';
import useResumePoint from '../hooks/useResumePoint.js';
import { useAccountStore } from '../store/accountStore.js';

// Hero photograph (WebP with JPEG fallback).
import heroWebp from '../assets/hero-collaboration.webp';
import heroJpg from '../assets/hero-collaboration.jpg';
import journeyPath from '../assets/page-illustrations/journey-path.png';
import snapshotKeepsake from '../assets/page-illustrations/snapshot-keepsake.png';
import gapBridge from '../assets/page-illustrations/gap-bridge.png';

const VALUE_CARDS = [
  {
    id: 'break-counts',
    icon: 'intake',
    illustration: snapshotKeepsake,
    title: 'Your break counts as experience',
    body: 'Budgeting, scheduling, coordination — named, then mapped to standard taxonomies.',
  },
  {
    id: 'weighted-readiness',
    icon: 'clock',
    illustration: gapBridge,
    title: 'Transparent, weighted readiness',
    body: 'A score for any target role, with the reasoning behind every point.',
  },
  {
    id: 'three-focus-areas',
    icon: 'climb',
    illustration: journeyPath,
    title: 'Three focus areas, never a wall',
    body: 'Three, ranked by impact — not a list of everything you have not done.',
  },
];

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

export default function Landing() {
  const navigate = useSmoothNavigate();
  const openSheet = useAccountStore((state) => state.openSheet);
  const user = useAccountStore((state) => state.user);
  const resume = useResumePoint();

  return (
    <div className="flex min-h-svh flex-col">
      <Header />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-plane">
          <div className="absolute inset-0">
            <Photo
              webp={heroWebp}
              jpg={heroJpg}
              width={1672}
              height={941}
              loading="eager"
              fetchPriority="high"
              alt="Three women smiling as they work together around a laptop in a bright office."
              className="block h-full w-full object-cover object-[center_20%]"
            />
          </div>
          <div aria-hidden="true" className="landing-hero-shade absolute inset-0" />

          {/* Viewport-relative height. The 9rem offset accounts for the header and
              the next section's top padding, so the fold falls on that padding
              rather than through its text. The min-height applies on short
              viewports. */}
          <div className="relative mx-auto flex min-h-[42rem] w-full max-w-[1200px] items-end px-5 py-12 sm:px-8 md:min-h-[max(34rem,calc(100svh-9rem))] md:items-center md:py-20">
            <div className="max-w-[34rem]">
              <h1 className="font-display text-4xl font-bold leading-[1.04] tracking-[-0.025em] text-white sm:text-5xl md:text-[3.5rem]">
                See what you still
                <br />
                have to offer
              </h1>

              <p className="mt-5 max-w-[44ch] text-base leading-relaxed text-white/90 sm:text-lg">
                A career break can feel like starting from zero. It is not. We turn your past work
                and your time away into a plan.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-5">
                {/* Label and target depend on progress (see useResumePoint). Restarting
                    the diagnostic is available from the profile page only. */}
                <GradientButton variant="onPlane" onClick={() => navigate(resume.to)}>
                  {resume.label}
                  <span aria-hidden="true">→</span>
                </GradientButton>

                <a
                  href="#how-it-works"
                  onClick={scrollToHowItWorks}
                  className="rounded-full px-2 py-1 text-sm font-medium text-white/90 underline underline-offset-4 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  How it works
                </a>
              </div>

              {!resume.started && (
                <p className="mt-5 max-w-[44ch] text-sm text-white/90">
                  Free. No signup until you want to keep it.
                </p>
              )}
            </div>
          </div>

          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] bg-grad-rule" />
        </section>

        <section id="how-it-works" className="scroll-mt-6 border-t border-line bg-surface">
          <div className="mx-auto w-full max-w-[1200px] px-5 py-16 sm:px-8 md:py-20">
            <h2
              tabIndex="-1"
              className="font-display text-3xl font-bold tracking-[-0.02em] text-ink sm:text-4xl"
            >
              How it works
            </h2>
            <p className="mt-3 max-w-[46ch] text-ink-soft">
              Three stages, five screens, about ten minutes. Your break is skill-building, not a gap
              to explain away.
            </p>

            <div className="mt-10">
              <JourneyRail />
            </div>

            <div className="mt-14 grid gap-4 md:grid-cols-3">
              {VALUE_CARDS.map((card) => (
                <GlassCard
                  key={card.id}
                  interactive
                  className="card-with-illustration landing-value-card p-6"
                >
                  <CardIllustration src={card.illustration} />
                  <ValueIcon name={card.icon} />
                  <h3 className="mt-4 font-semibold text-ink">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{card.body}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* Dark section; the page's only use of the dark surface. */}
        <section className="bg-plane text-on-plane">
          <div className="mx-auto grid w-full max-w-[1200px] gap-8 px-5 py-14 sm:px-8 md:grid-cols-[1.2fr_0.8fr] md:items-center md:py-16">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-[-0.015em] sm:text-3xl">
                Free to start
              </h2>
              <p className="mt-3 max-w-[48ch] text-sm leading-relaxed text-on-plane-soft sm:text-base">
                {user
                  ? 'Your plan saves itself as you go, and opens on any device you sign in on.'
                  : 'Signing up is optional. An account keeps your plan, so closing this tab does not start you over.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 md:justify-end">
              {/* Same progress-aware action as the hero button. */}
              <button
                type="button"
                onClick={() => navigate(resume.to)}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink shadow-card transition duration-200 ease-spring hover:-translate-y-px hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {resume.label}
                <span aria-hidden="true">→</span>
              </button>

              {/* Guest-only sign-up prompt. Sign-in is available from the header. */}
              {!user && (
                <button
                  type="button"
                  onClick={() => openSheet('create')}
                  className="text-sm text-on-plane-soft underline underline-offset-2 transition hover:text-on-plane focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Sign up
                </button>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
