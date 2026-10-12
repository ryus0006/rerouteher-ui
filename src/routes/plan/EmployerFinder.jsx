import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import useSmoothNavigate from '../../hooks/useSmoothNavigate.js';
import Header from '../../components/layout/Header.jsx';
import GradientButton from '../../components/ui/GradientButton.jsx';
import HowItWorks from '../../components/employers/HowItWorks.jsx';
import PriorityPicker from '../../components/employers/PriorityPicker.jsx';
import { useAccountStore } from '../../store/accountStore.js';
import { useIntakeStore } from '../../store/intakeStore.js';

/** Summarises how the current selection differs from the baseline search. */
function changeSummary(added, removed) {
  if (added === 0 && removed === 0) return 'Same as your last search';

  const parts = [];
  if (added > 0) parts.push(`${added} added`);
  if (removed > 0) parts.push(`${removed} removed`);
  return `${parts.join(' · ')} since your last search`;
}

/**
 * Adjust-priorities page, reached from the employer matches. Edits the
 * priorities used for matching, then returns to the matches.
 */
export default function EmployerFinder() {
  const navigate = useSmoothNavigate();
  const snapshot = useIntakeStore((state) => state.snapshot);
  const gapResult = useIntakeStore((state) => state.gapResult);
  const priorities = useIntakeStore((state) => state.employerPriorities);
  const setPriorities = useIntakeStore((state) => state.setEmployerPriorities);
  const user = useAccountStore((state) => state.user);

  // Priorities used for the current results; used to show changes and restored on Cancel.
  const [baseline] = useState(() => priorities ?? []);

  // Guests are sent to the matches page, which asks them to sign in.
  if (!user) return <Navigate to="/plan/employers/matches" replace />;
  if (!snapshot || !gapResult) return <Navigate to="/diagnostic/gap" replace />;

  const chosen = priorities ?? [];
  const added = chosen.filter((id) => !baseline.includes(id)).length;
  const removed = baseline.filter((id) => !chosen.includes(id)).length;

  function toggle(id) {
    setPriorities(chosen.includes(id) ? chosen.filter((value) => value !== id) : [...chosen, id]);
  }

  function cancel() {
    setPriorities(baseline);
    navigate('/plan/employers/matches');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Compact spacing keeps the actions visible without scrolling. */}
      <main className="page-shell max-w-[900px] flex-1 py-10 max-md:py-8">
        <h1 className="font-display text-[2rem] font-bold leading-[1.12] tracking-[-0.02em] text-ink max-md:text-[1.75rem]">
          What matters most for your return?
        </h1>
        <p className="mt-2 text-sm text-ink-soft">Select all the priorities that matter to you.</p>

        <div className="mt-5">
          <PriorityPicker chosen={chosen} baseline={baseline} onToggle={toggle} />
        </div>

        <div className="mt-6">
          <HowItWorks compact />
        </div>

        {/* Actions bar: Cancel on the left; selection summary and submit on the right.
            On phones it stacks: submit, summary, then Cancel. */}
        <div className="mt-6 flex items-center justify-between gap-6 max-sm:flex-col-reverse max-sm:items-stretch max-sm:gap-3">
          {/* Cancel is shown only when a previous search exists; with no
              priorities the matches page redirects back here. */}
          {baseline.length > 0 ? (
            <GradientButton
              variant="secondary"
              size="md"
              onClick={cancel}
              className="max-sm:w-full"
            >
              Cancel
            </GradientButton>
          ) : (
            <span className="max-sm:hidden" />
          )}

          <div className="flex items-center gap-5 max-sm:flex-col-reverse max-sm:items-stretch max-sm:gap-3">
            <p aria-live="polite" className="text-right max-sm:text-center">
              <span className="block text-sm text-ink">
                <span className="tabular font-semibold">{chosen.length}</span>{' '}
                {chosen.length === 1 ? 'priority' : 'priorities'} chosen
              </span>
              <span className="block text-xs text-ink-faint">
                {chosen.length === 0
                  ? 'Choose at least one to see your matches'
                  : changeSummary(added, removed)}
              </span>
            </p>

            <GradientButton
              variant="accent"
              disabled={chosen.length === 0}
              onClick={() => navigate('/plan/employers/matches')}
              className="max-sm:w-full"
            >
              See your matches
              <span aria-hidden="true">→</span>
            </GradientButton>
          </div>
        </div>
      </main>
    </div>
  );
}
