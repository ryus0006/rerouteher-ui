import { PREFERENCE_TAXONOMY } from '../../config/preferenceTaxonomy.js';

/**
 * Everything she can ask of a workplace, all of it on screen at once.
 *
 * The categories are headings rather than disclosure rows: collapsed, the step
 * showed four grey bars and none of the answers, so the only way to find out
 * whether childcare was on the list was to open all four. Fourteen short labels
 * fit in the space the closed accordion took up.
 *
 * Selected reads blue, the selection colour everywhere else in the product.
 * Green is reserved for a claim we can source, which is exactly what a need she
 * has ticked is not.
 */
export default function NeedPicker({ selections, onChange }) {
  function toggle(categoryId, optionId) {
    const current = selections[categoryId] ?? [];

    onChange(
      categoryId,
      current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId]
    );
  }

  return (
    <div className="space-y-5">
      {PREFERENCE_TAXONOMY.map((category) => (
        <fieldset key={category.id}>
          <legend className="text-sm font-semibold text-ink">{category.label}</legend>

          <div className="mt-2.5 flex flex-wrap gap-2">
            {category.options.map((option) => {
              const checked = (selections[category.id] ?? []).includes(option.id);

              return (
                <label
                  key={option.id}
                  className={[
                    'cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition duration-200 ease-spring',
                    'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-blue-600',
                    checked
                      ? 'border-blue-600 bg-blue-600 font-medium text-white'
                      : 'border-line-strong bg-surface text-ink-soft hover:border-blue-600/45 hover:text-ink',
                  ].join(' ')}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(category.id, option.id)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
