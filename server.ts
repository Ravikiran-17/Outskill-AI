import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import {
  extractTextFromDocument,
  splitTextIntoChunks,
  saveDocument,
  getAllDocuments,
  deleteDocument,
  queryDocuments,
} from "./ragService";

dotenv.config();

// Create the server
async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Increase payload limit for base64 uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Simple health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: process.env.NODE_ENV });
  });

  // Get all documents
  app.get("/api/documents", (req, res) => {
    try {
      const docs = getAllDocuments();
      res.json({ documents: docs });
    } catch (error: any) {
      res.status(500).json({ error: `Failed to retrieve documents: ${error.message}` });
    }
  });

  // Upload document
  app.post("/api/documents/upload", async (req, res) => {
    const { name, size, type, base64 } = req.body;

    if (!name || !size || !type || !base64) {
      return res.status(400).json({ error: "Missing required fields (name, size, type, base64)" });
    }

    try {
      console.log(`Received upload for document: ${name} (${size} bytes, type: ${type})`);
      const text = await extractTextFromDocument(base64, type);
      
      if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: "The uploaded document is empty or text could not be extracted." });
      }

      const chunks = splitTextIntoChunks(text);
      if (chunks.length === 0) {
        return res.status(400).json({ error: "Document is too short or has no extractable paragraphs." });
      }

      const documentId = `doc_${Date.now()}`;
      const metadata = {
        id: documentId,
        name,
        size,
        type,
        uploadedAt: Date.now(),
        chunkCount: chunks.length,
      };

      await saveDocument(metadata, chunks);
      console.log(`Successfully parsed, chunked, and saved document: ${name} with ID: ${documentId} (${chunks.length} chunks)`);

      res.status(201).json({
        success: true,
        document: metadata,
      });
    } catch (error: any) {
      console.error("Document upload/parsing error:", error);
      res.status(500).json({ error: `Document ingestion failed: ${error.message}` });
    }
  });

  // Delete document
  app.delete("/api/documents/:id", (req, res) => {
    const { id } = req.params;
    try {
      deleteDocument(id);
      res.json({ success: true, message: `Document ${id} deleted successfully.` });
    } catch (error: any) {
      res.status(500).json({ error: `Failed to delete document: ${error.message}` });
    }
  });

  // Chat completion proxy endpoint (with RAG support)
  app.post("/api/chat", async (req, res) => {
    const { messages, documentIds } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Invalid or empty messages history" });
    }

    const hasDocs = documentIds && Array.isArray(documentIds) && documentIds.length > 0;
    let contextText = "";
    let retrievedChunks: any[] = [];

    if (hasDocs) {
      try {
        const lastUserMsg = [...messages].reverse().find(m => m.role === "user")?.content || "";
        if (lastUserMsg) {
          console.log(`Querying documents [${documentIds.join(", ")}] for context: "${lastUserMsg.substring(0, 50)}..."`);
          retrievedChunks = await queryDocuments(documentIds, lastUserMsg, 4);
          if (retrievedChunks.length > 0) {
            contextText = retrievedChunks.map(c => `[Source: ${c.documentName}] (Part ${c.chunkIndex + 1}):\n${c.text}`).join("\n\n---\n\n");
          }
        }
      } catch (err) {
        console.error("RAG retrieval error:", err);
      }
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    const openaiBaseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    const modelName = process.env.MODEL_NAME || "gpt-4o";

    // 1. Check if OpenAI-compatible API is configured
    if (openaiApiKey && openaiApiKey.trim() !== "") {
      try {
        console.log(`Using OpenAI-compatible API endpoint: ${openaiBaseUrl} with model: ${modelName}`);
        
        // Format messages to match standard Chat Completion format
        const formattedMessages = messages.map(msg => ({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content,
        }));

        // If RAG context is found, inject it at the beginning or as system/user contextual guide
        if (contextText) {
          const systemMsg = {
            role: "system",
            content: `You are OutSkill AI, a professional document analysis assistant. Answer the user's question based strictly on the provided context below.
If the answer is not present in the context, explicitly state "I'm sorry, but that information is not available in the uploaded document." Do not make up facts or use external knowledge.
Always cite the source document name and part in your answer when referencing facts from the context.

CONTEXT:
${contextText}`,
          };
          formattedMessages.unshift(systemMsg as any);
        }

        const response = await fetch(`${openaiBaseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({
            model: modelName,
            messages: formattedMessages,
            temperature: 0.4, // lower temperature for RAG precision
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const status = response.status;
          
          if (status === 401) {
            return res.status(401).json({ error: "Invalid API key: The provided OpenAI API key is unauthorized." });
          } else if (status === 429) {
            return res.status(429).json({ error: "Rate limit exceeded: Please try again in a moment." });
          } else {
            return res.status(status).json({ error: errData?.error?.message || `Server error from AI provider (${status})` });
          }
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;

        if (!content) {
          return res.status(502).json({ error: "Invalid response format: No message content received from AI provider." });
        }

        return res.json({
          role: "assistant",
          content,
          citations: retrievedChunks.map(c => ({
            documentName: c.documentName,
            text: c.text,
            chunkIndex: c.chunkIndex
          }))
        });
      } catch (error: any) {
        console.error("OpenAI Endpoint error:", error);
        return res.status(500).json({ error: `Network error: Could not connect to AI provider (${error.message || "Unknown error"})` });
      }
    }

    // 2. Fall back to Gemini API via GoogleGenAI if pre-configured
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey && geminiApiKey.trim() !== "") {
      try {
        console.log("No OpenAI key found. Falling back to Google Gemini API (gemini-3.5-flash).");
        
        const ai = new GoogleGenAI({
          apiKey: geminiApiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });

        // Convert messages to Gemini format: { role: 'user'|'model', parts: [{ text: string }] }
        const geminiContents = messages.map((msg: any) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        }));

        let systemInstruction = "You are OutSkill AI, a helpful, friendly, and highly intelligent AI programming and learning assistant. Format your replies beautifully with markdown. Use code blocks with appropriate languages when rendering code.";

        if (contextText) {
          systemInstruction = `You are OutSkill AI, a professional document analysis assistant. Answer the user's question based strictly on the provided context below.
If the answer is not present in the context, explicitly state "I'm sorry, but that information is not available in the uploaded document." Do not make up facts or use external knowledge.
Always cite the source document name and part in your answer when referencing facts from the context. Use clean markdown formatting.

CONTEXT:
${contextText}`;
        }

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: geminiContents,
          config: {
            systemInstruction,
            temperature: 0.3,
          },
        });

        const content = response.text;
        if (!content) {
          return res.status(502).json({ error: "Empty response received from Google Gemini API." });
        }

        return res.json({
          role: "assistant",
          content,
          citations: retrievedChunks.map(c => ({
            documentName: c.documentName,
            text: c.text,
            chunkIndex: c.chunkIndex
          }))
        });
      } catch (error: any) {
        console.error("Gemini fallback error:", error);
        return res.status(500).json({ error: `Gemini API Error: ${error.message || "Unknown error"}` });
      }
    }

    // 3. No credentials configured at all
    return res.status(400).json({
      error: "API Key Required: Please configure your OPENAI_API_KEY or use the Google AI Studio Secrets tab to supply a GEMINI_API_KEY.",
    });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
