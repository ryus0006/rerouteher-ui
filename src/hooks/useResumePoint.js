import { journeyProgress } from '../lib/journeyProgress.js';
import { useAccountStore } from '../store/accountStore.js';
import { useIntakeStore } from '../store/intakeStore.js';

/**
 * Resolves the landing-page CTA label and destination from the user's
 * progress: start, resume, or return.
 *
 * The resume target comes from `journeyProgress`, the same source the journey
 * dashboard uses, so both always agree.
 *
 * Finished guests are sent to the gap screen, since the journey route requires
 * an account.
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
