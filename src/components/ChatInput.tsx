
import { useState, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  voiceEnabled: boolean;
  isLoading?: boolean;
}

export const ChatInput = ({ onSendMessage, voiceEnabled, isLoading = false }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <motion.form 
      onSubmit={handleSubmit} 
      className="relative w-full"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative flex items-center">
        <textarea
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          className="w-full pr-24 pl-4 py-3 rounded-2xl bg-white border border-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none shadow-md transition-all"
          rows={1}
          disabled={isLoading}
        />
        <div className="absolute right-2 flex gap-2">
          <Button
            type="submit"
            className="bg-teal-400 hover:bg-teal-500 text-white rounded-xl shadow-md transition-transform hover:scale-105"
            disabled={isLoading || !message.trim()}
          >
            {isLoading ? 
              <Loader2 className="w-5 h-5 animate-spin" /> : 
              <motion.div
                whileTap={{ scale: 0.9 }}
              >
                <Send className="w-5 h-5" />
              </motion.div>
            }
          </Button>
        </div>
      </div>
    </motion.form>
  );
};
