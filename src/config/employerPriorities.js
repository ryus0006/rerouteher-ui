/**
 * What an employer can be asked for, at the grain a sustainability report
 * actually answers.
 *
 * Deliberately coarse: a company discloses "flexible working arrangements", not
 * "hybrid, three days". Asking her for detail the source cannot answer would
 * promise a precision the match does not have.
 *
 * Ids are the join key to each employer's disclosures, so they are stable.
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
    id: 'returning_to_work',
    name: 'Returning to Work',
    blurb: 'Return-to-work programmes, reintegration support',
  },
  {
    id: 'inclusive_workplace',
    name: 'Inclusive Workplace',
    blurb: 'Women leadership, gender equality initiatives',
  },
];

/**
 * Three, because the question is what matters *most*. An unlimited list would
 * be answered by ticking everything, and a ranking against everything is the
 * same as no ranking at all.
 */
export const MAX_PRIORITIES = 3;

export const PRIORITY_NAMES = Object.fromEntries(
  EMPLOYER_PRIORITIES.map((priority) => [priority.id, priority.name])
);
