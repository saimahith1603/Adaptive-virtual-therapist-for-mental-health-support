
import { useRef, useEffect, useState } from 'react';
import { ConsentBanner } from '@/components/ConsentBanner';
import { useChat } from '@/hooks/useChat';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { WelcomeOverlay } from '@/components/WelcomeOverlay';
import { ChatHeader } from '@/components/ChatHeader';
import { ChatMessages } from '@/components/ChatMessages';
import { ChatInputArea } from '@/components/ChatInputArea';
import { EnhancedBackground } from '@/components/EnhancedBackground';
import { cleanupExistingAudio } from '@/utils/speechUtils';

const Index = () => {
  const { messages, sendMessage, isLoading, isSpeaking, setCurrentEmotion, currentEmotion, toggleMute, muted } = useChat();
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showWelcome, setShowWelcome] = useState(true);
  const isMobile = useIsMobile();
  const themeSwitchingRef = useRef(false);

  // Force browser to reload any active MediaStream to fix stalled camera
  useEffect(() => {
    // Clear speech synthesis on mount to restart voice
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      console.log('Speech synthesis cleared on component mount');
    }
    
    cleanupExistingAudio();
    
    // Add a forced restart for camera when component mounts
    return () => {
      if (typeof window !== 'undefined' && navigator.mediaDevices) {
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(stream => {
            stream.getTracks().forEach(track => {
              track.stop();
              console.log('Camera track stopped:', track.id);
            });
          })
          .catch(err => console.log('Camera reset:', err));
      }
      
      cleanupExistingAudio();
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 3000); // Extended welcome duration
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (muted && isSpeaking) {
      // Cancel any ongoing speech when muted
      cleanupExistingAudio();
      console.log('Speech cancelled due to mute setting');
    }
  }, [muted, isSpeaking]);

  const handleVoiceInput = (text: string) => {
    if (text.trim()) {
      sendMessage(text.trim());
    }
  };

  const toggleTheme = () => {
    // Set a ref to prevent voice triggering during theme switch
    themeSwitchingRef.current = true;
    
    // Clean up audio before UI change to prevent unintended replays
    cleanupExistingAudio();
    
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
    
    // Reset the ref after a short delay
    setTimeout(() => {
      themeSwitchingRef.current = false;
    }, 500);
  };
  
  const handleEmotionDetected = (emotion: string) => {
    setCurrentEmotion(emotion);
    console.log('Emotion detected and set:', emotion);
  };

  const handleToggleMute = () => {
    // Use a ref to prevent voice triggering during mute toggle
    themeSwitchingRef.current = true;
    
    // Toggle mute
    toggleMute();
    
    // Reset the ref after a short delay
    setTimeout(() => {
      themeSwitchingRef.current = false;
    }, 500);
  }

  return (
    <div className={`min-h-screen relative overflow-hidden ${
      theme === 'dark' 
        ? 'bg-gray-900 text-white' 
        : 'bg-gradient-to-br from-ivory-50 to-teal-50/30'
    } transition-colors duration-500`}>
      <AnimatePresence>
        {showWelcome && <WelcomeOverlay show={showWelcome} />}
      </AnimatePresence>

      <EnhancedBackground theme={theme} />

      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6 relative z-10 min-h-screen flex flex-col">
        <motion.div 
          className={`${
            theme === 'dark' 
              ? 'bg-gray-800/90 border-gray-700' 
              : 'bg-white/70 border-teal-100'
          } backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-lg border overflow-hidden transition-colors duration-500 flex-grow flex flex-col max-h-[calc(100vh-24px)]`}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="p-3 sm:p-6 flex flex-col h-full">
            <ChatHeader
              toggleMute={handleToggleMute}
              toggleTheme={toggleTheme}
              muted={muted}
              theme={theme}
              cameraEnabled={cameraEnabled}
              onEmotionDetected={handleEmotionDetected}
              isMobile={isMobile}
            />
            
            <ChatMessages
              messages={messages}
              isLoading={isLoading}
              isSpeaking={isSpeaking}
              muted={muted}
              currentEmotion={currentEmotion}
              theme={theme}
            />
            
            <ChatInputArea
              sendMessage={sendMessage}
              voiceEnabled={voiceEnabled}
              isLoading={isLoading}
              isMobile={isMobile}
              handleVoiceInput={handleVoiceInput}
            />
          </div>
        </motion.div>
      </div>
      
      <ConsentBanner
        onCameraConsent={setCameraEnabled}
        onVoiceConsent={setVoiceEnabled}
      />
    </div>
  );
};

export default Index;
