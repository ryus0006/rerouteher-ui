import { journeyProgress } from '../lib/journeyProgress.js';
import { useAccountStore } from '../store/accountStore.js';
import { useIntakeStore } from '../store/intakeStore.js';

/**
 * Where the front page's button should send her, and what it should say.
 *
 * The button reads her state rather than offering one fixed thing: start,
 * resume, or return. Offering "Get started" to a woman who has finished would
 * send her to the upload screen with nothing to upload.
 *
 * The screen itself comes from `journeyProgress`, which is what the dashboard
 * counts with too. One answer to "where did she stop", so the two places that
 * offer to take her back cannot send her to different rooms.
 *
 * A guest is sent to the gap screen rather than the journey, which is
 * account-only and would bounce her straight back here.
 *
 * @param {{ cvParsed: boolean, activities: string[], employerPriorities: string[], snapshot: object | null, gapResult: object | null, signedIn: boolean }} state
 * @returns {{ label: string, to: string, started: boolean }}
 */
export function resumePoint({
  cvParsed,
  activities,
  employerPriorities,
  snapshot,
  gapResult,
  signedIn,
}) {
  if (gapResult) {
    return signedIn
      ? { label: 'Go to my journey', to: '/journey', started: true }
      : { label: 'Back to my results', to: '/diagnostic/gap', started: true };
  }

  const { completed, next } = journeyProgress({
    cvParsed,
    activities,
    employerPriorities,
    snapshot,
    gapResult,
  });

  return completed === 0
    ? { label: 'Get started', to: next.to, started: false }
    : { label: 'Continue where you left off', to: next.to, started: true };
}

export default function useResumePoint() {
  const cvParsed = useIntakeStore((state) => state.cvParsed);
  const activities = useIntakeStore((state) => state.break.activities);
  const employerPriorities = useIntakeStore((state) => state.employerPriorities);
  const snapshot = useIntakeStore((state) => state.snapshot);
  const gapResult = useIntakeStore((state) => state.gapResult);
  const signedIn = useAccountStore((state) => Boolean(state.user));

  return resumePoint({
    cvParsed,
    activities,
    employerPriorities,
    snapshot,
    gapResult,
    signedIn,
  });
}
