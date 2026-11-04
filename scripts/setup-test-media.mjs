// Prepares the synthetic test mix for the Playwright tests (tests/fixtures/media/test-mix.mp3).
// Safe to run often: does nothing when the file exists. Needs ffmpeg. A beat with a different
// pitch starts at every marker, and on macOS a voice reads the marker time, so you can hear
// the tracklist highlight switch. The demo mixes in tests/fixtures/mixes.json use these
// markers. The MP3 is gitignored and never part of a real build.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, 'tests', 'fixtures', 'media', 'test-mix.mp3');

// Marker start times in seconds. The demo tracklists in tests/fixtures/mixes.json use them.
const MARKERS = [0, 300, 690, 1080, 1485, 1860, 2300, 2700, 3150, 3480];
const TOTAL_SECONDS = 3690;
const PITCHES = [220, 247, 262, 294, 330, 349, 392, 440, 494, 523];
const SAMPLE_RATE = 22050;

function has(command) {
  return spawnSync('which', [command], { stdio: 'ignore' }).status === 0;
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: ['ignore', 'ignore', 'pipe'] });
  if (result.status !== 0) {
    throw new Error(`${command} failed:\n${result.stderr?.toString().slice(-2000)}`);
  }
}

function spokenTime(seconds) {
  if (seconds === 0) return 'Start of the St. Marco test mix.';
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `Marker. ${minutes} minutes${rest ? ` ${rest}` : ''}.`;
}

function generate() {
  const work = mkdtempSync(join(tmpdir(), 'stmarco-media-'));
  const withVoice = has('say');
  const segments = [];
  try {
    MARKERS.forEach((start, index) => {
      const end = MARKERS[index + 1] ?? TOTAL_SECONDS;
      const pitch = PITCHES[index % PITCHES.length];
      const music =
        `aevalsrc=exprs='0.32*sin(2*PI*52*t)*exp(-14*mod(t,0.5))` +
        `+0.10*sin(2*PI*${pitch}*t)*exp(-5*mod(t+0.25,0.5))` +
        `+0.025*sin(2*PI*${pitch * 1.5}*t)':s=${SAMPLE_RATE}:d=${end - start}`;
      const out = join(work, `segment-${index}.wav`);
      process.stdout.write(`  segment ${index + 1}/${MARKERS.length}\r`);

      if (withVoice) {
        const voice = join(work, `voice-${index}.aiff`);
        run('say', ['-o', voice, spokenTime(start)]);
        run('ffmpeg', [
          '-y',
          '-v',
          'error',
          '-f',
          'lavfi',
          '-i',
          music,
          '-i',
          voice,
          '-filter_complex',
          `[1:a]aformat=sample_rates=${SAMPLE_RATE}:channel_layouts=mono,volume=1.4[v];` +
            '[0:a][v]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[out]',
          '-map',
          '[out]',
          '-ac',
          '1',
          '-ar',
          String(SAMPLE_RATE),
          out,
        ]);
      } else {
        run('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', music, '-ac', '1', out]);
      }
      segments.push(out);
    });

    const list = join(work, 'segments.txt');
    writeFileSync(list, segments.map((file) => `file '${file}'`).join('\n'));
    const mp3 = join(work, 'test-mix.mp3');
    run('ffmpeg', [
      '-y',
      '-v',
      'error',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      list,
      '-c:a',
      'libmp3lame',
      '-b:a',
      '32k',
      '-ac',
      '1',
      '-ar',
      String(SAMPLE_RATE),
      '-metadata',
      'title=St. Marco test mix',
      '-metadata',
      'artist=St. Marco',
      mp3,
    ]);
    mkdirSync(dirname(target), { recursive: true });
    renameSync(mp3, target);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

if (existsSync(target)) {
  process.exit(0);
}

if (has('ffmpeg')) {
  console.log('Generating the 61:30 synthetic test mix (one time, takes a moment)...');
  generate();
  console.log('Done: tests/fixtures/media/test-mix.mp3');
} else {
  console.error('ffmpeg is needed to generate the test mix for the Playwright tests.');
  process.exit(1);
}
