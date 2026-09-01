import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header.jsx';
import GlassCard from '../components/ui/GlassCard.jsx';
import GradientButton from '../components/ui/GradientButton.jsx';
import HeroArt from '../components/landing/HeroArt.jsx';
import JourneyRail from '../components/landing/JourneyRail.jsx';
import ValueIcon from '../components/landing/ValueIcon.jsx';

const VALUE_CARDS = [
  {
    id: 'break-counts',
    icon: 'intake',
    title: 'Your break counts as experience',
    body: 'Budgeting, scheduling, coordination — named, then mapped to standard taxonomies.',
  },
  {
    id: 'weighted-readiness',
    icon: 'clock',
    title: 'Transparent, weighted readiness',
    body: 'A score for any target role, with the reasoning behind every point.',
  },
  {
    id: 'three-focus-areas',
    icon: 'climb',
    title: 'Three focus areas, never a wall',
    body: 'Three, ranked by impact — not a list of everything you have not done.',
  },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-svh flex-col">
      {/* One screenful of gradient on any display; the fixed scroll-cue button below
          signals there is more to scroll to. */}
      <div className="relative flex min-h-svh flex-col overflow-hidden bg-grad-hero">
        {/* Runs the full height of the gradient and bleeds off the right edge.
            The radial mask feathers the artwork into the gradient. */}
        <HeroArt className="pointer-events-none absolute inset-y-0 right-0 h-full w-auto max-w-[72%] object-contain object-right opacity-[0.35] [mask-image:radial-gradient(ellipse_75%_85%_at_52%_48%,#000_35%,rgb(0_0_0/0.85)_60%,transparent_95%)] md:max-w-[46%] md:opacity-[0.85]" />

        <Header />

        <section className="relative z-10 mx-auto grid w-full max-w-[1100px] flex-1 items-center gap-8 px-4 pb-16 pt-10 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:pb-24 md:pt-16">
          <div>
            <h1 className="font-display text-4xl font-bold leading-[1.08] text-ink sm:text-5xl md:text-6xl">
              See what you still
              <br />
              have to offer
            </h1>

            {/* Darker than ink-soft: this copy sits on the gradient, not on the page tint. */}
            <p className="mt-5 max-w-[52ch] text-base text-ink/80 sm:text-lg">
              A career break can feel like starting from zero. It is not. We turn your past work and
              your time away into a plan.
            </p>

            <GradientButton className="mt-8" onClick={() => navigate('/diagnostic/background')}>
              Get started
              <span aria-hidden="true">→</span>
            </GradientButton>
          </div>
        </section>
      </div>

      <main id="how-it-works" className="flex-1 scroll-mt-4 bg-grad-soft">
        <div className="mx-auto w-full max-w-[1100px] px-4 py-16 sm:px-6 md:py-20">
          <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
            Three steps. No signup.
          </h2>
          <p className="mt-3 max-w-[46ch] text-ink-soft">
            Your break is skill-building, not a gap to explain away.
          </p>

          <div className="mt-10">
            <JourneyRail />
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {VALUE_CARDS.map((card) => (
              <GlassCard key={card.id} interactive className="p-6">
                <ValueIcon name={card.icon} />
                <h3 className="mt-4 font-semibold text-ink">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{card.body}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </main>

      {/* Fixed scroll cue: a clear, always-visible button pinned to the bottom-centre of the
          viewport (any screen size) so the content below the hero is never missed. */}
      <button
        type="button"
        onClick={() =>
          document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
        }
        aria-label="Scroll to how it works"
        className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-ink/10 bg-white/60 px-5 py-2.5 text-sm font-semibold text-ink shadow-lg backdrop-blur-md transition hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
      >
        How it works
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-4 w-4 animate-bounce"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
