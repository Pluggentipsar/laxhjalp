import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Camera, CameraOff, Hand, AlertCircle } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useHandTracking } from '../../hooks/useHandTracking';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { HAND_CONNECTIONS, type Results } from '@mediapipe/hands';

export function HandTrackingDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [handInfo, setHandInfo] = useState<{
    leftHand: boolean;
    rightHand: boolean;
    leftPosition?: { x: number; y: number };
    rightPosition?: { x: number; y: number };
  }>({
    leftHand: false,
    rightHand: false,
  });

  // Custom onResults to draw and extract hand info
  const handleResults = (results: Results) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw video frame
    if (results.image) {
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    }

    // Extract hand info
    const newHandInfo: typeof handInfo = {
      leftHand: false,
      rightHand: false,
    };

    // Draw hands and extract positions
    if (results.multiHandLandmarks && results.multiHandedness) {
      results.multiHandLandmarks.forEach((landmarks, index) => {
        const handedness = results.multiHandedness?.[index];
        const label = handedness?.label?.toLowerCase();

        // Draw connections
        drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
          color: label === 'left' ? '#00FF00' : '#0099FF',
          lineWidth: 5,
        });

        // Draw landmarks
        drawLandmarks(ctx, landmarks, {
          color: '#FF0000',
          lineWidth: 2,
          radius: 5,
        });

        // Extract position (wrist)
        if (label === 'left') {
          newHandInfo.leftHand = true;
          newHandInfo.leftPosition = {
            x: Math.round(landmarks[0].x * 100),
            y: Math.round(landmarks[0].y * 100),
          };
        } else if (label === 'right') {
          newHandInfo.rightHand = true;
          newHandInfo.rightPosition = {
            x: Math.round(landmarks[0].x * 100),
            y: Math.round(landmarks[0].y * 100),
          };
        }
      });
    }

    ctx.restore();
    setHandInfo(newHandInfo);
  };

  const {
    videoRef,
    state,
    startCamera,
    stopCamera,
  } = useHandTracking({
    onResults: handleResults,
    maxNumHands: 2,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-blue-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <Link to="/motion-learn">
          <Button variant="ghost" size="sm" className="mb-4 text-white hover:bg-white/10">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tillbaka till Hub
          </Button>
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Handspårning Demo
          </h1>
          <p className="text-white/80">
            Testa kameran och se dina händer spåras i realtid
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video/Canvas Area */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              {state.error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                      Fel
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {state.error}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col items-center gap-4">
                {/* Video element (hidden) */}
                <video
                  ref={videoRef}
                  className="hidden"
                  autoPlay
                  playsInline
                />

                {/* Canvas for drawing */}
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={480}
                  className="w-full max-w-2xl rounded-lg shadow-xl border-4 border-purple-500 bg-gray-900"
                />

                {/* Controls */}
                <div className="flex gap-3">
                  {!state.isStreaming ? (
                    <Button
                      onClick={startCamera}
                      disabled={!state.isReady}
                      size="lg"
                      className="bg-gradient-to-r from-purple-500 to-pink-500"
                    >
                      <Camera className="mr-2 h-5 w-5" />
                      Starta Kamera
                    </Button>
                  ) : (
                    <Button
                      onClick={stopCamera}
                      variant="secondary"
                      size="lg"
                    >
                      <CameraOff className="mr-2 h-5 w-5" />
                      Stoppa Kamera
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Hand className="h-5 w-5 text-purple-500" />
                Status
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    MediaPipe
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    state.isReady
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {state.isReady ? 'Redo' : 'Laddar...'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Kamera
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    state.isStreaming
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {state.isStreaming ? 'Aktiv' : 'Stoppad'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Vänster hand
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    handInfo.leftHand
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {handInfo.leftHand ? 'Detekterad' : 'Ej synlig'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Höger hand
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    handInfo.rightHand
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {handInfo.rightHand ? 'Detekterad' : 'Ej synlig'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Instructions */}
            <Card className="p-6 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Instruktioner
              </h3>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                <li>✋ Håll upp en eller båda händerna framför kameran</li>
                <li>📏 Håll händerna ca 30-50 cm från kameran</li>
                <li>💡 Se till att du har bra belysning</li>
                <li>🎯 Grön = vänster hand, Blå = höger hand</li>
              </ul>
            </Card>

            {/* Hand Positions */}
            {(handInfo.leftPosition || handInfo.rightPosition) && (
              <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Handpositioner
                </h3>
                <div className="space-y-2 text-sm">
                  {handInfo.leftPosition && (
                    <div>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        Vänster:
                      </span>
                      <span className="ml-2 text-gray-700 dark:text-gray-300">
                        X: {handInfo.leftPosition.x}%, Y: {handInfo.leftPosition.y}%
                      </span>
                    </div>
                  )}
                  {handInfo.rightPosition && (
                    <div>
                      <span className="font-semibold text-purple-600 dark:text-purple-400">
                        Höger:
                      </span>
                      <span className="ml-2 text-gray-700 dark:text-gray-300">
                        X: {handInfo.rightPosition.x}%, Y: {handInfo.rightPosition.y}%
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
