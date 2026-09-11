import { useState } from 'react';
import useSmoothNavigate from '../../hooks/useSmoothNavigate.js';
import GlassCard from '../../components/ui/GlassCard.jsx';
import GradientButton from '../../components/ui/GradientButton.jsx';
import IntakeLayout from '../../components/intake/IntakeLayout.jsx';
import NeedPicker from '../../components/intake/NeedPicker.jsx';
import { generateSnapshot } from '../../api/snapshot.js';
import { useIntakeStore } from '../../store/intakeStore.js';

export default function Preferences() {
  const navigate = useSmoothNavigate();
  const cv = useIntakeStore((state) => state.cv);
  const careerBreak = useIntakeStore((state) => state.break);
  const preferences = useIntakeStore((state) => state.preferences);
  const setPreference = useIntakeStore((state) => state.setPreference);
  const setSnapshot = useIntakeStore((state) => state.setSnapshot);
  const canGenerate = useIntakeStore((state) => state.canGenerateSnapshot)();

  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setError(null);
    setGenerating(true);

    try {
      setSnapshot(await generateSnapshot(cv, careerBreak));
      navigate('/diagnostic/snapshot');
    } catch (cause) {
      setError(cause.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <IntakeLayout
      stageIndex={1}
      title="What are you looking for now?"
      intro="Pick anything that fits — this shapes which roles we show you."
    >
      <GlassCard className="p-6">
        <NeedPicker selections={preferences} onChange={setPreference} />
      </GlassCard>

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-pink-600">
          {error}
        </p>
      )}

      <div className="mt-8 flex flex-col items-center gap-3">
        <GradientButton disabled={!canGenerate || generating} onClick={handleGenerate}>
          {generating ? 'Building your snapshot…' : 'See my skill snapshot'}
        </GradientButton>

        <button
          type="button"
          onClick={() => navigate('/diagnostic/break')}
          className="text-sm text-ink-soft underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Back
        </button>
      </div>
    </IntakeLayout>
  );
}
