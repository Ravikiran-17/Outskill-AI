import React from "react";
import { Sun, Moon } from "lucide-react";
import { useChat } from "../context/ChatContext";
import { motion } from "motion/react";

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useChat();

  return (
    <button
      id="theme-toggle"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="w-10 h-10 flex items-center justify-center relative rounded-lg bg-[#1a1c1e] border border-[#242729] hover:bg-[#242729] text-[#a0a0a0] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      aria-label="Toggle Theme"
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === "dark" ? 180 : 0, scale: theme === "dark" ? 0 : 1, opacity: theme === "dark" ? 0 : 1 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="absolute flex items-center justify-center"
      >
        <Sun className="h-5 w-5 text-amber-500" />
      </motion.div>
      <motion.div
        initial={false}
        animate={{ rotate: theme === "light" ? -180 : 0, scale: theme === "light" ? 0 : 1, opacity: theme === "light" ? 0 : 1 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="absolute flex items-center justify-center"
      >
        <Moon className="h-5 w-5 text-indigo-400" />
      </motion.div>
    </button>
  );
};
export default ThemeToggle;
