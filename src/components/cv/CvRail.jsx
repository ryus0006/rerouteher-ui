import { CheckCircle, DownloadSimple, Plus } from '@phosphor-icons/react';

/**
 * Side panel for the CV builder: download, the career-break inclusion choice,
 * and suggested skills to add. Contact details are not edited here; the PDF
 * prints placeholders for them.
 */
export default function CvRail({
  draft,
  role,
  suggestedSkills,
  downloadError,
  disabled,
  onDownload,
  onCareerBreakChoice,
  onAddSkill,
}) {
  const careerBreak = draft.careerBreak;

  return (
    <aside className="cv-rail" aria-label="Finish your CV">
      <div className="cv-bezel cv-rise" style={{ '--i': 2 }}>
        <section className="cv-bezel-core">
          <button
            type="button"
            onClick={onDownload}
            disabled={disabled}
            className="cv-download group"
          >
            <span>Download PDF</span>
            <span className="cv-download-icon" aria-hidden="true">
              <DownloadSimple weight="bold" className="size-4" />
            </span>
          </button>
          {downloadError && (
            <p role="alert" className="mt-3 text-sm text-pink-600">
              {downloadError}
            </p>
          )}
          <p className="mt-4 flex items-center gap-2 text-xs text-ink-soft">
            <CheckCircle weight="fill" className="size-4 shrink-0 text-verify" aria-hidden="true" />
            Saved to your account as you type
          </p>
          <p className="mt-2 text-xs leading-relaxed text-ink-soft">
            Anything you leave blank, like your phone number, prints as a field you can fill in on
            the PDF.
          </p>
        </section>
      </div>

      {careerBreak && (
        <div className="cv-bezel cv-rise" style={{ '--i': 3 }}>
          <section
            className="cv-bezel-core"
            data-asking={careerBreak.include === null || undefined}
            aria-labelledby="cv-break-title"
          >
            <h2 id="cv-break-title" className="font-display text-lg font-bold text-ink">
              Include your career break?
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              It shows as a career break with the strengths you built, never as a job. Your call
              either way.
            </p>
            <div className="cv-segment mt-4" role="group" aria-label="Career break on your CV">
              <button
                type="button"
                aria-pressed={careerBreak.include === true}
                onClick={() => onCareerBreakChoice(true)}
              >
                Include it
              </button>
              <button
                type="button"
                aria-pressed={careerBreak.include === false}
                onClick={() => onCareerBreakChoice(false)}
              >
                Leave it out
              </button>
            </div>
          </section>
        </div>
      )}

      {suggestedSkills.length > 0 && (
        <div className="cv-bezel cv-rise" style={{ '--i': 4 }}>
          <section className="cv-bezel-core" aria-labelledby="cv-skills-title">
            <h2 id="cv-skills-title" className="font-display text-lg font-bold text-ink">
              Add skills from your profile
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              Already in your journey, so safe to claim.
              {suggestedSkills.some((s) => s.relevant) && ` Marked ones fit ${role} best.`}
              {suggestedSkills.some((s) => s.learned) &&
                ' Learned ones come from focus areas you finished.'}
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {suggestedSkills.map(({ skill, relevant, learned }) => (
                <li key={skill}>
                  <button
                    type="button"
                    onClick={() => onAddSkill(skill)}
                    className="cv-skill-chip"
                    data-relevant={relevant || learned || undefined}
                  >
                    <Plus weight="bold" className="size-3" aria-hidden="true" />
                    {skill}
                    {learned ? (
                      <span className="cv-skill-fit cv-skill-learned">Learned</span>
                    ) : (
                      relevant && <span className="cv-skill-fit">Fits role</span>
                    )}
                    <span className="sr-only">, add to your CV</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      <p className="cv-rise px-2 text-xs leading-relaxed text-ink-soft" style={{ '--i': 5 }}>
        Wording help only sees the section you ask about. Your contact details never leave this
        page.
      </p>
    </aside>
  );
}
