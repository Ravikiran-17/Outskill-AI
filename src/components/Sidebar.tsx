import React from "react";
import { Plus, Trash2, Github, HelpCircle, Terminal, RefreshCw } from "lucide-react";
import { useChat } from "../context/ChatContext";
import { ChatHistory } from "./ChatHistory";
import { ThemeToggle } from "./ThemeToggle";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { createNewChat, chats, setTheme, theme, activeChatId, setActiveChatId } = useChat();

  const handleNewChat = () => {
    createNewChat();
    onClose();
  };

  const handleClearAll = () => {
    if (chats.length === 0) return;
    if (confirm("Are you sure you want to clear ALL conversations? This cannot be undone.")) {
      localStorage.removeItem("outskill_ai_chats");
      localStorage.removeItem("outskill_ai_active_chat_id");
      window.location.reload();
    }
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="sidebar"
        className={`fixed top-0 bottom-0 left-0 z-40 flex w-72 flex-col border-r border-[#242729] bg-[#131517] transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header / Branding */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-[#242729]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md">
              <Terminal className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white">
                OutSkill AI
              </span>
              <span className="text-[10px] font-semibold text-[#5c6066] tracking-wider uppercase">
                ChatGPT Clone MVP
              </span>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* New Chat Button */}
        <div className="p-4 border-b border-[#242729]">
          <button
            onClick={handleNewChat}
            className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-[#242729] hover:bg-[#1d1f21] px-4 py-2.5 text-sm font-medium text-white transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <Plus className="h-4.5 w-4.5 stroke-[2.5]" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto">
          <ChatHistory onCloseSidebar={onClose} />
        </div>

        {/* Bottom Actions / Settings */}
        <div className="border-t border-[#242729] p-4 space-y-2 bg-[#131517]">
          {chats.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear all conversations</span>
            </button>
          )}

          <div className="rounded-xl bg-[#1d1f21] p-3 text-[11px] text-[#a0a0a0] space-y-1.5 border border-[#242729]">
            <div className="flex justify-between items-center text-[10px] font-bold text-[#5c6066] uppercase tracking-wider">
              <span>System Settings</span>
              <span className="text-blue-400 lowercase flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                ready
              </span>
            </div>
            <p className="leading-relaxed">
              Provider: <span className="font-mono text-[10px] text-white">OpenAI Compatible</span>
            </p>
            <p className="leading-relaxed">
              Fallback: <span className="font-mono text-[10px] text-white">Gemini-3.5-flash</span>
            </p>
          </div>

          <div className="flex items-center justify-between px-2 pt-2 text-[10px] text-[#5c6066] font-medium">
            <span>OutSkill Cohort MVP v1.0</span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white flex items-center gap-0.5 transition-colors"
            >
              <Github className="h-3 w-3" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </aside>
    </>
  );
};
export default Sidebar;
