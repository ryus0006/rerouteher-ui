/**
 * Maps the current interview session + question index to the context Hera needs:
 * the question, and the latest recorded (ready/error) attempt's transcript and feedback.
 * Returns null when there is no current session.
 */
export function buildInterviewContext(current, index) {
  if (!current || !current.questions?.length) return null;
  const slot = current.questions[Math.min(index, current.questions.length - 1)];
  if (!slot) return null;
  const recorded = (slot.attempts ?? []).filter(
    (a) => a.feedback_status === 'ready' || a.feedback_status === 'error'
  );
  const latest = recorded.at(-1) ?? null;
  return {
    question_id: slot.question_id,
    question_text: slot.question_text ?? '',
    kind: slot.kind ?? '',
    transcript: latest?.transcript ?? null,
    feedback_summary: latest?.feedback_summary ?? null,
    strengths: latest?.strengths ?? [],
    improvements: latest?.improvements ?? [],
  };
}
