/**
 * Career-break activities, grouped into the four categories shown on the break step.
 *
 * Ids are sent to the snapshot endpoint, which maps them to reframed skills.
 * Components read ids from this config instead of using string literals.
 */
export const ACTIVITY_TAXONOMY = [
  {
    id: 'care_household',
    label: 'Care & Household',
    activities: [
      { id: 'care_household.cared_for_children', label: 'Childcare' },
      { id: 'care_household.ran_household', label: 'Running the household' },
      {
        id: 'care_household.cared_for_elderly_sick_family',
        label: 'Cared for elderly / sick family',
      },
    ],
  },
  {
    id: 'planning_organisation',
    label: 'Planning & Organisation',
    activities: [
      { id: 'planning.organised_family_logistics', label: 'Day-to-day coordination' },
      { id: 'planning.managed_multiple_schedules', label: 'Managing schedules' },
      { id: 'planning.planned_events_gatherings', label: 'Event planning' },
      { id: 'planning.kept_household_records', label: 'Paperwork and records' },
    ],
  },
  {
    id: 'finance_coordination',
    label: 'Finance & Negotiation',
    activities: [
      { id: 'finance.managed_budget_finances', label: 'Budgeting' },
      { id: 'finance.managed_home_repairs_vendors', label: 'Home repairs and contractors' },
      { id: 'finance.handled_disputes_negotiations', label: 'Negotiation' },
    ],
  },
  {
    id: 'learning_community',
    label: 'Learning & Community',
    activities: [
      { id: 'learning.taught_tutored_children', label: 'Teaching or tutoring' },
      { id: 'learning.volunteered_community_roles', label: 'Volunteering' },
    ],
  },
];

/** Flat id -> label lookup, used to name the source activity on a reframed skill. */
export const ACTIVITY_LABELS = Object.fromEntries(
  ACTIVITY_TAXONOMY.flatMap((category) =>
    category.activities.map((activity) => [activity.id, activity.label])
  )
);
