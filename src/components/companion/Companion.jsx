import { useEffect, useRef, useState } from 'react';
import useSmoothNavigate from '../../hooks/useSmoothNavigate.js';
import { MAX_FOCUS_AREAS } from '../gap/FocusAreaList.jsx';
import { pickFocusAreas } from '../../lib/focusAreas.js';
import { askCompanion, buildProfile } from '../../api/companion.js';
import { INTERVIEW, INTERVIEW_INTRO } from '../../lib/profileInterview.js';
import { useIntakeStore } from '../../store/intakeStore.js';
import { useCompanionStore } from '../../store/companionStore.js';

/**
 * Openers that are only worth offering because they are about her.
 *
 * A generic "How can I help?" puts the work of finding a question back on the
 * person who does not yet know what the system can answer.
 */
const OPENERS = [
  'What does my readiness score actually mean?',
  'Which focus area should I start with?',
  'Does my career break count as experience?',
];

/** The mark on the trigger and in the panel header — one shape, two sizes. */
function CompanionMark({ className = 'size-4' }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M10 2.5a7.5 7.5 0 0 0-6.6 11.05l-.86 3.04a.6.6 0 0 0 .74.74l3.04-.86A7.5 7.5 0 1 0 10 2.5Z"
        opacity="0.25"
      />
      <path
        fill="currentColor"
        d="M7.2 8.1a2.85 2.85 0 0 1 5.6.75c0 1.2-.75 1.85-1.45 2.35-.55.4-.85.65-.85 1.1v.2a.75.75 0 0 1-1.5 0v-.2c0-1.25.8-1.9 1.45-2.35.6-.42.85-.66.85-1.1a1.35 1.35 0 0 0-2.66-.35.75.75 0 0 1-1.44-.4Zm2.55 6.15a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8Z"
      />
    </svg>
  );
}

export default function Companion({ defaultMode = 'ask' }) {
  const navigate = useSmoothNavigate();
  const snapshot = useIntakeStore((state) => state.snapshot);
  const selectedRole = useIntakeStore((state) => state.selectedRole);
  const gapResult = useIntakeStore((state) => state.gapResult);
  const setSnapshot = useIntakeStore((state) => state.setSnapshot);

  const open = useCompanionStore((state) => state.open);
  const mode = useCompanionStore((state) => state.mode);
  const openCompanion = useCompanionStore((state) => state.openCompanion);
  const toggleCompanion = useCompanionStore((state) => state.toggleCompanion);
  const closeCompanion = useCompanionStore((state) => state.closeCompanion);

  const [question, setQuestion] = useState('');
  const [thread, setThread] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [answers, setAnswers] = useState({});

  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const openerRef = useRef(null);
  const endRef = useRef(null);

  // A screen that opened it for a job wins; otherwise the route decides.
  const building = (open ? mode : defaultMode) === 'build';
  const asked = Object.keys(answers).length;
  const step = building ? INTERVIEW[asked] : null;

  useEffect(() => {
    if (!open) return undefined;

    inputRef.current?.focus();
    const opener = openerRef.current;

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        closeCompanion();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      opener?.focus?.();
    };
  }, [open, closeCompanion]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [thread, thinking]);

  /** One answer in the guided conversation, and the profile once it is done. */
  async function answer(text) {
    const given = text.trim();
    if (!given || thinking || !step) return;

    const next = { ...answers, [step.id]: given };
    setQuestion('');
    setAnswers(next);
    setThread((current) => [...current, { from: 'you', text: given }]);

    if (Object.keys(next).length < INTERVIEW.length) return;

    setThinking(true);
    try {
      const built = await buildProfile({ answers: next });
      setSnapshot(built);
      closeCompanion();
      navigate('/diagnostic/snapshot');
    } catch (cause) {
      setAnswers(answers);
      setThread((current) => [
        ...current,
        { from: 'companion', text: cause.message, sources: [], failed: true },
      ]);
    } finally {
      setThinking(false);
    }
  }

  async function ask(text) {
    const question = text.trim();
    if (!question || thinking) return;

    setQuestion('');
    setThread((current) => [...current, { from: 'you', text: question }]);
    setThinking(true);

    const focusAreas = gapResult ? pickFocusAreas(gapResult.gaps, MAX_FOCUS_AREAS) : [];

    try {
      const result = await askCompanion({
        question,
        context: {
          readiness: gapResult?.readiness ?? null,
          role: selectedRole?.role ?? null,
          focusAreas: focusAreas.map((gap) => gap.skill),
          skillCount:
            (snapshot?.professional_skills?.length ?? 0) + (snapshot?.reframed_skills?.length ?? 0),
        },
      });

      setThread((current) => [
        ...current,
        { from: 'companion', text: result.answer, sources: result.sources },
      ]);
    } catch (cause) {
      setThread((current) => [
        ...current,
        { from: 'companion', text: cause.message, sources: [], failed: true },
      ]);
    } finally {
      setThinking(false);
    }
  }

  function switchTo(next) {
    setThread([]);
    setAnswers({});
    setQuestion('');
    openCompanion(next);
  }

  return (
    <>
      <button
        ref={openerRef}
        type="button"
        onClick={() => toggleCompanion(defaultMode)}
        aria-expanded={open}
        className={`fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full py-3 pl-4 pr-5 text-sm font-semibold text-white shadow-card transition duration-200 ease-spring hover:-translate-y-px hover:bg-plane-2 hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:bottom-6 sm:right-6 ${
          open ? 'bg-plane-2 ring-2 ring-ink/25 ring-offset-2' : 'bg-ink'
        }`}
      >
        <CompanionMark />
        Ask me
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Ask me"
          /* A settled height rather than one that grows with every message: at
             400px the text still sets to a readable measure, and a panel that
             resizes as she talks is both flimsy and distracting to read. */
          className="companion-panel fixed inset-x-3 bottom-20 z-40 flex h-[min(32rem,70vh)] flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-sheet sm:inset-x-auto sm:bottom-24 sm:right-6 sm:h-[min(34rem,72vh)] sm:w-[25rem]"
        >
          <header className="flex items-start gap-3 border-b border-line py-4 pl-5 pr-3">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-canvas-sunk text-ink">
              <CompanionMark className="size-4" />
            </span>

            <div className="min-w-0 flex-1">
              <h2 className="font-display text-base font-bold text-ink">Ask me</h2>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
                {building
                  ? INTERVIEW_INTRO
                  : gapResult
                    ? `I read your snapshot and your gap${selectedRole ? ` for ${selectedRole.role}` : ''}, and answer from those.`
                    : 'I answer from your own results, once you have them.'}
              </p>
            </div>

            {/* Inside the panel, where the account sheet already puts it. A
                dismiss control that sits outside the thing it dismisses reads
                as a separate button rather than as this panel's own. */}
            <button
              type="button"
              onClick={closeCompanion}
              aria-label="Close"
              className="-mt-1 shrink-0 rounded-full p-2 text-ink-faint transition hover:bg-canvas-sunk hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
                className="size-4"
              >
                <path d="m4 4 8 8M12 4l-8 8" />
              </svg>
            </button>
          </header>

          {/* Where she is in the three questions, without a second heading. */}
          {building && (
            <div
              role="progressbar"
              aria-valuenow={asked}
              aria-valuemin={0}
              aria-valuemax={INTERVIEW.length}
              aria-label="Questions answered"
              className="h-0.5 w-full bg-canvas-sunk"
            >
              <div
                className="h-full bg-ink transition-[width] duration-500 ease-spring"
                style={{ width: `${(asked / INTERVIEW.length) * 100}%` }}
              />
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {!building && thread.length === 0 && (
              <ul className="space-y-2">
                {OPENERS.map((opener) => (
                  <li key={opener}>
                    <button
                      type="button"
                      onClick={() => ask(opener)}
                      className="w-full rounded-xl border border-line px-3.5 py-2.5 text-left text-sm text-ink transition hover:border-line-strong hover:bg-canvas-sunk focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                      {opener}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <ul className="space-y-4">
              {thread.map((turn, index) => (
                <li key={`${turn.from}-${index}`}>
                  {turn.from === 'you' ? (
                    <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-blue-100 px-3.5 py-2 text-sm text-ink">
                      {turn.text}
                    </p>
                  ) : (
                    <div className="max-w-[92%]">
                      <p
                        className={`text-sm leading-relaxed ${turn.failed ? 'text-pink-600' : 'text-ink'}`}
                      >
                        {turn.text}
                      </p>
                      {turn.sources?.length > 0 && (
                        <p className="mt-1.5 text-xs text-ink-faint">
                          From {turn.sources.join(' · ')}
                        </p>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>

            {/* The live question sits with the thread, so it reads as the next
                thing said rather than as a form label pinned above it. */}
            {building && step && !thinking && (
              <div className="mt-4">
                <p className="text-xs font-medium text-ink-faint">
                  Question {asked + 1} of {INTERVIEW.length}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink">{step.ask}</p>
              </div>
            )}

            {thinking && (
              <p className="mt-4 text-sm text-ink-faint" role="status">
                {building ? 'Building your snapshot…' : 'Reading your results…'}
              </p>
            )}

            <div ref={endRef} />
          </div>

          {/* Both jobs stay reachable, so the widget is never the wrong one. */}
          {!snapshot && (
            <div className="border-t border-line px-5 py-2.5">
              <button
                type="button"
                onClick={() => switchTo(building ? 'ask' : 'build')}
                className="text-xs font-medium text-pink-600 underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                {building ? 'Ask a question instead' : 'Build my snapshot without a CV'}
              </button>
            </div>
          )}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (building) answer(question);
              else ask(question);
            }}
            className="flex items-center gap-2 border-t border-line px-4 py-3"
          >
            <label htmlFor="companion-question" className="sr-only">
              {building ? (step?.ask ?? 'Your answer') : 'Ask about your results'}
            </label>
            <input
              ref={inputRef}
              id="companion-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={building ? (step?.placeholder ?? '') : 'Ask about your results'}
              className="min-w-0 flex-1 rounded-xl border border-line-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600"
            />
            <button
              type="submit"
              disabled={!question.trim() || thinking}
              className="shrink-0 rounded-xl bg-ink px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-plane-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:pointer-events-none disabled:opacity-40"
            >
              {building ? 'Send' : 'Ask'}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
