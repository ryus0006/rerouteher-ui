import { toFraction } from '../../lib/confidence.js';
import { formatConfidence } from '../../lib/formatters.js';

/** Badge for low-confidence (exploratory) occupation matches; renders nothing otherwise. */
export default function ConfidenceBadge({ confidence }) {
  return (
    <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
      Exploratory match
      <span className="sr-only"> — {formatConfidence(toFraction(confidence))} confidence</span>
    </span>
  );
}
