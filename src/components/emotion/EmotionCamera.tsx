
import { useEffect, useRef } from 'react';
import { FaceLandmarker } from '@mediapipe/tasks-vision';
import { startCameraStream, drawFaceMesh } from '@/utils/emotionDetection';

interface EmotionCameraProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  faceLandmarker: FaceLandmarker | null;
  isLoaded: boolean;
  isMobile: boolean;
  showFaceMesh: boolean;
  faceLandmarksResult: any;
}

export const EmotionCamera = ({ 
  videoRef, 
  canvasRef, 
  faceLandmarker, 
  isLoaded,
  isMobile,
  showFaceMesh,
  faceLandmarksResult
}: EmotionCameraProps) => {
  const initAttemptsRef = useRef(0);
  const maxAttempts = 3;

  // Initialize camera when component mounts or dependencies change
  useEffect(() => {
    if (!faceLandmarker || !isLoaded) return;
    
    const initCamera = async () => {
      try {
        const success = await startCameraStream(videoRef, isMobile);
        
        if (success && videoRef.current) {
          console.log('Camera stream started successfully');
          initAttemptsRef.current = 0; // Reset attempts counter on success
          
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded, dimensions:', 
              videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
            
            // Force play for mobile browsers that might block autoplay
            const playVideo = async () => {
              try {
                if (!videoRef.current?.paused) {
                  console.log('Video already playing');
                  return;
                }
                
                await videoRef.current?.play();
                console.log('Video playing after metadata load');
              } catch (err) {
                console.error('Error playing video after metadata load:', err);
                if (initAttemptsRef.current < maxAttempts) {
                  initAttemptsRef.current++;
                  setTimeout(playVideo, 300);
                }
              }
            };
            
            playVideo();
          };
          
          // Additional fallback for iOS devices
          setTimeout(() => {
            if (videoRef.current?.paused) {
              console.log('Video still paused after timeout, trying again');
              videoRef.current.play().catch(err => 
                console.error('Final play attempt failed:', err)
              );
            }
          }, 1000);
        } else {
          console.error('Failed to start camera stream');
          // Try again if not successful
          if (initAttemptsRef.current < maxAttempts) {
            initAttemptsRef.current++;
            setTimeout(initCamera, 500);
          }
        }
      } catch (error) {
        console.error('Error in initCamera:', error);
      }
    };

    initCamera();

    // Clean up function
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => {
          track.stop();
          console.log('Camera track stopped:', track.id);
        });
      }
    };
  }, [faceLandmarker, isLoaded, isMobile, videoRef]);

  // Draw face mesh on canvas when results are available
  useEffect(() => {
    if (canvasRef.current && videoRef.current && showFaceMesh && faceLandmarksResult) {
      drawFaceMesh(canvasRef.current, videoRef.current, faceLandmarksResult);
    } else if (canvasRef.current && !showFaceMesh) {
      // Clear canvas when faceMesh is disabled
      const ctx = canvasRef.current.getContext('2d');
      if (ctx && videoRef.current) {
        ctx.clearRect(0, 0, videoRef.current.videoWidth || 300, videoRef.current.videoHeight || 200);
      }
    }
  }, [canvasRef, videoRef, showFaceMesh, faceLandmarksResult]);

  return null;
};
