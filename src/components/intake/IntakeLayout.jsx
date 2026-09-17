import Header from '../layout/Header.jsx';
import IntakeStepper from './IntakeStepper.jsx';
import PreviousPlanBar from './PreviousPlanBar.jsx';

/**
 * Shared frame for every intake screen: stepper, heading, and body.
 */
export default function IntakeLayout({ stageIndex, back, title, intro, children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto w-full max-w-[720px] flex-1 px-5 py-8 sm:px-6 sm:py-10">
        {/* Above the stepper, so the way out is visible on every step of the
            redo rather than only on the one where it started. */}
        <PreviousPlanBar />

        <IntakeStepper currentIndex={stageIndex} />

        {back && <div className="mt-8">{back}</div>}

        <h1
          className={`${back ? 'mt-3' : 'mt-9'} font-display text-2xl font-bold tracking-[-0.015em] text-ink sm:text-3xl`}
        >
          {title}
        </h1>
        {intro && (
          <p className="mt-2 max-w-[54ch] text-sm leading-relaxed text-ink-soft sm:text-base">
            {intro}
          </p>
        )}

        <div className="mt-7">{children}</div>
      </main>
    </div>
  );
}
