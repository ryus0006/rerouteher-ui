import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { askCompanion } from '../../api/companion.js';
import { useIntakeStore } from '../../store/intakeStore.js';
import { useCompanionStore } from '../../store/companionStore.js';

/**
 * Openers that are only worth offering because they are about her.
 *
 * A generic "How can I help?" puts the work of finding a question back on the
 * person who does not yet know what the system can answer. Build mode offers
 * ways to start a profile; ask mode offers questions about her results.
 */
const ASK_OPENERS = [
  'What does my readiness score actually mean?',
  'Which focus area should I start with?',
  'Does my career break count as experience?',
];

const BUILD_OPENERS = [
  'I was a teacher for six years, then home with my kids.',
  'Help me build my profile without a CV.',
  'Use the CV I uploaded.',
];

/** A stable per-browser conversation id, so history survives reloads (E8). */
function getSessionId() {
  const KEY = 'rerouteher.companionSession';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

/**
 * The companion's face: one shape, two sizes.
 *
 * Drawn as a single evenodd path, so the eyes and mouth are holes rather than
 * painted features. The head takes `currentColor` and whatever sits behind it
 * shows through the gaps, which is what lets the same mark read white on the
 * gradient trigger and pink inside the panel header.
 */
function CompanionMark({ className = 'size-4' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M13.4 2.2a1.4 1.4 0 1 1-2.8 0 1.4 1.4 0 0 1 2.8 0ZM11.25 3.6h1.5V6h-1.5V3.6ZM8 6h8a4 4 0 0 1 4 4v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-5a4 4 0 0 1 4-4Zm-5 4.5h1v4H3a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Zm17 0h1a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-1v-4ZM10.65 11.6a1.35 1.35 0 1 1-2.7 0 1.35 1.35 0 0 1 2.7 0Zm5.4 0a1.35 1.35 0 1 1-2.7 0 1.35 1.35 0 0 1 2.7 0ZM9.3 14.75q2.7 2.6 5.4 0-2.7 1.5-5.4 0Z"
      />
    </svg>
  );
}

export default function Companion({ defaultMode = 'ask' }) {
  const location = useLocation();
  const cv = useIntakeStore((state) => state.cv);
  const careerBreak = useIntakeStore((state) => state.break);
  const snapshot = useIntakeStore((state) => state.snapshot);
  const selectedRole = useIntakeStore((state) => state.selectedRole);
  const gapResult = useIntakeStore((state) => state.gapResult);
  const employerPriorities = useIntakeStore((state) => state.employerPriorities);
  const setCv = useIntakeStore((state) => state.setCv);
  const setBreak = useIntakeStore((state) => state.setBreak);

  const open = useCompanionStore((state) => state.open);
  const mode = useCompanionStore((state) => state.mode);
  const openCompanion = useCompanionStore((state) => state.openCompanion);
  const toggleCompanion = useCompanionStore((state) => state.toggleCompanion);
  const closeCompanion = useCompanionStore((state) => state.closeCompanion);

  const [question, setQuestion] = useState('');
  const [thread, setThread] = useState([]);
  const [thinking, setThinking] = useState(false);
  // A profile the agent drafted, held for her review before it touches the store.
  const [proposed, setProposed] = useState(null);

  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const openerRef = useRef(null);
  const endRef = useRef(null);

  // A screen that opened it for a job wins; otherwise the route decides.
  const building = (open ? mode : defaultMode) === 'build';
  const openers = building ? BUILD_OPENERS : ASK_OPENERS;

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

  /**
   * One turn. Both modes talk to the same conversational endpoint; build mode
   * differs only in what she is there to do, which the backend reads from the
   * page and the conversation. A profile the model commits comes back in
   * journey_update and is applied through the same store mutators the intake
   * pages use, so a chat-built profile is indistinguishable from an uploaded one.
   */
  async function send(text) {
    const asked = text.trim();
    if (!asked || thinking) return;

    setQuestion('');
    setThread((current) => [...current, { from: 'you', text: asked }]);
    setThinking(true);

    try {
      const result = await askCompanion({
        question: asked,
        sessionId: getSessionId(),
        journey: { cv, break: careerBreak, snapshot, selectedRole, gapResult, employerPriorities },
        currentPage: location.pathname,
      });

      // The drafted profile is held for her review, not applied yet (US8.1: she
      // confirms before it becomes her journey).
      const update = result.journey_update;
      if (update?.cv || update?.break) setProposed(update);

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

  /** She accepts the drafted profile; only now does it enter her journey, through
   * the same store mutators the pages use, so it is identical to an uploaded CV. */
  function confirmProfile() {
    if (!proposed) return;
    // setCv resets everything downstream (incl. the break), which is right for a
    // fresh upload but wrong for a refinement: keep her existing break unless this
    // draft changes it, so a cv-only update does not wipe it.
    const keptBreak = careerBreak;
    if (proposed.cv) {
      setCv({
        ...proposed.cv,
        fileName: cv?.fileName ?? 'Built from our chat',
        fileSize: cv?.fileSize ?? 0,
      });
    }
    if (proposed.break) setBreak(proposed.break);
    else if (proposed.cv) setBreak(keptBreak);
    setProposed(null);
    setThread((current) => [
      ...current,
      {
        from: 'companion',
        text: 'Saved to your journey. Continue to the next step whenever you are ready.',
        sources: [],
      },
    ]);
  }

  function switchTo(next) {
    setThread([]);
    setQuestion('');
    setProposed(null);
    openCompanion(next);
  }

  return (
    <>
      {/* The round bubble a chat widget is expected to be, carrying the
          palette's accent rather than its dark plane: at 56px a navy circle
          reads as a stray chip on a page with no other navy on it. The mark
          swaps for a close chevron while the panel is up, so one control does
          both. */}
      <button
        ref={openerRef}
        type="button"
        onClick={() => toggleCompanion(defaultMode)}
        aria-expanded={open}
        aria-label={open ? 'Close Hera' : 'Ask Hera'}
        className={`fixed bottom-5 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-grad-companion text-white shadow-companion transition duration-200 ease-spring hover:-translate-y-px hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600 sm:bottom-6 sm:right-6 ${
          open ? 'brightness-110' : ''
        }`}
      >
        {open ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="size-5"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        ) : (
          <CompanionMark className="size-7" />
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Ask Hera"
          /* A settled height rather than one that grows with every message: at
             400px the text still sets to a readable measure, and a panel that
             resizes as she talks is both flimsy and distracting to read. */
          className="companion-panel fixed inset-x-3 bottom-20 z-40 flex h-[min(32rem,70vh)] flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-sheet sm:inset-x-auto sm:bottom-24 sm:right-6 sm:h-[min(34rem,72vh)] sm:w-[25rem]"
        >
          <header className="flex items-start gap-3 border-b border-line py-4 pl-5 pr-3">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink-600">
              <CompanionMark className="size-4" />
            </span>

            <div className="min-w-0 flex-1">
              <h2 className="font-display text-base font-bold text-ink">Hera</h2>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
                {building
                  ? 'No CV needed. Tell me about your work and your time away, and I will build your profile.'
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

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {thread.length === 0 && (
              <ul className="space-y-2">
                {openers.map((opener) => (
                  <li key={opener}>
                    <button
                      type="button"
                      onClick={() => send(opener)}
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
                    <div className="mr-auto w-fit max-w-[92%]">
                      <div
                        className={`w-fit whitespace-pre-line rounded-2xl rounded-bl-sm bg-canvas-sunk px-3.5 py-2 text-sm leading-relaxed ${turn.failed ? 'text-pink-600' : 'text-ink'}`}
                      >
                        {turn.text}
                      </div>
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

            {thinking && (
              <p className="mt-4 text-sm text-ink-faint" role="status">
                {building ? 'Building your profile…' : 'Reading your results…'}
              </p>
            )}

            {/* The drafted profile, laid out for her to read and accept or change
                before it becomes her journey (US8.1). */}
            {proposed && (
              <div className="mt-4 rounded-2xl border border-line bg-canvas-sunk p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  Your profile so far
                </p>

                {proposed.cv?.experiences?.[0]?.title && (
                  <p className="mt-2 text-sm font-semibold text-ink">
                    {proposed.cv.experiences[0].title}
                    {proposed.cv.experiences[0].organisation
                      ? ` · ${proposed.cv.experiences[0].organisation}`
                      : ''}
                  </p>
                )}

                {proposed.cv?.skill_mentions?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {proposed.cv.skill_mentions.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-surface px-2.5 py-1 text-xs text-ink-soft"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {proposed.break && (
                  <p className="mt-2.5 text-xs text-ink-soft">
                    <span className="font-medium text-ink">Career break:</span>{' '}
                    {proposed.break.duration_years}{' '}
                    {proposed.break.duration_years === 1 ? 'year' : 'years'}
                    {proposed.break.activities?.length
                      ? ` — ${proposed.break.activities.join(', ')}`
                      : ''}
                  </p>
                )}

                <div className="mt-3.5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={confirmProfile}
                    className="rounded-xl bg-pink-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-pink-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600"
                  >
                    Use this profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setProposed(null)}
                    className="rounded-xl border border-line-strong px-3.5 py-1.5 text-xs font-medium text-ink-soft transition hover:border-ink/30 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    Change something
                  </button>
                </div>
              </div>
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
                {building ? 'Ask a question instead' : 'Build my profile without a CV'}
              </button>
            </div>
          )}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              send(question);
            }}
            className="flex items-center gap-2 border-t border-line px-4 py-3"
          >
            <label htmlFor="companion-question" className="sr-only">
              {building ? 'Tell me about your work' : 'Ask about your results'}
            </label>
            <input
              ref={inputRef}
              id="companion-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={building ? 'Tell me about your work' : 'Ask about your results'}
              className="min-w-0 flex-1 rounded-xl border border-line-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600"
            />
            <button
              type="submit"
              disabled={!question.trim() || thinking}
              className="shrink-0 rounded-xl bg-pink-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-pink-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600 disabled:pointer-events-none disabled:opacity-40"
            >
              {building ? 'Send' : 'Ask'}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
