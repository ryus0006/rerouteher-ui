/**
 * The guided conversation that stands in for a CV (US8.1).
 *
 * Three questions, because that is what the snapshot actually needs: what she
 * did, what she did while she was away, and what she was relied on for. Asking
 * more would make the conversational route slower than the upload it exists to
 * replace.
 */
export const INTERVIEW = [
  {
    id: 'occupation',
    ask: 'What was your job before your break? Job title is enough — "HR officer", "designer at an agency".',
    placeholder: 'Senior UX/UI Designer',
  },
  {
    id: 'responsibilities',
    ask: 'What did people rely on you for in that job? Two or three things is plenty.',
    placeholder: 'Ran usability tests, owned the design system',
  },
  {
    id: 'break',
    ask: 'And while you were away — what filled your time? Anything counts, including the unpaid work.',
    placeholder: 'Family budget, school runs, ran the parents committee',
  },
];

export const INTERVIEW_INTRO =
  'No CV needed. Three questions, and I will turn your answers into the same skill snapshot the upload produces.';
