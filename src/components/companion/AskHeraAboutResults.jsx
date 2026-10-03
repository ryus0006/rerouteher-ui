import { useCompanionStore } from '../../store/companionStore.js';
import HeraBot from './HeraBot.jsx';

/**
 * Inline button that opens the companion in ask mode from a results page, as
 * an alternative to the floating launcher. Opens only on user action.
 */
export default function AskHeraAboutResults({ className = '' }) {
  const openCompanion = useCompanionStore((state) => state.openCompanion);

  return (
    <button
      type="button"
      onClick={() => openCompanion('ask')}
      className={`inline-flex items-center gap-2 rounded-full border border-line-strong py-1.5 pr-3.5 pl-2 text-xs font-medium text-ink-soft transition hover:border-ink/30 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${className}`}
    >
      <HeraBot className="size-5" />
      Ask Hera about your results
    </button>
  );
}
