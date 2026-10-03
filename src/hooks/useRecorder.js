import { useCallback, useEffect, useRef, useState } from 'react';

const MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];

const pickMimeType = () =>
  typeof MediaRecorder === 'undefined'
    ? ''
    : (MIME_TYPES.find((type) => MediaRecorder.isTypeSupported?.(type)) ?? '');

/**
 * Microphone recording for one spoken answer.
 *
 * `status` is 'idle', 'requesting' (waiting on the permission prompt),
 * 'recording', or 'blocked' (permission refused, or no microphone at all).
 * `level` is a 0–1 loudness reading so the page can show that sound is
 * actually arriving. `stop()` resolves with the recording and its length.
 */
export default function useRecorder() {
  const [status, setStatus] = useState('idle');
  const [seconds, setSeconds] = useState(0);
  const [level, setLevel] = useState(0);

  const recorder = useRef(null);
  const stream = useRef(null);
  const chunks = useRef([]);
  const startedAt = useRef(0);
  const audio = useRef(null);
  const frame = useRef(0);
  const ticker = useRef(0);

  const release = useCallback(() => {
    cancelAnimationFrame(frame.current);
    clearInterval(ticker.current);
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    audio.current?.close().catch(() => {});
    audio.current = null;
    setLevel(0);
  }, []);

  useEffect(() => release, [release]);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setStatus('blocked');
      return false;
    }

    setStatus('requesting');
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setStatus('blocked');
      return false;
    }

    const mimeType = pickMimeType();
    recorder.current = new MediaRecorder(stream.current, mimeType ? { mimeType } : undefined);
    chunks.current = [];
    recorder.current.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.current.push(event.data);
    };
    recorder.current.start();

    startedAt.current = Date.now();
    setSeconds(0);
    ticker.current = setInterval(
      () => setSeconds(Math.floor((Date.now() - startedAt.current) / 1000)),
      250
    );

    // Level metering is optional; recording still works without Web Audio.
    try {
      audio.current = new AudioContext();
      const analyser = audio.current.createAnalyser();
      analyser.fftSize = 512;
      audio.current.createMediaStreamSource(stream.current).connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);
      const read = () => {
        analyser.getByteTimeDomainData(samples);
        let peak = 0;
        for (const sample of samples) peak = Math.max(peak, Math.abs(sample - 128));
        setLevel(Math.min(1, peak / 64));
        frame.current = requestAnimationFrame(read);
      };
      read();
    } catch {
      /* no meter */
    }

    setStatus('recording');
    return true;
  }, []);

  const stop = useCallback(
    () =>
      new Promise((resolve) => {
        const active = recorder.current;
        recorder.current = null;

        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          clearTimeout(fallback);
          const blob = chunks.current.length
            ? new Blob(chunks.current, { type: active?.mimeType || 'audio/webm' })
            : null;
          const length = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
          release();
          setStatus('idle');
          resolve(blob ? { blob, seconds: length } : null);
        };

        // Fallback in case the recorder already stopped or never fires `stop`:
        // finish with the audio received so far so the UI cannot stay in "recording".
        const fallback = setTimeout(finish, 1500);
        if (!active || active.state === 'inactive') {
          finish();
          return;
        }
        active.onstop = finish;
        active.stop();
      }),
    [release]
  );

  const reset = useCallback(() => setStatus('idle'), []);

  return { status, seconds, level, start, stop, reset };
}
