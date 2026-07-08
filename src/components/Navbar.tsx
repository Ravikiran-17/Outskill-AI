import React from "react";
import { Menu, Plus, Terminal } from "lucide-react";
import { useChat } from "../context/ChatContext";

interface NavbarProps {
  onOpenSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSidebar }) => {
  const { createNewChat } = useChat();

  return (
    <header
      id="navbar"
      className="flex h-16 w-full items-center justify-between border-b border-[#242729] bg-[#0b0d0ebf] px-4 backdrop-blur-md lg:hidden"
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="rounded-lg p-2 text-[#a0a0a0] hover:text-white hover:bg-[#1d1f21] focus:outline-none"
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>
        
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm">
            <Terminal className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold tracking-tight text-white">
            OutSkill AI
          </span>
        </div>
      </div>

      <button
        onClick={() => createNewChat()}
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#131517] border border-[#242729] hover:bg-[#1d1f21] text-white transition-colors focus:outline-none"
        title="New Chat"
      >
        <Plus className="h-4.5 w-4.5 stroke-[2.5]" />
      </button>
    </header>
  );
};
export default Navbar;
