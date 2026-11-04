function wholeSeconds(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

/** Player clock: "4:05", "1:01:30". */
export function formatTime(seconds: number): string {
  const total = wholeSeconds(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = String(total % 60).padStart(2, '0');
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${secs}` : `${minutes}:${secs}`;
}

/** Friendly length for lists: "58 min", "1 h 02 min". */
export function formatDuration(seconds: number): string {
  const minutes = Math.round(wholeSeconds(seconds) / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`;
}

/** Spoken form for screen readers: "1 hour, 1 minute, 30 seconds". */
export function describeTime(seconds: number): string {
  const total = wholeSeconds(seconds);
  const parts: [number, string][] = [
    [Math.floor(total / 3600), 'hour'],
    [Math.floor((total % 3600) / 60), 'minute'],
    [total % 60, 'second'],
  ];
  const spoken = parts
    .filter(([value]) => value > 0)
    .map(([value, unit]) => `${value} ${unit}${value === 1 ? '' : 's'}`);
  return spoken.length > 0 ? spoken.join(', ') : '0 seconds';
}

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** "2026-10-18" to "18 Oct 2026", independent of the viewer's time zone. */
export function formatDate(isoDate: string): string {
  const [year = 1970, month = 1, day = 1] = isoDate.split('-').map(Number);
  return dateFormat.format(new Date(Date.UTC(year, month - 1, day)));
}
