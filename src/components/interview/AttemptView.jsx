import { useId, useState } from 'react';
import InterviewIcon from './InterviewIcon.jsx';
import PillButton from './PillButton.jsx';

/* Character count above which the transcript is collapsed (about two lines). */
const FOLD_AFTER = 140;

const clock = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

function Point({ item, tone }) {
  return (
    <li className="iv-point" data-tone={tone}>
      <span className="iv-list-mark" aria-hidden="true">
        <InterviewIcon
          name={tone === 'good' ? 'check' : 'pencil'}
          weight="bold"
          className="size-3"
        />
      </span>
      <p className="min-w-0">
        <strong className="font-semibold text-ink">{item.title.replace(/[.!?]+$/, '')}.</strong>{' '}
        {item.detail}
      </p>
    </li>
  );
}

function PointGroup({ title, items, tone, order }) {
  if (items.length === 0) return null;
  return (
    <section className="iv-reveal" style={{ '--i': order }}>
      <h4 className="text-sm font-semibold text-ink-soft">{title}</h4>
      <ul className="mt-4 space-y-3.5">
        {items.map((item) => (
          <Point key={item.criterion_id ?? item.title} item={item} tone={tone} />
        ))}
      </ul>
    </section>
  );
}

/**
 * Answer transcript. Collapsed to its first lines when `foldable` (i.e. once
 * feedback is available); otherwise shown in full.
 */
function Transcript({ attempt, foldable }) {
  const [expanded, setExpanded] = useState(false);
  const textId = useId();
  const folded = foldable && !expanded;

  return (
    <figure className="iv-reveal" style={{ '--i': 5 }}>
      <figcaption className="flex items-baseline gap-3 text-sm text-ink-soft">
        <span className="font-semibold text-ink">Your answer</span>
        {attempt.duration_s != null && (
          <span className="tabular">{clock(Math.round(attempt.duration_s))}</span>
        )}
      </figcaption>
      <blockquote id={textId} className="iv-transcript" data-folded={folded || undefined}>
        {attempt.transcript}
      </blockquote>
      {foldable && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={textId}
          onClick={() => setExpanded((value) => !value)}
          className="iv-text-button mt-3 ml-6"
        >
          {expanded ? 'Show less' : 'Show full answer'}
        </button>
      )}
    </figure>
  );
}

/**
 * One saved answer with its server feedback: summary, top improvement, remaining
 * points, then the transcript. On a feedback error the transcript is kept and a
 * retry action is shown. When the content has been purged for privacy, only a
 * note is shown.
 */
export default function AttemptView({ attempt, reviewing, onRetryFeedback }) {
  const ready = attempt.feedback_status === 'ready';
  const failed = attempt.feedback_status === 'error';
  const strengths = attempt.strengths ?? [];
  const improvements = attempt.improvements ?? [];
  const [next, ...alsoImprove] = improvements;

  if (attempt.content_expired) {
    return (
      <div role="note" className="iv-alert">
        <InterviewIcon name="alert" className="size-5 shrink-0 text-ink-faint" />
        <p className="min-w-0 flex-1">
          This answer and its feedback have been cleared to protect your privacy. Record the
          question again for fresh feedback.
        </p>
      </div>
    );
  }

  return (
    <div>
      {reviewing && (
        <p role="status" className="iv-shimmer mb-10">
          Reviewing your answer
        </p>
      )}

      {!reviewing && failed && (
        <div role="alert" className="iv-alert mb-10">
          <InterviewIcon name="alert" className="size-5 shrink-0 text-pink-600" />
          <p className="min-w-0 flex-1">Feedback could not be generated. Your answer is saved.</p>
          <PillButton icon="retry" iconSide="start" onClick={onRetryFeedback}>
            Try feedback again
          </PillButton>
        </div>
      )}

      {ready && (
        <section aria-label="Feedback on your answer" className="mb-14">
          <p className="iv-reveal text-sm font-semibold text-pink-600" style={{ '--i': 0 }}>
            Feedback
          </p>
          <p className="iv-verdict iv-reveal" style={{ '--i': 1 }}>
            {attempt.feedback_summary}
          </p>

          {next && (
            <div className="iv-next iv-reveal" style={{ '--i': 2 }}>
              <span className="iv-next-mark" aria-hidden="true">
                <InterviewIcon name="target" weight="regular" className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-pink-600">Try this next time</p>
                <p className="mt-1 font-display text-xl font-bold tracking-[-0.01em] text-ink">
                  {next.title}
                </p>
                <p className="mt-1 max-w-[58ch] text-base leading-relaxed text-ink-soft">
                  {next.detail}
                </p>
              </div>
            </div>
          )}

          <div className="mt-10 grid gap-x-12 gap-y-8 lg:grid-cols-2">
            <PointGroup order={3} title="What worked well" items={strengths} tone="good" />
            <PointGroup
              order={4}
              title="Also worth working on"
              items={alsoImprove}
              tone="improve"
            />
          </div>
        </section>
      )}

      {attempt.transcript && (
        <Transcript attempt={attempt} foldable={ready && attempt.transcript.length > FOLD_AFTER} />
      )}
    </div>
  );
}
