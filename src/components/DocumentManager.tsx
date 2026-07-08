import React, { useState, useRef } from "react";
import { useChat } from "../context/ChatContext";
import { 
  FileText, UploadCloud, CheckCircle, Trash2, Loader, 
  ToggleLeft, ToggleRight, Database, HelpCircle, X, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const DocumentManager: React.FC = () => {
  const {
    documents,
    uploadingDoc,
    uploadDocument,
    deleteDocument,
    toggleDocumentForActiveChat,
    activeChat,
    setError
  } = useChat();

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeDocIds = activeChat?.documentIds || [];

  // Allowed file extensions/MIME types
  const ALLOWED_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
    "text/plain",
    "text/markdown"
  ];
  const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

  const validateFile = (file: File): boolean => {
    // Check type
    const isAllowedType = ALLOWED_TYPES.includes(file.type) || 
                          file.name.endsWith(".pdf") || 
                          file.name.endsWith(".docx") || 
                          file.name.endsWith(".txt") || 
                          file.name.endsWith(".md");
    if (!isAllowedType) {
      setError("Unsupported file format. Supported file types: PDF, DOCX, TXT, MD.");
      return false;
    }

    // Check size
    if (file.size > MAX_FILE_SIZE) {
      setError("File exceeds maximum size limit of 15MB.");
      return false;
    }

    return true;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processUpload = async (file: File) => {
    if (!validateFile(file)) return;
    
    setSelectedFile(file);
    setError(null);
    setUploadProgress(10);
    setUploadStep("Reading document binary...");

    // Read file as Base64
    const reader = new FileReader();
    reader.onloadstart = () => {
      setUploadProgress(25);
    };
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 40) + 25;
        setUploadProgress(percent);
      }
    };
    reader.onload = async (e) => {
      try {
        setUploadProgress(65);
        setUploadStep("Extracting text contents...");
        
        const result = e.target?.result as string;
        // Strip data: url prefix to get raw base64 string
        const base64Content = result.substring(result.indexOf(",") + 1);

        setUploadProgress(80);
        setUploadStep("Chunking & generating embeddings...");

        await uploadDocument(file.name, file.size, file.type || "text/plain", base64Content);

        setUploadProgress(100);
        setUploadStep("Ingestion completed successfully!");
        
        // Reset state after success animation
        setTimeout(() => {
          setSelectedFile(null);
          setUploadProgress(0);
          setUploadStep("");
        }, 2000);
      } catch (err: any) {
        setSelectedFile(null);
        setUploadProgress(0);
        setUploadStep("");
        setError(err.response?.data?.error || err.message || "Failed to ingest document.");
      }
    };
    reader.onerror = () => {
      setSelectedFile(null);
      setUploadProgress(0);
      setUploadStep("");
      setError("Failed to read file.");
    };

    reader.readAsDataURL(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processUpload(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div id="document-manager" className="space-y-5">
      {/* Active Chat Warning if no chat is active */}
      {!activeChat && (
        <div className="flex items-start gap-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3.5 text-xs text-amber-200">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-amber-400" />
          <p className="leading-relaxed">
            Please start or select a chat first to link uploaded documents and query them!
          </p>
        </div>
      )}

      {/* Upload Drag & Drop Box */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-300 cursor-pointer ${
          dragActive 
            ? "border-blue-500 bg-blue-500/5 shadow-inner" 
            : "border-[#242729] bg-[#131517] hover:border-[#5c6066] hover:bg-[#1d1f21]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.txt,.md"
          onChange={handleFileInputChange}
          disabled={uploadingDoc}
        />

        <AnimatePresence mode="wait">
          {selectedFile ? (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="flex flex-col items-center w-full space-y-3.5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400 animate-pulse">
                <Loader className="h-6 w-6 animate-spin stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-white truncate max-w-xs">{selectedFile.name}</p>
                <p className="text-[10px] text-[#5c6066] font-medium">{formatBytes(selectedFile.size)}</p>
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-xs bg-zinc-850 h-2.5 rounded-full overflow-hidden border border-[#242729]">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-[#a0a0a0] font-medium animate-pulse">{uploadStep}</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="flex flex-col items-center space-y-3"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1d1f21] text-[#a0a0a0] border border-[#242729]">
                <UploadCloud className="h-5.5 w-5.5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-white">Drag & drop document</p>
                <p className="text-[10px] font-semibold text-[#5c6066]">PDF, DOCX, TXT, MD up to 15MB</p>
              </div>
              <button
                type="button"
                className="rounded-lg bg-blue-600 hover:bg-blue-700 font-bold text-[11px] text-white px-3.5 py-1.5 shadow-md shadow-blue-500/10 transition"
              >
                Choose File
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Uploaded Documents List */}
      <div className="space-y-3.5">
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] font-extrabold text-[#5c6066] uppercase tracking-wider flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5" />
            <span>Uploaded Knowledge ({documents.length})</span>
          </span>
          <span className="text-[9px] font-semibold text-[#5c6066] flex items-center gap-1">
            <HelpCircle className="h-3 w-3" />
            RAG Active
          </span>
        </div>

        <AnimatePresence>
          {documents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-dashed border-[#242729] p-6 text-center"
            >
              <FileText className="h-8 w-8 text-[#5c6066] mx-auto mb-2 opacity-50" />
              <p className="text-xs text-[#a0a0a0] font-medium">No documents uploaded yet</p>
              <p className="text-[10px] text-[#5c6066] mt-0.5 leading-relaxed">
                Ingest files above to query them instantly inside your conversations.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => {
                const isActive = activeDocIds.includes(doc.id);
                return (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                      isActive 
                        ? "border-blue-500/40 bg-blue-500/5 shadow-md" 
                        : "border-[#242729] bg-[#131517] hover:border-[#383c3e] hover:bg-[#1d1f21]"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                        isActive 
                          ? "bg-blue-600/10 border-blue-500/20 text-blue-400" 
                          : "bg-[#1d1f21] border-[#242729] text-[#a0a0a0]"
                      }`}>
                        <FileText className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0 flex-grow space-y-0.5">
                        <p className="text-xs font-semibold text-[#e0e0e0] truncate leading-tight" title={doc.name}>
                          {doc.name}
                        </p>
                        <div className="flex items-center gap-1.5 text-[9px] text-[#5c6066] font-bold">
                          <span>{formatBytes(doc.size)}</span>
                          <span>•</span>
                          <span>{doc.chunkCount} parts</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Toggle Activation in current active chat */}
                      {activeChat ? (
                        <button
                          onClick={() => toggleDocumentForActiveChat(doc.id)}
                          className="p-1.5 text-[#5c6066] hover:text-[#e0e0e0] transition-colors focus:outline-none"
                          title={isActive ? "Deactivate for current chat" : "Activate for current chat"}
                        >
                          {isActive ? (
                            <ToggleRight className="h-6 w-6 text-blue-500" />
                          ) : (
                            <ToggleLeft className="h-6 w-6" />
                          )}
                        </button>
                      ) : (
                        <div className="w-6 h-6" /> // spacer
                      )}

                      {/* Delete Button */}
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="p-1.5 text-[#5c6066] hover:text-red-400 transition-colors focus:outline-none rounded-lg hover:bg-red-500/10"
                        title="Delete document permanently"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
export default DocumentManager;
