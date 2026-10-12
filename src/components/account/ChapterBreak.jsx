import { Link } from 'react-router-dom';
import { ArrowUpRight } from '@phosphor-icons/react';
import { useAccountStore } from '../../store/accountStore.js';
import { useIntakeStore } from '../../store/intakeStore.js';

const BUTTON_CLASS =
  'group inline-flex items-center gap-3 rounded-full bg-ink py-2 pl-5 pr-2 text-sm font-semibold text-white transition duration-300 ease-spring hover:bg-plane-2 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600';

/** Button label followed by an arrow in its own circle, nudged on hover. */
function ButtonContent({ children }) {
  return (
    <>
      {children}
      <span
        aria-hidden="true"
        className="flex size-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-500 ease-spring group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      >
        <ArrowUpRight size={13} weight="bold" />
      </span>
    </>
  );
}

/**
 * Closing band on the gap screen pointing to My Journey, where the learning
 * plan, employer matches, CV and interview practice for the target role live.
 *
 * Signed-in users get a link straight to the journey. Guests see the same band
 * with a button that opens account creation and lands on the journey; the
 * account sheet saves their on-device progress to the new account.
 */
export default function ChapterBreak() {
  const user = useAccountStore((state) => state.user);
  const openSheet = useAccountStore((state) => state.openSheet);
  const role = useIntakeStore((state) => state.selectedRole?.role);

  return (
    <section
      aria-labelledby="whats-next-title"
      className="chapter-break mt-10 rounded-3xl p-6 text-ink sm:p-8"
    >
      <p className="eyebrow">What&rsquo;s next</p>
      <h2
        id="whats-next-title"
        className="mt-2 max-w-[28ch] font-display text-2xl font-bold leading-tight tracking-[-0.015em] sm:text-3xl"
      >
        {role ? `Your plan for ${role} is ready.` : 'Your plan is ready.'}
      </h2>

      <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <p className="max-w-[56ch] text-sm leading-relaxed text-ink-soft sm:text-base">
          {user ? (
            <>
              A learning plan, employer matches, a tailored CV and interview practice, all in My
              Journey.
            </>
          ) : (
            <>
              <span className="font-semibold text-ink">
                Create a free account to open My Journey:
              </span>{' '}
              a learning plan, employer matches, a tailored CV and interview practice. What
              you&rsquo;ve done so far comes with you.
            </>
          )}
        </p>

        {user ? (
          <Link to="/journey" className={`${BUTTON_CLASS} shrink-0 self-start md:self-auto`}>
            <ButtonContent>Go to My Journey</ButtonContent>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => openSheet('create', '/journey')}
            className={`${BUTTON_CLASS} shrink-0 self-start md:self-auto`}
          >
            <ButtonContent>Create account to continue</ButtonContent>
          </button>
        )}
      </div>
    </section>
  );
}
