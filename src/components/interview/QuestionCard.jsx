import { useEffect, useRef, useState } from 'react';
import useRecorder from '../../hooks/useRecorder.js';
import AskHeraAboutInterview from '../companion/AskHeraAboutInterview.jsx';
import { useInterviewStore } from '../../store/interviewStore.js';
import AttemptView from './AttemptView.jsx';
import InterviewIcon from './InterviewIcon.jsx';
import PillButton from './PillButton.jsx';
import VoiceOrb from './VoiceOrb.jsx';
import WordReveal from './WordReveal.jsx';

const clock = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

/** Server error codes mapped to something a user can act on. */
const UPLOAD_ERRORS = {
  no_speech_detected:
    'No speech was picked up in that recording. Check your microphone and record again.',
  unsupported_audio_type: 'That audio format is not supported. Record again.',
  recording_too_large:
    'That recording is too large. Keep it under a couple of minutes and record again.',
  recording_too_long:
    'That recording is too long. Keep it under a couple of minutes and record again.',
  invalid_audio: 'That recording could not be read. Record again.',
  transcription_unavailable: 'The transcriber is busy right now. Record again in a moment.',
};

/**
 * A single question slot from the server. Recording uploads one attempt (the
 * backend transcribes, redacts, saves, and returns feedback in one call); a
 * feedback failure keeps the transcript and offers a retry. All attempts come
 * from the slot, which the store re-reads after each call.
 */
export default function QuestionCard({
  question,
  position,
  total,
  note,
  onBusyChange,
  statuses,
  onJump,
  onPrevious,
  onNext,
  onFinish,
}) {
  const submitAttempt = useInterviewStore((state) => state.submitAttempt);
  const retry = useInterviewStore((state) => state.retry);
  const recorder = useRecorder();

  // The backend seeds a pending placeholder response per question; a slot counts
  // as answered only once an attempt has been recorded (feedback ready or errored).
  const attempts = (question.attempts ?? []).filter(
    (a) => a.feedback_status === 'ready' || a.feedback_status === 'error'
  );
  const [phase, setPhase] = useState(null); // 'submitting' | 'reviewing' | null
  const [uploadError, setUploadError] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const [shown, setShown] = useState(attempts.length - 1);

  const voiceRef = useRef(null);
  // "Try again" is at the bottom of the card; scroll the recorder back into view.
  useEffect(() => {
    if (retrying) voiceRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
  }, [retrying]);

  const busy =
    recorder.status === 'requesting' || recorder.status === 'recording' || phase !== null;
  useEffect(() => onBusyChange(busy), [busy, onBusyChange]);

  const hasAttempts = attempts.length > 0;
  const showRecorder = !hasAttempts || retrying;
  const latest = attempts.at(-1);
  const answeredWithFeedback = latest?.feedback_status === 'ready';
  const isLast = position === total - 1;
  // Clamp defensively so a stale index (e.g. carried from another session) never
  // hides an existing attempt's feedback.
  const viewed = attempts[Math.min(Math.max(shown, 0), attempts.length - 1)];

  async function submit(recording) {
    setUploadError(null);
    setPhase('submitting');
    try {
      await submitAttempt({ sequenceNo: question.sequence_no, audio: recording.blob });
      // The store re-reads the session, so the new attempt arrives on the slot.
      setShown(attempts.length);
      setRetrying(false);
    } catch (cause) {
      setUploadError(
        UPLOAD_ERRORS[cause.message] ?? 'Your answer could not be processed. Record again.'
      );
    } finally {
      setPhase(null);
    }
  }

  async function stopRecording() {
    const recording = await recorder.stop();
    if (recording) await submit(recording);
    else
      setUploadError(
        'No audio came through from your microphone. Check it is connected, then record again.'
      );
  }

  async function retryFeedbackFor(attempt) {
    setPhase('reviewing');
    try {
      await retry(attempt.response_id);
    } finally {
      setPhase(null);
    }
  }

  const recording = recorder.status === 'recording';
  const orbState = recording
    ? 'recording'
    : phase === 'submitting'
      ? 'processing'
      : recorder.status === 'requesting'
        ? 'requesting'
        : retrying
          ? 'retry'
          : 'idle';

  return (
    <article className="iv-question" aria-labelledby="interview-question-text">
      <div className="iv-progress">
        <ol className="iv-segments" aria-label="Questions in this set">
          {statuses.map((status, at) => {
            const label = `Question ${at + 1}, ${
              status === 'current' ? 'current' : status === 'done' ? 'answered' : 'not answered yet'
            }`;
            return (
              <li key={at}>
                <button
                  type="button"
                  disabled={busy || status === 'current'}
                  aria-current={status === 'current' ? 'step' : undefined}
                  aria-label={label}
                  data-status={status}
                  data-tip={label}
                  onClick={() => onJump(at)}
                  className="iv-segment"
                />
              </li>
            );
          })}
        </ol>
        <p className="tabular text-sm font-semibold text-ink">
          Question {position + 1} <span className="text-ink-faint">of {total}</span>
        </p>
      </div>

      {note && <p className="mt-10 text-sm text-ink-soft">{note}</p>}
      <WordReveal
        as="h2"
        id="interview-question-text"
        text={question.question_text}
        className="iv-question-text"
      />
      <AskHeraAboutInterview className="mt-4" />

      {showRecorder ? (
        <div ref={voiceRef} className="iv-voice">
          <VoiceOrb
            state={orbState}
            level={recorder.level}
            disabled={recorder.status === 'requesting' || phase === 'submitting'}
            onPress={recording ? stopRecording : () => recorder.start()}
          />
          <div className="min-w-0 flex-1">
            {recording ? (
              <>
                <p className="iv-voice-time tabular">{clock(recorder.seconds)}</p>
                <p className="mt-1 text-sm text-ink-soft">Recording. Tap the circle to stop.</p>
              </>
            ) : phase === 'submitting' ? (
              <p role="status" className="iv-shimmer">
                Turning your answer into text and reviewing it
              </p>
            ) : (
              <>
                <p className="font-display text-xl font-bold text-ink">
                  {recorder.status === 'requesting'
                    ? 'Waiting for your microphone'
                    : retrying
                      ? 'Answer it again'
                      : 'Tap to answer out loud'}
                </p>
                <p className="mt-1 max-w-[44ch] text-sm leading-relaxed text-ink-soft">
                  Speak as you would in the room, and keep each answer under 5 minutes. When you
                  stop, your answer is turned into text and reviewed.
                  {retrying && ' Your earlier answers stay saved, so you can compare them.'}
                </p>
              </>
            )}
            {uploadError && !recording && phase !== 'submitting' && (
              <div role="alert" className="iv-alert">
                <InterviewIcon name="alert" className="size-5 shrink-0 text-pink-600" />
                <p className="min-w-0 flex-1">{uploadError}</p>
              </div>
            )}
            {recorder.status === 'blocked' && (
              <div role="alert" className="iv-alert">
                <InterviewIcon name="alert" className="size-5 shrink-0 text-pink-600" />
                <p className="min-w-0 flex-1">
                  Spoken practice needs your microphone. Allow microphone access for this site in
                  your browser’s address bar or settings, then tap the circle again.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="iv-answered">
          <InterviewIcon name="check" weight="bold" className="size-4" />
          Answered{attempts.length > 1 ? ` in ${attempts.length} attempts` : ''}
        </p>
      )}

      {hasAttempts && viewed && (
        <div className="iv-response">
          {attempts.length > 1 && (
            <div className="mb-8 flex flex-wrap gap-1.5" role="group" aria-label="Your attempts">
              {attempts.map((attempt, number) => (
                <button
                  key={attempt.response_id}
                  type="button"
                  aria-pressed={viewed.response_id === attempt.response_id}
                  onClick={() => setShown(number)}
                  className="iv-attempt-tab"
                >
                  Attempt {number + 1}
                  {number === attempts.length - 1 ? ' (latest)' : ''}
                </button>
              ))}
            </div>
          )}
          <AttemptView
            key={viewed.response_id}
            attempt={viewed}
            reviewing={phase === 'reviewing' && viewed.response_id === latest.response_id}
            onRetryFeedback={() => retryFeedbackFor(viewed)}
          />
        </div>
      )}

      <nav className="iv-dock" aria-label="Move through the set">
        <PillButton
          icon="left"
          iconSide="start"
          disabled={busy || position === 0}
          onClick={onPrevious}
        >
          Previous
        </PillButton>
        <div className="ml-auto flex items-center gap-2">
          {hasAttempts && !retrying && (
            <PillButton
              icon="retry"
              iconSide="start"
              disabled={busy}
              onClick={() => setRetrying(true)}
            >
              Try again
            </PillButton>
          )}
          <PillButton
            tone={answeredWithFeedback ? 'solid' : 'quiet'}
            icon="right"
            disabled={busy}
            onClick={isLast ? onFinish : onNext}
          >
            {isLast ? 'Finish set' : answeredWithFeedback ? 'Next question' : 'Skip for now'}
          </PillButton>
        </div>
      </nav>
    </article>
  );
}
