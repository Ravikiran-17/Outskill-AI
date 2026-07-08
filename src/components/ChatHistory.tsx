import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Trash2, Edit3, Check, X, Download } from "lucide-react";
import { useChat } from "../context/ChatContext";
import { Chat } from "../types";

interface ChatHistoryProps {
  onCloseSidebar?: () => void;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({ onCloseSidebar }) => {
  const { chats, activeChatId, setActiveChatId, deleteChat, renameChat, exportChatMarkdown } = useChat();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleStartEdit = (chat: Chat, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(chat.id);
    setEditTitle(chat.title);
  };

  const handleSaveEdit = (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (editTitle.trim()) {
      renameChat(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this conversation?")) {
      deleteChat(id);
    }
  };

  const handleExport = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    exportChatMarkdown(id);
  };

  const handleChatSelect = (id: string) => {
    setActiveChatId(id);
    if (onCloseSidebar) {
      onCloseSidebar();
    }
  };

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 px-4 text-center">
        <MessageSquare className="h-8 w-8 text-[#5c6066] mb-2 stroke-[1.5]" />
        <p className="text-xs text-[#a0a0a0] font-medium">
          No chat history yet.
        </p>
        <p className="text-[11px] text-[#5c6066] mt-1">
          Your conversations will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 px-2 py-3 overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-zinc-800">
      <div className="px-2 text-[11px] font-semibold uppercase tracking-wider text-[#5c6066] mb-2">
        Recent History
      </div>
      {chats.map((chat) => {
        const isActive = chat.id === activeChatId;
        const isEditing = chat.id === editingId;

        return (
          <div
            key={chat.id}
            onClick={() => !isEditing && handleChatSelect(chat.id)}
            className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm cursor-pointer transition-all duration-200 ${
              isActive
                ? "bg-[#242729] text-white font-medium"
                : "text-[#a0a0a0] hover:text-white hover:bg-[#1d1f21]"
            }`}
          >
            <MessageSquare className={`h-4 w-4 shrink-0 ${isActive ? "text-blue-400" : "text-[#5c6066] group-hover:text-white"}`} />

            {isEditing ? (
              <form
                onSubmit={(e) => handleSaveEdit(chat.id, e)}
                className="flex items-center gap-1.5 flex-grow"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full text-xs px-1.5 py-0.5 rounded border border-[#242729] bg-[#131517] text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={(e) => handleSaveEdit(chat.id, e)}
                  className="p-0.5 rounded text-emerald-500 hover:bg-[#242729]"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="p-0.5 rounded text-red-400 hover:bg-[#242729]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </form>
            ) : (
              <span className="truncate flex-grow pr-12 text-xs font-medium">
                {chat.title}
              </span>
            )}

            {/* Hover Actions */}
            {!isEditing && (
              <div className="absolute right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity duration-150 bg-gradient-to-l from-[#1d1f21] via-[#1d1f21] to-transparent group-hover:from-[#1d1f21] group-hover:via-[#1d1f21] pl-4 py-0.5 rounded-r-lg">
                <button
                  onClick={(e) => handleStartEdit(chat, e)}
                  className="p-1 rounded text-[#a0a0a0] hover:text-white hover:bg-[#242729]"
                  title="Rename Chat"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => handleExport(chat.id, e)}
                  className="p-1 rounded text-[#a0a0a0] hover:text-white hover:bg-[#242729]"
                  title="Export to Markdown"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => handleDelete(chat.id, e)}
                  className="p-1 rounded text-[#a0a0a0] hover:text-red-400 hover:bg-[#242729]"
                  title="Delete Chat"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
export default ChatHistory;
