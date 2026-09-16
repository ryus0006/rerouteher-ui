import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import useSmoothNavigate from '../../hooks/useSmoothNavigate.js';
import Header from '../../components/layout/Header.jsx';
import BackLink from '../../components/intake/BackLink.jsx';
import { PRIORITY_NAMES } from '../../config/employerPriorities.js';
import { matchEmployers } from '../../api/employers.js';
import { useAccountStore } from '../../store/accountStore.js';
import { useIntakeStore } from '../../store/intakeStore.js';

/**
 * How well an employer answered, said in words.
 *
 * Words rather than a percentage on purpose: a number implies a measurement
 * she could audit, and there is nothing behind it but a count of three. "Two
 * of your priorities", stated beside it, is the audit.
 */
function matchLabel(met, total) {
  if (met === total) return { text: 'Strong match', tone: 'bg-verify-soft text-verify' };
  if (met * 2 >= total) return { text: 'Good match', tone: 'bg-verify-soft text-verify' };
  return { text: 'Partial match', tone: 'bg-canvas-sunk text-ink-soft' };
}

/** The company's own mark, stood in for by its name on its own colour. */
function LogoTile({ logo, name }) {
  return (
    <span
      aria-hidden="true"
      style={{ backgroundColor: logo?.bg ?? 'var(--color-canvas-sunk)', color: logo?.fg ?? '#fff' }}
      className={[
        'flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl px-1 text-center font-bold leading-tight',
        // A wordmark stands in for the logo, so the longer ones have to shrink
        // to stay inside the square rather than run out of it.
        (logo?.text ?? name).length > 7 ? 'text-[0.5625rem]' : 'text-[0.6875rem]',
      ].join(' ')}
    >
      {logo?.text ?? name}
    </span>
  );
}

/**
 * One employer, answered against the priorities she chose.
 *
 * One source, not one per priority. Every disclosure comes from the same
 * document, so citing it beside each chip would repeat a single link three
 * times and make one reading look like three. The chips say what was found;
 * the report link is where she can check all of it at once.
 */
function EmployerCard({ employer }) {
  const total = employer.met.length + employer.unmet.length;
  const label = matchLabel(employer.met.length, total);

  return (
    <article className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex flex-wrap items-start gap-4 p-5 sm:flex-nowrap sm:p-6">
        <LogoTile logo={employer.logo} name={employer.name} />

        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-bold tracking-[-0.01em] text-ink">
            {employer.name}
          </h2>
          <p className="mt-0.5 text-sm text-ink-soft">
            {employer.industry} · {employer.location}
          </p>
          <p className="mt-2.5 max-w-[62ch] text-sm leading-relaxed text-ink-soft">
            {employer.summary}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <span
            className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${label.tone}`}
          >
            {label.text}
          </span>
          <p className="mt-1 text-xs text-ink-soft">
            {employer.met.length} of your {total} {total === 1 ? 'priority' : 'priorities'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-5 pb-5 sm:px-6">
        {employer.met.map((id) => (
          <span
            key={id}
            className="inline-flex items-center gap-1.5 rounded-full bg-verify-soft px-3 py-1.5 text-xs font-medium text-verify"
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="size-3"
            >
              <path d="m3.5 8.5 3 3 6-7" />
            </svg>
            {PRIORITY_NAMES[id]}
          </span>
        ))}

        {employer.unmet.map((id) => (
          <span
            key={id}
            className="inline-flex flex-col rounded-full bg-canvas-sunk px-3 py-1 text-xs text-ink-faint"
          >
            <span className="font-medium">{PRIORITY_NAMES[id]}</span>
            <span>Not found in report</span>
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-line px-5 py-3.5 sm:px-6">
        <a
          href={employer.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-pink-600 underline decoration-transparent underline-offset-4 transition hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          View company details
          <span aria-hidden="true" className="ml-1">
            →
          </span>
          <span className="sr-only">, opens {employer.name} in a new tab</span>
        </a>

        {employer.report ? (
          <p className="text-xs text-ink-soft">
            Read from{' '}
            <a
              href={employer.report.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-ink-soft underline underline-offset-2 transition hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {employer.report.label}
              <span aria-hidden="true" className="ml-0.5">
                ↗
              </span>
              <span className="sr-only">, opens in a new tab</span>
            </a>
          </p>
        ) : (
          <p className="text-xs text-ink-faint">Source report not yet published</p>
        )}
      </div>
    </article>
  );
}

/**
 * Step two of the employer fit finder: who published something about what she
 * asked for (E9).
 */
export default function EmployerMatches() {
  const navigate = useSmoothNavigate();
  const snapshot = useIntakeStore((state) => state.snapshot);
  const selectedRole = useIntakeStore((state) => state.selectedRole);
  const gapResult = useIntakeStore((state) => state.gapResult);
  const priorities = useIntakeStore((state) => state.employerPriorities);
  const user = useAccountStore((state) => state.user);

  const [employers, setEmployers] = useState(null);
  const [error, setError] = useState(null);

  const chosen = priorities ?? [];
  const key = chosen.join('|');

  useEffect(() => {
    if (!gapResult || key === '') return undefined;

    let live = true;

    matchEmployers({ priorities: key.split('|'), targetRoleId: selectedRole?.role_id })
      .then((result) => {
        if (!live) return;
        setEmployers(result.employers);
        setError(null);
      })
      .catch((cause) => live && setError(cause.message));

    return () => {
      live = false;
    };
  }, [key, gapResult, selectedRole]);

  if (!snapshot || !gapResult) return <Navigate to="/diagnostic/gap" replace />;
  // Nothing was asked, so there is nothing to answer.
  if (chosen.length === 0) return <Navigate to="/plan/employers" replace />;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto w-full max-w-[980px] flex-1 px-5 py-10 sm:px-6 sm:py-14">
        {/* The journey for an account, the gap screen for a guest, who has no
            journey to be sent to. */}
        {user ? (
          <BackLink to="/journey">Back to your journey</BackLink>
        ) : (
          <BackLink to="/diagnostic/gap">Back to your readiness</BackLink>
        )}

        <div className="mt-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div className="min-w-0 flex-1">
            <p className="eyebrow text-pink-600">Employer fit finder</p>
            <h1 className="mt-2 font-display text-3xl font-bold leading-[1.1] tracking-[-0.02em] text-ink sm:text-4xl">
              Your employer matches
            </h1>
            <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-ink-soft">
              Based on publicly available ESG and sustainability disclosures from Malaysian listed
              companies.
            </p>
          </div>

          {/* The count and the way to change it, together: the answer to "why
              these companies" is the priorities she picked, so the control that
              rewrites them belongs beside the number they produced. */}
          <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
            {employers && (
              <p className="text-sm text-ink-soft">
                {employers.length} {employers.length === 1 ? 'company' : 'companies'} found
              </p>
            )}

            <button
              type="button"
              onClick={() => navigate('/plan/employers')}
              className="-mx-2 rounded-full px-2 py-1 text-sm text-ink-soft underline underline-offset-2 transition hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Adjust priorities
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-8 text-sm font-medium text-pink-600">
            {error} Reload the page to try again.
          </p>
        )}

        {!employers && !error && (
          <p className="mt-8 text-sm text-ink-soft">Reading company disclosures…</p>
        )}

        {employers?.length === 0 && (
          <p className="mt-8 max-w-[56ch] text-sm leading-relaxed text-ink-soft">
            No company in our set has published anything about what you chose. That is a finding
            about the disclosures, not about you — try a different priority.
          </p>
        )}

        {employers?.map((employer) => (
          <EmployerCard key={employer.id} employer={employer} />
        ))}

        {employers?.length > 0 && (
          <aside className="mt-8 flex gap-3 rounded-2xl border border-line bg-canvas-sunk p-5">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-ink-faint"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v5M12 8h.01" strokeLinecap="round" />
            </svg>
            <p className="max-w-[74ch] text-sm leading-relaxed text-ink-soft">
              <span className="font-semibold text-ink">Important note</span> — recommendations are
              based on publicly available information in company ESG and sustainability reports.
              They do not guarantee individual workplace experiences.
            </p>
          </aside>
        )}
      </main>
    </div>
  );
}
