import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import AreasView from '../../src/components/interview/AreasView.jsx';

afterEach(cleanup);

const areas = {
  improvements: [
    { criterion_id: 'EVAL-07', title: 'Add a result', response_count: 3 },
    { criterion_id: 'EVAL-05', title: 'Give an example', response_count: 1 },
  ],
  strengths: [{ criterion_id: 'EVAL-01', title: 'Relevance', response_count: 4 }],
};

describe('AreasView', () => {
  it('renders the top improvement, the ranked rest, and strengths from the server shape', () => {
    render(<AreasView areas={areas} onBack={() => {}} />);
    expect(screen.getByText('Add a result')).toBeInTheDocument();
    expect(screen.getByText(/Came up in 3 answers/)).toBeInTheDocument();
    expect(screen.getByText('Give an example')).toBeInTheDocument();
    expect(screen.getByText('Relevance')).toBeInTheDocument();
  });

  it('shows an empty state when there are no improvements', () => {
    render(<AreasView areas={{ improvements: [], strengths: [] }} onBack={() => {}} />);
    expect(screen.getByText(/Nothing to improve came up yet/)).toBeInTheDocument();
  });
});
