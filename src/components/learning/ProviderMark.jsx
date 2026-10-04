import figmaLogo from '../../assets/logos/figma.png';
import youtubeLogo from '../../assets/logos/youtube.png';
import nngroupLogo from '../../assets/logos/nngroup.png';
import openaiLogo from '../../assets/logos/openai.png';

/* Provider logos are self-hosted to avoid third-party requests. */
const LOGOS = {
  figma: figmaLogo,
  youtube: youtubeLogo,
  nngroup: nngroupLogo,
  openai: openaiLogo,
};

/**
 * Provider logo, falling back to initials. Hidden from assistive technology
 * because the provider name is rendered beside it.
 */
export default function ProviderMark({ logo, provider, className = 'size-8' }) {
  const source = LOGOS[logo];

  if (source) {
    return (
      <img
        src={source}
        alt=""
        aria-hidden="true"
        width="32"
        height="32"
        loading="lazy"
        decoding="async"
        className={`${className} shrink-0 rounded-lg object-contain`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${className} flex shrink-0 items-center justify-center rounded-lg bg-canvas-sunk text-[0.625rem] font-bold leading-none text-ink-soft`}
    >
      {provider.slice(0, 2)}
    </span>
  );
}
