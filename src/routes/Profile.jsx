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
 * Formats the user's intake answers for display. Includes inputs only;
 * computed results are shown on the journey page.
 *
 * The store holds ids, so labels are resolved through the same config the
 * intake screens use.
 */
function useAnswers() {
  const cv = useIntakeStore((state) => state.cv);
  const careerBreak = useIntakeStore((state) => state.break);
  const employerPriorities = useIntakeStore((state) => state.employerPriorities);

  // `careerBreak` is absent until the break step has been completed.
  const years = careerBreak?.duration_years ?? 0;
  const activities = careerBreak?.activities ?? [];
  const answered = activities.length > 0;

  return [
    { id: 'cv', label: 'CV', value: cv?.fileName ?? 'Not uploaded' },
    {
      id: 'break',
      label: 'Career break',
      /* A duration of 0 is valid ("less than a year"), so the step counts as
         answered once at least one activity is selected, matching the break
         screen's own check. */
      value: !answered
        ? 'Not answered yet'
        : years === 0
          ? 'Less than a year'
          : `${years} ${years === 1 ? 'year' : 'years'}`,
      faint: !answered,
    },
    {
      id: 'activities',
      label: 'During your break',
      // List activity labels rather than a count.
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
 * Profile page: editable display name and a read-only summary of intake
 * answers. Answers cannot be edited individually; changing them means
 * restarting the diagnostic.
 */
export default function Profile() {
  const navigate = useSmoothNavigate();
  const user = useAccountStore((state) => state.user);
  const setDisplayName = useAccountStore((state) => state.setDisplayName);
  const answers = useAnswers();
  const resetJourney = useIntakeStore((state) => state.reset);

  /* Initialised once from the store; nothing else updates the name while
     this page is mounted, so no syncing effect is needed. */
  const [draft, setDraft] = useState(() => {
    const stored = useAccountStore.getState().user;
    return stored ? resolveDisplayName(stored) : '';
  });
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [confirmingRestart, setConfirmingRestart] = useState(false);
  // Memoised so the dialog's key listener is not re-bound on every render.
  const cancelRestart = useCallback(() => setConfirmingRestart(false), []);

  // Account-only route.
  if (!user) return <Navigate to="/" replace />;

  function handleSubmit(event) {
    event.preventDefault();

    const message = validateDisplayName(draft);
    setError(message);
    if (message) return;

    setDisplayName(draft.trim() || user.username);
    setSaved(true);
  }

  /* Full reset, including the snapshot, priorities and any stashed previous
     plan. Plan sync then saves the empty plan to the account. */
  function handleRestart() {
    resetJourney();
    setConfirmingRestart(false);
    navigate('/diagnostic/background');
  }

  const dirty = draft.trim() !== resolveDisplayName(user);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="page-shell max-w-[720px] flex-1 pt-14 pb-20">
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
                  {/* Multi-value answers render as chips, since lists can be long. */}
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

          {/* Single restart action; the store does not support editing one answer
              in isolation. */}
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
