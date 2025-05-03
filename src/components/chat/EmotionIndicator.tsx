
import React from 'react';
import { motion } from 'framer-motion';

interface EmotionIndicatorProps {
  emotion: string;
}

export const EmotionIndicator = ({ emotion }: EmotionIndicatorProps) => (
  <motion.div 
    className="text-xs mt-2 opacity-75 font-semibold"
    initial={{ opacity: 0 }}
    animate={{ opacity: 0.75 }}
    transition={{ duration: 0.3, delay: 0.3 }}
  >
    Detected emotion: {emotion}
  </motion.div>
);
