import React, { useRef, useEffect } from "react";
import { useChat } from "../context/ChatContext";
import { ChatMessage } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";
import { Terminal, RefreshCw, Trash2, ArrowUpRight, MessageSquare, AlertTriangle, Database, Info } from "lucide-react";
import { motion } from "motion/react";

interface ChatWindowProps {
  onToggleDocs: () => void;
  isDocsOpen: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ onToggleDocs, isDocsOpen }) => {
  const {
    activeChat,
    loading,
    error,
    sendMessage,
    regenerateLastResponse,
    clearActiveChatMessages,
    setError,
    documents,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom when messages or loading state changes
  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages?.length, loading]);

  const handleSampleClick = async (promptText: string) => {
    await sendMessage(promptText);
  };

  const samplePrompts = [
    {
      category: "Explain",
      desc: "Explain React 19's useActionState hook inside simple terms",
      prompt: "Can you explain what the new React 19 useActionState hook is, how it works, and write a simple example showing how to use it?",
    },
    {
      category: "Code",
      desc: "Write a secure server-side Express API route to proxy fetch calls",
      prompt: "Write a secure, production-ready Express.js API route that accepts POST requests, proxies them to an external endpoint, handles headers and authorization tokens securely, and logs errors properly.",
    },
    {
      category: "Brainstorm",
      desc: "List 5 unique features to add to an AI chatbot dashboard",
      prompt: "Brainstorm 5 highly-valuable, non-trivial, and visually stunning feature ideas I can add to a ChatGPT clone dashboard to make it outstanding.",
    },
    {
      category: "Debug",
      desc: "Fix a tricky 'Cannot read properties of undefined' error",
      prompt: "How do I fix this JavaScript runtime error: 'TypeError: Cannot read properties of undefined (reading 'map')' when rendering state in React? Show standard debugging steps and safe guards.",
    },
  ];

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto bg-[#0b0d0e] flex flex-col"
    >
      {/* If no chat is active, or active chat has no messages, show Landing Page layout */}
      {!activeChat || activeChat.messages.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 max-w-3xl mx-auto w-full text-center">
          {/* Logo element */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/10"
          >
            <Terminal className="h-8 w-8" />
          </motion.div>

          <motion.h2
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
          >
            How can I help you today?
          </motion.h2>
          
          <motion.p
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mt-3 text-sm text-[#a0a0a0] max-w-md leading-relaxed font-medium"
          >
            OutSkill AI is a robust ChatGPT clone MVP designed to help you write, debug, and explain code beautifully.
          </motion.p>

          {/* Quick suggestions bento grid */}
          <motion.div
            initial={{ y: 25, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-left"
          >
            {samplePrompts.map((item, index) => (
              <button
                key={index}
                onClick={() => handleSampleClick(item.prompt)}
                className="group relative flex flex-col justify-between p-4 rounded-2xl border border-[#242729] bg-[#131517] hover:bg-[#1d1f21] hover:border-[#5c6066] hover:shadow-md transition-all duration-300 text-left cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-blue-400 tracking-wider uppercase mb-1">
                    {item.category}
                  </span>
                  <span className="text-xs text-[#e0e0e0] font-medium leading-relaxed pr-6 line-clamp-2">
                    {item.desc}
                  </span>
                </div>
                <div className="absolute right-3.5 bottom-3.5 text-[#5c6066] group-hover:text-blue-400 transition-colors">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </button>
            ))}
          </motion.div>
        </div>
      ) : (
        /* Conversation layout */
        <div className="flex-1 flex flex-col">
          {/* Header Controls inside Chat */}
          <div className="sticky top-0 z-10 flex flex-col border-b border-[#242729] bg-[#0b0d0ebf] backdrop-blur-md">
            <div className="flex h-14 items-center justify-between px-6">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-400" />
                <h1 className="text-xs font-semibold text-white truncate max-w-xs md:max-w-md">
                  {activeChat.title}
                </h1>
              </div>

              <div className="flex items-center gap-3">
                {/* RAG panel Toggle Button */}
                <button
                  onClick={onToggleDocs}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold border transition-all focus:outline-none ${
                    isDocsOpen
                      ? "bg-blue-600/10 border-blue-500/30 text-blue-400 hover:bg-blue-600/20"
                      : "bg-[#131517] border-[#242729] text-[#a0a0a0] hover:text-white hover:border-[#5c6066]"
                  }`}
                  title="Toggle Knowledge Base (RAG)"
                >
                  <Database className="h-3.5 w-3.5" />
                  <span>Knowledge Base</span>
                </button>

                <button
                  onClick={clearActiveChatMessages}
                  className="flex items-center gap-1.5 rounded-lg border border-[#242729] bg-[#131517] hover:bg-[#1d1f21] px-2.5 py-1.5 text-xs font-medium text-[#a0a0a0] hover:text-red-400 transition-all focus:outline-none"
                  title="Clear current conversation"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Clear Chat</span>
                </button>
              </div>
            </div>

            {/* Active Documents Bar */}
            {activeChat.documentIds && activeChat.documentIds.length > 0 && (
              <div className="flex items-center gap-2 px-6 py-2 border-t border-[#242729]/50 bg-blue-950/5 text-[10px] font-medium text-blue-400">
                <Database className="h-3.5 w-3.5 animate-pulse shrink-0" />
                <span className="font-semibold text-[9px] uppercase tracking-wider text-blue-500 mr-1 shrink-0">RAG Sources Active:</span>
                <div className="flex flex-wrap gap-1.5 overflow-hidden">
                  {documents
                    .filter(d => activeChat.documentIds?.includes(d.id))
                    .map(d => (
                      <span key={d.id} className="rounded bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 text-blue-300 font-medium truncate max-w-[120px] sm:max-w-[200px]">
                        {d.name}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Message Stream */}
          <div className="flex-1 divide-y divide-[#242729] pb-36">
            {activeChat.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {/* Loading / Typing States */}
            {loading && (
              <div className="flex items-start gap-4 py-6 px-4 md:px-6 bg-[#131517]/30 border-y border-[#242729]">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-blue-600 text-white font-semibold shadow-sm">
                  <Terminal className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col items-start flex-grow max-w-2xl md:max-w-3xl">
                  <TypingIndicator />
                </div>
              </div>
            )}

            {/* Error Indicators inside Chat Stream */}
            {error && (
              <div className="m-4 md:mx-6 p-4 rounded-2xl border border-red-900 bg-red-950/20 text-red-200 text-sm flex items-start gap-3 shadow-sm max-w-3xl">
                <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                <div className="flex-grow">
                  <p className="font-semibold text-xs uppercase tracking-wider mb-0.5 text-red-400">API Request Failed</p>
                  <p className="text-xs leading-relaxed text-red-300">{error}</p>
                  {error.includes("API Key Required") && (
                    <p className="text-[11px] text-[#a0a0a0] mt-2">
                      Please define the <code className="font-mono bg-[#1d1f21] px-1 py-0.5 rounded text-white text-[10px]">OPENAI_API_KEY</code> environment variable in your Secrets tab or .env file to enable responses.
                    </p>
                  )}
                  <button
                    onClick={regenerateLastResponse}
                    className="mt-3 flex items-center gap-1.5 rounded bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-1.5 text-xs transition shadow-sm focus:outline-none"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Retry Request</span>
                  </button>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-300 rounded p-1"
                >
                  &times;
                </button>
              </div>
            )}

            {/* Regenerate Trigger for last Assistant message */}
            {!loading && !error && activeChat.messages.length > 0 && (
              <div className="flex justify-center py-4 bg-transparent">
                <button
                  onClick={regenerateLastResponse}
                  className="flex items-center gap-1.5 rounded-lg border border-[#242729] bg-[#131517] text-xs font-semibold px-4 py-2 hover:bg-[#1d1f21] hover:border-[#5c6066] transition-all text-[#a0a0a0] focus:outline-none shadow-sm hover:shadow"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Regenerate Response</span>
                </button>
              </div>
            )}

            {/* Invisible tag for scrolling anchor */}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
    </div>
  );
};
export default ChatWindow;
