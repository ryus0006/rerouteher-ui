import { useState } from 'react';
import useSmoothNavigate from '../../hooks/useSmoothNavigate.js';
import { ArrowRight } from '@phosphor-icons/react';
import GradientButton from '../../components/ui/GradientButton.jsx';
import IntakeLayout from '../../components/intake/IntakeLayout.jsx';
import BackLink from '../../components/intake/BackLink.jsx';
import PriorityPicker from '../../components/employers/PriorityPicker.jsx';
import HowItWorks from '../../components/employers/HowItWorks.jsx';
import { generateSnapshot } from '../../api/snapshot.js';
import { useIntakeStore } from '../../store/intakeStore.js';

/**
 * Intake step for employer priorities. Runs before the snapshot, since
 * priorities are independent of the target role; the copy notes that they
 * are used later for employer matching.
 */
export default function Priorities() {
  const navigate = useSmoothNavigate();
  const cv = useIntakeStore((state) => state.cv);
  const careerBreak = useIntakeStore((state) => state.break);
  const priorities = useIntakeStore((state) => state.employerPriorities);
  const setPriorities = useIntakeStore((state) => state.setEmployerPriorities);
  const setSnapshot = useIntakeStore((state) => state.setSnapshot);
  const confirmedSkills = useIntakeStore((state) => state.confirmedSkills);
  const canGenerate = useIntakeStore((state) => state.canGenerateSnapshot)();

  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);

  const chosen = priorities ?? [];

  function toggle(id) {
    setPriorities(chosen.includes(id) ? chosen.filter((value) => value !== id) : [...chosen, id]);
  }

  async function handleGenerate() {
    setError(null);
    setGenerating(true);

    try {
      setSnapshot(await generateSnapshot(cv, careerBreak, confirmedSkills));
      navigate('/diagnostic/snapshot');
    } catch (cause) {
      setError(cause.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <IntakeLayout
      stageIndex={2}
      title="What matters most for your return?"
      intro="Select all the priorities that matter to you."
      wide
    >
      <PriorityPicker chosen={chosen} onToggle={toggle} />

      <div className="mt-6">
        <HowItWorks compact />
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-pink-600">
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between">
        <BackLink to="/diagnostic/break">Back to career break</BackLink>
        <GradientButton
          disabled={!canGenerate || chosen.length === 0 || generating}
          onClick={handleGenerate}
        >
          {generating ? 'Building your snapshot…' : 'Continue to Skill Snapshot'}
          {!generating && <ArrowRight weight="bold" className="size-4" aria-hidden="true" />}
        </GradientButton>
      </div>
    </IntakeLayout>
  );
}
