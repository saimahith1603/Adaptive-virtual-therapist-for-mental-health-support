
// This file is kept minimal as we're using only ElevenLabs for voice
// It contains basic browser check for audio playback capabilities and audio management

// Simple utility to check if audio can play (for browser compatibility check)
export const canPlayAudio = (): boolean => {
  try {
    const audio = new Audio();
    return !!audio;
  } catch (e) {
    console.error('Audio playback not supported:', e);
    return false;
  }
};

// Check if the browser can play MP3 audio (which ElevenLabs returns)
export const canPlayMP3 = (): boolean => {
  try {
    const audio = new Audio();
    return audio.canPlayType('audio/mpeg') !== '';
  } catch (e) {
    console.error('MP3 playback not supported:', e);
    return false;
  }
};

// Global audio instance tracker to help prevent multiple audio instances
let currentAudio: HTMLAudioElement | null = null;

// Clean up any existing audio to prevent duplication/repetition
export const cleanupExistingAudio = (): void => {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.src = '';
      
      // Remove all event listeners by cloning and replacing
      const newAudio = new Audio();
      currentAudio.replaceWith(newAudio);
      
      // Force browser to release resources
      currentAudio.load();
      
      currentAudio = null;
      console.log('Existing audio cleaned up');
    } catch (e) {
      console.error('Error cleaning up audio:', e);
    }
  }
};

// Set the current audio instance for tracking
export const setCurrentAudio = (audio: HTMLAudioElement): void => {
  cleanupExistingAudio();
  currentAudio = audio;
};

// Get the current audio instance
export const getCurrentAudio = (): HTMLAudioElement | null => {
  return currentAudio;
};

// Check if audio is allowed to play (based on permissions and browser state)
export const checkAudioPlaybackPermission = async (): Promise<boolean> => {
  try {
    // Try playing a silent audio to check if autoplay is allowed
    const silentAudio = new Audio("data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAABAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDA//NEAAAANWGFMAAAAAGQADRAAAAABAQEAAAABAAADTGF2YzU4LjU0AAAAAAAAAAAAAAAA");
    silentAudio.volume = 0.01; // Very low volume
    const playPromise = silentAudio.play();
    await playPromise;
    silentAudio.pause();
    silentAudio.remove();
    return true;
  } catch (e) {
    console.error('Audio playback permission check failed:', e);
    return false;
  }
};

// Retry playback with user interaction requirement
export const retryPlaybackWithUserInteraction = (audio: HTMLAudioElement): void => {
  // First try to add a document click listener for better UX
  const handleClick = () => {
    audio.play()
      .then(() => {
        document.removeEventListener('click', handleClick);
        // Remove any visible retry button
        const existingButton = document.getElementById('audio-retry-button');
        if (existingButton) {
          existingButton.remove();
        }
      })
      .catch(error => {
        console.error('Error during retry playback on document click:', error);
        // If document click fails, show the explicit button
        createRetryButton(audio);
      });
  };
  
  document.addEventListener('click', handleClick, { once: true });
  
  // Also create a visible button as fallback
  createRetryButton(audio);
};

const createRetryButton = (audio: HTMLAudioElement): void => {
  // Remove any existing retry button
  const existingButton = document.getElementById('audio-retry-button');
  if (existingButton) {
    existingButton.remove();
  }
  
  // Create new retry button
  const retryButton = document.createElement('button');
  retryButton.id = 'audio-retry-button';
  retryButton.textContent = 'Click to enable audio';
  retryButton.style.position = 'fixed';
  retryButton.style.top = '20px';
  retryButton.style.right = '20px';
  retryButton.style.zIndex = '9999';
  retryButton.style.padding = '10px';
  retryButton.style.background = '#10b981'; // Tailwind teal-500
  retryButton.style.color = 'white';
  retryButton.style.border = 'none';
  retryButton.style.borderRadius = '5px';
  retryButton.style.cursor = 'pointer';
  retryButton.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
  
  retryButton.onclick = () => {
    audio.play()
      .then(() => {
        retryButton.remove();
      })
      .catch(error => {
        console.error('Error during retry playback:', error);
        retryButton.textContent = 'Try again (click here)';
      });
  };
  
  document.body.appendChild(retryButton);
  
  // Auto-remove after 15 seconds
  setTimeout(() => {
    if (retryButton.parentNode) {
      retryButton.remove();
    }
  }, 15000);
};
