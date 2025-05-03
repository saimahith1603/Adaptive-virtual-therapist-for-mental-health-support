
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export const useSession = () => {
  const [sessionId, setSessionId] = useState<string>('');

  // Initialize session
  useEffect(() => {
    // Check for existing session in local storage
    const existingSessionId = localStorage.getItem('chat_session_id');
    
    if (existingSessionId) {
      setSessionId(existingSessionId);
    } else {
      // Create new session
      const newSessionId = uuidv4();
      setSessionId(newSessionId);
      localStorage.setItem('chat_session_id', newSessionId);
      
      // Save session to database
      const createSession = async () => {
        try {
          await supabase
            .from('user_sessions')
            .insert([{ session_id: newSessionId }]);
        } catch (error) {
          console.error('Error creating session:', error);
        }
      };
      
      createSession();
    }
  }, []);

  return { sessionId };
};
