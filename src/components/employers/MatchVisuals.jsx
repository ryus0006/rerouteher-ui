import { useState } from 'react';

/** Logo placeholder: the company name on its brand colour. */
export function LogoTile({ logo, logoUrl, name, size = 'size-14' }) {
  // Show the image logo when present; fall back to the initials/name badge if it is
  // missing or fails to load.
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(logoUrl) && !imageFailed;
  const long = (logo?.text ?? name).length > 7;

  return (
    <span
      aria-hidden="true"
      style={
        showImage
          ? undefined
          : { backgroundColor: logo?.bg ?? 'var(--color-canvas-sunk)', color: logo?.fg ?? '#fff' }
      }
      className={[
        'flex shrink-0 items-center justify-center overflow-hidden rounded-2xl text-center font-bold leading-tight',
        'shadow-[inset_0_0_0_1px_rgb(44_33_66/0.06)]',
        size,
        showImage ? 'bg-white p-1.5' : 'px-1',
        // Smaller text for long names so they fit the tile.
        long ? 'text-[0.625rem]' : 'text-[0.75rem]',
      ].join(' ')}
    >
      {showImage ? (
        <img
          src={logoUrl}
          alt=""
          loading="lazy"
          className="size-full object-contain"
          onError={() => setImageFailed(true)}
        />
      ) : (
        (logo?.text ?? name)
      )}
    </span>
  );
}

/**
 * Segmented met/total meter. Decorative; the adjacent label conveys the same count.
 */
export function MatchMeter({ met, total }) {
  return (
    <span aria-hidden="true" className="flex gap-1">
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={`h-1.5 w-6 rounded-full ${index < met ? 'bg-verify' : 'bg-ink/10'}`}
        />
      ))}
    </span>
  );
}
