import useSmoothNavigate from '../../hooks/useSmoothNavigate.js';

/** Return to the previous step. Sits under the stepper on every screen. */
export default function BackLink({ to, children }) {
  const navigate = useSmoothNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className="-ml-2 rounded-full px-2 py-1 text-sm text-ink-soft transition hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <span aria-hidden="true">←</span> {children}
    </button>
  );
}
