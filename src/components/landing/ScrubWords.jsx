import { motion, useReducedMotion, useTransform } from 'motion/react';

/**
 * One word whose ink fills in over its slice of the scroll range.
 *
 * The opacity is computed in a function rather than a range map. Motion
 * hands range maps on scroll progress to the browser's native scroll
 * timeline, which drops back to the starting value once scrolling passes
 * the end of the range, leaving the line faded at the bottom of the page.
 */
function Word({ progress, from, to, children }) {
  const opacity = useTransform(progress, (value) => {
    const amount = Math.min(1, Math.max(0, (value - from) / (to - from)));
    return 0.14 + 0.86 * amount;
  });
  return <motion.span style={{ opacity }}>{children}</motion.span>;
}

/**
 * Text that inks in word by word as `progress` (a 0–1 MotionValue) advances,
 * so reading pace follows scroll pace. `range` picks the slice of progress the
 * whole line uses. The words stay real text, so the heading reads and copies
 * as one sentence. Under reduced motion the text renders fully inked.
 */
export default function ScrubWords({ text, progress, range = [0, 1], className = '' }) {
  const reduce = useReducedMotion();
  if (reduce) return <span className={className}>{text}</span>;

  const words = text.split(' ');
  const [start, end] = range;
  const step = (end - start) / words.length;

  return (
    <span className={className}>
      {words.map((word, at) => (
        <Word
          key={`${word}-${at}`}
          progress={progress}
          from={start + step * at}
          to={Math.min(end, start + step * (at + 1.6))}
        >
          {word}
          {at < words.length - 1 ? ' ' : ''}
        </Word>
      ))}
    </span>
  );
}
