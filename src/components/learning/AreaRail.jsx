import { ArrowCounterClockwise, CaretRight, Check, Plus } from '@phosphor-icons/react';
import LearningIcon from '../plan/LearningIcon.jsx';

/**
 * A focus area in the rail: its icon, name and progress. Refreshers use the
 * same row, marked by their green tone and a refresh icon.
 */
function RailItem({ area, active, onSelect }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(area.skill_id)}
        aria-current={active === area.skill_id ? 'true' : undefined}
        data-tone={area.tone}
        data-complete={area.complete || undefined}
        className="lp-rail-item lp-tone group"
      >
        <span aria-hidden="true" className="lp-area-icon lp-area-icon-sm">
          {area.complete ? (
            <Check weight="bold" className="size-4" />
          ) : area.refresher ? (
            <ArrowCounterClockwise weight="bold" className="size-4" />
          ) : (
            <LearningIcon name={area.icon} className="size-4" />
          )}
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="line-clamp-2 block text-sm font-semibold leading-snug text-ink">
            {area.skill}
          </span>
          <span className="mt-2 flex items-center gap-2">
            <span aria-hidden="true" className="flex flex-1 gap-1">
              {area.statuses.map((status, index) => (
                <span key={index} className="lp-meter-track h-1 flex-1">
                  <span className="lp-meter-fill" data-status={status ?? 'none'} />
                </span>
              ))}
            </span>
            <span className="text-[0.6875rem] font-medium text-ink-faint tabular">
              {area.done}/{area.statuses.length}
            </span>
          </span>
        </span>
        <CaretRight weight="bold" className="lp-rail-caret" aria-hidden="true" />
      </button>
    </li>
  );
}

/**
 * Sticky list of focus areas beside the resources. Each shows its progress
 * and, when picked, shows its resources in the main column; a caret marks the
 * one showing. Gaps not yet in the plan are counted after them, linking to Up
 * later. Refreshers follow in their own group, and finished areas as single
 * lines.
 */
export default function AreaRail({
  areas,
  active,
  onSelect,
  laterCount = 0,
  onLater,
  refreshing = [],
  finished = [],
  onSelectFinished,
}) {
  return (
    <nav aria-label="Focus areas" className="lg:sticky lg:top-8">
      {areas.length > 0 && (
        <div className="mb-3 px-3">
          <p className="lp-eyebrow">Learning now</p>
          <p className="mt-1 text-xs text-ink-faint">Pick a skill to see its resources.</p>
        </div>
      )}
      <ol className="space-y-1">
        {areas.map((area) => (
          <RailItem key={area.skill_id} area={area} active={active} onSelect={onSelect} />
        ))}
      </ol>
      {laterCount > 0 && (
        <button type="button" onClick={onLater} className="lp-rail-later mt-1">
          <span aria-hidden="true" className="lp-rail-later-icon">
            <Plus weight="bold" className="size-3.5" />
          </span>
          {laterCount} more {laterCount === 1 ? 'skill' : 'skills'} up later
        </button>
      )}
      {refreshing.length > 0 && (
        <>
          <p className={`lp-eyebrow px-3 ${areas.length || laterCount ? 'mt-7' : ''}`}>
            Refreshing
          </p>
          <ol className="mt-3 space-y-1">
            {refreshing.map((area) => (
              <RailItem key={area.skill_id} area={area} active={active} onSelect={onSelect} />
            ))}
          </ol>
        </>
      )}
      {finished.length > 0 && (
        <>
          <p
            className={`lp-eyebrow px-3 ${
              areas.length || laterCount || refreshing.length ? 'mt-7' : ''
            }`}
          >
            Finished
          </p>
          <ul className="mt-2 space-y-0.5">
            {finished.map((area) => (
              <li key={area.skill_id}>
                <button
                  type="button"
                  onClick={() => onSelectFinished(area.skill_id)}
                  className="lp-rail-done"
                >
                  <span aria-hidden="true" className="lp-done-tick">
                    <Check weight="bold" className="size-3" />
                  </span>
                  <span className="line-clamp-2 min-w-0 flex-1">{area.skill}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </nav>
  );
}
