/**
 * A photograph with a WebP source and a JPEG fallback.
 *
 * `width` and `height` are the file's intrinsic pixels, so the browser reserves
 * the box before the image arrives and nothing around it shifts on load. The
 * frame's own aspect ratio comes from `className`, with `object-cover` cropping
 * to it.
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
  // `contents` removes the picture's own box, so the image lays out as a direct
  // child of whatever frame it is dropped into.
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
