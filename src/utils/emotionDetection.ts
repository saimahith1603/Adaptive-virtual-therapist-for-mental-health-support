
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

// Initialize MediaPipe FaceLandmarker with improved settings
export const initFaceLandmarker = async (isMobile: boolean): Promise<{
  faceLandmarker: FaceLandmarker | null;
  hasPermission: boolean;
}> => {
  try {
    // Check for camera permissions first
    try {
      const constraints = { 
        video: { 
          width: { ideal: isMobile ? 640 : 1280 },
          height: { ideal: isMobile ? 480 : 720 },
          facingMode: 'user',
          frameRate: { ideal: isMobile ? 20 : 30 } // Better framerate for mobile
        } 
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (stream) {
        // Stop this initial stream as we'll start it properly later
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (error) {
      console.error('Camera permission denied:', error);
      return { faceLandmarker: null, hasPermission: false };
    }
    
    const filesetResolver = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );
    
    const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        delegate: 'GPU' // Try GPU first for better performance
      },
      runningMode: 'VIDEO',
      numFaces: 1,
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: true
    });
    
    return { faceLandmarker: landmarker, hasPermission: true };
  } catch (error) {
    console.error('Error loading MediaPipe model:', error);
    // Fallback to CPU if GPU fails
    try {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      
      const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'CPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: true,
      });
      
      return { faceLandmarker: landmarker, hasPermission: true };
    } catch (fallbackError) {
      console.error('Fallback error loading MediaPipe model:', fallbackError);
      return { faceLandmarker: null, hasPermission: false };
    }
  }
};

// Enhanced emotion mapping with improved sensitivity and accuracy
export const mapBlendshapesToEmotion = (blendshapes: any[]): string => {
  if (!blendshapes || blendshapes.length === 0) return 'neutral';
  
  // Get relevant facial expressions from blendshapes with weighted scoring
  const expressionMap: {[key: string]: number} = {
    happy: 0,
    angry: 0,
    surprised: 0,
    sad: 0,
    disgusted: 0,
    fearful: 0,
    neutral: 0.05 // Small baseline for neutral
  };
  
  blendshapes.forEach(blendshape => {
    const category = blendshape.categoryName.toLowerCase();
    const score = blendshape.score;
    
    // Enhanced emotion scoring with more precise thresholds
    if (category.includes('smile') || category.includes('mouth_smile')) {
      expressionMap['happy'] += score * 1.4; // Boost happiness detection
    } 
    
    if (category.includes('browdown') || category.includes('brow_down')) {
      expressionMap['angry'] += score * 1.3;
    }
    
    if (category.includes('eyeblink') && score > 0.8) {
      // Ignore normal blinks for emotion detection
    } else if (category.includes('eyewide') && score > 0.4) {
      expressionMap['surprised'] += score * 1.5;
    }
    
    if (category.includes('jawopen') && score > 0.7) {
      expressionMap['surprised'] += score * 1.2;
    } else if (category.includes('jawopen') && score > 0.3 && score < 0.5) {
      // Slight jaw opening could be part of different emotions
      expressionMap['neutral'] += score * 0.3;
    }
    
    if (category.includes('mouthfrown')) {
      expressionMap['sad'] += score * 1.5;
    }
    
    if (category.includes('mouthpucker') || category.includes('mouthlowerdown')) {
      expressionMap['disgusted'] += score * 1.4;
    }
    
    if (category.includes('browouterup') && score > 0.4) {
      expressionMap['fearful'] += score * 1.3;
    }
    
    if (category.includes('cheekraise') && score > 0.5) {
      // Might be part of genuine smile or squinting
      expressionMap['happy'] += score * 0.8;
    }
    
    // Look for combinations that suggest complex emotions
    if (category.includes('mouthpress') && score > 0.5) {
      expressionMap['angry'] += score * 0.7;
    }
  });
  
  // Cross-check emotional states for more accuracy
  // E.g., if surprised AND fearful are high, prioritize fearful
  if (expressionMap['surprised'] > 0.3 && expressionMap['fearful'] > 0.3) {
    expressionMap['fearful'] *= 1.3;
  }
  
  // Happy usually involves multiple facial cues
  if (expressionMap['happy'] > 0 && expressionMap['cheekraise'] > 0) {
    expressionMap['happy'] *= 1.2; // Genuine smile has cheek raising
  }
  
  // Get highest scoring emotion with adjusted threshold for better sensitivity
  let highestScore = 0.1; // Threshold for emotion detection
  let dominantEmotion = 'neutral';
  
  Object.entries(expressionMap).forEach(([emotion, score]) => {
    if (score > highestScore) {
      highestScore = score;
      dominantEmotion = emotion;
    }
  });
  
  return dominantEmotion;
};

// Improved camera stream for better face detection
export const startCameraStream = async (
  videoRef: React.RefObject<HTMLVideoElement>,
  isMobile: boolean
): Promise<boolean> => {
  try {
    // Optimized constraints for better face detection
    const constraints = { 
      video: { 
        width: { ideal: isMobile ? 640 : 1280 },
        height: { ideal: isMobile ? 480 : 720 },
        facingMode: 'user',
        frameRate: { ideal: isMobile ? 20 : 30 }
      } 
    };
    
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    if (videoRef.current) {
      // Force any existing tracks to stop before assigning new stream
      if (videoRef.current.srcObject) {
        const oldStream = videoRef.current.srcObject as MediaStream;
        oldStream.getTracks().forEach(track => track.stop());
      }
      
      videoRef.current.srcObject = stream;
      
      // Critical for mobile browser compatibility
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current.setAttribute('muted', 'true');
      videoRef.current.setAttribute('autoplay', 'true');
      
      // Force play for mobile browsers
      try {
        await videoRef.current.play();
        console.log('Video playing successfully');
      } catch (playError) {
        console.error('Error playing video, trying again:', playError);
        // Try again with a delay for mobile browsers
        setTimeout(async () => {
          try {
            await videoRef.current?.play();
            console.log('Video playing after retry');
          } catch (retryError) {
            console.error('Retry failed:', retryError);
          }
        }, 300);
      }
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error accessing camera:', error);
    // Try with less strict constraints as fallback
    try {
      const fallbackConstraints = { 
        video: { 
          facingMode: 'user'
        } 
      };
      
      const fallbackStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = fallbackStream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('muted', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        
        try {
          await videoRef.current.play();
        } catch (playError) {
          setTimeout(async () => {
            await videoRef.current?.play().catch(e => console.error('Final play attempt failed:', e));
          }, 500);
        }
        
        return true;
      }
    } catch (fallbackError) {
      console.error('Fallback camera error:', fallbackError);
    }
    return false;
  }
};

// Enhanced face mesh drawing function
export const drawFaceMesh = (
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  landmarks: any[]
) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set canvas dimensions to match video
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw face mesh with better visibility
  if (landmarks && landmarks.length > 0) {
    ctx.fillStyle = 'rgba(0,255,255,0.2)';
    ctx.strokeStyle = 'rgba(0,255,255,0.8)';
    ctx.lineWidth = isMobileDevice() ? 1.5 : 1; // Thicker lines on mobile for visibility
    
    // Draw points
    for (const landmark of landmarks[0]) {
      const x = landmark.x * canvas.width;
      const y = landmark.y * canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, isMobileDevice() ? 1.5 : 1, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // Draw lines connecting facial features for better visualization
    // Eyes
    drawFacialFeature(ctx, landmarks[0], [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246], canvas.width, canvas.height);
    drawFacialFeature(ctx, landmarks[0], [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398], canvas.width, canvas.height);
    
    // Lips - important for emotion detection
    drawFacialFeature(ctx, landmarks[0], [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0], canvas.width, canvas.height);
    
    // Eyebrows - critical for emotion detection
    drawFacialFeature(ctx, landmarks[0], [70, 63, 105, 66, 107], canvas.width, canvas.height);
    drawFacialFeature(ctx, landmarks[0], [336, 296, 334, 293, 300], canvas.width, canvas.height);
  }
};

// Helper function to detect mobile devices
const isMobileDevice = (): boolean => {
  return window.innerWidth < 768;
};

// Helper function to draw a closed facial feature
const drawFacialFeature = (
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  indices: number[],
  canvasWidth: number,
  canvasHeight: number
) => {
  if (indices.length === 0) return;
  
  ctx.beginPath();
  const firstIndex = indices[0];
  const firstPoint = landmarks[firstIndex];
  ctx.moveTo(firstPoint.x * canvasWidth, firstPoint.y * canvasHeight);
  
  for (let i = 1; i < indices.length; i++) {
    const point = landmarks[indices[i]];
    ctx.lineTo(point.x * canvasWidth, point.y * canvasHeight);
  }
  
  // Close the path
  ctx.closePath();
  ctx.stroke();
};
