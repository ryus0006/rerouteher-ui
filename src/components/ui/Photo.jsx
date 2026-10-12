/**
 * Responsive photo with a WebP source and JPEG fallback.
 *
 * `width` and `height` are the intrinsic pixel dimensions, letting the browser
 * reserve space and avoid layout shift. The displayed aspect ratio comes from
 * `className`, with `object-cover` cropping to fit.
 */
export default function Photo({
  webp,
  jpg,
  alt,
  width,
  height,
  className = '',
  loading = 'lazy',
  fetchPriority = 'auto',
}) {
  // `contents` removes the <picture> box so the image lays out as a direct child of its container.
  return (
    <picture className="contents">
      <source srcSet={webp} type="image/webp" />
      <img
        src={jpg}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        className={className}
      />
    </picture>
  );
}
