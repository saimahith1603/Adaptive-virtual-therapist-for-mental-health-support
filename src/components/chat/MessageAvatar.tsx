
import React from 'react';
import { UserRound, Bot } from 'lucide-react';

interface MessageAvatarProps {
  isUser: boolean;
}

export const MessageAvatar = ({ isUser }: MessageAvatarProps) => (
  <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md ${
    isUser ? 'bg-teal-400' : 'bg-ivory-200'
  }`}>
    {isUser ? (
      <UserRound className="w-6 h-6 text-white" />
    ) : (
      <Bot className="w-6 h-6 text-teal-400" />
    )}
  </div>
);
