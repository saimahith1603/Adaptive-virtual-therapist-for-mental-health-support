
import { useEffect, useRef } from 'react';
import { ChatMessage } from '@/components/ChatMessage';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  isSpeaking: boolean;
  muted: boolean;
  currentEmotion: string;
  theme: 'light' | 'dark';
}

export const ChatMessages = ({ 
  messages, 
  isLoading, 
  isSpeaking, 
  muted, 
  currentEmotion,
  theme
}: ChatMessagesProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!scrollAreaRef.current || !messagesEndRef.current) return;
    
    // Calculate if user is already at the bottom or a new message is added
    const scrollArea = scrollAreaRef.current;
    const isAtBottom = scrollArea ? 
      (scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight < 50) : 
      true;
    
    if (isAtBottom || messages[messages.length - 1]?.isUser) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [messages]);

  return (
    <ScrollArea 
      className={`flex-grow h-[calc(100vh-280px)] overflow-y-auto ${
        theme === 'dark' ? 'scrollbar-dark' : 'scrollbar-light'
      }`}
      type="hover"
    >
      <div 
        ref={scrollAreaRef}
        className="space-y-3 sm:space-y-4 mb-4 sm:mb-6 px-2 sm:px-4 pb-6 min-h-full"
      >
        {messages.map((message, index) => (
          <ChatMessage
            key={message.id}
            message={message.text}
            isUser={message.isUser}
            emotion={message.isUser ? currentEmotion : undefined}
            animate
            isLatest={index === messages.length - 1 && !message.isUser}
          />
        ))}
        
        {isLoading && (
          <div className="flex justify-center py-3">
            <div className="flex space-x-2 justify-center items-center">
              <div className="h-2 w-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="h-2 w-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="h-2 w-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}

        {isSpeaking && !muted && (
          <div className="flex justify-center py-2">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-teal-100 text-teal-700 text-xs sm:text-sm shadow-md animate-pulse">
              <div className="flex space-x-1">
                <div className="w-1 h-3 bg-teal-400 rounded-full animate-sound-wave" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1 h-4 bg-teal-400 rounded-full animate-sound-wave" style={{ animationDelay: '200ms' }}></div>
                <div className="w-1 h-3 bg-teal-400 rounded-full animate-sound-wave" style={{ animationDelay: '400ms' }}></div>
                <div className="w-1 h-2 bg-teal-400 rounded-full animate-sound-wave" style={{ animationDelay: '600ms' }}></div>
              </div>
              AI is speaking...
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};
