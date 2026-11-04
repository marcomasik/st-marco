import { describe, expect, it } from 'vitest';
import { resolveMediaUrl } from './mediaUrl';
import { prepareMixes } from './mixes';

describe('resolveMediaUrl', () => {
  it('puts the base URL in front of bucket keys', () => {
    expect(resolveMediaUrl('test-mix.mp3', '/mixes')).toBe('/mixes/test-mix.mp3');
    expect(resolveMediaUrl('2026/low-tide.mp3', 'https://media.example.com/')).toBe(
      'https://media.example.com/2026/low-tide.mp3',
    );
  });

  it('encodes each path segment once', () => {
    expect(resolveMediaUrl('2026/Low Tide #1.mp3', 'https://m.example.com')).toBe(
      'https://m.example.com/2026/Low%20Tide%20%231.mp3',
    );
    expect(resolveMediaUrl('Low%20Tide.mp3', '/mixes')).toBe('/mixes/Low%20Tide.mp3');
  });

  it('keeps absolute and root-relative URLs as they are', () => {
    expect(resolveMediaUrl('https://cdn.example.com/a.mp3', '/mixes')).toBe(
      'https://cdn.example.com/a.mp3',
    );
    expect(resolveMediaUrl('/img/covers/a.jpg', 'https://m.example.com')).toBe('/img/covers/a.jpg');
  });

  it('ignores a leading ./ and extra slashes', () => {
    expect(resolveMediaUrl('./a//b.mp3', '/mixes/')).toBe('/mixes/a/b.mp3');
  });
});

describe('prepareMixes', () => {
  const base = {
    durationSeconds: 60,
    audioUrl: 'a.mp3',
  };

  it('resolves media URLs and sorts newest first', () => {
    const mixes = prepareMixes(
      [
        { ...base, id: '1', slug: 'old', title: 'Old', date: '2025-01-01', cover: 'c.jpg' },
        { ...base, id: '2', slug: 'new', title: 'New', date: '2026-05-01' },
      ],
      'https://m.example.com',
    );
    expect(mixes.map((m) => m.slug)).toEqual(['new', 'old']);
    expect(mixes[0]?.audioUrl).toBe('https://m.example.com/a.mp3');
    expect(mixes[1]?.cover).toBe('https://m.example.com/c.jpg');
    expect(mixes[0]).not.toHaveProperty('cover');
  });
});
