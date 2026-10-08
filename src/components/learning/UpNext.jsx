import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, BookmarkSimple, Check } from '@phosphor-icons/react';
import ProviderMark from './ProviderMark.jsx';
import { statusOf } from '../../lib/learningProgress.js';

const EASE = [0.32, 0.72, 0, 1];

/**
 * Shelf of the other saved and started resources, after the one featured at
 * the top of the page. New saves join the end.
 */
export default function UpNext({ items, progress, areaName, toneOf, onOpen, onFinish, onRemove }) {
  return (
    <section aria-labelledby="up-next-title" className="mt-12">
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2
            id="up-next-title"
            className="font-display text-xl font-bold tracking-[-0.02em] text-ink"
          >
            Up next
          </h2>
          <p className="text-sm text-ink-soft tabular">
            {items.length} {items.length === 1 ? 'resource' : 'resources'}
          </p>
        </div>

        <ul className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {items.map((item) => {
              const status = statusOf(progress, item.id);
              return (
                <motion.li
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 16, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  data-tone={toneOf(item.skill_id)}
                  className="lp-queue-card lp-tone flex flex-col"
                >
                  <div className="flex items-start gap-3">
                    <ProviderMark logo={item.logo} provider={item.provider} className="size-9" />
                    <div className="min-w-0 flex-1">
                      <p className="lp-area-tag truncate">{areaName(item.skill_id)}</p>
                      <h3 className="mt-0.5 line-clamp-2 text-[0.9375rem] font-semibold leading-snug text-ink">
                        {item.title}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(item)}
                      aria-label={`Remove ${item.title} from Up next`}
                      className="lp-icon-button -mt-1 -mr-1"
                    >
                      <BookmarkSimple weight="fill" className="size-4" aria-hidden="true" />
                    </button>
                  </div>

                  <p className="mt-3 flex items-center gap-2 text-xs text-ink-faint">
                    <span className="lp-status" data-status={status}>
                      {status === 'started' ? 'In progress' : 'Saved'}
                    </span>
                    {item.format}
                  </p>

                  <div className="mt-auto flex items-center gap-2 pt-4">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onOpen(item)}
                      className="lp-primary lp-primary-sm group"
                    >
                      {status === 'started' ? 'Continue' : 'Start'}
                      <span className="lp-primary-icon">
                        <ArrowUpRight weight="bold" className="size-3" aria-hidden="true" />
                      </span>
                      <span className="sr-only">
                        {item.title} at {item.provider}, opens in a new tab
                      </span>
                    </a>
                    <button type="button" onClick={() => onFinish(item)} className="lp-ghost">
                      <Check weight="bold" className="size-3.5" aria-hidden="true" />
                      Mark finished
                      <span className="sr-only">: {item.title}</span>
                    </button>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </div>
    </section>
  );
}
