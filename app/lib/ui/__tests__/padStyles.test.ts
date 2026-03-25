// filepath: /home/user/Brain-Math-Quest/app/lib/ui/__tests__/padStyles.test.ts
import { describe, it, expect } from 'vitest';
import { styleForPad } from '../padStyles';
import { PadSettings } from '../../types/ui';

describe('styleForPad', () => {
  const baseSettings: PadSettings = {
    show: true,
    floating: false,
    anchor: 'br',
    size: 100,
    sizePct: 100,
    opacity: 1.0,
    collapsed: false,
  };

  it('should return static positioning when not floating', () => {
    const result = styleForPad({ ...baseSettings, floating: false });
    expect(result.position).toBe('static');
    expect(result.left).toBeUndefined();
    expect(result.top).toBeUndefined();
  });

  it('should use custom position when provided', () => {
    const result = styleForPad({
      ...baseSettings,
      floating: true,
      pos: { x: 100, y: 200 },
    });
    expect(result.position).toBe('fixed');
    expect(result.left).toBe(100);
    expect(result.top).toBe(200);
    expect(result.transform).toBe('none');
    expect(result.right).toBe('auto');
    expect(result.bottom).toBe('auto');
  });

  it('should position at top-left anchor', () => {
    const result = styleForPad({ ...baseSettings, floating: true, anchor: 'tl' });
    expect(result.position).toBe('fixed');
    expect(result.left).toBe(10);
    expect(result.top).toBe(10);
  });

  it('should position at top-right anchor', () => {
    const result = styleForPad({ ...baseSettings, floating: true, anchor: 'tr' });
    expect(result.position).toBe('fixed');
    expect(result.right).toBe(10);
    expect(result.top).toBe(10);
  });

  it('should position at bottom-left anchor', () => {
    const result = styleForPad({ ...baseSettings, floating: true, anchor: 'bl' });
    expect(result.position).toBe('fixed');
    expect(result.left).toBe(10);
    expect(result.bottom).toBe(10);
  });

  it('should position at bottom-right anchor', () => {
    const result = styleForPad({ ...baseSettings, floating: true, anchor: 'br' });
    expect(result.position).toBe('fixed');
    expect(result.right).toBe(10);
    expect(result.bottom).toBe(10);
  });

  it('should position at top-center anchor with transform', () => {
    const result = styleForPad({ ...baseSettings, floating: true, anchor: 'tc' });
    expect(result.position).toBe('fixed');
    expect(result.left).toBe('50%');
    expect(result.transform).toBe('translateX(-50%)');
    expect(result.top).toBe(10);
  });

  it('should position at bottom-center anchor with transform', () => {
    const result = styleForPad({ ...baseSettings, floating: true, anchor: 'bc' });
    expect(result.position).toBe('fixed');
    expect(result.left).toBe('50%');
    expect(result.transform).toBe('translateX(-50%)');
    expect(result.bottom).toBe(10);
  });

  it('should position at top-center-left anchor with transform', () => {
    const result = styleForPad({ ...baseSettings, floating: true, anchor: 'tcl' });
    expect(result.position).toBe('fixed');
    expect(result.left).toBe('35%');
    expect(result.transform).toBe('translateX(-50%)');
    expect(result.top).toBe(10);
  });

  it('should position at top-center-right anchor with transform', () => {
    const result = styleForPad({ ...baseSettings, floating: true, anchor: 'tcr' });
    expect(result.position).toBe('fixed');
    expect(result.right).toBe('35%');
    expect(result.transform).toBe('translateX(50%)');
    expect(result.top).toBe(10);
  });

  it('should position at bottom-center-left anchor with transform', () => {
    const result = styleForPad({ ...baseSettings, floating: true, anchor: 'bcl' });
    expect(result.position).toBe('fixed');
    expect(result.left).toBe('35%');
    expect(result.transform).toBe('translateX(-50%)');
    expect(result.bottom).toBe(10);
  });

  it('should position at bottom-center-right anchor with transform', () => {
    const result = styleForPad({ ...baseSettings, floating: true, anchor: 'bcr' });
    expect(result.position).toBe('fixed');
    expect(result.right).toBe('35%');
    expect(result.transform).toBe('translateX(50%)');
    expect(result.bottom).toBe(10);
  });
});
