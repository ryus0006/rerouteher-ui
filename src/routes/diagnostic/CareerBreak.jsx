import useSmoothNavigate from '../../hooks/useSmoothNavigate.js';
import GlassCard from '../../components/ui/GlassCard.jsx';
import GradientButton from '../../components/ui/GradientButton.jsx';
import IntakeLayout from '../../components/intake/IntakeLayout.jsx';
import BackLink from '../../components/intake/BackLink.jsx';
import DurationSlider from '../../components/intake/DurationSlider.jsx';
import ActivityPicker from '../../components/intake/ActivityPicker.jsx';
import { useIntakeStore } from '../../store/intakeStore.js';

export default function CareerBreak() {
  const navigate = useSmoothNavigate();
  const careerBreak = useIntakeStore((state) => state.break);
  const setBreakDuration = useIntakeStore((state) => state.setBreakDuration);
  const toggleActivity = useIntakeStore((state) => state.toggleActivity);
  const canGenerate = useIntakeStore((state) => state.canGenerateSnapshot)();

  return (
    <IntakeLayout
      stageIndex={1}
      back={<BackLink to="/diagnostic/background">Back to CV</BackLink>}
      title="Tell us about your career break"
      intro="Your time out counts as real experience — just two simple questions."
    >
      <GlassCard className="space-y-8 p-6">
        <DurationSlider value={careerBreak.duration_years} onChange={setBreakDuration} />
        <ActivityPicker selected={careerBreak.activities} onToggle={toggleActivity} />
      </GlassCard>

      <div className="mt-6 flex justify-end">
        <GradientButton disabled={!canGenerate} onClick={() => navigate('/diagnostic/priorities')}>
          Continue to Work Priorities
          <span aria-hidden="true">→</span>
        </GradientButton>
      </div>
    </IntakeLayout>
  );
}
