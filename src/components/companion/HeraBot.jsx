import { useId } from 'react';

/**
 * Companion mascot as an inline SVG robot.
 *
 * - `waving`: the arm waves periodically to draw attention to the launcher.
 * - `thinking`: the eyes move side to side while a reply is pending.
 *
 * All shapes stay within the viewBox so the icon never overflows its container.
 */
export default function HeraBot({ className = 'size-9', thinking = false, waving = false }) {
  const id = useId();
  const head = `${id}-head`;
  const visor = `${id}-visor`;
  const pink = `${id}-pink`;

  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      data-thinking={thinking || undefined}
      data-waving={waving || undefined}
      className={`hera-bot ${className}`}
    >
      <defs>
        <linearGradient id={head} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e9e2f7" />
        </linearGradient>
        <linearGradient id={visor} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8f3463" />
          <stop offset="1" stopColor="#521f48" />
        </linearGradient>
        <linearGradient id={pink} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff9fbd" />
          <stop offset="1" stopColor="#e2507f" />
        </linearGradient>
      </defs>

      <rect x="30.8" y="6.5" width="2.4" height="9.5" rx="1.2" fill="#cdbff0" />
      <circle className="hera-bot-bulb" cx="32" cy="6" r="3.6" fill={`url(#${pink})`} />

      <rect x="6.5" y="28" width="6" height="14" rx="3" fill={`url(#${pink})`} />
      <rect x="51.5" y="28" width="6" height="14" rx="3" fill={`url(#${pink})`} />

      <rect x="10.5" y="14.5" width="43" height="41" rx="14.5" fill={`url(#${head})`} />
      <rect
        x="10.5"
        y="14.5"
        width="43"
        height="41"
        rx="14.5"
        fill="none"
        stroke="#2c2142"
        strokeOpacity="0.08"
      />

      <rect x="15.5" y="22.5" width="33" height="18" rx="9" fill={`url(#${visor})`} />
      <g className="hera-bot-eyes">
        <rect className="hera-bot-eye" x="23" y="27.25" width="4.2" height="8.5" rx="2.1" />
        <rect className="hera-bot-eye" x="36.8" y="27.25" width="4.2" height="8.5" rx="2.1" />
      </g>

      <g className="hera-bot-arm">
        <rect x="52.25" y="23" width="4.5" height="17" rx="2.25" fill="#d6cbf2" />
        <circle cx="54.5" cy="21.5" r="4.6" fill={`url(#${pink})`} />
      </g>

      <path
        d="M27.5 46.5q4.5 3.6 9 0"
        fill="none"
        stroke="#be3f6c"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
