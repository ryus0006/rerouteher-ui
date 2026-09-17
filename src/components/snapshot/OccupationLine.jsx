import { isHighConfidence } from '../../lib/confidence.js';
import ConfidenceBadge from './ConfidenceBadge.jsx';

/**
 * Attribution for the skills below: the occupation her CV reads as. A weak read
 * carries a badge and guidance, since it decides which roles are offered later.
 */
export default function OccupationLine({ occupation }) {
  if (!occupation) {
    return (
      <p className="mt-2 text-sm text-ink-soft sm:text-base">
        Here is what you already bring. No suitable match found for a previous occupation, so you
        can pick any target role on the next step.
      </p>
    );
  }

  const exploratory = !isHighConfidence(occupation.confidence);

  return (
    <>
      <p className="mt-2 text-sm text-ink-soft sm:text-base">
        {/* She may never have uploaded one: the conversational route reaches
            this same screen, and crediting a CV she does not have is wrong. */}
        {occupation.method === 'conversation'
          ? 'Here is what you already bring, based on what you told us about your work as a '
          : 'Here is what you already bring, based on your CV as a '}
        <strong className="font-semibold text-ink">{occupation.role}</strong>.
      </p>

      {exploratory && (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
          <ConfidenceBadge confidence={occupation.confidence} />
          Treat this as a starting point rather than a verdict — you can switch to any role on the
          next step.
        </p>
      )}
    </>
  );
}
