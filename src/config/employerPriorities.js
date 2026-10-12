/**
 * Workplace priorities used for employer matching.
 *
 * Kept at the granularity sustainability reports disclose (e.g. "flexible
 * working arrangements" rather than specific policies), since finer options
 * could not be matched.
 *
 * Ids are the join key to employer disclosures and must remain stable.
 */
export const EMPLOYER_PRIORITIES = [
  {
    id: 'flexible_work',
    name: 'Flexible Work',
    blurb: 'Hybrid or remote work, flexible hours',
  },
  {
    id: 'childcare_support',
    name: 'Childcare Support',
    blurb: 'On-site childcare facilities, childcare subsidies',
  },
  {
    id: 'parental_support',
    name: 'Parental Support',
    blurb: 'Maternity leave, paternity leave, nursing rooms',
  },
  {
    id: 'inclusive_workplace',
    name: 'Inclusive Workplace',
    blurb: 'Women leadership, gender equality initiatives',
  },
];

export const PRIORITY_NAMES = Object.fromEntries(
  EMPLOYER_PRIORITIES.map((priority) => [priority.id, priority.name])
);

/**
 * Drops ids no longer offered (e.g. a retired priority still in a saved
 * plan), so they are neither shown nor sent for matching.
 */
export const knownPriorities = (ids) => (ids ?? []).filter((id) => id in PRIORITY_NAMES);
