import { useAccountStore } from '../store/accountStore.js';
import { useIntakeStore } from '../store/intakeStore.js';

/**
 * Where the front page's button should send her, and what it should say.
 *
 * The button reads her state rather than offering one fixed thing: start,
 * resume, or return. Offering "Get started" to a woman who has finished would
 * send her to the upload screen with nothing to upload.
 *
 * A guest is sent to the gap screen rather than the journey, which is
 * account-only and would bounce her straight back here.
 *
 * @param {{ cvParsed: boolean, activities: string[], snapshot: object | null, gapResult: object | null, signedIn: boolean }} state
 * @returns {{ label: string, to: string, started: boolean }}
 */
export function resumePoint({ cvParsed, activities, snapshot, gapResult, signedIn }) {
  if (gapResult) {
    return signedIn
      ? { label: 'Go to my journey', to: '/journey', started: true }
      : { label: 'Back to my results', to: '/diagnostic/gap', started: true };
  }

  if (snapshot) {
    return { label: 'Continue where you left off', to: '/diagnostic/snapshot', started: true };
  }

  /* An activity is what finishes the career break step, so it is what separates
     a woman waiting on the priorities question from one still answering the
     break. Both look alike before the snapshot without it. */
  if (cvParsed && activities.length > 0) {
    return { label: 'Continue where you left off', to: '/diagnostic/priorities', started: true };
  }

  if (cvParsed) {
    return { label: 'Continue where you left off', to: '/diagnostic/break', started: true };
  }

  return { label: 'Get started', to: '/diagnostic/background', started: false };
}

export default function useResumePoint() {
  const cvParsed = useIntakeStore((state) => state.cvParsed);
  const activities = useIntakeStore((state) => state.break.activities);
  const snapshot = useIntakeStore((state) => state.snapshot);
  const gapResult = useIntakeStore((state) => state.gapResult);
  const signedIn = useAccountStore((state) => Boolean(state.user));

  return resumePoint({ cvParsed, activities, snapshot, gapResult, signedIn });
}
