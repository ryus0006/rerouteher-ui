import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../src/mocks/server.js';
import InterviewPractice from '../../src/routes/InterviewPractice.jsx';
import { useAccountStore } from '../../src/store/accountStore.js';
import { useIntakeStore } from '../../src/store/intakeStore.js';
import { useInterviewStore } from '../../src/store/interviewStore.js';

// A light QuestionCard stub isolates the route's orchestration from the card's internals.
vi.mock('../../src/components/interview/QuestionCard.jsx', () => ({
  default: ({ question, onFinish }) => (
    <div>
      <p>{question.question_text}</p>
      <button type="button" onClick={onFinish}>
        Finish set
      </button>
    </div>
  ),
}));

const SNAPSHOT = {
  recommended_roles: [
    { role: 'Data Analyst', role_id: 'R1', similarity: 1 },
    { role: 'Business Analyst', role_id: 'R2', similarity: 0.8 },
  ],
};

const detail = (over = {}) => ({
  session_id: 's1',
  role: { role_id: 'R1', role_title: 'Data Analyst' },
  practice_focus: 'mixed',
  status: 'active',
  created_at: 't',
  updated_at: 't',
  questions: [
    {
      sequence_no: 1,
      question_id: 'GEN-001',
      question_text: 'Tell me about yourself.',
      category: 'c',
      difficulty: 'foundation',
      role_id: null,
      kind: 'general',
      attempts: [],
    },
    {
      sequence_no: 2,
      question_id: 'R1-1',
      question_text: 'A role question.',
      category: 'c',
      difficulty: 'intermediate',
      role_id: 'R1',
      kind: 'role_specific',
      attempts: [],
    },
  ],
  ...over,
});

const summary = (sessionId, roleId, roleTitle) => ({
  session_id: sessionId,
  role: { role_id: roleId, role_title: roleTitle },
  practice_focus: 'mixed',
  status: 'active',
  progress: 0,
  created_at: 't',
  updated_at: 't',
});

function renderRoute() {
  const router = createMemoryRouter([{ path: '/', element: <InterviewPractice /> }], {
    initialEntries: ['/'],
  });
  render(<RouterProvider router={router} />);
  return router;
}

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  // Report reduced-motion so AnimatePresence removes exiting nodes synchronously.
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: true, addEventListener() {}, removeEventListener() {} }))
  );
  useInterviewStore.getState().reset();
  useIntakeStore.setState({
    cv: { fileName: 'cv.pdf', fileSize: 1 },
    cvParsed: true,
    break: { duration_years: 5, activities: [] },
    snapshot: SNAPSHOT,
    selectedRole: { role: 'Data Analyst', role_id: 'R1', similarity: 1 },
    gapResult: { readiness: 70, gaps: [] },
  });
  useAccountStore.setState({ user: { username: 'aisha' } });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  useAccountStore.setState({ user: null });
  useInterviewStore.getState().reset();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('InterviewPractice route', () => {
  it('shows setup when the role has no session, then creates and renders the first question', async () => {
    server.use(
      http.get('/api/interview/sessions', () => HttpResponse.json([])),
      http.post('/api/interview/sessions', () => HttpResponse.json(detail(), { status: 201 }))
    );
    renderRoute();
    expect(await screen.findByText('Set up your practice')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /start practice/i }));
    expect(await screen.findByText('Tell me about yourself.')).toBeInTheDocument();
    // The role switcher only renders once practice has started.
    expect(screen.getByLabelText(/change role/i)).toBeInTheDocument();
  });

  it('loads an existing session for the role without showing setup', async () => {
    server.use(
      http.get('/api/interview/sessions', () =>
        HttpResponse.json([summary('s1', 'R1', 'Data Analyst')])
      ),
      http.get('/api/interview/sessions/s1', () => HttpResponse.json(detail()))
    );
    renderRoute();
    expect(await screen.findByText('Tell me about yourself.')).toBeInTheDocument();
    expect(screen.queryByText('Set up your practice')).not.toBeInTheDocument();
  });

  it('switches to another role with its own session', async () => {
    server.use(
      http.get('/api/interview/sessions', () =>
        HttpResponse.json([
          summary('s1', 'R1', 'Data Analyst'),
          summary('s2', 'R2', 'Business Analyst'),
        ])
      ),
      http.get('/api/interview/sessions/s1', () => HttpResponse.json(detail())),
      http.get('/api/interview/sessions/s2', () =>
        HttpResponse.json(
          detail({
            session_id: 's2',
            role: { role_id: 'R2', role_title: 'Business Analyst' },
            questions: [
              {
                sequence_no: 1,
                question_id: 'GEN-002',
                question_text: 'A business question.',
                category: 'c',
                difficulty: 'foundation',
                role_id: null,
                kind: 'general',
                attempts: [],
              },
            ],
          })
        )
      )
    );
    renderRoute();
    expect(await screen.findByText('Tell me about yourself.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/change role/i), { target: { value: 'R2' } });
    expect(await screen.findByText('A business question.')).toBeInTheDocument();
  });

  it('renders the not-ready path when creating a session returns 409', async () => {
    server.use(
      http.get('/api/interview/sessions', () => HttpResponse.json([])),
      http.post('/api/interview/sessions', () =>
        HttpResponse.json({ error: 'journey_prerequisite_incomplete' }, { status: 409 })
      )
    );
    renderRoute();
    fireEvent.click(await screen.findByRole('button', { name: /start practice/i }));
    expect(
      await screen.findByText(/Finish your Target Role & Gap step first/i)
    ).toBeInTheDocument();
  });
});
