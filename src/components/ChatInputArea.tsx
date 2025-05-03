
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { ChatInput } from '@/components/ChatInput';

interface ChatInputAreaProps {
  sendMessage: (message: string) => void;
  voiceEnabled: boolean;
  isLoading: boolean;
  isMobile: boolean;
  handleVoiceInput: (text: string) => void;
}

export const ChatInputArea = ({ 
  sendMessage, 
  voiceEnabled, 
  isLoading,
  isMobile,
  handleVoiceInput
}: ChatInputAreaProps) => {
  return (
    <>
      {isMobile ? (
        <div className="flex-shrink-0">
          <div className="relative">
            <ChatInput
              onSendMessage={sendMessage}
              voiceEnabled={voiceEnabled}
              isLoading={isLoading}
            />
            {voiceEnabled && (
              <div className="absolute bottom-2 right-12">
                <VoiceRecorder
                  onVoiceInput={handleVoiceInput}
                  enabled={voiceEnabled}
                  isLoading={isLoading}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-end gap-3">
          <ChatInput
            onSendMessage={sendMessage}
            voiceEnabled={voiceEnabled}
            isLoading={isLoading}
          />
          {voiceEnabled && (
            <VoiceRecorder
              onVoiceInput={handleVoiceInput}
              enabled={voiceEnabled}
              isLoading={isLoading}
            />
          )}
        </div>
      )}
    </>
  );
};
