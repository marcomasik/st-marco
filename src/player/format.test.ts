import { describe, expect, it } from 'vitest';
import { describeTime, formatDate, formatDuration, formatTime } from './format';

describe('formatTime', () => {
  it('formats minutes and hours', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(5.9)).toBe('0:05');
    expect(formatTime(245)).toBe('4:05');
    expect(formatTime(3690)).toBe('1:01:30');
  });

  it('treats invalid values as zero', () => {
    expect(formatTime(Number.NaN)).toBe('0:00');
    expect(formatTime(-3)).toBe('0:00');
    expect(formatTime(Number.POSITIVE_INFINITY)).toBe('0:00');
  });
});

describe('formatDuration', () => {
  it('rounds to minutes', () => {
    expect(formatDuration(3480)).toBe('58 min');
    expect(formatDuration(3690)).toBe('1 h 02 min');
    expect(formatDuration(7200)).toBe('2 h 00 min');
  });
});

describe('describeTime', () => {
  it('spells out the parts', () => {
    expect(describeTime(0)).toBe('0 seconds');
    expect(describeTime(61)).toBe('1 minute, 1 second');
    expect(describeTime(3690)).toBe('1 hour, 1 minute, 30 seconds');
  });
});

describe('formatDate', () => {
  it('formats ISO dates without time zone shifts', () => {
    expect(formatDate('2026-10-18')).toBe('18 Oct 2026');
    expect(formatDate('2026-01-01')).toBe('1 Jan 2026');
  });
});
