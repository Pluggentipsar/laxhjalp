import { useEffect, useRef, useState, useCallback } from 'react';
import { Pose, type Results } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';

interface UsePoseTrackingOptions {
    onResults?: (results: Results) => void;
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
}

interface PoseTrackingState {
    isReady: boolean;
    isStreaming: boolean;
    error: string | null;
    pose: {
        nose?: { x: number; y: number; z: number; visibility?: number };
    };
}

export function usePoseTracking(options: UsePoseTrackingOptions = {}) {
    const {
        onResults,
        minDetectionConfidence = 0.5,
        minTrackingConfidence = 0.5,
    } = options;

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const poseRef = useRef<Pose | null>(null);
    const cameraRef = useRef<Camera | null>(null);
    const onResultsRef = useRef(onResults);

    const [state, setState] = useState<PoseTrackingState>({
        isReady: false,
        isStreaming: false,
        error: null,
        pose: {},
    });

    useEffect(() => {
        onResultsRef.current = onResults;
    }, [onResults]);

    // Process results from MediaPipe
    const handleResults = useCallback((results: Results) => {
        const newPose: PoseTrackingState['pose'] = {};

        if (results.poseLandmarks) {
            // Landmark 0 is the nose
            const nose = results.poseLandmarks[0];
            if (nose) {
                newPose.nose = {
                    x: nose.x,
                    y: nose.y,
                    z: nose.z,
                    visibility: nose.visibility,
                };
            }
        }

        setState(prev => ({ ...prev, pose: newPose }));

        // Call custom callback if provided
        if (onResultsRef.current) {
            onResultsRef.current(results);
        }
    }, []);

    // Initialize MediaPipe Pose
    const initializePose = useCallback(async () => {
        try {
            const pose = new Pose({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
                },
            });

            pose.setOptions({
                modelComplexity: 1,
                smoothLandmarks: true,
                enableSegmentation: false,
                minDetectionConfidence,
                minTrackingConfidence,
            });

            pose.onResults(handleResults);

            poseRef.current = pose;

            setState(prev => ({ ...prev, isReady: true, error: null }));
        } catch (err) {
            console.error('Failed to initialize MediaPipe Pose:', err);
            setState(prev => ({
                ...prev,
                error: 'Failed to initialize pose tracking',
            }));
        }
    }, [minDetectionConfidence, minTrackingConfidence, handleResults]);

    // Start camera
    const startCamera = useCallback(async () => {
        if (!videoRef.current || !poseRef.current) {
            console.error('Video element or Pose not initialized');
            return;
        }

        try {
            const camera = new Camera(videoRef.current, {
                onFrame: async () => {
                    if (poseRef.current && videoRef.current) {
                        await poseRef.current.send({ image: videoRef.current });
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

    // Initialize on mount
    useEffect(() => {
        initializePose();

        return () => {
            stopCamera();
            if (poseRef.current) {
                poseRef.current.close();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        videoRef,
        state,
        startCamera,
        stopCamera,
    };
}
