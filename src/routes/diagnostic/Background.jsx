import { useState } from 'react';
import useSmoothNavigate from '../../hooks/useSmoothNavigate.js';
import GlassCard from '../../components/ui/GlassCard.jsx';
import GradientButton from '../../components/ui/GradientButton.jsx';
import IntakeLayout from '../../components/intake/IntakeLayout.jsx';
import { useCompanionStore } from '../../store/companionStore.js';
import CvDropzone from '../../components/intake/CvDropzone.jsx';
import UploadedFileChip from '../../components/intake/UploadedFileChip.jsx';
import { parseCv, validateCvFile } from '../../api/cv.js';
import { useIntakeStore } from '../../store/intakeStore.js';

const REQUIRED_MESSAGE = 'CV is required before you can continue.';

export default function Background() {
  const navigate = useSmoothNavigate();
  const openCompanion = useCompanionStore((state) => state.openCompanion);
  const cv = useIntakeStore((state) => state.cv);
  const cvParsed = useIntakeStore((state) => state.cvParsed);
  const setCv = useIntakeStore((state) => state.setCv);
  const clearCv = useIntakeStore((state) => state.clearCv);

  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function upload(file) {
    setError(null);
    setUploading(true);

    try {
      const parsed = await parseCv(file);
      setCv({ ...parsed, fileName: file.name, fileSize: file.size });
    } catch (cause) {
      setError(cause.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSelect(file) {
    const invalid = validateCvFile(file);
    if (invalid) {
      setError(invalid);
      return;
    }

    await upload(file);
  }

  function handleRemove() {
    setError(null);
    clearCv();
  }

  function handleContinue() {
    if (!cvParsed) {
      setError(REQUIRED_MESSAGE);
      return;
    }

    navigate('/diagnostic/break');
  }

  return (
    <IntakeLayout
      stageIndex={0}
      title="Upload your CV"
      intro="We analyze your previous experience to extract your core professional skills automatically."
    >
      <GlassCard className="p-6">
        <h2 className="text-sm text-ink-soft">
          Select your CV file <span className="text-pink-600">*</span>
        </h2>

        {/* Fixed height across both states: without it the primary action jumps
            ~56px up the moment a file is accepted, under the pointer. */}
        <div className="mt-3 flex min-h-[11.5rem] items-center">
          <div className="w-full">
            {cvParsed && cv ? (
              // Keeps the dropzone frame around the accepted file.
              <div className="rounded-2xl border border-dashed border-line-strong bg-canvas p-4">
                <UploadedFileChip
                  fileName={cv.fileName}
                  fileSize={cv.fileSize}
                  onRemove={handleRemove}
                />
              </div>
            ) : (
              <CvDropzone onSelect={handleSelect} disabled={uploading} />
            )}
          </div>
        </div>

        {uploading && <p className="mt-3 text-sm text-ink-soft">Reading your CV…</p>}

        {error && (
          <p role="alert" className="mt-3 text-sm font-medium text-pink-600">
            {error}
          </p>
        )}

        {/* Plenty of women returning after years away have no CV to hand, and
            being stopped at the first screen is where they leave. The
            conversation reaches the same snapshot (US8.1). */}
        {!cvParsed && (
          <p className="mt-4 border-t border-line pt-4 text-sm text-ink-soft">
            No CV?{' '}
            <button
              type="button"
              onClick={() => openCompanion('build')}
              className="font-semibold text-pink-600 underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Talk to our AI
            </button>{' '}
            — three questions, and we build the same snapshot from what you tell us.
          </p>
        )}
      </GlassCard>

      <div className="mt-8 flex justify-end">
        <GradientButton onClick={handleContinue} disabled={uploading}>
          Continue to Career Break
          <span aria-hidden="true">→</span>
        </GradientButton>
      </div>
    </IntakeLayout>
  );
}
