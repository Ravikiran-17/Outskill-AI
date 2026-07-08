export interface Citation {
  documentName: string;
  text: string;
  chunkIndex: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  citations?: Citation[];
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  documentIds?: string[]; // Attached documents for RAG in this specific chat
}

export type Theme = "light" | "dark";

export interface DocumentMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: number;
  chunkCount: number;
}

export interface ChatContextType {
  chats: Chat[];
  activeChatId: string | null;
  loading: boolean;
  theme: Theme;
  error: string | null;
  activeChat: Chat | null;
  createNewChat: (initialMessage?: string) => string;
  deleteChat: (id: string) => void;
  renameChat: (id: string, newTitle: string) => void;
  sendMessage: (content: string) => Promise<void>;
  regenerateLastResponse: () => Promise<void>;
  clearActiveChatMessages: () => void;
  setTheme: (theme: Theme) => void;
  setActiveChatId: (id: string | null) => void;
  setError: (error: string | null) => void;
  exportChatMarkdown: (id: string) => void;
  abortGeneration: () => void;
  
  // Document RAG States & Functions
  documents: DocumentMetadata[];
  uploadingDoc: boolean;
  fetchDocuments: () => Promise<void>;
  uploadDocument: (name: string, size: number, type: string, base64: string) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  toggleDocumentForActiveChat: (id: string) => void;
}
