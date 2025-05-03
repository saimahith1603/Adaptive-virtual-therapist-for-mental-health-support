
import React from 'react';
import { Camera } from 'lucide-react';

interface CameraInitializerProps {
  isInitializing: boolean;
  hasPermission: boolean | null;
}

export const CameraInitializer: React.FC<CameraInitializerProps> = ({ 
  isInitializing, 
  hasPermission 
}) => {
  if (isInitializing) {
    return (
      <div className="relative w-12 h-12 flex items-center justify-center overflow-hidden rounded-full bg-black/10 backdrop-blur-sm">
        <div className="animate-spin w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (hasPermission === false) {
    return (
      <div className="relative w-12 h-12 flex items-center justify-center overflow-hidden rounded-full bg-red-100 backdrop-blur-sm">
        <Camera className="w-5 h-5 text-red-500" />
      </div>
    );
  }

  return null;
};
