import React, { useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { ChatWindow } from "../components/ChatWindow";
import { MessageInput } from "../components/MessageInput";
import { DocumentManager } from "../components/DocumentManager";
import { Database, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const ChatWorkspace: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(true); // Open by default so users immediately see RAG!

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0d0e] text-[#e0e0e0] font-sans transition-colors duration-200">
      {/* Left Sidebar - Handles both persistent desktop and drawer mobile */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="relative flex flex-grow flex-col overflow-hidden">
        {/* Navbar - Mobile only */}
        <Navbar onOpenSidebar={() => setSidebarOpen(true)} />

        {/* Chat Stream Canvas */}
        <ChatWindow onToggleDocs={() => setRightPanelOpen(!rightPanelOpen)} isDocsOpen={rightPanelOpen} />

        {/* Floating Input Dock */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0b0d0e] via-[#0b0d0e]/95 to-transparent pt-10 pb-6 pointer-events-none z-10">
          <div className="max-w-3xl mx-auto w-full pointer-events-auto">
            <MessageInput />
          </div>
        </div>
      </div>

      {/* Right Drawer Panel - Document Management & RAG Controls */}
      <AnimatePresence mode="wait">
        {rightPanelOpen && (
          <motion.div
            id="right-panel"
            initial={{ x: 384, opacity: 0.9 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 384, opacity: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col border-l border-[#242729] bg-[#111315] lg:static lg:translate-x-0"
          >
            {/* Panel Header */}
            <div className="flex h-14 items-center justify-between border-b border-[#242729] px-6">
              <div className="flex items-center gap-2 text-white">
                <Database className="h-4.5 w-4.5 text-blue-500" />
                <span className="text-xs font-bold tracking-tight">RAG Context Control</span>
              </div>
              <button
                onClick={() => setRightPanelOpen(false)}
                className="rounded-lg p-1.5 text-[#5c6066] hover:text-white transition-colors hover:bg-[#1d1f21] focus:outline-none"
                title="Hide right panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              <DocumentManager />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default ChatWorkspace;
