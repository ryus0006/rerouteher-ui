import { useAccountStore } from '../../store/accountStore.js';

/**
 * Confirms the work has somewhere to live, from the snapshot onward.
 *
 * Only the signed-in state is worth a strip. Guests get no counterpart: the
 * state is already legible from the Sign in button in the header, and a
 * standing banner about it would spend attention on a worry with nothing
 * behind it.
 */
export default function SavedStrip() {
  const user = useAccountStore((state) => state.user);

  if (!user) return null;

  return (
    <div className="border-b border-line bg-verify-soft">
      <p className="mx-auto flex max-w-[1000px] items-center gap-2 px-4 py-2 text-xs text-verify sm:px-6">
        <span aria-hidden="true">✓</span>
        Saved to your account · All changes saved
      </p>
    </div>
  );
}
