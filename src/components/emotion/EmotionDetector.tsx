
import { useEffect, useRef, useState } from 'react';
import { FaceLandmarker } from '@mediapipe/tasks-vision';
import { useIsMobile } from '@/hooks/use-mobile';
import { EmotionDisplay } from './EmotionDisplay';
import { CameraInitializer } from './CameraInitializer';
import { EmotionCamera } from './EmotionCamera';
import { EmotionProcessor } from './EmotionProcessor';
import { initFaceLandmarker } from '@/utils/emotionDetection';

interface EmotionDetectorProps {
  onEmotionDetected: (emotion: string) => void;
  enabled: boolean;
}

export const EmotionDetector = ({ onEmotionDetected, enabled }: EmotionDetectorProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastEmotion, setLastEmotion] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const isMobile = useIsMobile();
  const [showFaceMesh, setShowFaceMesh] = useState(true);
  const [faceLandmarksResult, setFaceLandmarksResult] = useState<any>(null);

  // Load MediaPipe model
  useEffect(() => {
    if (!enabled) return;

    const setupFaceLandmarker = async () => {
      setIsInitializing(true);
      
      const { faceLandmarker: landmarker, hasPermission: permission } = 
        await initFaceLandmarker(isMobile);
      
      setFaceLandmarker(landmarker);
      setHasPermission(permission);
      
      if (landmarker && permission) {
        setIsLoaded(true);
      }
      
      setIsInitializing(false);
    };

    setupFaceLandmarker();
  }, [enabled, isMobile]);

  const toggleFaceMesh = () => {
    setShowFaceMesh(prev => !prev);
  };

  if (!enabled) return null;

  // Render camera initializer for loading and permission states
  if (isInitializing || hasPermission === false) {
    return <CameraInitializer 
      isInitializing={isInitializing} 
      hasPermission={hasPermission} 
    />;
  }

  const containerSize = isMobile ? "w-12 h-12 rounded-full" : "w-48 h-36 rounded-lg";

  return (
    <div className={`relative overflow-hidden bg-black/10 backdrop-blur-sm ${containerSize}`}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
      
      <EmotionCamera 
        videoRef={videoRef}
        canvasRef={canvasRef}
        faceLandmarker={faceLandmarker}
        isLoaded={isLoaded}
        isMobile={isMobile}
        showFaceMesh={showFaceMesh}
        faceLandmarksResult={faceLandmarksResult}
      />
      
      <EmotionProcessor 
        videoRef={videoRef}
        faceLandmarker={faceLandmarker}
        isLoaded={isLoaded}
        isMobile={isMobile}
        onEmotionDetected={onEmotionDetected}
        setLastEmotion={setLastEmotion}
        setFaceLandmarksResult={setFaceLandmarksResult}
        lastEmotion={lastEmotion}
      />
      
      <EmotionDisplay 
        lastEmotion={lastEmotion} 
        isMobile={isMobile} 
        onToggleFaceMesh={toggleFaceMesh}
        showFaceMesh={showFaceMesh}
      />
    </div>
  );
};
