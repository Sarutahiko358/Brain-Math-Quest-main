import { render, screen } from '@testing-library/react';
import React from 'react';
import BrainQuizPane from '../BrainQuizPane';

describe('BrainQuizPane', () => {
  const mockQuiz = {
    type: 'SUM' as const,
    prompt: 'Test prompt',
    answer: '10',
    ui: { kind: 'input' as const },
  };

  it('renders quiz prompt', () => {
    render(
      <BrainQuizPane
        quiz={mockQuiz}
        timeMax={30}
        timeStart={Date.now()}
        onTimeout={() => {}}
        onSubmit={() => {}}
        onGiveup={() => {}}
      />
    );
    expect(screen.getByText('Test prompt')).toBeInTheDocument();
  });

  it('renders skip button', () => {
    render(
      <BrainQuizPane
        quiz={mockQuiz}
        timeMax={30}
        timeStart={Date.now()}
        onTimeout={() => {}}
        onSubmit={() => {}}
        onGiveup={() => {}}
      />
    );
    expect(screen.getByText('スキップ')).toBeInTheDocument();
  });
});
