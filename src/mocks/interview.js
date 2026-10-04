import { http, HttpResponse } from 'msw';

/* In-memory, stateful mocks for the E7 interview endpoints. They mirror the real
   stateful contract: one session per role and focus, attempts saved to their
   question slot, grounded feedback, and server-side areas aggregation. Like the
   real services they never add facts not present in the input. */

const GENERAL_QUESTIONS = [
  'Tell me about yourself and what brings you back to work now.',
  'Walk me through your career break and what you did during that time.',
  'Why are you interested in this kind of role at this point in your career?',
  'What are you most proud of in your previous work?',
  'How do you keep organised when several things need attention at once?',
];
const ROLE_QUESTIONS = [
  'What would you focus on in your first three months in this role?',
  'Tell me about a time your skills solved a real problem.',
  'How would you explain a complicated piece of work to someone outside the team?',
  'What does good work look like to you in this role?',
  'How do you keep your skills current for this role?',
];
const DIFFICULTIES = ['foundation', 'foundation', 'intermediate', 'intermediate', 'advanced'];

const TRANSCRIPT =
  'I worked in this area for several years before a two year break to care for my family. I am coming back because I enjoy solving problems with a team, and I recently refreshed my skills with a short course.';

let nextSessionId = 1;
let nextResponseId = 1;
/** session_id -> SessionDetail */
const sessions = new Map();

/** Resets the in-memory state. Exposed for tests. */
export function resetInterviewMocks() {
  sessions.clear();
  nextSessionId = 1;
  nextResponseId = 1;
}

/** A pending placeholder response, as the real backend seeds per question. */
function placeholder() {
  const now = new Date().toISOString();
  const id = nextResponseId;
  nextResponseId += 1;
  return {
    response_id: id,
    attempt_no: 1,
    transcript: null,
    feedback_status: 'pending',
    feedback_summary: null,
    strengths: [],
    improvements: [],
    detected_language: null,
    duration_s: null,
    error_code: null,
    created_at: now,
    updated_at: now,
    content_expired: false,
  };
}

function makeQuestions(roleId, focus) {
  return Array.from({ length: 5 }, (_, i) => {
    const roleSpecific = focus === 'role_specific' || (focus === 'mixed' && i % 2 === 1);
    return {
      sequence_no: i + 1,
      question_id: `${roleSpecific ? roleId : 'GEN'}-${i + 1}`,
      question_text: roleSpecific ? ROLE_QUESTIONS[i] : GENERAL_QUESTIONS[i],
      category: roleSpecific ? 'role_specific' : 'general',
      difficulty: DIFFICULTIES[i],
      role_id: roleSpecific ? roleId : null,
      kind: roleSpecific ? 'role_specific' : 'general',
      attempts: [placeholder()],
    };
  });
}

function feedbackFor(seed) {
  const strengths = [
    { criterion_id: 'EVAL-01', title: 'Relevance', detail: 'You stayed on the question.' },
    {
      criterion_id: 'EVAL-03',
      title: 'Clear structure',
      detail: 'Your answer moved in a clear order.',
    },
  ];
  const improvements = [
    { criterion_id: 'EVAL-07', title: 'Add a result', detail: 'Finish by saying what changed.' },
    { criterion_id: 'EVAL-05', title: 'Give an example', detail: 'Ground it in one real moment.' },
  ];
  return {
    feedback_summary: 'A clear, grounded answer. Tightening the ending would make it land harder.',
    strengths: seed % 2 === 0 ? strengths : strengths.slice(0, 1),
    improvements: improvements.slice(0, seed % 2 === 0 ? 2 : 1),
  };
}

function refreshStatus(detail) {
  const allReady = detail.questions.every((q) =>
    q.attempts.some((a) => a.feedback_status === 'ready')
  );
  detail.status = allReady ? 'completed' : 'active';
}

function toSummary(detail) {
  const answered = detail.questions.filter((q) =>
    q.attempts.some((a) => a.feedback_status === 'ready')
  ).length;
  return {
    session_id: detail.session_id,
    role: detail.role,
    practice_focus: detail.practice_focus,
    status: detail.status,
    progress: answered,
    created_at: detail.created_at,
    updated_at: detail.updated_at,
  };
}

function findAttempt(responseId) {
  for (const detail of sessions.values()) {
    for (const slot of detail.questions) {
      const attempt = slot.attempts.find((a) => a.response_id === responseId);
      if (attempt) return { detail, attempt };
    }
  }
  return null;
}

function notFound() {
  return HttpResponse.json({ error: 'interview_resource_not_found' }, { status: 404 });
}

const sentences = (text) =>
  text
    .split(/(?<=[.!?])\s+|,\s+(?:and\s+)?|\s+and\s+/)
    .map((part) => part.trim().replace(/[.!?]+$/, ''))
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1));

export const interviewHandlers = [
  http.get('*/api/interview/setup', () =>
    HttpResponse.json({
      selected_role: { role_id: 'role_ux', role_title: 'Senior UX/UI Designer' },
      available_roles: [{ role_id: 'role_ux', role_title: 'Senior UX/UI Designer' }],
      focus_choices: ['general', 'role_specific', 'mixed'],
      question_count: 5,
    })
  ),

  http.get('*/api/interview/sessions', () =>
    HttpResponse.json(
      [...sessions.values()].map(toSummary).sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    )
  ),

  http.post('*/api/interview/sessions', async ({ request }) => {
    const { role_id: roleId, practice_focus: focus } = await request.json();
    for (const detail of sessions.values()) {
      if (detail.role.role_id === roleId && detail.practice_focus === focus) {
        return HttpResponse.json(detail, { status: 200 });
      }
    }
    const id = `s${nextSessionId}`;
    nextSessionId += 1;
    const now = new Date().toISOString();
    const detail = {
      session_id: id,
      role: { role_id: roleId, role_title: roleId },
      practice_focus: focus,
      status: 'active',
      created_at: now,
      updated_at: now,
      questions: makeQuestions(roleId, focus),
    };
    sessions.set(id, detail);
    return HttpResponse.json(detail, { status: 201 });
  }),

  http.get('*/api/interview/sessions/:id', ({ params }) => {
    const detail = sessions.get(params.id);
    return detail ? HttpResponse.json(detail) : notFound();
  }),

  http.post('*/api/interview/sessions/:id/refresh', ({ params }) => {
    const detail = sessions.get(params.id);
    if (!detail) return notFound();
    detail.questions = makeQuestions(detail.role.role_id, detail.practice_focus);
    detail.status = 'active';
    detail.updated_at = new Date().toISOString();
    return HttpResponse.json(detail, { status: 201 });
  }),

  http.delete('*/api/interview/sessions/:id', ({ params }) => {
    sessions.delete(params.id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('*/api/interview/sessions/:id/questions/:seq/attempts', async ({ params }) => {
    const detail = sessions.get(params.id);
    if (!detail) return notFound();
    const slot = detail.questions.find((q) => q.sequence_no === Number(params.seq));
    if (!slot) return notFound();

    const fb = feedbackFor(Number(params.seq));
    const now = new Date().toISOString();
    const latest = slot.attempts.at(-1);
    const recorded = {
      transcript: TRANSCRIPT,
      feedback_status: 'ready',
      feedback_summary: fb.feedback_summary,
      strengths: fb.strengths,
      improvements: fb.improvements,
      detected_language: 'en',
      duration_s: 18,
      error_code: null,
      updated_at: now,
      content_expired: false,
    };
    let attempt;
    if (latest && latest.feedback_status === 'pending') {
      // First recording updates the seeded placeholder in place (as the backend does).
      Object.assign(latest, recorded);
      attempt = latest;
    } else {
      // A retry records a new attempt.
      attempt = {
        response_id: nextResponseId,
        attempt_no: (latest?.attempt_no ?? 0) + 1,
        created_at: now,
        ...recorded,
      };
      nextResponseId += 1;
      slot.attempts.push(attempt);
    }
    refreshStatus(detail);
    detail.updated_at = now;
    return HttpResponse.json(attempt, { status: 200 });
  }),

  http.post('*/api/interview/attempts/:responseId/feedback', ({ params }) => {
    const hit = findAttempt(Number(params.responseId));
    if (!hit) return notFound();
    const fb = feedbackFor(Number(params.responseId));
    Object.assign(hit.attempt, {
      feedback_status: 'ready',
      feedback_summary: fb.feedback_summary,
      strengths: fb.strengths,
      improvements: fb.improvements,
      error_code: null,
      updated_at: new Date().toISOString(),
    });
    refreshStatus(hit.detail);
    return HttpResponse.json(hit.attempt, { status: 200 });
  }),

  http.get('*/api/interview/areas', () => {
    const improvements = new Map();
    const strengths = new Map();
    const tally = (bucket, item) => {
      const entry = bucket.get(item.criterion_id) ?? {
        criterion_id: item.criterion_id,
        title: item.title,
        response_count: 0,
      };
      entry.response_count += 1;
      bucket.set(item.criterion_id, entry);
    };
    for (const detail of sessions.values()) {
      for (const slot of detail.questions) {
        const latest = slot.attempts.filter((a) => a.feedback_status === 'ready').at(-1);
        if (!latest) continue;
        latest.improvements.forEach((item) => tally(improvements, item));
        latest.strengths.forEach((item) => tally(strengths, item));
      }
    }
    const sorted = (bucket) =>
      [...bucket.values()].sort((a, b) => b.response_count - a.response_count);
    return HttpResponse.json({
      improvements: sorted(improvements),
      strengths: sorted(strengths),
    });
  }),

  /* CV wording endpoint: outside the interview scope but still used by the CV
     feature, so it stays mocked here. */
  http.post('*/api/cv/improve', async ({ request }) => {
    const { text, previous_suggestions: previous = [] } = await request.json();
    const parts = sentences(text);
    const variants = [
      `${parts.join('. ')}.`,
      parts.map((part) => `- ${part}`).join('\n'),
      `${parts.join('; ')}.`,
    ];
    const suggestion = variants.find((variant) => !previous.includes(variant)) ?? variants[0];
    return HttpResponse.json({ suggestion });
  }),
];
