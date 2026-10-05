import useSmoothNavigate from '../../hooks/useSmoothNavigate.js';
import { motion } from 'motion/react';
import { ArrowRight } from '@phosphor-icons/react';
import GradientButton from '../../components/ui/GradientButton.jsx';
import IntakeLayout from '../../components/intake/IntakeLayout.jsx';
import BackLink from '../../components/intake/BackLink.jsx';
import DurationSlider from '../../components/intake/DurationSlider.jsx';
import ActivityPicker from '../../components/intake/ActivityPicker.jsx';
import { useIntakeStore } from '../../store/intakeStore.js';

const EASE = [0.32, 0.72, 0, 1];

export default function CareerBreak() {
  const navigate = useSmoothNavigate();
  const careerBreak = useIntakeStore((state) => state.break);
  const setBreakDuration = useIntakeStore((state) => state.setBreakDuration);
  const toggleActivity = useIntakeStore((state) => state.toggleActivity);
  const canGenerate = useIntakeStore((state) => state.canGenerateSnapshot)();

  return (
    <IntakeLayout
      stageIndex={1}
      title="Tell us about your career break"
      intro="Your career break counts as real experience — just two simple questions."
    >
      <motion.div
        className="cv-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE }}
      >
        <DurationSlider value={careerBreak.duration_years} onChange={setBreakDuration} />
        <div className="mt-8">
          <ActivityPicker selected={careerBreak.activities} onToggle={toggleActivity} />
        </div>
      </motion.div>

      <motion.div
        className="mt-6 flex items-center justify-between"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.12, ease: EASE }}
      >
        <BackLink to="/diagnostic/background">Back to CV</BackLink>
        <GradientButton disabled={!canGenerate} onClick={() => navigate('/diagnostic/priorities')}>
          Continue to Work Priorities
          <ArrowRight weight="bold" className="size-4" aria-hidden="true" />
        </GradientButton>
      </motion.div>
    </IntakeLayout>
  );
}
