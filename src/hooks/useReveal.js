import { useEffect, useRef } from 'react';

/**
 * Marks an element with `data-shown` once it scrolls into view, which starts
 * its `.reveal` entry animation. Observation stops after the first reveal.
 *
 * Without IntersectionObserver (older browsers, jsdom) the element is shown
 * immediately, so content never stays hidden.
 *
 * @returns {import('react').RefObject<HTMLElement>}
 */
export default function useReveal() {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      node.dataset.shown = '';
      return undefined;
    }

    /* The negative bottom margin starts the reveal slightly after the element
       enters, so the motion is seen rather than finished off-screen. */
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        node.dataset.shown = '';
        observer.disconnect();
      },
      { rootMargin: '0px 0px -12% 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return ref;
}
