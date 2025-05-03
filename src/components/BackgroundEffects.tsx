
import { motion } from 'framer-motion';

export const BackgroundEffects = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 180, 270, 360],
        }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        className="absolute -top-1/2 -left-1/2 w-full h-full opacity-10"
      >
        <div className="w-full h-full bg-gradient-to-br from-teal-400 to-purple-500 rounded-full blur-3xl" />
      </motion.div>
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          rotate: [360, 270, 180, 90, 0],
        }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-1/2 -right-1/2 w-full h-full opacity-10"
      >
        <div className="w-full h-full bg-gradient-to-bl from-yellow-400 to-pink-500 rounded-full blur-3xl" />
      </motion.div>
      <motion.div
        animate={{
          x: [50, -50, 50],
          y: [0, 70, 0],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/3 right-1/4 w-72 h-72 opacity-10"
      >
        <div className="w-full h-full bg-gradient-to-tr from-blue-400 to-green-300 rounded-full blur-3xl" />
      </motion.div>
    </div>
  );
};
