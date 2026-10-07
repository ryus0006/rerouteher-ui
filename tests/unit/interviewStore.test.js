import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/api/interview.js', () => ({
  listSessions: vi.fn(),
  getSession: vi.fn(),
  createSession: vi.fn(),
  refreshSession: vi.fn(),
  deleteSession: vi.fn(),
  uploadAttempt: vi.fn(),
  retryFeedback: vi.fn(),
}));

import * as api from '../../src/api/interview.js';
import { useInterviewStore } from '../../src/store/interviewStore.js';

const store = () => useInterviewStore.getState();

const detail = (over = {}) => ({
  session_id: 's1',
  role: { role_id: 'R1', role_title: 'Data Analyst' },
  practice_focus: 'mixed',
  status: 'active',
  created_at: 't',
  updated_at: 't',
  questions: [
    { sequence_no: 1, question_id: 'GEN-001', attempts: [] },
    { sequence_no: 2, question_id: 'R1-int-0', attempts: [] },
  ],
  ...over,
});

beforeEach(() => {
  store().reset();
  vi.clearAllMocks();
});
afterEach(() => vi.restoreAllMocks());

describe('interview store', () => {
  it('loadSessions stores the list and clears loading', async () => {
    api.listSessions.mockResolvedValue([{ session_id: 's1' }]);
    await store().loadSessions();
    expect(store().sessions).toEqual([{ session_id: 's1' }]);
    expect(store().loading).toBe(false);
  });

  it('startSession stores the returned detail and resets index to 0', async () => {
    api.getSession.mockResolvedValue(detail());
    await store().openSession('s1');
    store().goTo(1);
    expect(store().index).toBe(1);

    api.createSession.mockResolvedValue(detail());
    await store().startSession({ roleId: 'R1', focus: 'mixed' });
    expect(store().current.session_id).toBe('s1');
    expect(store().index).toBe(0);
    expect(store().view).toBe('practice');
    expect(api.createSession).toHaveBeenCalledWith({ roleId: 'R1', focus: 'mixed' });
  });

  it('submitAttempt uploads then re-reads and stores the session', async () => {
    api.createSession.mockResolvedValue(detail());
    await store().startSession({ roleId: 'R1', focus: 'mixed' });

    const updated = detail({
      questions: [
        {
          sequence_no: 1,
          question_id: 'GEN-001',
          attempts: [{ attempt_no: 1, feedback_status: 'ready' }],
        },
        { sequence_no: 2, question_id: 'R1-int-0', attempts: [] },
      ],
    });
    api.uploadAttempt.mockResolvedValue({ ok: true, attempt: { attempt_no: 1 } });
    api.getSession.mockResolvedValue(updated);

    const result = await store().submitAttempt({ sequenceNo: 1, audio: new Blob(['x']) });
    expect(api.uploadAttempt).toHaveBeenCalledWith({
      sessionId: 's1',
      sequenceNo: 1,
      audio: expect.any(Blob),
    });
    expect(api.getSession).toHaveBeenCalledWith('s1');
    expect(store().current.questions[0].attempts).toHaveLength(1);
    expect(result.ok).toBe(true);
  });

  it('refreshCurrent replaces current with the refreshed detail', async () => {
    api.createSession.mockResolvedValue(detail());
    await store().startSession({ roleId: 'R1', focus: 'mixed' });

    const refreshed = detail({
      questions: [{ sequence_no: 1, question_id: 'GEN-099', attempts: [] }],
    });
    api.refreshSession.mockResolvedValue(refreshed);
    await store().refreshCurrent();
    expect(api.refreshSession).toHaveBeenCalledWith('s1');
    expect(store().current.questions[0].question_id).toBe('GEN-099');
  });

  it('removeSession clears current when it was the deleted one', async () => {
    api.createSession.mockResolvedValue(detail());
    await store().startSession({ roleId: 'R1', focus: 'mixed' });
    api.deleteSession.mockResolvedValue(undefined);
    await store().removeSession('s1');
    expect(api.deleteSession).toHaveBeenCalledWith('s1');
    expect(store().current).toBeNull();
  });

  it('a failing call sets error and clears loading', async () => {
    api.listSessions.mockRejectedValue(new Error('boom'));
    await expect(store().loadSessions()).rejects.toThrow('boom');
    expect(store().error).toBe('boom');
    expect(store().loading).toBe(false);
  });
});
