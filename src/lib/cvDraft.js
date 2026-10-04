import { ACTIVITY_LABELS } from '../config/activityTaxonomy.js';

export const DRAFT_VERSION = 2;

const INITIAL_SKILLS = 6;

export const EMPTY_PERSONAL = { name: '', email: '', phone: '', location: '' };

/** Contact fields in display order, with their placeholder text. */
export const PERSONAL_FIELDS = [
  { key: 'name', label: 'Full name', placeholder: 'Your full name', autoComplete: 'name' },
  {
    key: 'email',
    label: 'Email',
    placeholder: 'Email address',
    autoComplete: 'email',
    type: 'email',
  },
  { key: 'phone', label: 'Phone', placeholder: 'Phone number', autoComplete: 'tel', type: 'tel' },
  {
    key: 'location',
    label: 'Location',
    placeholder: 'City, state',
    autoComplete: 'address-level2',
  },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Formats "YYYY-MM" as "Mon YYYY" (e.g. "Mar 2015"); other values are returned unchanged. */
export function formatMonth(value) {
  const match = /^(\d{4})-(\d{2})/.exec(value ?? '');
  if (!match) return value ?? '';
  const month = MONTHS[Number(match[2]) - 1];
  return month ? `${month} ${match[1]}` : match[1];
}

export function formatRange(start, end) {
  return [formatMonth(start), formatMonth(end)].filter(Boolean).join(' – ');
}

const listOf = (items) =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;

const sameSkill = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * All skills supported by the journey, de-duplicated, in order: experience
 * skills, confirmed skills, then skills reframed from the career break.
 */
export function supportedSkills({ snapshot, confirmedSkills }) {
  const all = [
    ...(snapshot?.professional_skills ?? []).map((s) => s.skill),
    ...(confirmedSkills ?? []).map((s) => s.skill_name),
    ...(snapshot?.reframed_skills ?? []).map((s) => s.skill),
  ].filter(Boolean);
  return all.filter((skill, at) => all.findIndex((other) => sameSkill(other, skill)) === at);
}

/** Whether the skill is one the gap result lists as already held for the target role. */
export function roleRelevant(skill, gapResult) {
  return (gapResult?.skills_have ?? []).some((have) => sameSkill(have, skill));
}

function careerBreakSection(careerBreak, snapshot) {
  const activities = (careerBreak?.activities ?? [])
    .map((id) => ACTIVITY_LABELS[id])
    .filter(Boolean);
  if (activities.length === 0) return null;

  const years = careerBreak.duration_years;
  const reframed = (snapshot?.reframed_skills ?? []).map((s) => s.skill);
  const description = [
    `Time focused on ${listOf(activities.map((label) => label.toLowerCase()))}.`,
    reframed.length > 0 && `Strengths built during this time: ${listOf(reframed)}.`,
  ]
    .filter(Boolean)
    .join(' ');

  return {
    // null = not yet decided; the UI prompts the user to choose.
    include: null,
    duration: years >= 1 ? `About ${years} ${years === 1 ? 'year' : 'years'}` : 'Less than a year',
    description,
  };
}

/**
 * Creates the initial draft from journey data only. No content is generated
 * for missing sections, and contact details are left blank.
 */
export function createCvDraft({
  cv,
  careerBreak,
  snapshot,
  selectedRole,
  gapResult,
  confirmedSkills,
}) {
  const supported = supportedSkills({ snapshot, confirmedSkills });
  const relevantFirst = [
    ...supported.filter((skill) => roleRelevant(skill, gapResult)),
    ...supported.filter((skill) => !roleRelevant(skill, gapResult)),
  ];
  const professional = (snapshot?.professional_skills ?? []).map((s) => s.skill);
  const experiences = (cv?.experiences ?? []).map((experience) => ({
    title: experience.title ?? '',
    organisation: experience.organisation ?? '',
    start: experience.start ?? '',
    end: experience.end ?? '',
    description: experience.description ?? '',
  }));

  const recentTitle = experiences.find((experience) => experience.title)?.title;
  const strengths = listOf(professional.slice(0, 3));
  const opening = recentTitle
    ? strengths
      ? `${recentTitle} with experience in ${strengths}.`
      : `${recentTitle}.`
    : strengths
      ? `Professional with experience in ${strengths}.`
      : '';
  const summary = [opening, `Looking to bring these strengths to a ${selectedRole.role} role.`]
    .filter(Boolean)
    .join(' ');

  return {
    version: DRAFT_VERSION,
    roleId: selectedRole.role_id,
    personal: { ...EMPTY_PERSONAL },
    summary,
    skills: relevantFirst.slice(0, INITIAL_SKILLS),
    experiences,
    careerBreak: careerBreakSection(careerBreak, snapshot),
  };
}

/**
 * Normalises a saved draft to the draft schema, mapping an
 * `includeCareerBreak` flag to the `careerBreak` object.
 */
export function normaliseDraft(saved, generated) {
  if (!saved) return generated;
  if (saved.version === DRAFT_VERSION) return saved;

  return {
    ...generated,
    personal: { ...EMPTY_PERSONAL, ...saved.personal },
    summary: saved.summary ?? generated.summary,
    skills: saved.skills ?? generated.skills,
    experiences: saved.experiences ?? generated.experiences,
    careerBreak: generated.careerBreak && {
      ...generated.careerBreak,
      include: saved.includeCareerBreak ? true : null,
    },
  };
}

/** Lists the journey data required to generate a CV, with the route to complete each item. */
export function missingForCv({ cvParsed, snapshot, selectedRole }) {
  return [
    !cvParsed &&
      !snapshot && {
        label: 'Your work background',
        detail: 'Upload your CV or tell Hera about your past roles.',
        to: '/diagnostic/background',
      },
    !snapshot && {
      label: 'Your Skill Snapshot',
      detail: 'Your skills, named from your experience and your break.',
      to: '/diagnostic/break',
    },
    !selectedRole && {
      label: 'A target role',
      detail: 'Choose the role your CV should be written for.',
      to: snapshot ? '/diagnostic/gap' : '/diagnostic/break',
    },
  ].filter(Boolean);
}

export const BOOK_VERSION = 3;

/**
 * Loads the CV book: one draft per role, so edits for one role are preserved
 * when switching to another. Contact details are shared across drafts. `gaps`
 * caches gap results for roles other than the target role, fetched on first
 * open, so each draft can prioritise role-relevant skills.
 *
 * @returns {{ version: number, activeRoleId: string | null, personal: object, drafts: Record<string, object>, gaps: Record<string, object> }}
 */
export function openCvBook(saved) {
  if (saved?.version === BOOK_VERSION) return saved;
  const empty = {
    version: BOOK_VERSION,
    activeRoleId: null,
    personal: { ...EMPTY_PERSONAL },
    drafts: {},
    gaps: {},
  };
  if (!saved) return empty;
  // A saved single draft, not keyed by role, becomes that role's entry.
  return {
    ...empty,
    personal: { ...EMPTY_PERSONAL, ...saved.personal },
    drafts: saved.roleId ? { [saved.roleId]: saved } : {},
  };
}

/** Whether the draft for a role already lists a skill. */
export function skillOnCv(storedBook, roleId, skill) {
  const draft = openCvBook(storedBook).drafts[roleId];
  return Boolean(draft?.skills?.some((entry) => sameSkill(entry, skill)));
}

/**
 * Adds a skill to the target role's draft. If the CV builder has not been
 * opened yet, the draft is first created as the builder would create it.
 */
export function addSkillToCv(state, skill) {
  const book = openCvBook(state.cvDraft);
  const roleId = state.selectedRole.role_id;
  const draft = normaliseDraft(
    book.drafts[roleId],
    createCvDraft({
      cv: state.cv,
      careerBreak: state.break,
      snapshot: state.snapshot,
      selectedRole: state.selectedRole,
      gapResult: state.gapResult,
      confirmedSkills: state.confirmedSkills,
    })
  );
  if (draft.skills.some((entry) => sameSkill(entry, skill))) return book;
  return {
    ...book,
    drafts: { ...book.drafts, [roleId]: { ...draft, skills: [...draft.skills, skill] } },
  };
}

/** Removes a skill from a role's draft. */
export function removeSkillFromCv(storedBook, roleId, skill) {
  const book = openCvBook(storedBook);
  const draft = book.drafts[roleId];
  if (!draft) return book;
  return {
    ...book,
    drafts: {
      ...book.drafts,
      [roleId]: { ...draft, skills: draft.skills.filter((entry) => !sameSkill(entry, skill)) },
    },
  };
}
