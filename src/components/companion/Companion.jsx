import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUp, ArrowUpRight, X } from '@phosphor-icons/react';
import { askCompanion } from '../../api/companion.js';
import useSmoothNavigate from '../../hooks/useSmoothNavigate.js';
import { useIntakeStore } from '../../store/intakeStore.js';
import { useCompanionStore } from '../../store/companionStore.js';
import HeraBot from './HeraBot.jsx';
import ProfileDraft from './ProfileDraft.jsx';
import { mergeDraft } from '../../lib/mergeDraft.js';

const EASE = [0.32, 0.72, 0, 1];

/**
 * Elements allowed when rendering the model's Markdown replies: paragraphs,
 * inline emphasis, links and lists. Headings, images and tables are dropped to
 * suit the chat bubble; raw HTML is disabled by default.
 */
const MARKDOWN_ALLOWED = ['p', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'code', 'br'];

const MARKDOWN_COMPONENTS = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-2 list-disc pl-4 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal pl-4 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="mb-0.5">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2"
    >
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-surface px-1 py-0.5 text-[0.85em]">{children}</code>
  ),
};

function AnswerText({ text }) {
  return (
    <ReactMarkdown
      allowedElements={MARKDOWN_ALLOWED}
      unwrapDisallowed
      components={MARKDOWN_COMPONENTS}
    >
      {text}
    </ReactMarkdown>
  );
}

/**
 * Checklist of skills common to the user's previous role. Selected skills are
 * passed to `onAdd`, which stores them for merging into the snapshot.
 * Selection state is local to this message.
 */
function SkillChecklist({ choices, onAdd }) {
  const [checked, setChecked] = useState(() => new Set());

  function toggle(id) {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="mt-2 rounded-2xl bg-canvas-sunk p-4">
      <p className="text-xs font-semibold text-ink-faint">Skills from your role</p>
      <ul className="mt-2 space-y-1.5">
        {choices.map((choice) => (
          <li key={choice.skill_id}>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={checked.has(choice.skill_id)}
                onChange={() => toggle(choice.skill_id)}
                className="size-4 rounded border-line-strong text-pink-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              />
              {choice.skill_name}
            </label>
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={checked.size === 0}
        onClick={() => onAdd(choices.filter((c) => checked.has(c.skill_id)))}
        className="mt-3 rounded-full bg-pink-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-pink-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600 disabled:pointer-events-none disabled:opacity-40"
      >
        Add these skills
      </button>
    </div>
  );
}

/**
 * Suggested questions for ask mode, so the user does not have to guess what
 * the companion can answer about their results.
 */
const ASK_OPENERS = [
  'What does my readiness score actually mean?',
  'Which focus area should I start with?',
  'Does my career break count as experience?',
];

/**
 * Build mode is a guided interview: Hera opens with a question and the user
 * answers in their own words. Without a CV, Hera starts from the last job;
 * with one, Hera moves on to the time away.
 */
const BUILD_GREETING =
  'No CV needed. Let’s start with your last job before your break. What did you do, and for roughly how long?';

const BUILD_GREETING_WITH_CV =
  'I’ve read your CV. Now let’s add your time away. What filled your days during your break?';

/** Returns a per-browser conversation id so history survives reloads. */
function getSessionId() {
  const KEY = 'rerouteher.companionSession';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

export default function Companion({ defaultMode = 'ask' }) {
  const location = useLocation();
  const navigate = useSmoothNavigate();
  const cv = useIntakeStore((state) => state.cv);
  const careerBreak = useIntakeStore((state) => state.break);
  const snapshot = useIntakeStore((state) => state.snapshot);
  const selectedRole = useIntakeStore((state) => state.selectedRole);
  const gapResult = useIntakeStore((state) => state.gapResult);
  const employerPriorities = useIntakeStore((state) => state.employerPriorities);
  const employerMatches = useIntakeStore((state) => state.employerMatches);
  const confirmedSkills = useIntakeStore((state) => state.confirmedSkills);
  const setCv = useIntakeStore((state) => state.setCv);
  const setBreak = useIntakeStore((state) => state.setBreak);
  const setEmployerPriorities = useIntakeStore((state) => state.setEmployerPriorities);
  const addConfirmedSkills = useIntakeStore((state) => state.addConfirmedSkills);
  const setConfirmedSkills = useIntakeStore((state) => state.setConfirmedSkills);

  const open = useCompanionStore((state) => state.open);
  const mode = useCompanionStore((state) => state.mode);
  const openCompanion = useCompanionStore((state) => state.openCompanion);
  const toggleCompanion = useCompanionStore((state) => state.toggleCompanion);
  const closeCompanion = useCompanionStore((state) => state.closeCompanion);
  const holdOpenAcrossNav = useCompanionStore((state) => state.holdOpenAcrossNav);

  const [question, setQuestion] = useState('');
  const [thread, setThread] = useState([]);
  const [thinking, setThinking] = useState(false);
  // Profile drafted by the agent, held for user confirmation before it is written to the store.
  const [proposed, setProposed] = useState(null);
  // Role the skills checklist was last offered for. Sent back to the backend so the
  // checklist is not repeated for the same role, while a role change still triggers it.
  const [roleSkillsOfferedForRoleId, setRoleSkillsOfferedForRoleId] = useState(null);

  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const openerRef = useRef(null);
  const endRef = useRef(null);

  // An explicit mode from `openCompanion` takes precedence over the route default.
  const building = (open ? mode : defaultMode) === 'build';
  const buildGreeting = cv ? BUILD_GREETING_WITH_CV : BUILD_GREETING;

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

  // Scroll to the newest message on each turn and whenever the panel opens.
  // Sets scrollTop to scrollHeight because scrollIntoView on a sentinel can stop
  // short of the bottom when padding or late layout changes the height.
  useEffect(() => {
    if (!open) return;
    const scroller = endRef.current?.parentElement;
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
  }, [open, thread, thinking]);

  /**
   * Sends one turn. Both modes use the same endpoint; the backend infers intent
   * from the current page and conversation. A profile returned in
   * `journey_update` is staged for confirmation and later applied through the
   * same store actions the intake pages use.
   */
  async function send(text) {
    const asked = text.trim();
    if (!asked || thinking) return;

    // Hera's opening question is shown only in the browser, so the first reply
    // in build mode carries it to the backend as context for the answer.
    const opening = building && thread.length === 0;
    const sent = opening ? `You asked me: "${buildGreeting}"\nMy answer: ${asked}` : asked;

    setQuestion('');
    setThread((current) => [...current, { from: 'you', text: asked }]);
    setThinking(true);

    try {
      const result = await askCompanion({
        question: sent,
        sessionId: getSessionId(),
        journey: {
          cv,
          break: careerBreak,
          snapshot,
          selectedRole,
          gapResult,
          employerPriorities,
          employerMatches,
          confirmedSkills,
          roleSkillsOfferedForRoleId,
        },
        currentPage: location.pathname,
      });

      // Track which role the checklist was offered for so it is not offered again.
      if (result.skill_choices_role_id) setRoleSkillsOfferedForRoleId(result.skill_choices_role_id);

      // Stage the drafted profile; it is applied only after the user confirms it.
      // Each update merges into the draft so a reply that omits a field keeps it.
      const update = result.journey_update;
      if (update?.cv || update?.break || update?.employerPriorities?.length) {
        setProposed((current) => mergeDraft(current, update));
      }

      setThread((current) => [
        ...current,
        {
          from: 'companion',
          text: result.answer,
          sources: result.sources,
          cta: result.cta,
          skill_choices: result.skill_choices,
        },
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

  /** Applies the confirmed profile through the same store actions as the intake pages. */
  function confirmProfile() {
    if (!proposed) return;
    // setCv resets all downstream state, including the break and confirmed skills.
    // Preserve both unless the draft replaces them, so a CV-only update does not
    // discard data captured earlier in the conversation.
    const keptBreak = careerBreak;
    const keptConfirmed = confirmedSkills;
    if (proposed.cv) {
      setCv({
        ...proposed.cv,
        fileName: cv?.fileName ?? 'Built from our chat',
        fileSize: cv?.fileSize ?? 0,
      });
    }
    if (proposed.break) setBreak(proposed.break);
    else if (proposed.cv) setBreak(keptBreak);
    // Restore the checklist skills cleared by setCv.
    if (proposed.cv && keptConfirmed.length) setConfirmedSkills(keptConfirmed);
    // Priorities captured in chat. Required by employer matching, since the
    // confirm flow goes straight to the snapshot and skips the Priorities step.
    if (proposed.employerPriorities?.length) setEmployerPriorities(proposed.employerPriorities);
    setProposed(null);
    setThread((current) => [
      ...current,
      {
        from: 'companion',
        text: 'Saved to your journey. When you are ready, I can take you to your skill snapshot.',
        sources: [],
        // Offer a link to the snapshot step instead of redirecting automatically;
        // the snapshot is generated from the confirmed cv and break.
        cta: { label: 'See my skill snapshot', to: '/diagnostic/snapshot' },
      },
    ]);
  }

  function switchTo(next) {
    setThread([]);
    setQuestion('');
    setProposed(null);
    openCompanion(next);
  }

  // Mark a checklist message as used once skills are added, replacing the checkboxes
  // with a confirmation showing how many were added.
  function markChoicesAdded(index, count) {
    setThread((current) =>
      current.map((turn, i) => (i === index ? { ...turn, skill_choices_added: count } : turn))
    );
  }

  return (
    <>
      {/* Floating launcher. While the panel is open the same button acts as the
          close control. */}
      <button
        ref={openerRef}
        type="button"
        onClick={() => toggleCompanion(defaultMode)}
        aria-expanded={open}
        aria-label={open ? 'Close Hera' : 'Ask Hera'}
        data-no-press
        data-open={open || undefined}
        className="hera-launcher group fixed right-6 bottom-6 z-40 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-600"
      >
        <HeraBot className="size-11 shrink-0" thinking={thinking} waving={!open} />
        {open ? (
          <span className="hera-launcher-close" aria-hidden="true">
            <X weight="bold" className="size-3.5" />
          </span>
        ) : (
          <span className="hera-launcher-text text-sm font-semibold text-ink">Hera</span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            ref={panelRef}
            role="dialog"
            aria-label="Ask Hera"
            exit={{ opacity: 0, y: 12, scale: 0.97, filter: 'blur(6px)' }}
            transition={{ duration: 0.4, ease: EASE }}
            /* Fixed height so the panel does not resize as messages are added. */
            className="hera-shell fixed right-6 bottom-[6.5rem] z-40 h-[min(37rem,74vh)] w-[25.5rem]"
          >
            <div className="hera-core flex h-full flex-col overflow-hidden">
              <header className="hera-head flex items-center gap-3.5 px-5 pt-5 pb-4">
                <HeraBot className="size-11 shrink-0" thinking={thinking} />
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-lg leading-tight font-bold text-ink">
                    Hi, I’m Hera
                  </h2>
                  <p className="mt-0.5 text-sm text-ink-soft">How can I help you today?</p>
                </div>
                <button
                  type="button"
                  onClick={closeCompanion}
                  aria-label="Close"
                  className="-mr-1 grid size-8 shrink-0 place-items-center rounded-full text-ink-faint transition hover:bg-ink/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  <X weight="bold" className="size-3.5" aria-hidden="true" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto px-5 pt-4 pb-4">
                {/* In build mode Hera opens the conversation with a question. */}
                {building && (
                  <div className="hera-rise mb-5 flex gap-2.5">
                    <HeraBot className="mt-0.5 size-6 shrink-0" />
                    <p className="min-w-0 flex-1 text-sm leading-relaxed text-ink">
                      {buildGreeting}
                    </p>
                  </div>
                )}

                {/* Ask mode suggests questions about the results. */}
                {!building && thread.length === 0 && (
                  <div>
                    <p className="text-xs font-semibold text-ink-faint">Try asking</p>
                    <ul className="mt-3 space-y-2">
                      {ASK_OPENERS.map((opener, at) => (
                        <li key={opener} className="hera-rise" style={{ '--i': at + 1 }}>
                          <button
                            type="button"
                            onClick={() => send(opener)}
                            className="hera-opener group"
                          >
                            <span className="min-w-0 flex-1">{opener}</span>
                            <span className="hera-opener-icon" aria-hidden="true">
                              <ArrowUpRight weight="bold" className="size-3" />
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <ul className="space-y-4">
                  {thread.map((turn, index) => (
                    <li key={`${turn.from}-${index}`}>
                      {turn.from === 'you' ? (
                        <p className="hera-you ml-auto w-fit max-w-[85%]">{turn.text}</p>
                      ) : (
                        <div className="flex gap-2.5">
                          <HeraBot className="mt-0.5 size-6 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div
                              className={`text-sm leading-relaxed ${turn.failed ? 'text-pink-600' : 'text-ink'}`}
                            >
                              <AnswerText text={turn.text} />
                            </div>
                            {turn.sources?.length > 0 && (
                              <p className="mt-1.5 text-xs text-ink-faint">
                                From {turn.sources.join(' · ')}
                              </p>
                            )}
                            {/* Optional navigation link; navigation happens only on click.
                          holdOpenAcrossNav keeps the chat open across the route change. */}
                            {turn.cta && (
                              <button
                                type="button"
                                onClick={() => {
                                  holdOpenAcrossNav();
                                  navigate(turn.cta.to);
                                }}
                                className="hera-cta mt-3"
                              >
                                {turn.cta.label}
                                <span className="hera-cta-icon" aria-hidden="true">
                                  <ArrowUpRight weight="bold" className="size-3" />
                                </span>
                              </button>
                            )}
                            {turn.skill_choices?.length > 0 && !turn.skill_choices_added && (
                              <SkillChecklist
                                choices={turn.skill_choices}
                                onAdd={(picked) => {
                                  addConfirmedSkills(picked);
                                  markChoicesAdded(index, picked.length);
                                }}
                              />
                            )}
                            {turn.skill_choices_added != null && (
                              <p className="mt-2 text-xs text-ink-faint">
                                Added {turn.skill_choices_added}{' '}
                                {turn.skill_choices_added === 1 ? 'skill' : 'skills'} to your
                                profile.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>

                {thinking && (
                  <div className="hera-rise mt-4 flex items-center gap-2.5" role="status">
                    <HeraBot className="size-6 shrink-0" thinking />
                    <span className="hera-shimmer text-sm font-medium">Hera is thinking</span>
                  </div>
                )}

                {/* Drafted profile for review; applied to the journey only on confirm.
                    "Change something" keeps the draft and returns to the message box. */}
                {proposed && (
                  <ProfileDraft
                    draft={proposed}
                    confirmedSkills={confirmedSkills}
                    onConfirm={confirmProfile}
                    onChange={() => inputRef.current?.focus()}
                  />
                )}

                <div ref={endRef} />
              </div>

              {/* Mode switch, so both build and ask modes remain reachable. */}
              {!snapshot && (
                <div className="px-5 pb-1">
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
                className="px-3 pt-2 pb-3"
              >
                <label htmlFor="companion-question" className="sr-only">
                  {building ? 'Tell me about your work' : 'Ask about your results'}
                </label>
                <div className="hera-composer">
                  <input
                    ref={inputRef}
                    id="companion-question"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder={building ? 'Tell me about your work' : 'Ask about your results'}
                    className="min-w-0 flex-1 bg-transparent py-2 pl-4 text-sm text-ink outline-none placeholder:text-ink-faint"
                  />
                  <button
                    type="submit"
                    disabled={!question.trim() || thinking}
                    aria-label={building ? 'Send' : 'Ask'}
                    className="hera-send"
                  >
                    <ArrowUp weight="bold" className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
