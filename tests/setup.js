import '@testing-library/jest-dom/vitest';
import { createElement, forwardRef } from 'react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from '../src/mocks/server.js';

// Motion elements apply `initial` styles (e.g. opacity: 0) and animate on a frame
// that jsdom never runs, so content reads as "not visible". Render motion.* as plain
// DOM at the final state, and collapse the animation wrappers/hooks to no-ops.
vi.mock('motion/react', () => {
  const MOTION_PROPS = new Set([
    'initial', 'animate', 'exit', 'transition', 'variants', 'custom', 'layout', 'layoutId',
    'layoutScroll', 'layoutDependency', 'drag', 'dragConstraints', 'dragElastic', 'dragMomentum',
    'whileHover', 'whileTap', 'whileFocus', 'whileInView', 'whileDrag', 'viewport',
    'onAnimationStart', 'onAnimationComplete', 'onUpdate', 'onHoverStart', 'onHoverEnd',
    'onTap', 'onTapStart', 'onTapCancel', 'onDragStart', 'onDragEnd', 'onDrag', 'onViewportEnter',
    'onViewportLeave',
  ]);
  const strip = (props) =>
    Object.fromEntries(Object.entries(props).filter(([key]) => !MOTION_PROPS.has(key)));
  // Cache one component per tag: a fresh component on every access would change the
  // element type each render, making React remount (and briefly detach) the subtree.
  const cache = new Map();
  const motion = new Proxy(
    {},
    {
      get: (_target, tag) => {
        const key = String(tag);
        if (!cache.has(key)) {
          const Component = forwardRef((props, ref) =>
            createElement(key, { ref, ...strip(props) })
          );
          Component.displayName = `motion.${key}`;
          cache.set(key, Component);
        }
        return cache.get(key);
      },
    }
  );
  const motionValue = { get: () => 0, set() {}, on: () => () => {} };
  return {
    motion,
    AnimatePresence: ({ children }) => children,
    MotionConfig: ({ children }) => children,
    useReducedMotion: () => true,
    useInView: () => true,
    useScroll: () => ({ scrollYProgress: motionValue, scrollY: motionValue }),
    useTransform: () => motionValue,
  };
});

class IntersectionObserverMock {
  observe() {}

  unobserve() {}

  disconnect() {}

  takeRecords() {
    return [];
  }
}

if (typeof globalThis.IntersectionObserver === 'undefined') {
  globalThis.IntersectionObserver = IntersectionObserverMock;
}

// jsdom has no matchMedia. Report reduced-motion so motion renders at its final
// state (no pending opacity/transform animation that would read as "not visible").
if (typeof globalThis.matchMedia === 'undefined') {
  globalThis.matchMedia = () => ({
    matches: true,
    media: '',
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() {
      return false;
    },
  });
  if (globalThis.window) globalThis.window.matchMedia = globalThis.matchMedia;
}

// The jsdom environment does not expose Storage on the test global.
class MemoryStorage {
  #entries = new Map();

  get length() {
    return this.#entries.size;
  }

  key(index) {
    return [...this.#entries.keys()][index] ?? null;
  }

  getItem(key) {
    return this.#entries.get(String(key)) ?? null;
  }

  setItem(key, value) {
    this.#entries.set(String(key), String(value));
  }

  removeItem(key) {
    this.#entries.delete(String(key));
  }

  clear() {
    this.#entries.clear();
  }
}

// Stores persist to sessionStorage; localStorage is provided for libraries that use it.
for (const name of ['localStorage', 'sessionStorage']) {
  if (typeof globalThis[name] !== 'undefined') continue;

  const storage = new MemoryStorage();
  globalThis[name] = storage;
  if (globalThis.window) globalThis.window[name] = storage;
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
  sessionStorage.clear();
});

afterAll(() => server.close());
