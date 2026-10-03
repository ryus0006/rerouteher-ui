import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const OPEN_DELAY_MS = 90;
const GAP = 10;
const EDGE = 12;
const WIDTH = 272;

/**
 * Floating skill-definition popover, shown on hover or keyboard focus. Placed
 * above the trigger, or below when there is not enough space.
 *
 * Portalled to the body and positioned relative to the viewport so ancestor
 * overflow cannot clip it and it does not affect layout. The definition is
 * also rendered as visually hidden text referenced by the trigger for screen
 * readers. Escape dismisses it. Renders only the trigger when no definition is
 * provided.
 */
export default function SkillDefinitionPopover({ definition, label, children }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [position, setPosition] = useState(null);
  const trigger = useRef(null);
  const card = useRef(null);
  const timer = useRef(0);
  const descriptionId = useId();
  const isOpen = Boolean(definition) && (hovered || focused);

  const place = useCallback(() => {
    const anchor = trigger.current?.getBoundingClientRect();
    const height = card.current?.offsetHeight ?? 0;
    if (!anchor) return;

    const above = anchor.top - GAP - height >= EDGE;
    const centre = anchor.left + anchor.width / 2;
    const left = Math.min(Math.max(centre - WIDTH / 2, EDGE), window.innerWidth - WIDTH - EDGE);
    setPosition({
      left,
      top: above ? anchor.top - GAP - height : anchor.bottom + GAP,
      above,
      // Keep the arrow over the trigger when the card is clamped to the viewport.
      arrow: Math.min(Math.max(centre - left, 16), WIDTH - 16),
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return undefined;
    // Position the newly mounted card, then keep it aligned on scroll and resize.
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [isOpen, place]);

  useEffect(() => () => clearTimeout(timer.current), []);

  if (!definition) return children({});

  const triggerProps = {
    ref: trigger,
    'aria-describedby': descriptionId,
    onMouseEnter: () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setHovered(true), OPEN_DELAY_MS);
    },
    onMouseLeave: () => {
      clearTimeout(timer.current);
      setHovered(false);
      if (!focused) setPosition(null);
    },
    onFocus: () => setFocused(true),
    onBlur: () => {
      setFocused(false);
      if (!hovered) setPosition(null);
    },
    onKeyDown: (event) => {
      if (event.key !== 'Escape') return;
      setHovered(false);
      setFocused(false);
      setPosition(null);
    },
  };

  return (
    <>
      {children(triggerProps)}
      <span id={descriptionId} className="sr-only">
        {definition}
      </span>
      {isOpen &&
        createPortal(
          <div
            ref={card}
            aria-hidden="true"
            className={`skill-popover ${position ? 'skill-popover-shown' : ''} ${
              position?.above === false ? 'skill-popover-below' : ''
            }`}
            style={{
              width: WIDTH,
              left: position?.left ?? -9999,
              top: position?.top ?? -9999,
              '--arrow-x': `${position?.arrow ?? WIDTH / 2}px`,
            }}
          >
            <p className="font-display text-[0.8125rem] font-bold text-ink">{label}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">{definition}</p>
          </div>,
          document.body
        )}
    </>
  );
}
