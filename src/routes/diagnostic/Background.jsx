import { useState } from 'react';
import useSmoothNavigate from '../../hooks/useSmoothNavigate.js';
import { motion } from 'motion/react';
import { ArrowRight } from '@phosphor-icons/react';
import GradientButton from '../../components/ui/GradientButton.jsx';
import IntakeLayout from '../../components/intake/IntakeLayout.jsx';
import { useCompanionStore } from '../../store/companionStore.js';
import CvDropzone from '../../components/intake/CvDropzone.jsx';
import UploadedFileChip from '../../components/intake/UploadedFileChip.jsx';
import { parseCv, validateCvFile } from '../../api/cv.js';
import { useIntakeStore } from '../../store/intakeStore.js';

const EASE = [0.32, 0.72, 0, 1];

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
      <motion.div
        className="cv-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE }}
      >
        <h2 className="text-sm font-medium text-ink-soft">
          Select your CV file <span className="text-pink-600">*</span>
        </h2>

        <div className="mt-3">
          {cvParsed && cv ? (
            <UploadedFileChip
              fileName={cv.fileName}
              fileSize={cv.fileSize}
              onRemove={handleRemove}
            />
          ) : (
            <CvDropzone onSelect={handleSelect} disabled={uploading} />
          )}
        </div>

        {uploading && <p className="mt-3 text-sm text-ink-soft">Reading your CV…</p>}

        {error && (
          <p role="alert" className="mt-3 text-sm font-medium text-pink-600">
            {error}
          </p>
        )}

        {/* Alternative for users without a CV: build the same profile through
            the companion. */}
        {!cvParsed && (
          <p className="cv-card-alt">
            No CV?{' '}
            <button
              type="button"
              onClick={() => openCompanion('build')}
              className="font-semibold text-pink-600 underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Talk to our AI
            </button>{' '}
            and build your profile by chatting about what you have done.
          </p>
        )}
      </motion.div>

      <motion.div
        className="mt-8 flex justify-end"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.12, ease: EASE }}
      >
        <GradientButton onClick={handleContinue} disabled={uploading}>
          Continue to Career Break
          <ArrowRight weight="bold" className="size-4" aria-hidden="true" />
        </GradientButton>
      </motion.div>
    </IntakeLayout>
  );
}
