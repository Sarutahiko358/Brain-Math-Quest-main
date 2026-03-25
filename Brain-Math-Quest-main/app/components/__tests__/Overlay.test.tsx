import { render, screen } from '@testing-library/react';
import React from 'react';
import Overlay from '../Overlay';

describe('Overlay', () => {
  it('renders title and children', () => {
    render(
      <Overlay title="Test Title" onClose={() => {}}>
        <div>Test Content</div>
      </Overlay>
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders close button', () => {
    render(
      <Overlay title="Test Title" onClose={() => {}}>
        <div>Test Content</div>
      </Overlay>
    );
    expect(screen.getByText('✕')).toBeInTheDocument();
  });
});
