import { ArrowRight } from '@phosphor-icons/react';
import { ACTIVITY_LABELS } from '../../config/activityTaxonomy.js';
import { PRIORITY_NAMES } from '../../config/employerPriorities.js';

/** One labelled row. An empty row shows a hint telling the user what to share next. */
function Row({ label, hint, filled, children }) {
  return (
    <div className="border-t border-ink/[0.06] pt-3 first:border-t-0 first:pt-0">
      <dt className="text-[0.6875rem] font-semibold text-ink-faint">{label}</dt>
      <dd className="mt-1">
        {filled ? (
          children
        ) : (
          <p className="flex items-center gap-2 text-[0.8125rem] text-ink-faint">
            <span
              aria-hidden="true"
              className="w-4 shrink-0 border-t border-dashed border-ink/25"
            />
            {hint}
          </p>
        )}
      </dd>
    </div>
  );
}

/**
 * The profile Hera has drafted so far, shown in the chat for review. Rows fill
 * in as the conversation adds detail, and each new value rises in so the user
 * sees the profile grow. Skills combine those mentioned in chat with those the
 * user ticked in Hera's checklist.
 */
export default function ProfileDraft({ draft, confirmedSkills, onConfirm, onChange }) {
  const experiences = draft.cv?.experiences ?? [];
  const job = experiences[0];
  const careerBreak = draft.break;
  const priorities = draft.employerPriorities ?? [];

  const skills = [
    ...new Set([
      ...confirmedSkills.map((skill) => skill.skill_name),
      ...(draft.cv?.skill_mentions ?? []),
    ]),
  ];

  const breakText = careerBreak
    ? [
        careerBreak.duration_years
          ? `${careerBreak.duration_years} ${careerBreak.duration_years === 1 ? 'year' : 'years'}`
          : null,
        careerBreak.activities?.map((id) => ACTIVITY_LABELS[id] ?? id).join(', '),
      ]
        .filter(Boolean)
        .join(' · ')
    : '';

  const year = (value) => (String(value ?? '').match(/\d{4}/) || [value ?? ''])[0];
  const jobDates = job?.start && job?.end ? `${year(job.start)} - ${year(job.end)}` : '';
  const experienceReady = Boolean(job?.title && job?.organisation && job?.start && job?.end);
  const complete = Boolean(experienceReady && breakText && skills.length && priorities.length);

  return (
    <section
      aria-label="Your profile so far"
      className="hera-rise mt-4 rounded-[1.25rem] bg-ink/[0.035] p-1 shadow-[inset_0_0_0_1px_rgb(44_33_66/0.06)]"
    >
      <div className="rounded-[1rem] bg-surface p-4 shadow-[0_1px_2px_rgb(44_33_66/0.05),0_16px_32px_-24px_rgb(44_33_66/0.35)]">
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-[0.9375rem] font-bold text-ink">Your profile so far</p>
          <span
            className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold ${
              complete ? 'bg-verify-soft text-verify' : 'bg-pink-100 text-pink-600'
            }`}
          >
            <span
              aria-hidden="true"
              className={`size-1.5 rounded-full ${complete ? 'bg-verify' : 'hera-live-dot bg-pink-600'}`}
            />
            {complete ? 'Ready' : 'Drafting'}
          </span>
        </div>

        <dl className="mt-3 space-y-3">
          <Row label="Experience" hint="Tell Hera about your last job" filled={Boolean(job?.title)}>
            <div key={`${job?.title}-${job?.organisation}`} className="hera-rise">
              <p className="text-sm font-semibold text-ink">{job?.title}</p>
              {(job?.organisation || jobDates) && (
                <p className="text-xs text-ink-soft">
                  {[job?.organisation, jobDates].filter(Boolean).join(' · ')}
                </p>
              )}
              {experiences.length > 1 && (
                <p className="mt-1 text-xs text-ink-faint">
                  +{experiences.length - 1} earlier {experiences.length - 1 === 1 ? 'role' : 'roles'}
                </p>
              )}
            </div>
          </Row>

          <Row
            label="Career break"
            hint="Tell Hera what filled your time away"
            filled={Boolean(breakText)}
          >
            <p key={breakText} className="hera-rise text-sm text-ink">
              {breakText}
            </p>
          </Row>

          <Row
            label="Skills"
            hint="Mention skills you used, or tick the ones Hera suggests"
            filled={skills.length > 0}
          >
            <ul className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <li
                  key={skill}
                  className="hera-rise rounded-full bg-pink-100 px-2.5 py-1 text-xs font-semibold text-pink-600"
                >
                  {skill}
                </li>
              ))}
            </ul>
          </Row>

          <Row
            label="Priorities"
            hint="Tell Hera what matters in your next role"
            filled={priorities.length > 0}
          >
            <p key={priorities.join()} className="hera-rise text-sm text-ink">
              {priorities.map((id) => PRIORITY_NAMES[id] ?? id).join(', ')}
            </p>
          </Row>
        </dl>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="group inline-flex items-center gap-2 rounded-full bg-ink py-1 pr-1 pl-4 text-xs font-semibold text-white transition duration-300 ease-spring hover:bg-plane-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Use this profile
            <span
              aria-hidden="true"
              className="flex size-7 items-center justify-center rounded-full bg-white/12 transition duration-300 ease-spring group-hover:translate-x-0.5 group-hover:scale-105"
            >
              <ArrowRight weight="bold" className="size-3" />
            </span>
          </button>
          <button
            type="button"
            onClick={onChange}
            className="rounded-full px-3 py-2 text-xs font-medium text-ink-soft transition hover:bg-ink/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Change something
          </button>
        </div>
      </div>
    </section>
  );
}
