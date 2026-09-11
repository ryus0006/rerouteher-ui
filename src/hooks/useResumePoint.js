import { useAccountStore } from '../store/accountStore.js';
import { useIntakeStore } from '../store/intakeStore.js';

/**
 * Where the front page's button should send her, and what it should say.
 *
 * A woman who has already finished was still being offered "Get started",
 * which is how she ended up back at the upload screen with nothing to upload.
 * The button reads her state instead: start, resume, or return.
 *
 * A guest is sent to the gap screen rather than the journey, which is
 * account-only and would bounce her straight back here.
 *
 * @param {{ cvParsed: boolean, snapshot: object | null, gapResult: object | null, signedIn: boolean }} state
 * @returns {{ label: string, to: string, started: boolean }}
 */
export function resumePoint({ cvParsed, snapshot, gapResult, signedIn }) {
  if (gapResult) {
    return signedIn
      ? { label: 'Go to my journey', to: '/journey', started: true }
      : { label: 'Back to my results', to: '/diagnostic/gap', started: true };
  }

  if (snapshot) {
    return { label: 'Continue where you left off', to: '/diagnostic/snapshot', started: true };
  }

  if (cvParsed) {
    return { label: 'Continue where you left off', to: '/diagnostic/break', started: true };
  }

  return { label: 'Get started', to: '/diagnostic/background', started: false };
}

export default function useResumePoint() {
  const cvParsed = useIntakeStore((state) => state.cvParsed);
  const snapshot = useIntakeStore((state) => state.snapshot);
  const gapResult = useIntakeStore((state) => state.gapResult);
  const signedIn = useAccountStore((state) => Boolean(state.user));

  return resumePoint({ cvParsed, snapshot, gapResult, signedIn });
}
