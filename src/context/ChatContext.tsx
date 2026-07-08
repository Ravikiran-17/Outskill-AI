import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import axios from "axios";
import { Chat, Message, Theme, ChatContextType, DocumentMetadata } from "../types";

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};


export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chats, setChats] = useState<Chat[]>(() => {
    const saved = localStorage.getItem("outskill_ai_chats");
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeChatId, setActiveChatId] = useState<string | null>(() => {
    return localStorage.getItem("outskill_ai_active_chat_id");
  });

  const [loading, setLoading] = useState(false);
  
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem("outskill_ai_theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  const [error, setError] = useState<string | null>(null);

  // RAG states
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  
  // Abort controller to allow stopping generation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync chats to localStorage
  useEffect(() => {
    localStorage.setItem("outskill_ai_chats", JSON.stringify(chats));
  }, [chats]);

  // Sync activeChatId to localStorage
  useEffect(() => {
    if (activeChatId) {
      localStorage.setItem("outskill_ai_active_chat_id", activeChatId);
    } else {
      localStorage.removeItem("outskill_ai_active_chat_id");
    }
  }, [activeChatId]);

  // Sync theme class to document element
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("outskill_ai_theme", theme);
  }, [theme]);

  // Load documents on startup
  const fetchDocuments = async () => {
    try {
      const response = await axios.get("/api/documents");
      setDocuments(response.data.documents || []);
    } catch (err: any) {
      console.error("Failed to load documents:", err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const uploadDocument = async (name: string, size: number, type: string, base64: string) => {
    setUploadingDoc(true);
    setError(null);
    try {
      const response = await axios.post("/api/documents/upload", {
        name,
        size,
        type,
        base64,
      });
      if (response.data.success) {
        await fetchDocuments();
        // Automatically link the newly uploaded document to the active chat
        const newDoc = response.data.document;
        if (activeChatId && newDoc) {
          toggleDocumentForActiveChat(newDoc.id);
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || "Failed to upload document.";
      setError(msg);
      throw err;
    } finally {
      setUploadingDoc(false);
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      await axios.delete(`/api/documents/${id}`);
      // Remove from frontend document list
      setDocuments(prev => prev.filter(d => d.id !== id));
      // Remove document from all chats that were referencing it
      setChats(prev => prev.map(c => {
        if (c.documentIds?.includes(id)) {
          return {
            ...c,
            documentIds: c.documentIds.filter(docId => docId !== id),
          };
        }
        return c;
      }));
    } catch (err: any) {
      console.error("Failed to delete document:", err);
      const msg = err.response?.data?.error || err.message || "Failed to delete document.";
      setError(msg);
    }
  };

  const toggleDocumentForActiveChat = (id: string) => {
    if (!activeChatId) return;
    setChats(prev => prev.map(c => {
      if (c.id === activeChatId) {
        const docIds = c.documentIds || [];
        const exists = docIds.includes(id);
        const nextDocIds = exists ? docIds.filter(d => d !== id) : [...docIds, id];
        return { ...c, documentIds: nextDocIds };
      }
      return c;
    }));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const activeChat = chats.find(c => c.id === activeChatId) || null;

  const createNewChat = (initialMessage?: string): string => {
    const newId = `chat_${Date.now()}`;
    const defaultTitle = initialMessage 
      ? (initialMessage.length > 25 ? initialMessage.substring(0, 25) + "..." : initialMessage)
      : "New Chat";
    
    const newChat: Chat = {
      id: newId,
      title: defaultTitle,
      messages: [],
      createdAt: Date.now(),
      documentIds: [],
    };

    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newId);
    setError(null);
    return newId;
  };

  const deleteChat = (id: string) => {
    setChats(prev => prev.filter(c => c.id !== id));
    if (activeChatId === id) {
      const remaining = chats.filter(c => c.id !== id);
      if (remaining.length > 0) {
        setActiveChatId(remaining[0].id);
      } else {
        setActiveChatId(null);
      }
    }
  };

  const renameChat = (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setChats(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, title: newTitle.trim() };
      }
      return c;
    }));
  };

  const abortGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
      setError("Generation stopped by user.");
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    let currentChatId = activeChatId;
    
    // Create new chat if none is active
    if (!currentChatId) {
      currentChatId = createNewChat(content);
    }

    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content,
      timestamp: Date.now(),
    };

    // Update active chat with user's message
    let updatedChats: Chat[] = [];
    setChats(prev => {
      updatedChats = prev.map(c => {
        if (c.id === currentChatId) {
          const messages = [...c.messages, userMessage];
          // Auto rename if the title is still "New Chat" or similar placeholder
          let title = c.title;
          if (title === "New Chat" || title.startsWith("New Chat")) {
            title = content.length > 30 ? content.substring(0, 30) + "..." : content;
          }
          return { ...c, messages, title };
        }
        return c;
      });
      return updatedChats;
    });

    setLoading(true);
    setError(null);

    // Get current message history for the active chat
    const activeChatRef = updatedChats.find(c => c.id === currentChatId);
    if (!activeChatRef) {
      setLoading(false);
      return;
    }

    abortControllerRef.current = new AbortController();

    try {
      // Build simplified message payload
      const payloadMessages = activeChatRef.messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await axios.post(
        "/api/chat",
        {
          messages: payloadMessages,
          documentIds: activeChatRef.documentIds || [],
        },
        { signal: abortControllerRef.current.signal }
      );

      const assistantMessage: Message = {
        id: `msg_${Date.now()}_assistant`,
        role: "assistant",
        content: response.data.content,
        timestamp: Date.now(),
        citations: response.data.citations,
      };

      setChats(prev => prev.map(c => {
        if (c.id === currentChatId) {
          return {
            ...c,
            messages: [...c.messages, assistantMessage],
          };
        }
        return c;
      }));
    } catch (err: any) {
      if (axios.isCancel(err)) {
        console.log("Request cancelled");
        return;
      }
      
      const errMsg = err.response?.data?.error || err.message || "An unexpected error occurred.";
      setError(errMsg);

      // Append an error indicator inside the chat or keep the error separate
      console.error("Failed to fetch response:", errMsg);
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const regenerateLastResponse = async () => {
    if (!activeChatId || !activeChat || activeChat.messages.length === 0) return;

    // Find the last user message and slice the messages list up to it
    const lastUserIdx = [...activeChat.messages].reverse().findIndex(m => m.role === "user");
    if (lastUserIdx === -1) return;

    const actualIdx = activeChat.messages.length - 1 - lastUserIdx;
    const previousMessages = activeChat.messages.slice(0, actualIdx + 1);

    // Truncate existing assistant messages beyond the last user message
    setChats(prev => prev.map(c => {
      if (c.id === activeChatId) {
        return { ...c, messages: previousMessages };
      }
      return c;
    }));

    setLoading(true);
    setError(null);

    abortControllerRef.current = new AbortController();

    try {
      const payloadMessages = previousMessages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await axios.post(
        "/api/chat",
        {
          messages: payloadMessages,
          documentIds: activeChat.documentIds || [],
        },
        { signal: abortControllerRef.current.signal }
      );

      const assistantMessage: Message = {
        id: `msg_${Date.now()}_assistant`,
        role: "assistant",
        content: response.data.content,
        timestamp: Date.now(),
        citations: response.data.citations,
      };

      setChats(prev => prev.map(c => {
        if (c.id === activeChatId) {
          return {
            ...c,
            messages: [...c.messages, assistantMessage],
          };
        }
        return c;
      }));
    } catch (err: any) {
      if (axios.isCancel(err)) {
        console.log("Request cancelled");
        return;
      }
      const errMsg = err.response?.data?.error || err.message || "An unexpected error occurred.";
      setError(errMsg);
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const clearActiveChatMessages = () => {
    if (!activeChatId) return;
    setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: [] } : c));
    setError(null);
  };

  const exportChatMarkdown = (id: string) => {
    const target = chats.find(c => c.id === id);
    if (!target) return;

    let markdown = `# ${target.title}\n\n`;
    markdown += `*Exported from OutSkill AI on ${new Date().toLocaleDateString()}*\n\n---\n\n`;

    target.messages.forEach(msg => {
      const roleName = msg.role === "user" ? "User" : "OutSkill AI";
      markdown += `### **${roleName}** *(${new Date(msg.timestamp).toLocaleTimeString()})*\n\n`;
      markdown += `${msg.content}\n\n`;
      if (msg.citations && msg.citations.length > 0) {
        markdown += `#### **Sources & Citations:**\n`;
        msg.citations.forEach((cit, idx) => {
          markdown += `> **[${idx + 1}] Document: ${cit.documentName} (Part ${cit.chunkIndex + 1})**\n`;
          markdown += `> ${cit.text.replace(/\n/g, "\n> ")}\n\n`;
        });
      }
      markdown += `---\n\n`;
    });

    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${target.title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_chat.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChatId,
        loading,
        theme,
        error,
        activeChat,
        createNewChat,
        deleteChat,
        renameChat,
        sendMessage,
        regenerateLastResponse,
        clearActiveChatMessages,
        setTheme,
        setActiveChatId,
        setError,
        exportChatMarkdown,
        abortGeneration,
        
        // RAG states and functions
        documents,
        uploadingDoc,
        fetchDocuments,
        uploadDocument,
        deleteDocument,
        toggleDocumentForActiveChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
