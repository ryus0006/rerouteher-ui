import { savePlan } from '../api/account.js';
import { useAccountStore } from './accountStore.js';
import { useIntakeStore } from './intakeStore.js';

/* Debounce interval: batches rapid edits into one save while keeping the
   delay short enough to complete before the tab is closed. */
const QUIET_MS = 800;

const serialise = () => JSON.stringify(useIntakeStore.getState().exportPlan());

/**
 * Syncs the signed-in user's plan to their account, debouncing local changes
 * and saving them with `savePlan`.
 *
 * Started explicitly from `main.jsx` rather than on import, so tests opt in
 * and do not generate unexpected background requests.
 *
 * @returns {() => void} stops syncing
 */
export function startPlanSync() {
  let timer = null;
  let saved = null;
  // Pending debounced write, retained so it can be flushed early.
  let queued = null;

  function send({ plan }) {
    saved = plan;

    savePlan({ plan: JSON.parse(plan) }).catch(() => {
      /* On failure, reset the baseline so the next change re-sends this edit.
         Failures are silent; the data remains on the device. */
      saved = null;
    });
  }

  /* Sends any pending write immediately. Called when the account changes, so a
     debounced edit is saved before sign-out clears local data. */
  function flush() {
    if (!queued) return;
    clearTimeout(timer);
    timer = null;

    const write = queued;
    queued = null;
    send(write);
  }

  /* On sign-in or sign-out, flush any pending edit to the previous account,
     then reset the baseline so an imported plan is not posted straight back. */
  const releaseAccount = useAccountStore.subscribe((state, previous) => {
    if (state.user?.username === previous.user?.username) return;
    flush();
    saved = state.user ? serialise() : null;
  });

  const releaseIntake = useIntakeStore.subscribe(() => {
    const { user } = useAccountStore.getState();
    if (!user) return;

    const plan = serialise();
    if (plan === saved) return;

    clearTimeout(timer);
    queued = { plan };
    timer = setTimeout(flush, QUIET_MS);
  });

  return () => {
    clearTimeout(timer);
    releaseAccount();
    releaseIntake();
  };
}
