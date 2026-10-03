import InterviewIcon from './InterviewIcon.jsx';
import PillButton from './PillButton.jsx';

/**
 * End-of-set summary, shown whether or not every question was answered.
 * Provides the actions to start a new set, review answers, or view themes.
 */
export default function SetComplete({ answered, total, onNewSet, onSeeAreas, onReview }) {
  const skipped = total - answered;
  return (
    <section className="interview-complete" aria-labelledby="interview-complete-title">
      <span className="interview-complete-mark" aria-hidden="true">
        <InterviewIcon name="check" weight="bold" className="size-7" />
      </span>
      <h2
        id="interview-complete-title"
        className="mt-6 font-display text-3xl font-bold tracking-[-0.02em] text-ink"
      >
        Set complete
      </h2>
      <p className="mt-2 max-w-[48ch] text-base leading-relaxed text-ink-soft">
        {answered === 0
          ? 'You skipped every question in this set. Start a new one whenever you are ready.'
          : `You answered ${answered} of ${total} questions${
              skipped > 0 ? `, and can still go back to the ${skipped} you skipped` : ''
            }.`}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <PillButton tone="accent" icon="right" onClick={onNewSet}>
          Practise a new set
        </PillButton>
        {answered > 0 && (
          <PillButton icon="chart" iconSide="start" onClick={onSeeAreas}>
            See areas to improve
          </PillButton>
        )}
      </div>
      <button type="button" onClick={onReview} className="iv-text-button mt-6">
        Review this set
      </button>
    </section>
  );
}
