import { http, HttpResponse } from 'msw';

/* Deterministic mocks for the interview coach and CV wording endpoints. Like
   the real services, they never add facts not present in the input. */

const GENERAL = [
  'Tell me about yourself and what brings you back to work now.',
  'Walk me through your career break and what you did during that time.',
  'Why are you interested in this kind of role at this point in your career?',
  'What are you most proud of in your previous work?',
  'How do you keep yourself organised when several things need attention at once?',
  'What kind of working arrangement helps you do your best work?',
  'Where would you like to be in two years?',
  'Tell me about a time you had to learn something new quickly.',
];

const roleSpecific = (role, skills, focusAreas) => [
  `What would you focus on in your first three months as a ${role}?`,
  ...skills
    .slice(0, 3)
    .map((skill) => `Tell me about a time you used ${skill} to solve a real problem.`),
  ...focusAreas
    .slice(0, 2)
    .map(
      (area) =>
        `How are you building your skills in ${area}, and how would you use it in this role?`
    ),
  `How would you explain a complicated piece of your work to someone outside the team?`,
  `What does good work look like to you in a ${role} role?`,
];

const TRANSCRIPTS = [
  'I worked as a product designer for about seven years, mostly on mobile banking. I took a break to look after my two children, and during that time I planned a lot of school events and handled the family budget. I am coming back because I miss solving problems with a team.',
  'At my last company we had three different button styles across the app, and users kept tapping the wrong one. I ran a quick usability test with five customers, pulled the findings together, and we built one shared component. Support tickets about it dropped noticeably after the release.',
  'I think I would start by listening. I would meet the people I work with, understand the product and where users struggle, and then pick one small thing I could improve early so the team can see how I work.',
];

let transcriptTurn = 0;

function feedbackFor(transcript, kind) {
  const words = transcript.split(/\s+/).length;
  const hasExample = /\b(time|when|at my|last|once|project)\b/i.test(transcript);
  const hasResult = /\b(dropped|grew|increased|reduced|result|so that|after the)\b/i.test(
    transcript
  );
  const mentionsBreak = /\b(break|children|family|returning|coming back)\b/i.test(transcript);

  const worked = [
    {
      area: 'Clear structure',
      detail: 'Your answer moved in a clear order, which made it easy to follow.',
    },
    hasExample && {
      area: 'Real examples',
      detail:
        'You grounded the answer in something that actually happened, which makes it believable.',
    },
    mentionsBreak && {
      area: 'Confident about your break',
      detail: 'You mentioned your career break plainly and moved on, without apologising for it.',
    },
    hasResult && {
      area: 'Showing the result',
      detail: 'You said what changed because of your work.',
    },
  ].filter(Boolean);

  const improve = [
    !hasExample && {
      area: 'Specific examples',
      detail: 'Add one real moment from your experience to back up the point you are making.',
    },
    !hasResult && {
      area: 'Explaining the outcome',
      detail: 'Finish by saying what changed as a result, even if it was small.',
    },
    kind === 'role_specific' && {
      area: 'Linking to the role',
      detail:
        'Name the part of this role your experience prepares you for, so the link is explicit.',
    },
    words < 45 && {
      area: 'Giving enough detail',
      detail:
        'The answer was quite short. Aim for one to two minutes so there is room for an example.',
    },
  ].filter(Boolean);

  return {
    summary: hasExample
      ? 'A grounded answer. The example does the work; tightening the ending would make it land harder.'
      : 'A clear, warm answer. It would be stronger with one concrete example from your own experience.',
    worked_well: worked.slice(0, 3),
    to_improve: improve.slice(0, 3),
  };
}

const sentences = (text) =>
  text
    .split(/(?<=[.!?])\s+|,\s+(?:and\s+)?|\s+and\s+/)
    .map((part) => part.trim().replace(/[.!?]+$/, ''))
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1));

export const interviewHandlers = [
  http.post('*/api/interview/questions', async ({ request }) => {
    const { target_role: role, focus, count, exclude = [], context = {} } = await request.json();
    const general = GENERAL.map((text) => ({ text, kind: 'general' }));
    const specific = roleSpecific(
      role.role,
      context.professional_skills ?? [],
      context.focus_areas ?? []
    ).map((text) => ({ text, kind: 'role_specific' }));

    let pool;
    if (focus === 'general') pool = general;
    else if (focus === 'role_specific') pool = specific;
    else pool = general.flatMap((question, at) => [question, specific[at]].filter(Boolean));

    const questions = pool.filter((q) => !exclude.includes(q.text)).slice(0, count);
    await new Promise((resolve) => setTimeout(resolve, 500));
    return HttpResponse.json({ questions });
  }),

  http.post('*/api/interview/transcribe', async () => {
    const transcript = TRANSCRIPTS[transcriptTurn % TRANSCRIPTS.length];
    transcriptTurn += 1;
    await new Promise((resolve) => setTimeout(resolve, 900));
    return HttpResponse.json({ transcript });
  }),

  http.post('*/api/interview/feedback', async ({ request }) => {
    const { transcript, question_kind: kind } = await request.json();
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return HttpResponse.json(feedbackFor(transcript, kind));
  }),

  http.post('*/api/cv/improve', async ({ request }) => {
    const { text, previous_suggestions: previous = [] } = await request.json();
    const parts = sentences(text);
    const variants = [
      `${parts.join('. ')}.`,
      parts.map((part) => `- ${part}`).join('\n'),
      `${parts.join('; ')}.`,
    ];
    const suggestion = variants.find((variant) => !previous.includes(variant)) ?? variants[0];
    await new Promise((resolve) => setTimeout(resolve, 700));
    return HttpResponse.json({ suggestion });
  }),
];
