import {
  ArrowCounterClockwise,
  ArrowLeft,
  ArrowRight,
  ChartBar,
  Check,
  Microphone,
  PencilSimple,
  Stop,
  Target,
  WarningCircle,
} from '@phosphor-icons/react';

const ICONS = {
  mic: Microphone,
  stop: Stop,
  check: Check,
  retry: ArrowCounterClockwise,
  pencil: PencilSimple,
  chart: ChartBar,
  left: ArrowLeft,
  right: ArrowRight,
  alert: WarningCircle,
  target: Target,
};

/** Semantic icon names for the interview page, mapped to the underlying glyphs. */
export default function InterviewIcon({ name, className = 'size-5', weight = 'light' }) {
  const Glyph = ICONS[name];
  return <Glyph aria-hidden="true" weight={weight} className={className} />;
}
