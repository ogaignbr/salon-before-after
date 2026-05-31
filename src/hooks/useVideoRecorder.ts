import { useRef, useState, useCallback, useEffect } from 'react';

function getSupportedMimeType(): string {
  const types = ['video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return 'video/webm';
}

export function useVideoRecorder(stream: MediaStream | null) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  const startRecording = useCallback(() => {
    if (!stream || isRecording) return;

    chunksRef.current = [];
    setRecordedBlob(null);
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);

    const mimeType = getSupportedMimeType();
    const recorder = new MediaRecorder(stream, { mimeType });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setRecordedBlob(blob);
      setRecordedUrl(URL.createObjectURL(blob));
      chunksRef.current = [];
    };

    recorderRef.current = recorder;
    recorder.start(1000);
    setIsRecording(true);
    setElapsedSeconds(0);

    timerRef.current = window.setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
  }, [stream, isRecording, recordedUrl]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    setIsRecording(false);
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearRecording = useCallback(() => {
    setRecordedBlob(null);
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
    setElapsedSeconds(0);
  }, [recordedUrl]);

  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
      if (timerRef.current !== null) clearInterval(timerRef.current);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, []);

  return { isRecording, elapsedSeconds, recordedBlob, recordedUrl, startRecording, stopRecording, clearRecording };
}
