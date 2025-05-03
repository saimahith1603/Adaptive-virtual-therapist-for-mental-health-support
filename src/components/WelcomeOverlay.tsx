
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface WelcomeOverlayProps {
  show: boolean;
}

export const WelcomeOverlay = ({ show }: WelcomeOverlayProps) => {
  const isMobile = useIsMobile();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: show ? 1 : 0 }}
      exit={{ opacity: 0, y: -100 }}
      transition={{ duration: 0.8 }}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-teal-400/20 backdrop-blur-md ${!show && 'pointer-events-none'}`}
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ 
          scale: show ? 1 : 0.8, 
          y: show ? 0 : 20,
          transition: { 
            type: "spring",
            stiffness: 200,
            damping: 20 
          }
        }}
        className="text-center"
      >
        <motion.div
          animate={{ 
            rotate: show ? [0, 10, -10, 0] : 0,
            scale: show ? [1, 1.2, 1] : 1
          }}
          transition={{ duration: 1.5, repeat: 1 }}
          className="text-7xl mb-4"
        >
          👋
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: show ? 1 : 0, y: show ? 0 : 20 }}
          transition={{ delay: 0.5 }}
          className={`${isMobile ? 'text-4xl' : 'text-5xl'} font-bold mb-2 gradient-text`}
        >
          Welcome to TherapyChat
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: show ? 1 : 0 }}
          transition={{ delay: 1 }}
          className="text-gray-600 dark:text-gray-300 text-xl"
        >
          Your AI companion is ready to support you
        </motion.p>
      </motion.div>
    </motion.div>
  );
};
