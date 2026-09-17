import { useState } from 'react';
import useSmoothNavigate from '../../hooks/useSmoothNavigate.js';
import GradientButton from '../../components/ui/GradientButton.jsx';
import IntakeLayout from '../../components/intake/IntakeLayout.jsx';
import BackLink from '../../components/intake/BackLink.jsx';
import PriorityPicker from '../../components/employers/PriorityPicker.jsx';
import HowItWorks from '../../components/employers/HowItWorks.jsx';
import { generateSnapshot } from '../../api/snapshot.js';
import { useIntakeStore } from '../../store/intakeStore.js';

/**
 * What she is asking employers for, asked while she is still answering
 * questions rather than after she has been given an answer.
 *
 * It comes before the snapshot, so she is choosing what a workplace owes her
 * without a role in front of her. That is the right order for this question —
 * what she needs from an employer is true of her, not of the job — but it does
 * mean the copy has to say the answer is for later, since the next screen is
 * her skills and not a list of companies.
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
      back={<BackLink to="/diagnostic/break">Back to career break</BackLink>}
      title="What matters most for your return?"
      intro={`Pick as many as matter to you. We come back to these at the end, to find employers whose published reports match.`}
    >
      <PriorityPicker chosen={chosen} columns={2} onToggle={toggle} />

      <div className="mt-6">
        <HowItWorks />
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-pink-600">
          {error}
        </p>
      )}

      <div className="mt-6 flex justify-end">
        <GradientButton
          disabled={!canGenerate || chosen.length === 0 || generating}
          onClick={handleGenerate}
        >
          {generating ? 'Building your snapshot…' : 'Continue to Skill Snapshot'}
          {!generating && <span aria-hidden="true">→</span>}
        </GradientButton>
      </div>
    </IntakeLayout>
  );
}
