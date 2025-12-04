import { useEffect, useRef, useState, useCallback } from 'react';
import { Hands, type Results as HandResults } from '@mediapipe/hands';
import { Pose, type Results as PoseResults } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';

interface UseCombinedTrackingOptions {
    onHandResults?: (results: HandResults) => void;
    onPoseResults?: (results: PoseResults) => void;
}

interface CombinedTrackingState {
    isReady: boolean;
    isStreaming: boolean;
    error: string | null;
}

export function useCombinedTracking(options: UseCombinedTrackingOptions = {}) {
    const { onHandResults, onPoseResults } = options;

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const handsRef = useRef<Hands | null>(null);
    const poseRef = useRef<Pose | null>(null);
    const cameraRef = useRef<Camera | null>(null);

    const [state, setState] = useState<CombinedTrackingState>({
        isReady: false,
        isStreaming: false,
        error: null,
    });

    const onHandResultsRef = useRef(onHandResults);
    const onPoseResultsRef = useRef(onPoseResults);

    useEffect(() => {
        onHandResultsRef.current = onHandResults;
        onPoseResultsRef.current = onPoseResults;
    }, [onHandResults, onPoseResults]);

    const initialize = useCallback(async () => {
        try {
            // Initialize Hands
            const hands = new Hands({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
            });
            hands.setOptions({
                maxNumHands: 2,
                modelComplexity: 1,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5,
            });
            hands.onResults((results) => {
                if (onHandResultsRef.current) onHandResultsRef.current(results);
            });
            handsRef.current = hands;

            // Initialize Pose
            const pose = new Pose({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
            });
            pose.setOptions({
                modelComplexity: 1,
                smoothLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5,
            });
            pose.onResults((results) => {
                if (onPoseResultsRef.current) onPoseResultsRef.current(results);
            });
            poseRef.current = pose;

            setState(prev => ({ ...prev, isReady: true, error: null }));
        } catch (err) {
            console.error('Failed to initialize tracking:', err);
            setState(prev => ({ ...prev, error: 'Failed to initialize tracking' }));
        }
    }, []);

    const startCamera = useCallback(async () => {
        if (!videoRef.current || !handsRef.current || !poseRef.current) return;

        try {
            const camera = new Camera(videoRef.current, {
                onFrame: async () => {
                    if (videoRef.current) {
                        // Send to both solutions
                        // Note: This might be heavy. We could alternate frames if needed.
                        await handsRef.current?.send({ image: videoRef.current });
                        await poseRef.current?.send({ image: videoRef.current });
                    }
                },
                width: 1280,
                height: 720,
            });

            await camera.start();
            cameraRef.current = camera;
            setState(prev => ({ ...prev, isStreaming: true }));
        } catch (err) {
            console.error('Failed to start camera:', err);
            setState(prev => ({ ...prev, error: 'Failed to start camera' }));
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (cameraRef.current) {
            cameraRef.current.stop();
            cameraRef.current = null;
        }
        setState(prev => ({ ...prev, isStreaming: false }));
    }, []);

    useEffect(() => {
        initialize();
        return () => {
            stopCamera();
            handsRef.current?.close();
            poseRef.current?.close();
        };
    }, []);

    return {
        videoRef,
        state,
        startCamera,
        stopCamera,
    };
}
