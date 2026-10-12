/**
 * Decorative artwork for a result card. The CSS mask leaves the reading area
 * clear while letting the illustration fade in from the card's right edge.
 */
export default function CardIllustration({ src, className = '' }) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      className={`card-illustration ${className}`}
    />
  );
}
