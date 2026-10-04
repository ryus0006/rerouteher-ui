import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  submitAttempt: vi.fn(),
  retry: vi.fn(),
  recorder: { status: 'idle', level: 0, seconds: 0, start: vi.fn(), stop: vi.fn() },
}));

vi.mock('../../src/store/interviewStore.js', () => ({
  useInterviewStore: (selector) => selector({ submitAttempt: h.submitAttempt, retry: h.retry }),
}));
vi.mock('../../src/hooks/useRecorder.js', () => ({ default: () => h.recorder }));
vi.mock('../../src/components/interview/VoiceOrb.jsx', () => ({
  default: ({ onPress }) => (
    <button type="button" onClick={onPress}>
      orb
    </button>
  ),
}));
vi.mock('../../src/components/interview/WordReveal.jsx', () => ({
  default: ({ text, id }) => <h2 id={id}>{text}</h2>,
}));

import QuestionCard from '../../src/components/interview/QuestionCard.jsx';

const attempt = (over = {}) => ({
  response_id: 10,
  attempt_no: 1,
  transcript: 'I led a small team through a migration.',
  feedback_status: 'ready',
  feedback_summary: 'Clear and relevant.',
  strengths: [{ criterion_id: 'EVAL-01', title: 'Relevance', detail: 'Stayed on topic.' }],
  improvements: [{ criterion_id: 'EVAL-07', title: 'Add a result', detail: 'Give the outcome.' }],
  detected_language: 'en',
  duration_s: 12,
  error_code: null,
  content_expired: false,
  ...over,
});

const slot = (attempts = [], over = {}) => ({
  sequence_no: 1,
  question_id: 'GEN-001',
  question_text: 'Tell me about yourself.',
  category: 'c',
  difficulty: 'foundation',
  role_id: null,
  kind: 'general',
  attempts,
  ...over,
});

const props = (over = {}) => ({
  position: 0,
  total: 5,
  note: null,
  onBusyChange: () => {},
  statuses: ['current', 'todo', 'todo', 'todo', 'todo'],
  onJump: () => {},
  onPrevious: () => {},
  onNext: () => {},
  onFinish: () => {},
  ...over,
});

beforeEach(() => {
  h.submitAttempt.mockReset().mockResolvedValue({ ok: true, attempt: attempt() });
  h.retry.mockReset().mockResolvedValue({ ok: true, attempt: attempt() });
  h.recorder.status = 'idle';
  h.recorder.stop.mockReset();
});
afterEach(() => cleanup());

describe('QuestionCard', () => {
  it('uploads one attempt when recording stops', async () => {
    h.recorder.status = 'recording';
    h.recorder.stop.mockResolvedValue({
      blob: new Blob(['x'], { type: 'audio/webm' }),
      seconds: 5,
    });
    render(<QuestionCard question={slot([])} {...props()} />);

    fireEvent.click(screen.getByText('orb'));
    await waitFor(() =>
      expect(h.submitAttempt).toHaveBeenCalledWith({
        sequenceNo: 1,
        audio: expect.any(Blob),
      })
    );
    expect(h.submitAttempt).toHaveBeenCalledTimes(1);
  });

  it('renders the feedback from the slot attempt (title and detail)', () => {
    render(<QuestionCard question={slot([attempt()])} {...props()} />);
    expect(screen.getByText('Clear and relevant.')).toBeInTheDocument();
    expect(screen.getByText('Stayed on topic.')).toBeInTheDocument();
    expect(screen.getByText('Give the outcome.')).toBeInTheDocument();
  });

  it('shows the transcript and a retry control when feedback failed, and retries by response_id', () => {
    const failed = attempt({
      response_id: 77,
      feedback_status: 'error',
      feedback_summary: null,
      strengths: [],
      improvements: [],
      error_code: 'feedback_service_unavailable',
    });
    render(<QuestionCard question={slot([failed])} {...props()} />);

    expect(screen.getByText('I led a small team through a migration.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /try feedback again/i }));
    expect(h.retry).toHaveBeenCalledWith(77);
  });

  it('treats a pending placeholder attempt as not answered and shows the recorder', () => {
    const placeholder = attempt({
      response_id: 9,
      feedback_status: 'pending',
      transcript: null,
      feedback_summary: null,
      strengths: [],
      improvements: [],
    });
    render(<QuestionCard question={slot([placeholder])} {...props()} />);
    // Recorder (mocked VoiceOrb) is shown, not the "Answered" state or feedback.
    expect(screen.getByText('orb')).toBeInTheDocument();
    expect(screen.queryByText(/^Answered/)).not.toBeInTheDocument();
    expect(screen.queryByText('Clear and relevant.')).not.toBeInTheDocument();
  });

  it('shows feedback when attempts arrive on a reused card (stale index clamped)', () => {
    // Mount with no real attempts (index state seeds to -1), then the same instance
    // receives a slot with an attempt - as happens when switching sessions without a remount.
    const { rerender } = render(<QuestionCard question={slot([])} {...props()} />);
    rerender(<QuestionCard question={slot([attempt()])} {...props()} />);
    expect(screen.getByText('Clear and relevant.')).toBeInTheDocument();
  });

  it('renders multiple attempts newest-last with the attempt switcher', () => {
    const a1 = attempt({ response_id: 1, attempt_no: 1 });
    const a2 = attempt({ response_id: 2, attempt_no: 2 });
    render(<QuestionCard question={slot([a1, a2])} {...props()} />);

    expect(screen.getByRole('button', { name: /attempt 1$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /attempt 2 \(latest\)/i })).toBeInTheDocument();
  });
});
