import { useCallback, useState } from 'react';
import { Navigate } from 'react-router-dom';
import useSmoothNavigate from '../hooks/useSmoothNavigate.js';
import Header from '../components/layout/Header.jsx';
import BackLink from '../components/intake/BackLink.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import { ACTIVITY_LABELS } from '../config/activityTaxonomy.js';
import { PRIORITY_NAMES } from '../config/employerPriorities.js';
import { useAccountStore } from '../store/accountStore.js';
import { useIntakeStore } from '../store/intakeStore.js';
import {
  MAX_DISPLAY_NAME_LENGTH,
  resolveDisplayName,
  validateDisplayName,
} from '../api/account.js';

const CARD = 'rounded-2xl border border-line bg-surface p-5 sm:p-6';
const FIELD =
  'mt-1.5 w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600';
const LABEL = 'text-sm font-medium text-ink';
const HELP = 'mt-1.5 text-xs text-ink-soft';

/**
 * Reads the intake back as prose, so the page shows answers rather than field
 * names. Only what she typed or picked: results live on the journey page, and
 * repeating them here would make both pages longer without making either
 * clearer.
 *
 * Ids are stored, not labels, so each list is resolved through the config that
 * owns it — the same source the screen that asked the question renders from.
 */
function useAnswers() {
  const cv = useIntakeStore((state) => state.cv);
  const careerBreak = useIntakeStore((state) => state.break);
  const employerPriorities = useIntakeStore((state) => state.employerPriorities);

  // A session stored before the break step was reached carries no break object.
  const years = careerBreak?.duration_years ?? 0;
  const activities = careerBreak?.activities ?? [];
  const answered = activities.length > 0;

  return [
    { id: 'cv', label: 'CV', value: cv?.fileName ?? 'Not uploaded' },
    {
      id: 'break',
      label: 'Career break',
      /* A duration of 0 is a real answer — "less than a year" — so an activity
         is what separates it from a step she has not reached. The same signal
         the break screen itself treats as answered. */
      value: !answered
        ? 'Not answered yet'
        : years === 0
          ? 'Less than a year'
          : `${years} ${years === 1 ? 'year' : 'years'}`,
      faint: !answered,
    },
    {
      id: 'activities',
      label: 'What filled it',
      // Named rather than counted: "3 activities" proves she answered without
      // saying what, which is the one thing a record of her answers is for.
      items: activities.map((activity) => ACTIVITY_LABELS[activity] ?? activity),
      empty: 'Not answered yet',
    },
    {
      id: 'priorities',
      label: 'Work priorities',
      items: employerPriorities.map((priority) => PRIORITY_NAMES[priority] ?? priority),
      empty: 'Not answered yet',
    },
  ];
}

/**
 * Everything about the account that is not the plan itself.
 *
 * Split in two on purpose: the display name is hers to rewrite freely, while
 * the intake answers are a record of what the snapshot was built from — one
 * way back into the diagnostic, not a row of controls implying each answer can
 * be changed on its own.
 */
export default function Profile() {
  const navigate = useSmoothNavigate();
  const user = useAccountStore((state) => state.user);
  const setDisplayName = useAccountStore((state) => state.setDisplayName);
  const answers = useAnswers();
  const resetJourney = useIntakeStore((state) => state.reset);

  /* Seeded once from the store rather than synced in an effect: the field is
     hers to edit from here on, and nothing else writes the name. */
  const [draft, setDraft] = useState(() => {
    const stored = useAccountStore.getState().user;
    return stored ? resolveDisplayName(stored) : '';
  });
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [confirmingRestart, setConfirmingRestart] = useState(false);
  // Stable, so the dialog's key handling is not torn down on every render.
  const cancelRestart = useCallback(() => setConfirmingRestart(false), []);

  // Signed out, there is no profile to show; the header offers the way back in.
  if (!user) return <Navigate to="/" replace />;

  function handleSubmit(event) {
    event.preventDefault();

    const message = validateDisplayName(draft);
    setError(message);
    if (message) return;

    setDisplayName(draft.trim() || user.username);
    setSaved(true);
  }

  /* A full clear, not the CV-only reset: the snapshot, priorities and any
     stashed earlier plan all go. Signed in, plan sync then writes the empty
     plan to the account. */
  function handleRestart() {
    resetJourney();
    setConfirmingRestart(false);
    navigate('/diagnostic/background');
  }

  const dirty = draft.trim() !== resolveDisplayName(user);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto w-full max-w-[720px] flex-1 px-5 py-8 sm:px-6 sm:py-10">
        <BackLink to="/">Back to home</BackLink>

        <h1 className="mt-3 font-display text-2xl font-bold tracking-[-0.015em] text-ink sm:text-3xl">
          Your profile
        </h1>

        <section className={`${CARD} mt-6`}>
          <h2 className="font-display text-lg font-bold text-ink">Account</h2>

          <form onSubmit={handleSubmit} className="mt-4">
            <label htmlFor="profile-display-name" className={LABEL}>
              Display name
            </label>
            <input
              id="profile-display-name"
              name="displayName"
              autoComplete="nickname"
              maxLength={MAX_DISPLAY_NAME_LENGTH}
              placeholder={user.username}
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                setError(null);
                setSaved(false);
              }}
              className={FIELD}
            />
            {error ? (
              <p className="mt-1.5 text-xs font-medium text-pink-600">{error}</p>
            ) : (
              <p className={HELP}>What we call you on screen. Blank falls back to your username.</p>
            )}

            <div className="mt-4 flex items-center gap-3">
              <button
                type="submit"
                disabled={!dirty}
                className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition duration-200 ease-spring hover:bg-plane-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:pointer-events-none disabled:opacity-40"
              >
                Save
              </button>
              {saved && !dirty && (
                <p role="status" className="text-xs font-medium text-verify">
                  Saved
                </p>
              )}
            </div>
          </form>

          <dl className="mt-6 border-t border-line pt-4">
            <dt className="eyebrow">Username</dt>
            <dd className="mt-1 text-sm text-ink">{user.username}</dd>
          </dl>
        </section>

        <section className={`${CARD} mt-5`}>
          <h2 className="font-display text-lg font-bold text-ink">Your answers</h2>
          <p className="mt-1 text-sm text-ink-soft">What your plan was built from.</p>

          <dl className="mt-4 divide-y divide-line">
            {answers.map((answer) => (
              <div key={answer.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3">
                <dt className="eyebrow w-full sm:w-44 sm:shrink-0">{answer.label}</dt>
                <dd className="min-w-0 flex-1 text-sm text-ink">
                  {/* A list she built is shown as the things in it. Chips rather
                      than a sentence because the break is uncapped: sixteen are
                      selectable, and a comma run that long stops being read. */}
                  {answer.items ? (
                    answer.items.length === 0 ? (
                      <span className="text-ink-faint">{answer.empty}</span>
                    ) : (
                      <ul className="flex flex-wrap gap-1.5">
                        {answer.items.map((item) => (
                          <li
                            key={item}
                            className="rounded-full border border-line bg-canvas-sunk px-2.5 py-1 text-xs text-ink-soft"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    )
                  ) : answer.faint ? (
                    <span className="text-ink-faint">{answer.value}</span>
                  ) : (
                    answer.value
                  )}
                </dd>
              </div>
            ))}
          </dl>

          {/* One way back in, not three. Clearing starts the diagnostic from
              nothing, so an "edit this one answer" control would have been a
              promise the store cannot keep. */}
          <div className="mt-5 border-t border-line pt-4">
            <button
              type="button"
              onClick={() => setConfirmingRestart(true)}
              className="rounded-full border border-line-strong bg-surface px-5 py-2.5 text-sm font-semibold text-ink transition duration-200 ease-spring hover:border-ink/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Start again from your CV
              <span aria-hidden="true" className="ml-1.5">
                →
              </span>
            </button>
            <p className={HELP}>Clears your answers and plan. Your account stays.</p>
          </div>
        </section>
      </main>

      <ConfirmDialog
        open={confirmingRestart}
        title="Start again?"
        confirmLabel="Clear and start again"
        cancelLabel="Keep my plan"
        onConfirm={handleRestart}
        onCancel={cancelRestart}
      >
        Your CV, answers and plan will be deleted. This can&rsquo;t be undone.
      </ConfirmDialog>
    </div>
  );
}
