import { render, screen } from '@testing-library/react';
import React from 'react';
import Topbar from '../Topbar';

describe('Topbar', () => {
  const noop = () => {};

  it('shows brand only on title', () => {
    const { rerender } = render(
      <Topbar scene="title" onOpenMenu={noop} onOpenStageSelect={noop} onGoTitle={noop} onOpenHowto={noop} onOpenSettings={noop} />
    );
    expect(screen.getByText('🧠 Brain Math Quest')).toBeInTheDocument();

    rerender(
      <Topbar scene="map" onOpenMenu={noop} onOpenStageSelect={noop} onGoTitle={noop} onOpenHowto={noop} onOpenSettings={noop} />
    );
    expect(screen.queryByText('🧠 Brain Math Quest')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'メニューを開く' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '操作方法を開く' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '設定を開く' })).toBeInTheDocument();
  });
});
