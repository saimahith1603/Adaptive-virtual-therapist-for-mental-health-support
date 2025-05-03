
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export type Message = {
  id: string;
  text: string;
  isUser: boolean;
  emotion?: string;
};

export const useMessages = (sessionId: string) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', text: "Hi! I'm here to support you. How are you feeling today?", isUser: false }
  ]);

  // Load previous messages for this session
  useEffect(() => {
    if (!sessionId) return;
    
    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          const formattedMessages = data.map(msg => ({
            id: msg.id,
            text: msg.message,
            isUser: msg.is_user,
            emotion: msg.emotion
          }));
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };
    
    loadMessages();
  }, [sessionId]);

  // Set up realtime subscription for new messages
  useEffect(() => {
    if (!sessionId) return;
    
    const channel = supabase
      .channel('chat_updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        const newMessage = payload.new;
        setMessages(prev => [
          ...prev,
          {
            id: newMessage.id,
            text: newMessage.message,
            isUser: newMessage.is_user,
            emotion: newMessage.emotion
          }
        ]);
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  return {
    messages,
    addMessage
  };
};
