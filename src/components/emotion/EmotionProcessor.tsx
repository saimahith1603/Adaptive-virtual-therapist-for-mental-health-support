
import { useEffect, useRef } from 'react';
import { FaceLandmarker } from '@mediapipe/tasks-vision';
import { mapBlendshapesToEmotion } from '@/utils/emotionDetection';

interface EmotionProcessorProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  faceLandmarker: FaceLandmarker | null;
  isLoaded: boolean;
  isMobile: boolean;
  onEmotionDetected: (emotion: string) => void;
  setLastEmotion: (emotion: string) => void;
  setFaceLandmarksResult: (result: any) => void;
  lastEmotion: string;
}

export const EmotionProcessor = ({
  videoRef,
  faceLandmarker,
  isLoaded,
  isMobile,
  onEmotionDetected,
  setLastEmotion,
  setFaceLandmarksResult,
  lastEmotion
}: EmotionProcessorProps) => {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  const emotionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const emotionBufferRef = useRef<string[]>([]);

  // Animation loop for processing video frames
  const animate = (time: number) => {
    if (previousTimeRef.current === undefined) {
      previousTimeRef.current = time;
    }
    
    const deltaTime = time - (previousTimeRef.current || 0);
    
    // Process less frequently on mobile to save battery but still get accurate results
    const processingInterval = isMobile ? 120 : 80;
    
    if (deltaTime > processingInterval) {
      detectEmotions();
      previousTimeRef.current = time;
    }
    
    requestRef.current = requestAnimationFrame(animate);
  };

  // Process video frames to detect emotions with improved accuracy
  const detectEmotions = () => {
    if (!faceLandmarker || !videoRef.current || !isLoaded || !videoRef.current.videoWidth) {
      return;
    }

    const video = videoRef.current;
    
    // Process video frame
    const result = faceLandmarker.detectForVideo(video, performance.now());
    
    // Store face landmarks for rendering
    if (result.faceLandmarks) {
      setFaceLandmarksResult(result.faceLandmarks);
    }
    
    if (result && result.faceBlendshapes && result.faceBlendshapes.length > 0) {
      const blendshapes = result.faceBlendshapes[0].categories;
      const detectedEmotion = mapBlendshapesToEmotion(blendshapes);
      
      // Use a buffer to smooth out emotion detection and avoid flickering
      emotionBufferRef.current.push(detectedEmotion);
      if (emotionBufferRef.current.length > 5) {
        emotionBufferRef.current.shift();
      }
      
      // Find most common emotion in buffer
      const emotionCounts: Record<string, number> = {};
      emotionBufferRef.current.forEach(emotion => {
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      });
      
      let mostCommonEmotion = 'neutral';
      let highestCount = 0;
      
      Object.entries(emotionCounts).forEach(([emotion, count]) => {
        if (count > highestCount) {
          highestCount = count;
          mostCommonEmotion = emotion;
        }
      });
      
      // Only update if emotion has changed and is stable
      if (mostCommonEmotion !== lastEmotion && highestCount > 2) {
        console.log('Emotion detected:', mostCommonEmotion);
        setLastEmotion(mostCommonEmotion);
        
        // Debounce emotion detection to prevent too frequent updates
        if (emotionTimeoutRef.current) {
          clearTimeout(emotionTimeoutRef.current);
        }
        
        emotionTimeoutRef.current = setTimeout(() => {
          onEmotionDetected(mostCommonEmotion);
        }, 600); // Balanced debounce time
      }
    }
  };

  // Start and clean up animation loop
  useEffect(() => {
    if (!isLoaded || !faceLandmarker) return;

    requestRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      
      if (emotionTimeoutRef.current) {
        clearTimeout(emotionTimeoutRef.current);
      }
    };
  }, [isLoaded, faceLandmarker]);

  return null;
};
