import Header from '../../components/layout/Header.jsx';
import BackLink from '../../components/intake/BackLink.jsx';
import CardIllustration from '../../components/ui/CardIllustration.jsx';
import { useIntakeStore } from '../../store/intakeStore.js';
import cvStationery from '../../assets/page-illustrations/cv-stationery.png';

function BlankField({ label }) {
  return (
    <p className="border-b border-ink/25 pb-1 text-sm text-ink-soft">
      {label}: ______________________________
    </p>
  );
}

export default function Cv() {
  const snapshot = useIntakeStore((state) => state.snapshot);
  const selectedRole = useIntakeStore((state) => state.selectedRole);
  const cv = useIntakeStore((state) => state.cv);

  if (!snapshot || !selectedRole) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-[760px] flex-1 px-5 py-16">
          <h1 className="font-display text-3xl font-bold text-ink">
            Your CV will be ready after two steps
          </h1>
          <p className="mt-3 text-ink-soft">
            Complete your Skill Snapshot and choose a target role first. We’ll then create a CV from
            only the information saved in your journey.
          </p>
          <a
            href="/diagnostic/background"
            className="mt-6 inline-flex rounded-full bg-pink-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Continue your journey
          </a>
        </main>
      </div>
    );
  }

  const skills = [...(snapshot.professional_skills ?? []), ...(snapshot.reframed_skills ?? [])];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-[1080px] flex-1 px-5 py-8 sm:px-6 sm:py-10">
        <BackLink to="/journey">Back to your journey</BackLink>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow text-pink-600">Refreshed CV</p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.02em] text-ink sm:text-4xl">
              A CV built from your journey
            </h1>
            <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
              Your personal details are deliberately blank, so you can complete them before
              applying.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-full bg-pink-600 px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-pink-500"
          >
            Download as PDF
          </button>
        </div>
        <article className="cv-sheet card-with-illustration mt-8 bg-white p-7 shadow-card sm:p-10">
          <CardIllustration src={cvStationery} />
          <div className="border-b-2 border-ink pb-6">
            <h2 className="font-display text-3xl font-bold text-ink">Your name</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <BlankField label="Email" />
              <BlankField label="Phone" />
              <BlankField label="Location" />
              <BlankField label="LinkedIn" />
            </div>
          </div>
          <section className="mt-7">
            <h3 className="cv-heading">Professional summary</h3>
            <p className="mt-3 max-w-[70ch] text-sm leading-relaxed text-ink-soft">
              Returning to work as a {selectedRole.role}, bringing recognised professional
              experience alongside transferable strengths developed during caregiving.
            </p>
          </section>
          <section className="mt-7">
            <h3 className="cv-heading">Core skills</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <li
                  key={skill.skill}
                  className="rounded-full bg-canvas-sunk px-3 py-1.5 text-sm text-ink"
                >
                  {skill.skill}
                </li>
              ))}
            </ul>
          </section>
          <section className="mt-7">
            <h3 className="cv-heading">Experience</h3>
            {cv?.experiences?.length ? (
              <div className="mt-3 space-y-5">
                {cv.experiences.map((experience) => (
                  <article key={`${experience.title}-${experience.organisation}`}>
                    <p className="font-semibold text-ink">
                      {experience.title} · {experience.organisation}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                      {experience.description}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-ink-soft">
                Experience details will appear when they are available in your saved journey.
              </p>
            )}
          </section>
          <section className="mt-7">
            <h3 className="cv-heading">Transferable caregiving strengths</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              {snapshot.reframed_skills.map((skill) => skill.skill).join(' · ') ||
                'Recognised strengths from your caregiving experience.'}
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}
