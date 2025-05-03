
import { Volume2, VolumeX, Moon, Sun, Sparkles } from 'lucide-react';
import { EmotionDetector } from './emotion/EmotionDetector';
import { motion } from 'framer-motion';

interface ChatHeaderProps {
  toggleMute: () => void;
  toggleTheme: () => void;
  muted: boolean;
  theme: 'light' | 'dark';
  cameraEnabled: boolean;
  onEmotionDetected: (emotion: string) => void;
  isMobile: boolean;
}

export const ChatHeader = ({ 
  toggleMute, 
  toggleTheme, 
  muted, 
  theme, 
  cameraEnabled, 
  onEmotionDetected,
  isMobile
}: ChatHeaderProps) => {
  return (
    <div className={`flex items-center justify-between mb-4 sticky top-0 z-10 ${
      theme === 'dark' ? 'bg-gray-800/90' : 'bg-white/90'
    } backdrop-filter backdrop-blur-sm py-2 -mx-3 sm:-mx-6 px-3 sm:px-6 transition-colors duration-300`}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className={`text-2xl sm:text-3xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
          <Sparkles className="w-5 h-5 text-yellow-400" />
          Therapy Chat
        </h1>
        {!isMobile && (
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-base sm:text-lg`}>
            Your safe space to talk and feel heard.
          </p>
        )}
      </motion.div>
      <div className="flex items-center gap-2 sm:gap-3">
        <motion.button 
          onClick={(e) => {
            e.stopPropagation(); // Prevent event bubbling that might trigger other handlers
            toggleMute();
          }}
          className={`p-1.5 sm:p-2 rounded-full transition-colors ${
            theme === 'dark' 
              ? 'hover:bg-gray-700 text-white' 
              : 'hover:bg-gray-100 text-gray-800'
          } ${muted ? 'bg-red-100 dark:bg-red-900/30' : ''}`}
          title={muted ? "Unmute AI voice" : "Mute AI voice"}
          aria-label={muted ? "Unmute AI voice" : "Mute AI voice"}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {muted ? (
            <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </motion.button>
        <motion.button 
          onClick={(e) => {
            e.stopPropagation(); // Prevent event bubbling
            toggleTheme();
          }}
          className={`p-1.5 sm:p-2 rounded-full transition-colors ${
            theme === 'dark' 
              ? 'hover:bg-gray-700 text-white' 
              : 'hover:bg-gray-100 text-gray-800'
          }`}
          aria-label={theme === 'light' ? "Switch to dark mode" : "Switch to light mode"}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </motion.button>
        {cameraEnabled && (
          <EmotionDetector
            enabled={cameraEnabled}
            onEmotionDetected={onEmotionDetected}
          />
        )}
      </div>
    </div>
  );
};
