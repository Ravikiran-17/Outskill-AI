import React from "react";
import { motion } from "motion/react";

export const TypingIndicator: React.FC = () => {
  const dotVariants = {
    initial: {
      y: 0,
    },
    animate: {
      y: [0, -6, 0],
    },
  };

  const dotTransition = (delay: number) => ({
    duration: 0.8,
    repeat: Infinity,
    ease: "easeInOut" as any,
    delay,
  });

  return (
    <div id="typing-indicator" className="flex items-center space-x-1.5 py-2 w-fit max-w-full">
      <span className="text-xs text-[#a0a0a0] mr-1 font-medium">Thinking</span>
      <div className="flex space-x-1 items-center">
        <motion.div
          variants={dotVariants}
          initial="initial"
          animate="animate"
          transition={dotTransition(0)}
          className="h-1.5 w-1.5 rounded-full bg-[#5c6066]"
        />
        <motion.div
          variants={dotVariants}
          initial="initial"
          animate="animate"
          transition={dotTransition(0.15)}
          className="h-1.5 w-1.5 rounded-full bg-[#5c6066]/80"
        />
        <motion.div
          variants={dotVariants}
          initial="initial"
          animate="animate"
          transition={dotTransition(0.3)}
          className="h-1.5 w-1.5 rounded-full bg-[#5c6066]/50"
        />
      </div>
    </div>
  );
};
export default TypingIndicator;
