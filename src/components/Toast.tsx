import React, { useEffect } from "react";
import { AlertCircle, X, Info, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ToastProps {
  message: string;
  type?: "error" | "info" | "success";
  onClose: () => void;
  autoCloseDuration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = "error",
  onClose,
  autoCloseDuration = 6000,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, autoCloseDuration);

    return () => clearTimeout(timer);
  }, [onClose, autoCloseDuration]);

  const styles = {
    error: {
      bg: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900",
      text: "text-red-800 dark:text-red-200",
      icon: <AlertCircle className="h-5 w-5 text-red-500" />,
    },
    info: {
      bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900",
      text: "text-blue-800 dark:text-blue-200",
      icon: <Info className="h-5 w-5 text-blue-500" />,
    },
    success: {
      bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900",
      text: "text-emerald-800 dark:text-emerald-200",
      icon: <CheckCircle className="h-5 w-5 text-emerald-500" />,
    },
  };

  const currentStyle = styles[type];

  return (
    <AnimatePresence>
      <motion.div
        id="toast-notification"
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 max-w-sm rounded-xl border p-4 shadow-lg backdrop-blur-md ${currentStyle.bg}`}
      >
        <div className="flex-shrink-0 mt-0.5">{currentStyle.icon}</div>
        <div className="flex-grow">
          <p className={`text-sm font-medium leading-relaxed ${currentStyle.text}`}>
            {message}
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all focus:outline-none"
          aria-label="Dismiss toast"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
export default Toast;
