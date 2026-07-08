import React, { useState } from "react";
import { Copy, Check, Terminal, User, Database } from "lucide-react";
import { Message } from "../types";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const [showCitations, setShowCitations] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy message: ", err);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      id={`message-${message.id}`}
      className="group w-full py-8 px-4 md:px-6 border-b border-[#242729]/40 bg-transparent transition-colors duration-200"
    >
      <div className="max-w-3xl mx-auto flex gap-5 items-start w-full">
        {/* Avatar Container */}
        <div
          className={`w-8 h-8 rounded flex-shrink-0 flex items-center justify-center text-white font-semibold text-xs ${
            isUser ? "bg-[#242729]" : "bg-blue-600"
          }`}
        >
          {isUser ? <User className="h-4 w-4 text-[#a0a0a0]" /> : <Terminal className="h-4 w-4 text-white" />}
        </div>

        {/* Message Content Area */}
        <div className="flex-grow flex flex-col min-w-0 space-y-1">
          {/* Author & Meta bar */}
          <div className="flex items-center gap-2 text-xs text-[#5c6066] mb-1">
            <span className="font-semibold text-[#a0a0a0]">
              {isUser ? "You" : "OutSkill AI"}
            </span>
            <span>•</span>
            <span>{formatTime(message.timestamp)}</span>
          </div>

          {/* Text / Markdown container */}
          <div className="w-full text-sm leading-relaxed text-[#f0f0f0] break-words">
            {isUser ? (
              <div className="whitespace-pre-wrap">{message.content}</div>
            ) : (
              <div className="overflow-x-auto">
                <MarkdownRenderer content={message.content} />
              </div>
            )}
          </div>

          {/* Citations & Sources */}
          {!isUser && message.citations && message.citations.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[#242729]/40 space-y-2">
              <button
                onClick={() => setShowCitations(!showCitations)}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors focus:outline-none"
              >
                <Database className="h-3.5 w-3.5" />
                <span>{showCitations ? "Hide retrieved sources" : `Show retrieved sources (${message.citations.length})`}</span>
              </button>

              {showCitations && (
                <div className="grid grid-cols-1 gap-2.5 pt-1">
                  {message.citations.map((citation, idx) => (
                    <div key={idx} className="rounded-xl border border-[#242729] bg-[#131517]/50 p-3 text-xs space-y-1.5 shadow-sm">
                      <div className="flex justify-between items-center text-[10px] font-bold text-blue-500 uppercase tracking-wider">
                        <span className="truncate max-w-[200px]">{citation.documentName}</span>
                        <span>Part {citation.chunkIndex + 1}</span>
                      </div>
                      <p className="text-[#a0a0a0] leading-relaxed font-mono text-[11px] whitespace-pre-wrap italic">
                        "{citation.text}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick action triggers */}
          <div className="pt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded px-2 py-1 text-[11px] text-[#808080] hover:text-white hover:bg-[#242729] transition-all focus:outline-none"
              title="Copy message"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ChatMessage;
