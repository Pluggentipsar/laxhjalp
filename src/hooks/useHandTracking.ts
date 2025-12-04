import { useEffect, useRef, useState, useCallback } from 'react';
import { Hands, type Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import type { HandLandmarks } from '../types/motion-learn';

interface UseHandTrackingOptions {
  onResults?: (results: Results) => void;
  maxNumHands?: number;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
}

interface HandTrackingState {
  isReady: boolean;
  isStreaming: boolean;
  error: string | null;
  hands: HandLandmarks;
}

export function useHandTracking(options: UseHandTrackingOptions = {}) {
  const {
    onResults,
    maxNumHands = 2,
    minDetectionConfidence = 0.7,
    minTrackingConfidence = 0.5,
  } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handsRef = useRef<Hands | null>(null);
  const cameraRef = useRef<Camera | null>(null);

  const [state, setState] = useState<HandTrackingState>({
    isReady: false,
    isStreaming: false,
    error: null,
    hands: {},
  });

  const onResultsRef = useRef(onResults);

  useEffect(() => {
    onResultsRef.current = onResults;
  }, [onResults]);

  // Process results from MediaPipe
  const handleResults = useCallback((results: Results) => {
    const newHands: HandLandmarks = {};

    if (results.multiHandLandmarks && results.multiHandedness) {
      results.multiHandLandmarks.forEach((landmarks, index) => {
        const handedness = results.multiHandedness?.[index];
        const label = handedness?.label?.toLowerCase() as 'left' | 'right';

        if (label) {
          // Convert landmarks to normalized positions
          newHands[label] = landmarks.map(landmark => ({
            x: landmark.x,
            y: landmark.y,
            z: landmark.z,
          }));
        }
      });
    }

    setState(prev => ({ ...prev, hands: newHands }));

    // Call custom callback if provided
    if (onResultsRef.current) {
      onResultsRef.current(results);
    }
  }, []);

  // Initialize MediaPipe Hands
  const initializeHands = useCallback(async () => {
    try {
      // Create Hands instance
      const hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        },
      });

      hands.setOptions({
        maxNumHands,
        modelComplexity: 1,
        minDetectionConfidence,
        minTrackingConfidence,
      });

      hands.onResults(handleResults);

      handsRef.current = hands;

      setState(prev => ({ ...prev, isReady: true, error: null }));
    } catch (err) {
      console.error('Failed to initialize MediaPipe Hands:', err);
      setState(prev => ({
        ...prev,
        error: 'Failed to initialize hand tracking',
      }));
    }
  }, [maxNumHands, minDetectionConfidence, minTrackingConfidence, handleResults]);

  // Start camera
  const startCamera = useCallback(async () => {
    if (!videoRef.current || !handsRef.current) {
      console.error('Video element or Hands not initialized');
      return;
    }

    try {
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (handsRef.current && videoRef.current) {
            await handsRef.current.send({ image: videoRef.current });
          }
        },
        width: 1280,
        height: 720,
      });

      await camera.start();
      cameraRef.current = camera;

      setState(prev => ({ ...prev, isStreaming: true, error: null }));
    } catch (err) {
      console.error('Failed to start camera:', err);
      setState(prev => ({
        ...prev,
        error: 'Failed to access camera. Please grant camera permissions.',
      }));
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }

    setState(prev => ({ ...prev, isStreaming: false }));
  }, []);

  // Get hand position (wrist as reference point)
  const getHandPosition = useCallback((hand: 'left' | 'right') => {
    const landmarks = state.hands[hand];
    if (!landmarks || landmarks.length === 0) return null;

    // Return wrist position (landmark 0)
    return landmarks[0];
  }, [state.hands]);

  // Get index finger tip position
  const getIndexFingerTip = useCallback((hand: 'left' | 'right') => {
    const landmarks = state.hands[hand];
    if (!landmarks || landmarks.length < 9) return null;

    // Index finger tip is landmark 8
    return landmarks[8];
  }, [state.hands]);

  // Check if hand is making a fist
  const isHandClosed = useCallback((hand: 'left' | 'right') => {
    const landmarks = state.hands[hand];
    if (!landmarks || landmarks.length < 21) return false;

    // Check if fingertips are close to palm
    const palmCenter = landmarks[0]; // Wrist
    const fingerTips = [4, 8, 12, 16, 20]; // Thumb, Index, Middle, Ring, Pinky tips

    let closedFingers = 0;

    fingerTips.forEach(tipIndex => {
      const tip = landmarks[tipIndex];
      const distance = Math.sqrt(
        Math.pow(tip.x - palmCenter.x, 2) +
        Math.pow(tip.y - palmCenter.y, 2)
      );

      if (distance < 0.15) closedFingers++;
    });

    return closedFingers >= 3; // At least 3 fingers closed
  }, [state.hands]);

  // Initialize on mount
  useEffect(() => {
    initializeHands();

    return () => {
      stopCamera();
      if (handsRef.current) {
        handsRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    videoRef,
    state,
    startCamera,
    stopCamera,
    getHandPosition,
    getIndexFingerTip,
    isHandClosed,
  };
}
