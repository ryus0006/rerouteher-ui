/**
 * The three journey stages shown on the landing page, in order. See
 * `FLOW_STEPS` for the per-screen list used by the intake stepper.
 */
export const JOURNEY_STAGES = [
  {
    id: 'story',
    label: 'Tell your story',
    blurb: 'Your CV, and what filled your break.',
  },
  {
    id: 'snapshot',
    label: 'See your skills',
    blurb: 'Your experience, mapped to O*NET skills.',
  },
  {
    id: 'gap',
    label: 'Know your next move',
    blurb: 'A readiness score and three focus areas.',
  },
];

export const STAGE_IDS = JOURNEY_STAGES.map((stage) => stage.id);

/** Index of a stage id, or -1 when unknown. */
export function stageIndex(id) {
  return STAGE_IDS.indexOf(id);
}
