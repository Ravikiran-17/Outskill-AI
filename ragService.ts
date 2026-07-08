import fs from "fs";
import path from "path";
import * as pdfImport from "pdf-parse";
const pdf = (pdfImport as any).default || pdfImport;
import mammoth from "mammoth";
import { GoogleGenAI } from "@google/genai";

// Standard English stopwords for the TF-IDF / BM25 search fallback
const STOPWORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at",
  "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can't", "cannot", "could",
  "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few", "for",
  "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's",
  "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm",
  "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't",
  "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours",
  "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't",
  "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there",
  "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too",
  "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't",
  "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's",
  "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself",
  "yourselves"
]);

export interface DocumentChunk {
  id: string;
  text: string;
  documentId: string;
  documentName: string;
  chunkIndex: number;
  embedding?: number[];
  termVector?: Record<string, number>;
}

export interface DocumentMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: number;
  chunkCount: number;
}

// In-memory / On-disk cache directory for documents
const DATA_DIR = path.join(process.cwd(), "data", "documents");

// Ensure documents directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Text cleaner and normalizer
 */
function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/ +/g, " ")
    .trim();
}

/**
 * Split text into semantic chunks with a specified size and overlap.
 */
export function splitTextIntoChunks(text: string, chunkSize: number = 1000, chunkOverlap: number = 200): string[] {
  const cleaned = cleanText(text);
  if (cleaned.length <= chunkSize) {
    return [cleaned];
  }

  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < cleaned.length) {
    let endIndex = startIndex + chunkSize;

    if (endIndex < cleaned.length) {
      // Try to find a logical break point (sentence, paragraph, or space) near the end of the chunk
      const searchRange = cleaned.substring(endIndex - 150, endIndex);
      const lastParagraph = searchRange.lastIndexOf("\n\n");
      const lastSentence = Math.max(searchRange.lastIndexOf(". "), searchRange.lastIndexOf("?\n"), searchRange.lastIndexOf("!\n"));
      const lastSpace = searchRange.lastIndexOf(" ");

      if (lastParagraph !== -1) {
        endIndex = (endIndex - 150) + lastParagraph + 2;
      } else if (lastSentence !== -1) {
        endIndex = (endIndex - 150) + lastSentence + 2;
      } else if (lastSpace !== -1) {
        endIndex = (endIndex - 150) + lastSpace + 1;
      }
    }

    chunks.push(cleaned.substring(startIndex, endIndex).trim());
    startIndex = endIndex - chunkOverlap;

    // Safety check to prevent infinite loop
    if (startIndex >= cleaned.length || chunkSize <= chunkOverlap) {
      break;
    }
  }

  return chunks.filter(c => c.length > 20);
}

/**
 * Extract text from base64 document based on file type
 */
export async function extractTextFromDocument(base64Content: string, fileType: string): Promise<string> {
  const buffer = Buffer.from(base64Content, "base64");

  if (fileType.includes("pdf")) {
    try {
      const data = await pdf(buffer);
      return data.text || "";
    } catch (error: any) {
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
  } else if (fileType.includes("officedocument.wordprocessingml") || fileType.includes("docx")) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || "";
    } catch (error: any) {
      throw new Error(`Word (.docx) parsing failed: ${error.message}`);
    }
  } else if (fileType.includes("text") || fileType.includes("plain") || fileType.includes("markdown") || fileType.endsWith(".txt") || fileType.endsWith(".md")) {
    return buffer.toString("utf8");
  } else {
    // Attempt standard text read as fallback
    try {
      return buffer.toString("utf8");
    } catch {
      throw new Error(`Unsupported document type: ${fileType}`);
    }
  }
}

/**
 * Compute Term Frequency (TF) for a chunk
 */
function computeTermVector(text: string): Record<string, number> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 1 && !STOPWORDS.has(word));

  const vector: Record<string, number> = {};
  for (const word of words) {
    vector[word] = (vector[word] || 0) + 1;
  }
  return vector;
}

/**
 * Generate semantic embeddings via OpenAI or Gemini API
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  // Try OpenAI Embedding first
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (openaiApiKey && openaiApiKey.trim() !== "") {
    try {
      const openaiBaseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
      const response = await fetch(`${openaiBaseUrl}/embeddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: text,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data?.data?.[0]?.embedding || null;
      }
    } catch (err) {
      console.warn("OpenAI embedding generation failed, falling back to Gemini:", err);
    }
  }

  // Try Gemini Embedding next
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey && geminiApiKey.trim() !== "") {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const response = await ai.models.embedContent({
        model: "text-embedding-004",
        contents: text,
      });

      // If the SDK returns a structured object containing embeddings
      const values = (response as any)?.embedding?.values || (response as any)?.embeddings?.[0]?.values;
      if (values) {
        return values;
      }
    } catch (err) {
      console.warn("Gemini embedding generation failed:", err);
    }
  }

  return null;
}

/**
 * Calculate Cosine Similarity between two dense embedding vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Calculate Cosine Similarity between two term-frequency sparse vectors (TF-IDF search fallback)
 */
function termVectorSimilarity(vecA: Record<string, number>, vecB: Record<string, number>): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const key in vecA) {
    normA += vecA[key] * vecA[key];
    if (vecB[key]) {
      dotProduct += vecA[key] * vecB[key];
    }
  }

  for (const key in vecB) {
    normB += vecB[key] * vecB[key];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Store parsed document chunks to JSON file
 */
export async function saveDocument(
  metadata: DocumentMetadata,
  chunksText: string[]
): Promise<void> {
  const chunks: DocumentChunk[] = [];

  for (let i = 0; i < chunksText.length; i++) {
    const text = chunksText[i];
    const chunk: DocumentChunk = {
      id: `${metadata.id}_chunk_${i}`,
      text,
      documentId: metadata.id,
      documentName: metadata.name,
      chunkIndex: i,
      termVector: computeTermVector(text),
    };

    // Optionally generate embedding in the background / foreground
    const emb = await generateEmbedding(text).catch(() => null);
    if (emb) {
      chunk.embedding = emb;
    }

    chunks.push(chunk);
  }

  // Save metadata
  fs.writeFileSync(
    path.join(DATA_DIR, `${metadata.id}_metadata.json`),
    JSON.stringify(metadata, null, 2)
  );

  // Save chunks
  fs.writeFileSync(
    path.join(DATA_DIR, `${metadata.id}_chunks.json`),
    JSON.stringify(chunks, null, 2)
  );
}

/**
 * Get all saved documents metadata
 */
export function getAllDocuments(): DocumentMetadata[] {
  try {
    const files = fs.readdirSync(DATA_DIR);
    const metadataFiles = files.filter(f => f.endsWith("_metadata.json"));
    const docs: DocumentMetadata[] = [];

    for (const file of metadataFiles) {
      try {
        const filePath = path.join(DATA_DIR, file);
        const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
        docs.push(data);
      } catch (err) {
        console.error("Error reading document metadata file:", file, err);
      }
    }

    return docs.sort((a, b) => b.uploadedAt - a.uploadedAt);
  } catch (err) {
    console.error("Error reading directory", err);
    return [];
  }
}

/**
 * Delete a document from local storage
 */
export function deleteDocument(documentId: string): void {
  const metadataPath = path.join(DATA_DIR, `${documentId}_metadata.json`);
  const chunksPath = path.join(DATA_DIR, `${documentId}_chunks.json`);

  if (fs.existsSync(metadataPath)) fs.unlinkSync(metadataPath);
  if (fs.existsSync(chunksPath)) fs.unlinkSync(chunksPath);
}

/**
 * Query active documents to retrieve the most relevant chunks.
 * Supports searching across multiple document IDs.
 */
export async function queryDocuments(
  documentIds: string[],
  queryText: string,
  topK: number = 4
): Promise<DocumentChunk[]> {
  const results: { chunk: DocumentChunk; score: number }[] = [];

  // Generate embedding for query if available
  const queryEmbedding = await generateEmbedding(queryText).catch(() => null);
  const queryTermVector = computeTermVector(queryText);

  for (const docId of documentIds) {
    const chunksPath = path.join(DATA_DIR, `${docId}_chunks.json`);
    if (!fs.existsSync(chunksPath)) continue;

    try {
      const chunks: DocumentChunk[] = JSON.parse(fs.readFileSync(chunksPath, "utf8"));

      for (const chunk of chunks) {
        let score = 0;

        if (queryEmbedding && chunk.embedding) {
          // If we have semantic dense embeddings, use cosine similarity
          const denseScore = cosineSimilarity(queryEmbedding, chunk.embedding);
          // Hybrid score: combine dense semantic and term vector matching
          const termScore = chunk.termVector ? termVectorSimilarity(queryTermVector, chunk.termVector) : 0;
          score = denseScore * 0.75 + termScore * 0.25;
        } else {
          // Fall back to term vector (keyword TF-IDF) similarity
          score = chunk.termVector ? termVectorSimilarity(queryTermVector, chunk.termVector) : 0;
        }

        if (score > 0) {
          results.push({ chunk, score });
        }
      }
    } catch (err) {
      console.error("Error searching document chunks:", docId, err);
    }
  }

  // Sort by score descending and take top K
  results.sort((a, b) => b.score - a.score);

  // If we got no scoring matches, just return the first few chunks of the active document so we at least provide some context
  if (results.length === 0 && documentIds.length > 0) {
    const chunksPath = path.join(DATA_DIR, `${documentIds[0]}_chunks.json`);
    if (fs.existsSync(chunksPath)) {
      try {
        const chunks: DocumentChunk[] = JSON.parse(fs.readFileSync(chunksPath, "utf8"));
        return chunks.slice(0, topK);
      } catch {}
    }
  }

  return results.slice(0, topK).map(r => r.chunk);
}
