import { motion } from 'motion/react';
import InterviewIcon from './InterviewIcon.jsx';

const LABELS = {
  idle: 'Start recording',
  retry: 'Record a new answer',
  requesting: 'Waiting for microphone',
  recording: 'Stop recording',
  processing: 'Turning your answer into text',
};

/**
 * Record button rendered as an animated orb. Idle: slow pulse. Recording:
 * scales with input level and emits rings. Processing: a light travels around
 * the edge. `level` is the input loudness from 0 to 1.
 */
export default function VoiceOrb({ state, level, onPress, disabled }) {
  const recording = state === 'recording';
  const label = LABELS[state];

  return (
    <div className="iv-orb-wrap" data-state={state}>
      <span className="iv-orb-ring" aria-hidden="true" />
      <span className="iv-orb-ring iv-orb-ring-late" aria-hidden="true" />
      <motion.button
        type="button"
        onClick={onPress}
        disabled={disabled}
        aria-label={label}
        whileHover={disabled ? undefined : { scale: 1.04 }}
        whileTap={disabled ? undefined : { scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 380, damping: 22 }}
        className="iv-orb"
        style={{ '--level': recording ? level : 0 }}
      >
        <span className="iv-orb-glow" aria-hidden="true" />
        <InterviewIcon
          name={recording ? 'stop' : 'mic'}
          weight="fill"
          className="relative size-7 text-white"
        />
      </motion.button>
    </div>
  );
}
