import { postFile, postJson } from './client.js';

export const QUESTIONS_PER_SET = 5;

/** The three practice focuses, keyed by the id the endpoints receive. */
export const PRACTICE_FOCUS = [
  {
    id: 'general',
    label: 'General',
    blurb: 'Your background, motivation, and returning after a career break.',
  },
  {
    id: 'role_specific',
    label: 'Role-specific',
    blurb: 'The work itself, and how your skills fit the role.',
  },
  {
    id: 'mixed',
    label: 'Mixed',
    blurb: 'A mix of both, like most real interviews.',
  },
];

export const focusLabel = (id) => PRACTICE_FOCUS.find((focus) => focus.id === id)?.label ?? id;

/**
 * Builds the context sent to the interview endpoints: skills and experience
 * from the journey, so questions and feedback can reference them. The journey
 * holds no contact details, so none are sent.
 */
export function interviewContext({ cv, careerBreak, snapshot, gapResult }) {
  return {
    experiences: (cv?.experiences ?? []).map(
      ({ title, organisation, start, end, description }) => ({
        title,
        organisation,
        start,
        end,
        description,
      })
    ),
    professional_skills: (snapshot?.professional_skills ?? []).map((skill) => skill.skill),
    reframed_skills: (snapshot?.reframed_skills ?? []).map((skill) => skill.skill),
    career_break: careerBreak ?? null,
    focus_areas: (gapResult?.gaps ?? []).map((gap) => gap.skill),
  };
}

/**
 * Generates questions for one practice setup. `exclude` lists questions
 * already asked in the session so none are repeated.
 *
 * @param {{ role: { role: string, role_id: string }, focus: string, count: number, exclude: string[], context: object }} request
 * @returns {Promise<{ questions: { id: string, text: string, kind: 'general' | 'role_specific' }[] }>}
 */
export function generateQuestions({ role, focus, count, exclude, context }) {
  return postJson('/api/interview/questions', {
    target_role: { role: role.role, role_id: role.role_id },
    focus,
    count,
    exclude,
    context,
  });
}

/**
 * Speech to text for one recorded answer.
 *
 * @param {Blob} audio
 * @returns {Promise<{ transcript: string, seconds?: number }>}
 */
export function transcribeAnswer(audio) {
  const extension = audio.type.includes('mp4')
    ? 'm4a'
    : audio.type.includes('ogg')
      ? 'ogg'
      : 'webm';
  const file = new File([audio], `answer.${extension}`, { type: audio.type || 'audio/webm' });
  return postFile('/api/interview/transcribe', file, 'audio');
}

/**
 * Requests feedback on one answer. Each item has a short, reusable `area` used
 * to aggregate themes across answers, and a `detail` specific to this answer.
 *
 * @param {{ question: { text: string, kind: string }, role: { role: string, role_id: string }, focus: string, transcript: string, context: object }} request
 * @returns {Promise<{ summary: string, worked_well: { area: string, detail: string }[], to_improve: { area: string, detail: string }[] }>}
 */
export function getAnswerFeedback({ question, role, focus, transcript, context }) {
  return postJson('/api/interview/feedback', {
    question: question.text,
    question_kind: question.kind,
    target_role: { role: role.role, role_id: role.role_id },
    focus,
    transcript,
    context,
  });
}
