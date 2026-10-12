import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowUp } from '@phosphor-icons/react';
import HeraBot from '../companion/HeraBot.jsx';

const EASE = [0.32, 0.72, 0, 1];

/* Example conversation in build mode. Hera's opening line is the companion's
   own build-mode greeting. */
const MESSAGES = [
  {
    from: 'hera',
    text: 'No CV needed. Let’s start with your last job before your break. What did you do, and for roughly how long?',
  },
  { from: 'you', text: 'I was a teacher for six years, then home with my kids.' },
  { from: 'hera', text: 'Thank you. What filled your days while you were at home?' },
  { from: 'you', text: 'School runs, the family budget, and I ran the school fundraiser.' },
];

const PROFILE = [
  { label: 'Experience', value: 'Primary school teacher · 6 years' },
  { label: 'Career break', value: '2019 – 2025 · Childcare' },
  { label: 'Skills', skills: ['Instructing', 'Coordination', 'Management of Financial Resources'] },
];

/* Milliseconds after the demo comes into view at which each beat lands:
   Hera typing, message 1, message 2, Hera typing, message 3, message 4,
   profile card, then one beat per profile row. */
const TIMELINE = [300, 1100, 1900, 2500, 3300, 4100, 4700, 5000, 5300, 5600];

/** Messages visible once `stage` beats have passed. */
function messagesAt(stage) {
  if (stage >= 6) return 4;
  if (stage >= 5) return 3;
  if (stage >= 3) return 2;
  if (stage >= 2) return 1;
  return 0;
}

function TypingDots() {
  return (
    <span className="land-typing flex items-center gap-1 py-2" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

function Message({ message }) {
  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: EASE }}
      className={message.from === 'you' ? 'origin-bottom-right' : 'origin-bottom-left'}
    >
      {message.from === 'you' ? (
        <p className="hera-you ml-auto w-fit max-w-[85%]">{message.text}</p>
      ) : (
        <div className="flex gap-2.5">
          <HeraBot className="mt-0.5 size-6 shrink-0" />
          <p className="text-sm leading-relaxed text-ink">{message.text}</p>
        </div>
      )}
    </motion.li>
  );
}

/**
 * Example of building a profile with Hera when there is no CV: a chat window
 * that plays a short scripted conversation once it scrolls into view, and the
 * drafted profile card filling in beside it. The card drifts slightly
 * against the chat as the section scrolls past. Purely illustrative, so it is
 * hidden from assistive technology and summarised in the caption.
 */
export default function HeraChatDemo() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [played, setPlayed] = useState(0);

  useEffect(() => {
    if (!inView || reduce) return undefined;
    const timers = TIMELINE.map((at, index) => setTimeout(() => setPlayed(index + 1), at));
    return () => timers.forEach(clearTimeout);
  }, [inView, reduce]);

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const cardY = useTransform(scrollYProgress, [0, 1], [20, -20]);

  /* Under reduced motion the finished conversation shows straight away. */
  const stage = reduce ? TIMELINE.length : played;
  const shown = messagesAt(stage);
  const typing = stage === 1 || stage === 4;
  const profileIn = stage >= 7;
  const rows = Math.max(0, stage - 7);

  return (
    <figure ref={ref} className="relative mx-auto h-[30rem] w-full max-w-[40rem]">
      <div aria-hidden="true">
        {/* Chat window */}
        <div className="land-shell absolute top-0 left-0 w-[22rem]">
          <div className="land-core flex h-[29rem] flex-col overflow-hidden">
            <div className="hera-head flex items-center gap-3 px-5 pt-5 pb-4">
              <HeraBot className="size-10 shrink-0" thinking={typing} />
              <div>
                <p className="font-display text-base font-bold text-ink">Hera</p>
                <p className="text-xs text-ink-faint">Building your profile</p>
              </div>
            </div>

            <ul className="flex flex-1 flex-col justify-end gap-4 px-5 pb-5">
              {MESSAGES.slice(0, shown).map((message) => (
                <Message key={message.text} message={message} />
              ))}
              {typing && (
                <li className="flex gap-2.5">
                  <HeraBot className="mt-0.5 size-6 shrink-0" thinking />
                  <TypingDots />
                </li>
              )}
            </ul>

            {/* Message box, as in the real companion. */}
            <div className="px-5 pb-5">
              <div className="flex items-center gap-2 rounded-full bg-canvas-sunk py-1.5 pr-1.5 pl-4">
                <span className="flex-1 text-sm text-ink-faint">Tell me about your work</span>
                <span className="flex size-8 items-center justify-center rounded-full bg-ink text-white">
                  <ArrowUp weight="bold" className="size-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Drafted profile, beside the chat. It overlaps only the chat's outer
            edge, so it never covers the conversation. */}
        <motion.div
          className="absolute top-[5rem] left-[21rem] w-[18rem]"
          style={reduce ? undefined : { y: cardY }}
        >
          <motion.div
            className="land-shell rotate-[2deg]"
            initial={false}
            animate={
              profileIn ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 40, scale: 0.94 }
            }
            transition={{ duration: 0.8, ease: EASE }}
          >
            <div className="land-core p-5">
              <p className="text-xs font-semibold text-ink-faint">Your profile so far</p>
              <dl className="mt-3 space-y-3">
                {PROFILE.map((row, index) => (
                  <motion.div
                    key={row.label}
                    initial={false}
                    animate={index < rows ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    transition={{ duration: 0.5, ease: EASE }}
                  >
                    <dt className="text-[0.6875rem] font-semibold text-ink-faint">{row.label}</dt>
                    {row.skills ? (
                      <dd className="mt-1.5 flex flex-wrap gap-1.5">
                        {row.skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-pink-100 px-2.5 py-1 text-[0.75rem] font-semibold text-pink-600"
                          >
                            {skill}
                          </span>
                        ))}
                      </dd>
                    ) : (
                      <dd className="mt-0.5 text-sm font-semibold text-ink">{row.value}</dd>
                    )}
                  </motion.div>
                ))}
              </dl>
              <span className="mt-4 flex items-center justify-center rounded-full bg-ink py-2.5 text-sm font-semibold text-white">
                Use this profile
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <figcaption className="sr-only">
        Example: a mother with no CV tells Hera she was a teacher for six years, then home with her
        children, running the family budget and a school fundraiser. Hera drafts a profile with her
        teaching experience, her career break, and the skills Instructing, Coordination and
        Management of Financial Resources.
      </figcaption>
    </figure>
  );
}
