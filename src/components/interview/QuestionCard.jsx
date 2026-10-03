import { useEffect, useRef, useState } from 'react';
import { getAnswerFeedback, transcribeAnswer } from '../../api/interview.js';
import useRecorder from '../../hooks/useRecorder.js';
import { useInterviewStore } from '../../store/interviewStore.js';
import AttemptView from './AttemptView.jsx';
import InterviewIcon from './InterviewIcon.jsx';
import PillButton from './PillButton.jsx';
import VoiceOrb from './VoiceOrb.jsx';
import WordReveal from './WordReveal.jsx';

const clock = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

/**
 * A single question: recording, transcription, feedback and retries. The
 * parent keys it by question id so recorder state resets between questions.
 */
export default function QuestionCard({
  question,
  position,
  total,
  note,
  attempts,
  context,
  onBusyChange,
  statuses,
  onJump,
  onPrevious,
  onNext,
  onFinish,
}) {
  const addAttempt = useInterviewStore((state) => state.addAttempt);
  const updateAttempt = useInterviewStore((state) => state.updateAttempt);
  const recorder = useRecorder();

  const [phase, setPhase] = useState(null);
  const [transcribeError, setTranscribeError] = useState(null);
  const [feedbackError, setFeedbackError] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const [shown, setShown] = useState(attempts.length - 1);
  // Recording retained after a failed transcription so it can be resent.
  const [unsent, setUnsent] = useState(null);

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
  const answeredWithFeedback = Boolean(latest?.feedback);
  const isLast = position === total - 1;
  const viewed = attempts[Math.min(shown, attempts.length - 1)];

  async function requestFeedback(attempt) {
    setPhase('reviewing');
    setFeedbackError(null);
    try {
      const feedback = await getAnswerFeedback({
        question,
        role: question.role,
        focus: question.focus,
        transcript: attempt.transcript,
        context,
      });
      updateAttempt(question.id, attempt.id, { feedback });
    } catch (cause) {
      setFeedbackError(cause.message ? `Feedback could not be generated: ${cause.message}.` : null);
    } finally {
      setPhase(null);
    }
  }

  async function processRecording(recording) {
    setUnsent(recording);
    setTranscribeError(null);
    setPhase('transcribing');

    let transcript;
    try {
      ({ transcript } = await transcribeAnswer(recording.blob));
    } catch (cause) {
      setTranscribeError(cause.message || 'The recording could not be turned into text.');
      setPhase(null);
      return;
    }

    if (!transcript?.trim()) {
      setUnsent(null);
      setTranscribeError(
        'No speech was picked up in that recording. Check your microphone and record again.'
      );
      setPhase(null);
      return;
    }

    setUnsent(null);
    const attempt = {
      id: `${question.id}-${Date.now()}`,
      transcript: transcript.trim(),
      seconds: recording.seconds,
      feedback: null,
      at: Date.now(),
    };
    addAttempt(question.id, attempt);
    setShown(attempts.length);
    setRetrying(false);
    await requestFeedback(attempt);
  }

  async function stopRecording() {
    const recording = await recorder.stop();
    if (recording) await processRecording(recording);
    else
      setTranscribeError(
        'No audio came through from your microphone. Check it is connected, then record again.'
      );
  }

  const recording = recorder.status === 'recording';
  const orbState = recording
    ? 'recording'
    : phase === 'transcribing'
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
        text={question.text}
        className="iv-question-text"
      />

      {showRecorder ? (
        <div ref={voiceRef} className="iv-voice">
          <VoiceOrb
            state={orbState}
            level={recorder.level}
            disabled={recorder.status === 'requesting' || phase === 'transcribing'}
            onPress={recording ? stopRecording : () => recorder.start()}
          />
          <div className="min-w-0 flex-1">
            {recording ? (
              <>
                <p className="iv-voice-time tabular">{clock(recorder.seconds)}</p>
                <p className="mt-1 text-sm text-ink-soft">Recording. Tap the circle to stop.</p>
              </>
            ) : phase === 'transcribing' ? (
              <p role="status" className="iv-shimmer">
                Turning your answer into text
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
                  Speak as you would in the room. When you stop, your answer is turned into text and
                  reviewed.
                  {retrying && ' Your earlier answers stay saved, so you can compare them.'}
                </p>
              </>
            )}
            {transcribeError && !recording && phase !== 'transcribing' && (
              <div role="alert" className="iv-alert">
                <InterviewIcon name="alert" className="size-5 shrink-0 text-pink-600" />
                <p className="min-w-0 flex-1">{transcribeError}</p>
                {unsent && (
                  <button
                    type="button"
                    onClick={() => processRecording(unsent)}
                    className="iv-text-button"
                  >
                    Send it again
                  </button>
                )}
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

      {hasAttempts && (
        <div className="iv-response">
          {attempts.length > 1 && (
            <div className="mb-8 flex flex-wrap gap-1.5" role="group" aria-label="Your attempts">
              {attempts.map((attempt, number) => (
                <button
                  key={attempt.id}
                  type="button"
                  aria-pressed={viewed.id === attempt.id}
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
            key={viewed.id}
            attempt={viewed}
            reviewing={phase === 'reviewing' && viewed.id === latest.id}
            feedbackError={feedbackError}
            onRetryFeedback={() => requestFeedback(viewed)}
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
