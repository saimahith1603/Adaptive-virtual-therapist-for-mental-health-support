
import { useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { MessageAvatar } from './chat/MessageAvatar';
import { EmotionIndicator } from './chat/EmotionIndicator';
import { formatMessage } from '@/utils/messageFormatter';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  animate?: boolean;
  emotion?: string;
  isLatest?: boolean;
}

export const ChatMessage = ({ 
  message, 
  isUser, 
  animate = true, 
  emotion, 
  isLatest = false 
}: ChatMessageProps) => {
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (animate && messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [animate]);

  return (
    <motion.div
      ref={messageRef}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} items-start mb-6`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <MessageAvatar isUser={isUser} />
      
      <motion.div
        className={`max-w-3xl p-4 rounded-2xl relative shadow-md ${
          isUser
            ? 'bg-teal-400 text-white rounded-tr-none'
            : 'bg-white text-gray-800 rounded-tl-none border border-teal-100'
        }`}
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2, delay: 0.1 }}
      >
        {!isUser && isLatest && (
          <motion.div 
            className="absolute -top-2 -left-2"
            initial={{ rotate: -20, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </motion.div>
        )}
        
        <div className="relative z-10">
          {isUser ? message : formatMessage(message)}
        </div>
        
        {emotion && <EmotionIndicator emotion={emotion} />}
      </motion.div>
    </motion.div>
  );
};
