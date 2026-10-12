import { motion } from 'motion/react';
import MetRequirements from './MetRequirements.jsx';

const EASE = [0.32, 0.72, 0, 1];

/**
 * One segment per role requirement in a single full-width row: filled for
 * those already met, faint for the rest. The count above it explains the
 * segments, so there is no legend.
 *
 * Each filled segment shows its slice of one gradient sized to the whole met
 * run, so the gradient reads continuously across the filled segments.
 */
export function RequirementSegments({ have, total, delay }) {
  return (
    <ul aria-hidden="true" className="flex gap-1">
      {Array.from({ length: total }, (_, index) => {
        const met = index < have;
        return (
          <motion.li
            key={index}
            className={`h-1.5 flex-1 origin-left rounded-full ${met ? 'bg-grad-readiness' : 'bg-white/15'}`}
            style={
              met
                ? {
                    backgroundSize: `${have * 100}% 100%`,
                    backgroundPosition: `${have > 1 ? (index / (have - 1)) * 100 : 0}% 0`,
                  }
                : undefined
            }
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.5, delay: delay + index * 0.035, ease: EASE }}
          />
        );
      })}
    </ul>
  );
}

/**
 * Dark summary panel for the selected target role. Shows plain counts, the
 * requirements already met against the role's total, rather than a score.
 */
export default function MatchPanel({ role, result, focusAreas, delay = 0 }) {
  const have = result.skills_have.length;
  const total = have + result.gaps.length;
  const focus = focusAreas.length;

  const rise = (step) => ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay: delay + step * 0.07, ease: EASE },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      <section className="overflow-hidden rounded-[1.75rem] bg-plane text-on-plane shadow-plane">
        <div className="relative p-7">
          {/* Soft glow behind the headline count. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-20 size-64 rounded-full bg-pink-500/25 blur-3xl"
          />

          <motion.p className="eyebrow relative text-on-plane-soft" {...rise(1)}>
            Your match for
          </motion.p>
          <motion.h2
            className="relative mt-1.5 font-display text-lg leading-snug font-bold text-white"
            {...rise(1)}
          >
            {role.role}
          </motion.h2>

          <div className="relative mt-7 overflow-hidden pb-1">
            <motion.p
              className="font-display text-[2.6rem] leading-none font-bold tracking-[-0.03em] text-white tabular"
              initial={{ y: '110%' }}
              animate={{ y: 0 }}
              transition={{ duration: 0.9, delay: delay + 0.2, ease: EASE }}
            >
              {have} <span className="text-on-plane-soft">of {total}</span>
            </motion.p>
          </div>
          <motion.p className="relative mt-2.5 text-sm text-on-plane-soft" {...rise(4)}>
            requirements you already have
          </motion.p>

          {total > 0 && (
            <motion.div className="relative mt-7" {...rise(5)}>
              <RequirementSegments have={have} total={total} delay={delay + 0.45} />
            </motion.div>
          )}

          {focus > 0 && (
            <motion.p
              className="relative mt-6 rounded-2xl bg-white/8 px-4 py-3 text-sm leading-relaxed font-medium text-white"
              {...rise(7)}
            >
              {/* Below md the skills stack under this panel instead of beside it. */}
              <span className="max-md:hidden">
                {focus === 1
                  ? 'Your next step is the skill on the right.'
                  : `Your next steps are the ${focus} skills on the right.`}
              </span>
              <span className="md:hidden">
                {focus === 1
                  ? 'Your next step is the skill below.'
                  : `Your next steps are the ${focus} skills below.`}
              </span>
            </motion.p>
          )}
        </div>

        <motion.div className="bg-plane-2 p-7" {...rise(8)}>
          <MetRequirements skills={result.skills_have} total={total} onPlane />

          <details className="mt-5 text-xs leading-relaxed text-on-plane-soft">
            <summary className="cursor-pointer font-semibold text-white">
              How this result is worked out
            </summary>
            <p className="mt-2">
              We compare the skills from your CV and career break with the skills this role asks
              for. Your top skills are the ones the role relies on most. This is a guide, not a
              guarantee of employment.
            </p>
          </details>
        </motion.div>
      </section>
    </motion.div>
  );
}
