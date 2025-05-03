
import { useState } from 'react';
import { Shield, Camera, Mic, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIsMobile } from '@/hooks/use-mobile';

interface ConsentBannerProps {
  onCameraConsent: (consent: boolean) => void;
  onVoiceConsent: (consent: boolean) => void;
}

export const ConsentBanner = ({ onCameraConsent, onVoiceConsent }: ConsentBannerProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [showCameraDialog, setShowCameraDialog] = useState(false);
  const [showVoiceDialog, setShowVoiceDialog] = useState(false);
  const isMobile = useIsMobile();

  const handleInitialConsent = () => {
    setIsVisible(false);
    // Show camera permission dialog first
    setShowCameraDialog(true);
  };

  const handleSkip = () => {
    setIsVisible(false);
    onCameraConsent(false);
    onVoiceConsent(false);
  };

  const handleCameraConsent = (consent: boolean) => {
    onCameraConsent(consent);
    setShowCameraDialog(false);
    // After camera permission, show voice permission dialog
    setShowVoiceDialog(true);
  };

  const handleVoiceConsent = (consent: boolean) => {
    onVoiceConsent(consent);
    setShowVoiceDialog(false);
  };

  const handleRetry = async () => {
    try {
      // Request camera permission explicitly
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      
      if (stream) {
        // Stop the stream since we're just testing permissions
        stream.getTracks().forEach(track => track.stop());
        // Grant consent and close dialog
        handleCameraConsent(true);
      }
    } catch (error) {
      console.error('Camera permission denied during retry:', error);
      // Show browser permission instructions
      alert('Please enable camera access in your browser settings to use emotion detection.');
    }
  };

  return (
    <>
      {isVisible && (
        <div className={`fixed ${isMobile ? 'inset-x-2 bottom-2' : 'bottom-4 left-4 right-4'} bg-white/80 backdrop-blur-lg rounded-2xl p-4 shadow-lg border border-teal-100 animate-fade-in z-40`}>
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-5 h-5 text-teal-400" />
            <h3 className="text-lg font-semibold text-gray-800">Your Privacy Matters</h3>
          </div>
          <p className="text-gray-600 mb-3 text-sm">
            Would you like to enable enhanced features to improve your experience?
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 text-sm"
              onClick={handleSkip}
            >
              Continue without features
            </Button>
            <Button
              className="flex-1 bg-teal-400 hover:bg-teal-500 text-white text-sm"
              onClick={handleInitialConsent}
            >
              Learn more
            </Button>
          </div>
        </div>
      )}

      {/* Camera Permission Dialog */}
      <Dialog open={showCameraDialog} onOpenChange={setShowCameraDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-teal-400" />
              Enable Emotion Detection
            </DialogTitle>
            <DialogDescription>
              We can detect your emotions to provide more personalized and supportive responses.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 mt-0.5" />
              <div className="text-sm text-gray-600">
                <p className="mb-2">Your camera will be used to:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Detect facial expressions and emotions</li>
                  <li>Provide responses tailored to your emotional state</li>
                  <li>Offer more empathetic support when you need it</li>
                  <li>All processing happens locally on your device</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-end">
            <Button variant="outline" onClick={() => handleCameraConsent(false)}>
              No thanks
            </Button>
            <Button variant="outline" onClick={handleRetry}>
              Retry permission
            </Button>
            <Button className="bg-teal-400 hover:bg-teal-500" onClick={() => handleCameraConsent(true)}>
              Enable camera
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Voice Permission Dialog */}
      <Dialog open={showVoiceDialog} onOpenChange={setShowVoiceDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-teal-400" />
              Enable Voice Features
            </DialogTitle>
            <DialogDescription>
              We can enable voice input and AI speech responses.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 mt-0.5" />
              <div className="text-sm text-gray-600">
                <p className="mb-2">Voice features allow you to:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Speak to the chatbot using your microphone</li>
                  <li>Hear AI responses with natural voice</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-end">
            <Button variant="outline" onClick={() => handleVoiceConsent(false)}>
              No thanks
            </Button>
            <Button className="bg-teal-400 hover:bg-teal-500" onClick={() => handleVoiceConsent(true)}>
              Enable voice
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
