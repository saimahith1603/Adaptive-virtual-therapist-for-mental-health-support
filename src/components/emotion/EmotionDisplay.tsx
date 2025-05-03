
import React from 'react';
import { Camera, Eye, EyeOff } from 'lucide-react';

interface EmotionDisplayProps {
  lastEmotion: string;
  isMobile: boolean;
  showFaceMesh: boolean;
  onToggleFaceMesh: () => void;
}

export const EmotionDisplay: React.FC<EmotionDisplayProps> = ({ 
  lastEmotion, 
  isMobile, 
  showFaceMesh, 
  onToggleFaceMesh 
}) => {
  const getEmotionColor = (emotion: string): string => {
    switch(emotion) {
      case 'happy': return 'bg-yellow-400/80';
      case 'sad': return 'bg-blue-400/80';
      case 'angry': return 'bg-red-500/80';
      case 'surprised': return 'bg-purple-400/80';
      case 'fearful': return 'bg-orange-400/80';
      case 'disgusted': return 'bg-green-500/80';
      default: return 'bg-black/40';
    }
  };

  const getEmotionIcon = (emotion: string): string => {
    switch(emotion) {
      case 'happy': return '😊';
      case 'sad': return '😢';
      case 'angry': return '😠';
      case 'surprised': return '😮';
      case 'fearful': return '😨';
      case 'disgusted': return '🤢';
      default: return '😐';
    }
  };

  if (isMobile) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`text-xs px-2 py-0.5 rounded-full text-white font-medium backdrop-blur-sm ${getEmotionColor(lastEmotion)}`}>
          {getEmotionIcon(lastEmotion)} {lastEmotion || 'neutral'}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-2 right-2 flex items-center gap-2">
      <div className={`px-2 py-1 rounded-full text-white text-xs font-medium ${getEmotionColor(lastEmotion)}`}>
        {getEmotionIcon(lastEmotion)} {lastEmotion || 'neutral'}
      </div>
      <button 
        onClick={onToggleFaceMesh}
        className="w-6 h-6 flex items-center justify-center text-white bg-black/40 rounded-full hover:bg-black/60 transition-colors"
        title={showFaceMesh ? "Hide face mesh" : "Show face mesh"}
      >
        {showFaceMesh ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
      </button>
      <Camera className="w-5 h-5 text-teal-400" />
    </div>
  );
};
