import { useId } from 'react';
import { formatYears } from '../../lib/formatters.js';

const MIN_YEARS = 0;
const MAX_YEARS = 20;

const THUMB =
  '[&::-webkit-slider-thumb]:size-4.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_2px_6px_rgb(35_42_82/0.35)] [&::-moz-range-thumb]:size-4.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-[0_2px_6px_rgb(35_42_82/0.35)]';

export default function DurationSlider({ value, onChange }) {
  const inputId = useId();
  const filled = ((value - MIN_YEARS) / (MAX_YEARS - MIN_YEARS)) * 100;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={inputId} className="text-sm font-semibold text-ink">
          1. Roughly how long was your career break?
        </label>
        <output htmlFor={inputId} className="text-sm font-semibold text-pink-600">
          {formatYears(value)}
        </output>
      </div>

      <p className="mt-1 text-xs text-ink-soft">
        Select the total duration of your time away from formal employment.
      </p>

      <input
        id={inputId}
        type="range"
        min={MIN_YEARS}
        max={MAX_YEARS}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-valuetext={formatYears(value)}
        /* The gradient stops at the current value, so the track reads as filled
           to the thumb rather than full at every value. */
        style={{
          background: `linear-gradient(to right, var(--color-pink-500), var(--color-violet-600) ${filled}%, rgb(44 33 66 / 0.12) ${filled}%)`,
        }}
        className={`mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full ${THUMB}`}
      />
    </div>
  );
}
