import { motion } from 'motion/react';

const EASE = [0.32, 0.72, 0, 1];

/**
 * Word-by-word reveal animation; each word slides up within its own clipped
 * box. The full text is exposed as a single string to assistive technology.
 */
export default function WordReveal({ text, as: Tag = 'span', className = '', id }) {
  const words = text.split(' ');
  return (
    <Tag id={id} className={className} aria-label={text}>
      {words.map((word, at) => (
        <span key={`${word}-${at}`} aria-hidden="true" className="iv-word">
          <motion.span
            className="inline-block"
            initial={{ y: '105%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.12 + at * 0.035 }}
          >
            {word}
          </motion.span>
          {at < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </Tag>
  );
}
