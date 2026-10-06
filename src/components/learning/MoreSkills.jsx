/**
 * The skills outside the focus areas, in one place: gaps up later, skills to
 * refresh, and finished areas. Each is a tab whose label carries its count, so
 * only one list is on the page at a time. Empty tabs are left out.
 */
export default function MoreSkills({ tabs, current, onSelect }) {
  const shown = tabs.find((tab) => tab.id === current) ?? tabs[0];
  if (!shown) return null;

  return (
    <section id="more-skills" aria-label="More skills" className="lp-area lp-later">
      <div className="lp-chapter">
        <div role="tablist" aria-label="More skills" className="lp-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`more-tab-${tab.id}`}
              aria-selected={tab.id === shown.id}
              aria-controls={`more-panel-${tab.id}`}
              onClick={() => onSelect(tab.id)}
              className="lp-tab"
            >
              {tab.label}
              <span className="lp-tab-count tabular">{tab.count}</span>
            </button>
          ))}
        </div>
        <span aria-hidden="true" className="lp-chapter-rule" />
      </div>

      <div
        key={shown.id}
        role="tabpanel"
        id={`more-panel-${shown.id}`}
        aria-labelledby={`more-tab-${shown.id}`}
        className="lp-swap mt-4"
      >
        {shown.panel}
      </div>
    </section>
  );
}
