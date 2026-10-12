/**
 * Suggested rewording shown next to the original text. The CV is updated only
 * when the user accepts it.
 */
export default function AiSuggestion({ state, onAccept, onAnother, onDismiss }) {
  if (state.loading && !state.text) {
    return (
      <p role="status" className="cv-suggestion cv-suggestion-loading">
        <span className="interview-spinner" aria-hidden="true" />
        Finding clearer wording…
      </p>
    );
  }

  if (state.error) {
    return (
      <div role="alert" className="cv-suggestion">
        <p className="text-sm text-ink">{state.error}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={onAnother} className="cv-chip-button">
            Try again
          </button>
          <button type="button" onClick={onDismiss} className="cv-chip-button">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cv-suggestion" aria-live="polite">
      <p className="text-xs font-semibold text-pink-600">Suggested wording</p>
      <p className={`mt-1.5 text-sm leading-relaxed text-ink ${state.loading ? 'opacity-50' : ''}`}>
        {state.text}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-ink-soft">
        Same meaning, clearer wording. Nothing is added that is not already in your draft.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={state.loading}
          onClick={onAccept}
          className="cv-chip-button cv-chip-button-primary"
        >
          Use this wording
        </button>
        <button
          type="button"
          disabled={state.loading}
          onClick={onAnother}
          className="cv-chip-button"
        >
          {state.loading ? 'Finding another…' : 'Try another'}
        </button>
        <button
          type="button"
          disabled={state.loading}
          onClick={onDismiss}
          className="cv-chip-button"
        >
          Keep mine
        </button>
      </div>
    </div>
  );
}
