import { useCompanionStore } from '../../store/companionStore.js';

/**
 * A quiet, contextual entry into results Q&A (US8.2), placed where her results
 * already are so "opens the companion from her results" is a real affordance and
 * not only the floating bubble. It opens on her tap in ask mode; nothing opens on
 * its own, which is what the UX calls for.
 */
export default function AskHeraAboutResults({ className = '' }) {
  const openCompanion = useCompanionStore((state) => state.openCompanion);

  return (
    <button
      type="button"
      onClick={() => openCompanion('ask')}
      className={`inline-flex items-center gap-1.5 rounded-full border border-line-strong px-3.5 py-1.5 text-xs font-medium text-ink-soft transition hover:border-ink/30 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${className}`}
    >
      <span aria-hidden="true">💬</span>
      Ask Hera about your results
    </button>
  );
}
