import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

const h = vi.hoisted(() => ({ openCompanion: vi.fn() }));
vi.mock('../../src/store/companionStore.js', () => ({
  useCompanionStore: (selector) => selector({ openCompanion: h.openCompanion }),
}));

import AskHeraAboutInterview from '../../src/components/companion/AskHeraAboutInterview.jsx';

afterEach(() => {
  cleanup();
  h.openCompanion.mockReset();
});

test('opens the companion in ask mode', () => {
  render(<AskHeraAboutInterview />);
  fireEvent.click(screen.getByRole('button', { name: /ask hera/i }));
  expect(h.openCompanion).toHaveBeenCalledWith('ask');
});
