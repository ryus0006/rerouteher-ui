import { useEffect, useRef, useState } from 'react';
import useSmoothNavigate from '../../hooks/useSmoothNavigate.js';
import { useAccountStore } from '../../store/accountStore.js';
import { hasJourney, useIntakeStore } from '../../store/intakeStore.js';
import {
  createAccount,
  resolveDisplayName,
  savePlan,
  signIn,
  validateDisplayName,
  validatePassword,
  validateUsername,
} from '../../api/account.js';

const FIELD =
  'mt-1.5 w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600';

const LABEL = 'text-sm font-medium text-ink';
const HELP = 'mt-1.5 text-xs text-ink-soft';
const ERROR = 'mt-1.5 text-xs font-medium text-pink-600';

/**
 * Create an account, or sign in. Opens over whatever screen she is on: the URL
 * does not change and the result behind it stays rendered, so this reads as
 * keeping her work rather than being sent somewhere to register.
 */
export default function AccountSheet() {
  const navigate = useSmoothNavigate();
  const mode = useAccountStore((state) => state.sheet);
  const closeSheet = useAccountStore((state) => state.closeSheet);
  const openSheet = useAccountStore((state) => state.openSheet);
  const setUser = useAccountStore((state) => state.setUser);
  const sheetRedirect = useAccountStore((state) => state.sheetRedirect);

  const panelRef = useRef(null);
  const firstFieldRef = useRef(null);
  const openerRef = useRef(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const creating = mode === 'create';

  /* Errors are cleared on the way out rather than on the way in, so opening the
     sheet never has to write state from inside an effect. */
  function dismiss() {
    setErrors({});
    closeSheet();
  }

  function switchMode() {
    setErrors({});
    openSheet(creating ? 'signIn' : 'create');
  }

  useEffect(() => {
    if (!mode) return undefined;

    openerRef.current = document.activeElement;
    firstFieldRef.current?.focus();

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setErrors({});
        closeSheet();
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
      openerRef.current?.focus?.();
    };
  }, [mode, closeSheet]);

  if (!mode) return null;

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = creating
      ? {
          username: validateUsername(username),
          password: validatePassword(password),
          displayName: validateDisplayName(displayName),
        }
      : {};

    const blocking = Object.fromEntries(Object.entries(nextErrors).filter(([, value]) => value));
    setErrors(blocking);
    if (Object.keys(blocking).length > 0) return;

    setSubmitting(true);

    try {
      const result = creating
        ? await createAccount({
            username,
            password,
            displayName,
            plan: useIntakeStore.getState().exportPlan(),
          })
        : await signIn({ username, password });

      const store = useIntakeStore.getState();
      const onDevice = store.exportPlan();

      /* Signing in means "take me back to my work", so the saved journey
         replaces whatever this device was holding — unless there is no saved
         journey to speak of. An account made before the diagnostic was started
         holds an empty plan, and letting that win would wipe the CV, snapshot
         and readiness she built as a guest in the meantime.

         It lands before the account does: `setUser` is what tells the sync
         whose plan to keep, and putting it second stops the import being
         posted straight back to the server it just came from. */
      const keptDevice = !creating && !hasJourney(result.plan);
      if (!creating && !keptDevice) store.importPlan(result.plan);

      setUser({
        username: result.username,
        displayName: resolveDisplayName({
          displayName: result.display_name,
          username: result.username,
        }),
      });

      // Her work is now the account's only copy, and the sync's baseline was
      // just set to it, so this is the one save it will not make by itself.
      // The server reads the session cookie the create/sign-in just set, so no
      // username travels in the body.
      if (keptDevice && hasJourney(onDevice)) {
        await savePlan({ plan: onDevice });
      }

      if (!creating) navigate('/journey');
      /* Signing up before starting is a decision to begin, so she is taken to
         the beginning rather than left on the page she signed up from. */
      else if (!hasJourney(onDevice)) navigate('/diagnostic/background');
      /* Signing up with work in hand keeps her where she is by default (US5.2.3),
         unless the opener asked for a destination — the "What's next" card sends
         her to the journey dashboard (US5.2.2). */
      else if (sheetRedirect) navigate(sheetRedirect);
    } catch (cause) {
      setErrors({ form: cause.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        onClick={dismiss}
        data-no-press
        className="account-sheet-backdrop absolute inset-0 bg-ink/35 backdrop-blur-[2px]"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-sheet-title"
        className="account-sheet-panel relative max-h-[92vh] w-full max-w-[30rem] overflow-y-auto rounded-t-3xl border border-line bg-surface p-6 shadow-sheet sm:rounded-3xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="account-sheet-title" className="font-display text-xl font-bold text-ink">
              {creating ? 'Create your account' : 'Sign in'}
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              {creating
                ? "It's free, and it takes about thirty seconds."
                : 'Pick up your plan where you left it.'}
            </p>
          </div>

          <button
            type="button"
            onClick={dismiss}
            aria-label="Close"
            className="-mr-1 -mt-1 shrink-0 rounded-full p-2 text-ink-faint transition hover:bg-canvas-sunk hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
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
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="account-username" className={LABEL}>
              Username
            </label>
            <input
              ref={firstFieldRef}
              id="account-username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className={FIELD}
            />
            {errors.username && <p className={ERROR}>{errors.username}</p>}
          </div>

          <div>
            <label htmlFor="account-password" className={LABEL}>
              Password
            </label>
            <div className="relative">
              <input
                id="account-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={creating ? 'new-password' : 'current-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={`${FIELD} pr-20`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-medium text-ink-soft transition hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password ? (
              <p className={ERROR}>{errors.password}</p>
            ) : (
              creating && <p className={HELP}>At least 8 characters.</p>
            )}
          </div>

          {creating && (
            <div>
              <label htmlFor="account-display-name" className={LABEL}>
                Display name <span className="font-normal text-ink-faint">— optional</span>
              </label>
              <input
                id="account-display-name"
                name="displayName"
                autoComplete="nickname"
                placeholder={username.trim() || 'Your name'}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className={FIELD}
              />
              {errors.displayName ? (
                <p className={ERROR}>{errors.displayName}</p>
              ) : (
                <p className={HELP}>
                  What we&rsquo;ll call you on screen. Your username stays private. Change it
                  whenever you like.
                </p>
              )}
            </div>
          )}

          {errors.form && (
            <p role="alert" className="text-sm font-medium text-pink-600">
              {errors.form}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white shadow-card transition duration-200 ease-spring hover:bg-plane-2 hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:pointer-events-none disabled:opacity-40"
          >
            {submitting
              ? creating
                ? 'Creating your account…'
                : 'Signing in…'
              : creating
                ? 'Create account and continue'
                : 'Sign in'}
          </button>
        </form>

        <p className="mt-4 text-sm text-ink-soft">
          {creating ? 'Already have an account? ' : 'No account yet? '}
          <button
            type="button"
            onClick={switchMode}
            className="font-semibold text-pink-600 underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            {creating ? 'Sign in' : 'Create one'}
          </button>
        </p>

        <p className="mt-3 border-t border-line pt-3 text-xs text-ink-soft">
          Your username signs you in. No email, and nothing is shared with employers.
        </p>
      </div>
    </div>
  );
}
