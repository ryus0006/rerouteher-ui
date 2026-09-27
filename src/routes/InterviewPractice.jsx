import { useMemo, useState } from 'react';
import Header from '../components/layout/Header.jsx';
import interviewIllustration from '../assets/interview-practice-illustration.webp';
import { useIntakeStore } from '../store/intakeStore.js';

const QUESTIONS = [
  'Tell me about yourself and why you are interested in this role.',
  'Tell me about a time you solved a problem at work.',
  'How have your experiences prepared you for this role?',
  'What would you bring to this team in your first few months?',
  'What would you like to ask us about this opportunity?',
];

const FEEDBACK = {
  summary:
    'You gave a warm, clear overview of your experience and showed genuine interest in the role.',
  good: [
    [
      'Clear and well-structured',
      'You introduced your experience and motivation in an easy-to-follow way.',
    ],
    ['Relevant experience', 'You highlighted practical skills that relate to the work.'],
    ['A positive, professional tone', 'Your answer felt considered, open and motivated.'],
  ],
  improve: [
    [
      'Use more specific examples',
      'Bring one real example to life so your answer feels more memorable.',
    ],
    [
      'Explain the outcome',
      'Share what changed as a result of your actions, even if it was small.',
    ],
    [
      'Connect experience to the role',
      'Name the part of your experience that maps most directly to this role.',
    ],
  ],
};

function Icon({ name, className = 'size-5' }) {
  const paths = {
    briefcase: (
      <path d="M4 7.5h16v11.25H4zM8 7.5V5.25A1.25 1.25 0 0 1 9.25 4h5.5A1.25 1.25 0 0 1 16 5.25V7.5M4 12h16M10 12v2h4v-2" />
    ),
    target: (
      <>
        <circle cx="12" cy="12" r="7.5" />
        <circle cx="12" cy="12" r="3" />
        <path d="m15 9 5-5M16.5 4H20v3.5" />
      </>
    ),
    pencil: (
      <>
        <path d="m4 20 4.1-1.05L19 8.05 15.95 5 5.05 15.9 4 20Z" />
        <path d="m14.9 6.05 3.05 3.05" />
      </>
    ),
    mic: (
      <>
        <rect x="8.25" y="3" width="7.5" height="12" rx="3.75" />
        <path d="M5.5 11.75a6.5 6.5 0 0 0 13 0M12 18.25V21M8.5 21h7" />
      </>
    ),
    check: <path d="m5 12.5 4.1 4.1L19.5 6.5" />,
    refresh: (
      <>
        <path d="M19.5 10a7.75 7.75 0 1 0 .1 4" />
        <path d="M19.5 5.5V10H15" />
      </>
    ),
    chart: (
      <>
        <path d="M5 19V12M12 19V5M19 19V9" />
        <path d="M3.5 20.5h17" />
      </>
    ),
    bulb: (
      <>
        <path d="M8.1 17.2h7.8M9.3 20h5.4M8.2 14.5A6.5 6.5 0 1 1 15.8 14.5c-.85.7-1.25 1.36-1.35 2.05h-4.9c-.1-.7-.5-1.36-1.35-2.05Z" />
      </>
    ),
    arrow: <path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5" />,
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {paths[name]}
    </svg>
  );
}

function CircleIcon({ name, tone = 'lavender' }) {
  return (
    <span className={`interview-icon interview-icon-${tone}`}>
      <Icon name={name} />
    </span>
  );
}

function SetupBar({ role, focus, open, onToggle }) {
  return (
    <section className="interview-setup-bar" aria-label="Practice setup">
      <div className="flex min-w-0 items-center gap-3.5">
        <CircleIcon name="briefcase" />
        <div className="min-w-0">
          <p className="text-sm text-ink-soft">Target role</p>
          <p className="truncate font-display text-lg font-bold text-ink">{role}</p>
        </div>
      </div>
      <div className="interview-setup-divider" aria-hidden="true" />
      <div className="flex min-w-0 items-center gap-3.5">
        <CircleIcon name="target" tone="pink" />
        <div className="min-w-0">
          <p className="text-sm text-ink-soft">Practice focus</p>
          <p className="font-display text-lg font-bold text-ink">{focus}</p>
          <p className="hidden text-xs text-ink-soft sm:block">
            General and role-specific questions
          </p>
        </div>
      </div>
      <button type="button" onClick={onToggle} className="interview-text-action">
        <Icon name="pencil" className="size-4" />
        {open ? 'Close setup' : 'Change setup'}
      </button>
    </section>
  );
}

function SetupEditor({ roles, role, focus, onRoleChange, onFocusChange, onStart }) {
  return (
    <section className="interview-editor" aria-labelledby="practice-setup-title">
      <div>
        <p className="eyebrow text-pink-600">Your practice session</p>
        <h2 id="practice-setup-title" className="mt-1 font-display text-xl font-bold text-ink">
          Make this practice useful to you
        </h2>
      </div>
      <label className="interview-field">
        <span>Target role</span>
        <select value={role} onChange={(event) => onRoleChange(event.target.value)}>
          {roles.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </label>
      <fieldset className="interview-focus-picker">
        <legend>Practice focus</legend>
        {['General', 'Role-specific', 'Mixed'].map((option) => (
          <label key={option}>
            <input
              type="radio"
              name="practice-focus"
              checked={focus === option}
              onChange={() => onFocusChange(option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </fieldset>
      <button type="button" onClick={onStart} className="interview-primary-button">
        Start 5-question practice <Icon name="arrow" className="size-4" />
      </button>
    </section>
  );
}

function FeedbackColumn({ title, items, tone }) {
  return (
    <section className={`interview-feedback-column interview-feedback-${tone}`}>
      <div className="flex items-center gap-3">
        <CircleIcon
          name={tone === 'good' ? 'check' : 'chart'}
          tone={tone === 'good' ? 'green' : 'pink'}
        />
        <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
      </div>
      <ul className="mt-4 space-y-3">
        {items.map(([heading, detail]) => (
          <li key={heading} className="flex gap-2.5 text-sm leading-relaxed text-ink-soft">
            <span
              className={`mt-1.5 size-2 shrink-0 rounded-full ${tone === 'good' ? 'bg-verify' : 'bg-pink-500'}`}
            />
            <span>
              <strong className="font-semibold text-ink">{heading}</strong> — {detail}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function GoodToKnow() {
  return (
    <section className="interview-good-card">
      <div className="flex items-center gap-3">
        <CircleIcon name="bulb" />
        <h2 className="font-display text-xl font-bold text-ink">Good to know</h2>
      </div>
      <ul className="mt-5 space-y-4 text-sm leading-relaxed text-ink-soft">
        {[
          'You’ll get immediate, personalised feedback after each answer.',
          'Focus on progress, not perfection.',
          'You can try the same question again whenever you need to.',
          'Each practice session helps you build confidence for a real interview.',
        ].map((item) => (
          <li key={item} className="flex gap-3">
            <span className="interview-check-small">
              <Icon name="check" className="size-3" />
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AreasPanel({ onContinue }) {
  const areas = [
    [
      'Use more specific examples',
      'Support your answers with clear, real examples from your experience.',
      '3 responses',
    ],
    [
      'Explain the result of your actions',
      'Share the outcomes or impact of your work, even when they felt small.',
      '3 responses',
    ],
    [
      'Connect your experience to the role',
      'Make the link between your skills and the role requirements explicit.',
      '2 responses',
    ],
  ];
  return (
    <div className="interview-area-layout">
      <section className="interview-areas-card">
        <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-ink">
          Recurring areas to improve
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-soft">
          These are the themes that have appeared most often in your recent practice feedback.
        </p>
        <div className="mt-5 space-y-3">
          {areas.map(([title, description, count], index) => (
            <article className="interview-area-row" key={title}>
              <CircleIcon
                name={index === 0 ? 'pencil' : index === 1 ? 'chart' : 'target'}
                tone={index === 0 ? 'pink' : 'lavender'}
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
                <p className="mt-0.5 text-sm leading-relaxed text-ink-soft">{description}</p>
              </div>
              <span className="interview-count">Appeared in {count}</span>
              <Icon name="arrow" className="size-4 shrink-0 text-violet-600" />
            </article>
          ))}
        </div>
        <button type="button" onClick={onContinue} className="interview-primary-button mt-6">
          Continue practising <Icon name="arrow" className="size-4" />
        </button>
      </section>
      <section className="interview-strengths-card">
        <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-ink">
          What you’re doing well
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          These strengths have been highlighted in your recent practice sessions.
        </p>
        <div className="mt-6 divide-y divide-line">
          {FEEDBACK.good.map(([title, detail]) => (
            <div className="flex gap-4 py-5 first:pt-0" key={title}>
              <CircleIcon name="check" tone="lavender" />
              <div>
                <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function InterviewPractice() {
  const selectedRole = useIntakeStore((state) => state.selectedRole);
  const snapshot = useIntakeStore((state) => state.snapshot);
  const [role, setRole] = useState(selectedRole?.role ?? 'Marketing Executive');
  const [focus, setFocus] = useState('Mixed');
  const [setupOpen, setSetupOpen] = useState(true);
  const [screen, setScreen] = useState('practice');
  const [status, setStatus] = useState('feedback');
  const [questionIndex, setQuestionIndex] = useState(0);

  const question = useMemo(() => QUESTIONS[questionIndex], [questionIndex]);
  const progress = ((questionIndex + 1) / QUESTIONS.length) * 100;
  const roles = snapshot?.recommended_roles?.map((candidate) => candidate.role) ?? [role];

  function startPractice() {
    setSetupOpen(false);
    setScreen('practice');
    setQuestionIndex(0);
    setStatus('ready');
  }

  function nextQuestion() {
    setQuestionIndex((index) => Math.min(index + 1, QUESTIONS.length - 1));
    setStatus('ready');
  }

  return (
    <div className="interview-page-background flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <div className="max-w-[880px]">
          <p className="eyebrow text-pink-600">Practise · prepare · progress</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.035em] text-ink sm:text-5xl">
            Interview practice
          </h1>
          <p className="mt-2 max-w-[58ch] text-base leading-relaxed text-ink-soft sm:text-lg">
            Build confidence by practising interview questions for your target role.
          </p>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
          <div className="min-w-0">
            <SetupBar
              role={role}
              focus={focus}
              open={setupOpen}
              onToggle={() => setSetupOpen((open) => !open)}
            />
            {setupOpen && (
              <SetupEditor
                roles={roles}
                role={role}
                focus={focus}
                onRoleChange={setRole}
                onFocusChange={setFocus}
                onStart={startPractice}
              />
            )}

            {screen === 'areas' ? (
              <div className="mt-5">
                <AreasPanel onContinue={() => setScreen('practice')} />
              </div>
            ) : (
              <section className="interview-question-card mt-5" aria-labelledby="question-title">
                <p className="text-sm font-medium text-violet-600">
                  Question {questionIndex + 1} of {QUESTIONS.length}
                </p>
                <h2
                  id="question-title"
                  className="mt-2 max-w-[48ch] font-display text-2xl font-bold leading-tight tracking-[-0.02em] text-ink sm:text-[1.7rem]"
                >
                  {question}
                </h2>

                {status === 'ready' && (
                  <div className="interview-record-ready mt-6">
                    <CircleIcon name="mic" tone="pink" />
                    <div>
                      <h3 className="font-display text-lg font-bold text-ink">
                        Ready when you are
                      </h3>
                      <p className="mt-1 text-sm text-ink-soft">
                        Speak naturally. Your response will be transcribed and reviewed
                        automatically.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStatus('recording')}
                      className="interview-primary-button ml-auto"
                    >
                      Start recording <Icon name="mic" className="size-4" />
                    </button>
                  </div>
                )}

                {status === 'recording' && (
                  <div className="interview-recording mt-6" role="status">
                    <span className="interview-record-pulse" aria-hidden="true" />
                    <CircleIcon name="mic" tone="pink" />
                    <div>
                      <h3 className="font-display text-lg font-bold text-ink">
                        Recording your answer
                      </h3>
                      <p className="mt-1 text-sm text-ink-soft">
                        Take your time. Press stop when you’re ready.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStatus('feedback')}
                      className="interview-secondary-button ml-auto"
                    >
                      Stop recording
                    </button>
                  </div>
                )}

                {status === 'feedback' && (
                  <>
                    <section
                      className="interview-transcript mt-6"
                      aria-label="Your answer transcript"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <CircleIcon name="mic" />
                          <h3 className="font-display text-lg font-bold text-ink">
                            Your answer{' '}
                            <span className="font-sans text-sm font-medium text-ink-soft">
                              (transcript)
                            </span>
                          </h3>
                        </div>
                        <span className="text-sm tabular text-ink-soft">0:58</span>
                      </div>
                      <p className="mt-4 max-w-[72ch] text-sm leading-relaxed text-ink-soft">
                        I have experience in marketing and content planning, where I have enjoyed
                        finding practical ways to connect people with useful information. I’m
                        returning to work because I’m ready to bring that experience, my
                        organisation skills and fresh energy to a role where I can keep learning and
                        contribute to a team.
                      </p>
                    </section>
                    <section className="interview-feedback-summary mt-4">
                      <CircleIcon name="bulb" tone="pink" />
                      <div>
                        <h3 className="font-display text-lg font-bold text-ink">Your feedback</h3>
                        <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                          {FEEDBACK.summary}
                        </p>
                      </div>
                    </section>
                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      <FeedbackColumn title="What worked well" items={FEEDBACK.good} tone="good" />
                      <FeedbackColumn
                        title="What to improve"
                        items={FEEDBACK.improve}
                        tone="improve"
                      />
                    </div>
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setStatus('ready')}
                        className="interview-secondary-button"
                      >
                        <Icon name="refresh" className="size-4" />
                        Try again
                      </button>
                      <button
                        type="button"
                        onClick={nextQuestion}
                        className="interview-primary-button"
                      >
                        Next question <Icon name="arrow" className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setScreen('areas')}
                        className="ml-auto inline-flex items-center gap-2 text-sm font-semibold text-violet-600 underline decoration-violet-600/30 underline-offset-4 hover:text-pink-600"
                      >
                        <Icon name="chart" className="size-4" />
                        See areas to improve
                      </button>
                    </div>
                  </>
                )}
              </section>
            )}
          </div>

          <aside className="space-y-5 xl:pt-0">
            <section className="interview-progress-card">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-display text-xl font-bold text-ink">Practice progress</h2>
                <span className="text-sm tabular text-ink-soft">
                  {questionIndex + 1} of {QUESTIONS.length}
                </span>
              </div>
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-violet-400/20">
                <div
                  className="h-full rounded-full bg-pink-500 transition-[width] duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </section>
            <figure className="interview-illustration">
              <img
                src={interviewIllustration}
                alt="A woman preparing confidently for an interview at her desk"
              />
            </figure>
            <GoodToKnow />
          </aside>
        </div>
      </main>
    </div>
  );
}
