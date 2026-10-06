import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import useSmoothNavigate from '../../hooks/useSmoothNavigate.js';
import Header from '../../components/layout/Header.jsx';
import BackLink from '../../components/intake/BackLink.jsx';
import AskHeraAboutResults from '../../components/companion/AskHeraAboutResults.jsx';
import TargetRoleSelect from '../../components/plan/TargetRoleSelect.jsx';
import PriorityIcon from '../../components/employers/PriorityIcon.jsx';
import { PRIORITY_NAMES } from '../../config/employerPriorities.js';
import { matchEmployers } from '../../api/employers.js';
import { useAccountStore } from '../../store/accountStore.js';
import { useIntakeStore } from '../../store/intakeStore.js';

/**
 * Text label for match strength. A percentage is avoided because the score is
 * only a count of met priorities.
 */
function matchLabel(met, total) {
  if (met === total) return { text: 'Strong match', tone: 'text-verify' };
  if (met * 2 >= total) return { text: 'Good match', tone: 'text-verify' };
  return { text: 'Partial match', tone: 'text-ink-soft' };
}

function formatFoundAt(value) {
  if (!value) return 'date unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

const CHECK_PATH = 'm3.5 8.5 3 3 6-7';

/** Circular arrow badge placed at the inner edge of a pill button. */
function ArrowBadge({ direction = 'right', className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={[
        'flex size-7 shrink-0 items-center justify-center rounded-full',
        'transition-transform duration-500 ease-spring group-hover:scale-105',
        direction === 'out'
          ? 'group-hover:translate-x-0.5 group-hover:-translate-y-px'
          : 'group-hover:translate-x-0.5',
        className,
      ].join(' ')}
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-3.5"
      >
        {direction === 'out' ? (
          <path d="M5.5 10.5 10.5 5.5M6 5.5h4.5V10" />
        ) : (
          <path d="M3.5 8h9M9 4.5 12.5 8 9 11.5" />
        )}
      </svg>
    </span>
  );
}

/** Logo placeholder: the company name on its brand colour. */
function LogoTile({ logo, logoUrl, name }) {
  // Show the image logo when present; fall back to the initials/name badge if it is
  // missing or fails to load.
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(logoUrl) && !imageFailed;
  const long = (logo?.text ?? name).length > 7;

  return (
    <span
      aria-hidden="true"
      style={
        showImage
          ? undefined
          : { backgroundColor: logo?.bg ?? 'var(--color-canvas-sunk)', color: logo?.fg ?? '#fff' }
      }
      className={[
        'flex shrink-0 items-center justify-center overflow-hidden rounded-2xl text-center font-bold leading-tight',
        'shadow-[inset_0_0_0_1px_rgb(44_33_66/0.06)]',
        'size-14',
        showImage ? 'bg-white p-1.5' : 'px-1',
        // Smaller text for long names so they fit the tile.
        long ? 'text-[0.625rem]' : 'text-[0.75rem]',
      ].join(' ')}
    >
      {showImage ? (
        <img
          src={logoUrl}
          alt=""
          loading="lazy"
          className="size-full object-contain"
          onError={() => setImageFailed(true)}
        />
      ) : (
        logo?.text ?? name
      )}
    </span>
  );
}

/**
 * Segmented met/total meter. Decorative; the adjacent label conveys the same count.
 */
function MatchMeter({ met, total }) {
  return (
    <span aria-hidden="true" className="flex gap-1">
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={`h-1.5 w-6 rounded-full ${index < met ? 'bg-verify' : 'bg-ink/10'}`}
        />
      ))}
    </span>
  );
}

/**
 * Per-priority result list: each selected priority marked as found or not
 * found in the employer's report.
 */
function PriorityLedger({ met, unmet }) {
  return (
    <ul aria-label="Your priorities" className="mt-5 space-y-3">
      {met.map((id) => (
        <li key={id} className="flex items-center gap-2.5">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-verify-soft text-verify">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="size-3"
            >
              <path d={CHECK_PATH} />
            </svg>
          </span>
          <span className="text-sm font-medium text-ink">{PRIORITY_NAMES[id]}</span>
        </li>
      ))}

      {unmet.map((id) => (
        <li key={id} className="flex items-start gap-2.5">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-canvas-sunk text-ink-faint">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              aria-hidden="true"
              className="size-3"
            >
              <path d="M4.5 8h7" />
            </svg>
          </span>
          <span className="flex min-w-0 flex-col pt-0.5">
            <span className="text-sm text-ink-soft">{PRIORITY_NAMES[id]}</span>
            <span className="text-xs text-ink-faint">Not found in report</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Employer result card. Left column: company details, job opening and links.
 * Right column: per-priority results. The accent colour is used only for the
 * job opening action.
 *
 * All disclosures come from a single report, so it is linked once rather than
 * per priority.
 *
 * `featured` adds a label and stronger border for the top result.
 */
function EmployerCard({ employer, featured = false }) {
  const total = employer.met.length + employer.unmet.length;
  const label = matchLabel(employer.met.length, total);

  return (
    <article
      className={`rounded-[2rem] p-1.5 ring-1 ${featured ? 'bg-ink/[0.06] ring-ink/[0.14]' : 'bg-ink/[0.03] ring-ink/[0.06]'}`}
    >
      <div className="grid gap-1.5 rounded-[calc(2rem-0.375rem)] bg-surface p-1.5 shadow-card md:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex flex-col p-5">
          <div className="flex items-center gap-4">
            <LogoTile logo={employer.logo} logoUrl={employer.logo_url} name={employer.name} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h2 className="font-display text-xl font-bold tracking-[-0.015em] text-ink">
                  {employer.name}
                </h2>
                {featured && (
                  <span className="rounded-full bg-ink px-2.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-on-plane">
                    Top of your list
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-ink-soft">
                {employer.location
                  ? `${employer.industry} · ${employer.location}`
                  : employer.industry}
              </p>
            </div>
          </div>

          {employer.summary && !employer.summary.trimStart().startsWith('{') && (
            <p className="mt-5 max-w-[60ch] text-[0.9375rem] leading-relaxed text-ink-soft">
              {employer.summary}
            </p>
          )}

          {/* Pinned to the bottom of the column. */}
          <div className="mt-auto pt-6">
            {employer.job && (
              <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-3">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                    <span aria-hidden="true" className="size-1.5 rounded-full bg-verify" />
                    Hiring for your role.
                  </p>
                  <p className="mt-1 font-semibold text-ink">{employer.job.title}</p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    Found {formatFoundAt(employer.job.found_at)} · A listing may have closed since.
                  </p>
                </div>

                <a
                  href={employer.job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2.5 rounded-full bg-pink-600 py-1.5 pr-1.5 pl-4 text-sm font-semibold text-white shadow-card transition duration-300 ease-spring hover:bg-pink-500 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Open job
                  <span className="sr-only">, opens the listing in a new tab</span>
                  <ArrowBadge direction="out" className="bg-white/20" />
                </a>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
              {employer.website ? (
                <a
                  href={employer.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group -ml-1 inline-flex items-center gap-2 rounded-full py-0.5 pl-1 text-sm font-semibold text-ink transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  View company details
                  <span className="sr-only">, opens {employer.name} in a new tab</span>
                  <ArrowBadge className="size-6 bg-canvas-sunk" />
                </a>
              ) : (
                <span />
              )}

              {employer.report ? (
                <p className="text-xs text-ink-faint">
                  Read from{' '}
                  <a
                    href={employer.report.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-ink-soft underline decoration-ink/20 underline-offset-2 transition hover:text-ink hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
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
          </div>
        </div>

        <div className="rounded-[1.25rem] bg-canvas p-5">
          <div className="flex items-center justify-between gap-3">
            <span className={`text-sm font-semibold ${label.tone}`}>{label.text}</span>
            <MatchMeter met={employer.met.length} total={total} />
          </div>
          <p className="mt-1 text-xs text-ink-faint">
            {employer.met.length} of your {total} {total === 1 ? 'priority' : 'priorities'}
          </p>

          <PriorityLedger met={employer.met} unmet={employer.unmet} />
        </div>
      </div>
    </article>
  );
}

/** Entrance animation delay for the block at `index`. */
function riseDelay(index) {
  return { animationDelay: `${Math.min(index, 8) * 80}ms` };
}

/**
 * Labelled group of employer cards (e.g. hiring vs. other matches).
 */
function MatchGroup({ label, employers, start }) {
  return (
    <section aria-label={label} className="mt-14">
      <div className="flex items-center gap-4">
        <p className="eyebrow">{label}</p>
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
        <span className="tabular text-xs text-ink-faint">{employers.length}</span>
      </div>

      <ul className="mt-5 flex flex-col gap-5">
        {employers.map((employer, index) => (
          <li key={employer.id} className="rise-in" style={riseDelay(start + index)}>
            <EmployerCard employer={employer} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Summary bar for the current search: target role, selected priorities and
 * result count, with an action to adjust priorities.
 */
function QueryBar({ chosen, count, onAdjust }) {
  const known = chosen.filter((id) => PRIORITY_NAMES[id]);

  return (
    <div className="rounded-[1.75rem] bg-ink/[0.03] p-1.5 ring-1 ring-ink/[0.06]">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-[calc(1.75rem-0.375rem)] bg-surface px-5 py-4 shadow-card">
        <TargetRoleSelect bare />

        <span aria-hidden="true" className="hidden h-9 w-px bg-line md:block" />

        <div className="min-w-0 flex-1">
          <p className="text-xs text-ink-faint">Matching on</p>
          <ul aria-label="Priorities you chose" className="mt-1.5 flex flex-wrap gap-1.5">
            {known.map((id) => (
              <li
                key={id}
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 py-1 pr-3 pl-2 text-xs font-medium text-blue-600"
              >
                <PriorityIcon id={id} className="size-3.5 shrink-0" />
                {PRIORITY_NAMES[id]}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-4">
          {count !== null && (
            <p className="text-sm text-ink-soft">
              <span className="tabular font-semibold text-ink">{count}</span>{' '}
              {count === 1 ? 'company' : 'companies'} found
            </p>
          )}

          <button
            type="button"
            onClick={onAdjust}
            className="group inline-flex items-center gap-2 rounded-full py-1 pr-1 pl-3.5 text-sm font-medium text-ink ring-1 ring-line-strong transition duration-300 ease-spring hover:ring-ink/30 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Adjust priorities
            <ArrowBadge className="size-6 bg-canvas-sunk" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Number of employer cards shown at first, and added by each "Show more". */
const PAGE_SIZE = 10;

/**
 * Employer matches page: employers whose sustainability disclosures cover the
 * selected priorities.
 */
export default function EmployerMatches() {
  const navigate = useSmoothNavigate();
  const snapshot = useIntakeStore((state) => state.snapshot);
  const selectedRole = useIntakeStore((state) => state.selectedRole);
  const gapResult = useIntakeStore((state) => state.gapResult);
  const priorities = useIntakeStore((state) => state.employerPriorities);
  const setEmployerMatches = useIntakeStore((state) => state.setEmployerMatches);
  const user = useAccountStore((state) => state.user);

  const [employers, setEmployers] = useState(null);
  const [jobSearch, setJobSearch] = useState(null);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const chosen = priorities ?? [];
  const key = chosen.join('|');

  useEffect(() => {
    if (!gapResult || key === '') return undefined;

    let live = true;

    const targetRoleId = selectedRole?.role_id;
    matchEmployers({ priorities: key.split('|'), targetRoleId })
      .then((result) => {
        if (!live) return;
        setEmployers(result.employers);
        setJobSearch(result.job_search);
        // Mirror into the store so the companion can reference the matches.
        setEmployerMatches(result.employers);
        setError(null);
      })
      .catch((cause) => live && setError(cause.message));

    return () => {
      live = false;
    };
  }, [key, gapResult, selectedRole?.role_id, setEmployerMatches]);

  if (!snapshot || !gapResult) return <Navigate to="/diagnostic/gap" replace />;
  // No priorities selected: redirect to the adjust page.
  if (chosen.length === 0) return <Navigate to="/plan/employers" replace />;

  const all = employers ?? [];
  const shown = all.slice(0, limit);

  // Results arrive with hiring employers first; the first is featured and the rest
  // are grouped by whether they are hiring.
  const [featured, ...rest] = shown;
  const hiring = rest.filter((employer) => employer.job);
  const others = rest.filter((employer) => !employer.job);
  const anyJob = Boolean(employers?.some((employer) => employer.job));

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="page-shell max-w-[1200px] flex-1 pt-14 pb-28">
        {/* Back target: the journey for signed-in users, the gap screen for guests. */}
        {user ? (
          <BackLink to="/journey">Back to your journey</BackLink>
        ) : (
          <BackLink to="/diagnostic/gap">Back to your readiness</BackLink>
        )}

        {/* Page header: title, matching explanation and companion entry point. */}
        <div className="rise-in mt-4">
          <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-[-0.02em] text-ink">
            Your employer matches
          </h1>
          <p className="mt-3 max-w-[62ch] text-[0.9375rem] leading-relaxed text-ink-soft">
            We read the published ESG and sustainability reports of Malaysian listed companies and
            check them for the priorities you chose. A tick means the report mentions it.
          </p>
          <AskHeraAboutResults className="mt-4" />
        </div>

        <div className="rise-in mt-8" style={riseDelay(1)}>
          <QueryBar
            chosen={chosen}
            count={employers ? employers.length : null}
            onAdjust={() => navigate('/plan/employers')}
          />
        </div>

        {error && (
          <p role="alert" className="mt-12 text-sm font-medium text-pink-600">
            {error} Reload the page to try again.
          </p>
        )}

        {!employers && !error && (
          <p className="mt-12 text-sm text-ink-soft">Reading company disclosures…</p>
        )}

        {employers?.length === 0 && (
          <p className="mt-12 max-w-[56ch] text-sm leading-relaxed text-ink-soft">
            No company in our set has published anything about what you chose. That is a finding
            about the disclosures, not about you. Try a different priority.
          </p>
        )}

        {employers?.length > 0 && !anyJob && jobSearch?.status === 'empty' && (
          <p className="mt-12 rounded-2xl bg-ink/[0.03] px-5 py-3.5 text-sm text-ink-soft ring-1 ring-ink/[0.06]">
            No current openings were found for this target role among these employer matches. Your
            employer-fit results are still shown below.
          </p>
        )}

        {jobSearch?.status === 'temporarily_unavailable' && (
          <p className="mt-12 rounded-2xl bg-ink/[0.03] px-5 py-3.5 text-sm text-ink-soft ring-1 ring-ink/[0.06]">
            Job openings are temporarily unavailable. Your employer-fit results are still shown
            below.
          </p>
        )}

        {featured && (
          <div className={`rise-in ${anyJob ? 'mt-12' : 'mt-6'}`} style={riseDelay(2)}>
            <EmployerCard employer={featured} featured />
          </div>
        )}

        {hiring.length > 0 && <MatchGroup label="Also hiring now" employers={hiring} start={3} />}

        {others.length > 0 && (
          <MatchGroup
            label={anyJob ? 'Also matches your priorities' : 'More matches'}
            employers={others}
            start={3 + hiring.length}
          />
        )}

        {all.length > shown.length && (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => setLimit((current) => current + PAGE_SIZE)}
              className="rounded-full bg-surface px-6 py-3 text-sm font-semibold text-ink shadow-card transition duration-300 ease-spring hover:shadow-card-hover active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Show {Math.min(PAGE_SIZE, all.length - shown.length)} more
              <span className="ml-1.5 font-normal text-ink-faint">
                · {all.length - shown.length} left
              </span>
            </button>
          </div>
        )}

        {employers?.length > 0 && (
          <aside className="mt-14 flex gap-3 rounded-[1.25rem] bg-ink/[0.03] p-5 ring-1 ring-ink/[0.06]">
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
              <span className="font-semibold text-ink">Important note:</span> recommendations are
              based on publicly available information in company ESG and sustainability reports.
              They do not guarantee individual workplace experiences.
            </p>
          </aside>
        )}
      </main>
    </div>
  );
}
