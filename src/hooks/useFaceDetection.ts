import { useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

let modelsLoaded = false;

export function useFaceDetection() {
  const [isLoading, setIsLoading] = useState(false);

  const loadModels = useCallback(async () => {
    if (modelsLoaded) return;
    setIsLoading(true);
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      modelsLoaded = true;
    } catch (e) {
      console.error('Failed to load face detection models:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const detectFaces = useCallback(
    async (canvas: HTMLCanvasElement): Promise<faceapi.FaceDetection[]> => {
      if (!modelsLoaded) await loadModels();
      const detections = await faceapi.detectAllFaces(
        canvas,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 }),
      );
      return detections;
    },
    [loadModels],
  );

  return { detectFaces, isLoading, loadModels };
}
