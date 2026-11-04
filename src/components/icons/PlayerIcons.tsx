// Hand-drawn player icons, 24 x 24. Decorative: the buttons carry the labels.

const iconProps = {
  viewBox: '0 0 24 24',
  'aria-hidden': true,
  focusable: false,
} as const;

export function PlayIcon() {
  return (
    <svg className="icon doodle" {...iconProps}>
      <path
        className="doodle__ink-fill"
        d="M7.2 4.1 C6.2 3.6 5.4 4.2 5.5 5.4 L6 18.7 C6.1 20 7.2 20.5 8.3 19.8 L19.2 13 C20.3 12.3 20.2 11.2 19.1 10.6 Z"
      />
    </svg>
  );
}

export function PauseIcon() {
  return (
    <svg className="icon doodle" {...iconProps}>
      <path
        className="doodle__ink-fill"
        d="M6.4 4.3 C7.6 4 9 4.1 9.6 4.5 C10 5 10.1 17 9.8 19.2 C9.6 20 7.8 20.1 6.6 19.8 C6 19.5 5.8 6 6.4 4.3 Z"
      />
      <path
        className="doodle__ink-fill"
        d="M14.5 4.2 C15.7 3.9 17.3 4 17.8 4.5 C18.2 5.2 18.3 17.4 17.9 19.3 C17.6 20 15.9 20.1 14.7 19.8 C14.1 19.4 13.9 6 14.5 4.2 Z"
      />
    </svg>
  );
}

export function PreviousIcon() {
  return (
    <svg className="icon doodle" {...iconProps}>
      <path className="doodle__ink" strokeWidth={2.6} d="M6 5.2 C6.2 9.5 6.1 14.5 5.9 18.8" />
      <path
        className="doodle__ink-fill"
        d="M18.2 5.4 C18.9 5 19.4 5.6 19.3 6.4 L19 17.8 C19 18.7 18.3 19.1 17.6 18.6 L9.4 12.9 C8.7 12.4 8.8 11.6 9.5 11.2 Z"
      />
    </svg>
  );
}

export function NextIcon() {
  return (
    <svg className="icon doodle" {...iconProps}>
      <path className="doodle__ink" strokeWidth={2.6} d="M18 5.2 C17.8 9.5 17.9 14.5 18.1 18.8" />
      <path
        className="doodle__ink-fill"
        d="M5.8 5.4 C5.1 5 4.6 5.6 4.7 6.4 L5 17.8 C5 18.7 5.7 19.1 6.4 18.6 L14.6 12.9 C15.3 12.4 15.2 11.6 14.5 11.2 Z"
      />
    </svg>
  );
}

function SkipIcon({ direction, seconds }: { direction: 'back' | 'forward'; seconds: number }) {
  const back = direction === 'back';
  return (
    <svg className="icon is-skip doodle" {...iconProps}>
      <path
        className="doodle__ink"
        strokeWidth={2.2}
        d={
          back
            ? 'M7.4 5.6 C10.6 3.4 15.6 3.9 18.3 7.2 C21 10.5 20.4 15.7 17 18.3 C13.9 20.7 9 20.3 6.4 17.2'
            : 'M16.6 5.6 C13.4 3.4 8.4 3.9 5.7 7.2 C3 10.5 3.6 15.7 7 18.3 C10.1 20.7 15 20.3 17.6 17.2'
        }
      />
      <path
        className="doodle__ink"
        strokeWidth={2.2}
        d={back ? 'M3.6 6.4 L7.6 5.4 L7.1 1.6' : 'M20.4 6.4 L16.4 5.4 L16.9 1.6'}
      />
      <text className="icon__label" x="12.2" y="15.6" textAnchor="middle">
        {seconds}
      </text>
    </svg>
  );
}

export function BackIcon({ seconds }: { seconds: number }) {
  return <SkipIcon direction="back" seconds={seconds} />;
}

export function ForwardIcon({ seconds }: { seconds: number }) {
  return <SkipIcon direction="forward" seconds={seconds} />;
}
