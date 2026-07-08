import React, { useState, useRef, useEffect } from "react";
import { Send, Square, ArrowUp, CornerDownLeft, Paperclip, Loader } from "lucide-react";
import { useChat } from "../context/ChatContext";

export const MessageInput: React.FC = () => {
  const { sendMessage, loading, abortGeneration, uploadDocument, uploadingDoc, setError } = useChat();
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto resize the textarea as user types
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height
    textarea.style.height = "auto";
    // Set height based on scrollHeight
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, [input]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const messageToSend = input.trim();
    setInput("");
    
    // Focus back on textarea and reset its height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }

    await sendMessage(messageToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // If Enter (without Shift) is pressed, submit the form
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const ALLOWED_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/markdown"
  ];
  const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate Type
      const isAllowedType = ALLOWED_TYPES.includes(file.type) || 
                            file.name.endsWith(".pdf") || 
                            file.name.endsWith(".docx") || 
                            file.name.endsWith(".txt") || 
                            file.name.endsWith(".md");
      if (!isAllowedType) {
        setError("Unsupported format. Please select a PDF, DOCX, TXT, or MD file.");
        return;
      }

      // Validate Size
      if (file.size > MAX_FILE_SIZE) {
        setError("File size exceeds 15MB limit.");
        return;
      }

      setError(null);
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const result = event.target?.result as string;
          const base64Content = result.substring(result.indexOf(",") + 1);
          await uploadDocument(file.name, file.size, file.type || "text/plain", base64Content);
        } catch (err: any) {
          console.error("Failed to upload via input bar:", err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-3xl mx-auto w-full relative">
      <form
        id="message-input-form"
        onSubmit={handleSubmit}
        className="bg-[#131517] border border-[#242729] rounded-2xl shadow-xl p-3 flex flex-col gap-2 transition-all focus-within:border-[#5c6066] focus-within:ring-1 focus-within:ring-[#242729]"
      >
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.txt,.md"
          onChange={handleFileChange}
          disabled={uploadingDoc}
        />

        {/* Input Text Area */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message OutSkill AI..."
          disabled={loading && !input}
          className="w-full resize-none bg-transparent border-none focus:ring-0 text-sm px-2 placeholder-[#5c6066] text-white outline-none max-h-44 min-h-[36px] scrollbar-thin overflow-y-auto leading-relaxed"
        />

        {/* Action Controls Row */}
        <div className="flex items-center justify-between px-2 pt-1">
          {/* File Upload Attachment & Key Hints */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={triggerFileInput}
              disabled={uploadingDoc}
              className={`flex h-8 w-8 items-center justify-center rounded-xl border border-[#242729] bg-[#1d1f21] transition-all focus:outline-none ${
                uploadingDoc 
                  ? "text-blue-400 cursor-not-allowed" 
                  : "text-[#a0a0a0] hover:text-white hover:border-[#5c6066] cursor-pointer"
              }`}
              title="Upload document for RAG query"
            >
              {uploadingDoc ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Paperclip className="h-4 w-4" />
              )}
            </button>

            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-[#5c6066] font-medium select-none">
              <span>Press</span>
              <kbd className="rounded bg-[#1d1f21] px-1 border border-[#242729] font-mono text-[9px] text-[#a0a0a0]">Enter</kbd>
              <span>to send</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            {loading ? (
              <button
                type="button"
                onClick={abortGeneration}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-md transition-all focus:outline-none"
                title="Stop generation"
              >
                <Square className="h-3 w-3 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all focus:outline-none ${
                  input.trim()
                    ? "bg-white hover:bg-[#e0e0e0] text-black shadow-md hover:scale-105 cursor-pointer"
                    : "bg-[#1d1f21] text-[#5c6066] cursor-not-allowed"
                }`}
                title="Send message"
              >
                <ArrowUp className="h-4 w-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </form>
      
      {/* Footer warning */}
      <div className="mt-2.5 text-center">
        <p className="text-[10px] text-[#5c6066] font-medium tracking-wide">
          OutSkill AI can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
};
export default MessageInput;
