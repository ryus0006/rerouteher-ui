import { savePlan } from '../api/account.js';
import { useAccountStore } from './accountStore.js';
import { useIntakeStore } from './intakeStore.js';

/* Long enough that a slider being dragged or a chip being toggled repeatedly
   is one save rather than twenty, short enough that closing the tab straight
   after an edit still catches it. */
const QUIET_MS = 800;

const serialise = () => JSON.stringify(useIntakeStore.getState().exportPlan());

/**
 * Keeps a signed-in woman's account copy level with what she has on screen.
 *
 * Every edit after account creation — a redone diagnostic, a different target
 * role, her employer priorities — is written back to the account, so signing
 * in on another device brings all of it and not just the plan as it stood at
 * sign-up.
 *
 * Started explicitly from `main.jsx` rather than on import, so tests reach for
 * it when they mean to and are not given background traffic they did not ask
 * for.
 *
 * @returns {() => void} stops syncing
 */
export function startPlanSync() {
  let timer = null;
  let saved = null;
  // The write the debounce is still holding, kept so it can be sent early.
  let queued = null;

  function send({ plan }) {
    saved = plan;

    savePlan({ plan: JSON.parse(plan) }).catch(() => {
      /* Losing the round trip must not lose the edit: clearing the baseline
         means the next change she makes carries this one to the server too.
         Nothing is said on screen — she did not ask for a save, and her work
         is still on the device either way. */
      saved = null;
    });
  }

  /* Sends the waiting write now rather than in another half second. Signing
     out clears the device, so an edit still sitting in the debounce would be
     the one thing that never reached the account. */
  function flush() {
    if (!queued) return;
    clearTimeout(timer);
    timer = null;

    const write = queued;
    queued = null;
    send(write);
  }

  /* Signing in or out changes whose plan this is rather than editing one. The
     baseline moves with it, so an import is not immediately posted back and a
     sign-out cannot leave one edit queued against the previous account. */
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
