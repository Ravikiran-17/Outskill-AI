import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  language: string;
  code: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Basic regex-based token highlighter for main languages
  const highlightCode = (rawCode: string, lang: string) => {
    if (!rawCode) return "";
    
    // Escape HTML first to prevent injection in raw rendering
    let html = rawCode
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Standard highlighters are complex, but this regex highlight adds a premium aesthetic
    const keywords = /\b(const|let|var|function|return|import|export|default|class|extends|if|else|for|while|async|await|try|catch|new|this|typeof|void|from|interface|type|enum|public|private|protected)\b/g;
    const strings = /(["'`])(.*?)\1/g;
    const comments = /(\/\/.*|\/\*[\s\S]*?\*\/)/g;
    const numbers = /\b(\d+)\b/g;
    const booleans = /\b(true|false|null|undefined)\b/g;

    html = html
      // Highlights comments (must do comments first so they don't get matched as quotes or keywords)
      .replace(comments, '<span class="text-[#5c6066] italic">$1</span>')
      // Highlights strings
      .replace(strings, '<span class="text-green-400">$&</span>')
      // Highlights keywords
      .replace(keywords, (match) => {
        return `<span class="text-purple-400 font-semibold">${match}</span>`;
      })
      // Highlights numbers
      .replace(numbers, '<span class="text-orange-400">$1</span>')
      // Highlights booleans
      .replace(booleans, '<span class="text-blue-400">$1</span>');

    return html;
  };

  const displayName = language ? language.toLowerCase() : "code";

  return (
    <div className="relative my-4 overflow-hidden rounded-lg border border-[#242729] bg-[#131517] text-[#d4d4d4]">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-[#1d1f21] border-b border-[#242729] px-4 py-2 text-[11px] font-mono text-[#808080]">
        <span className="uppercase tracking-wider font-semibold">
          {displayName}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[#a0a0a0] hover:text-white transition-colors"
          title="Copy Code"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code body */}
      <div className="overflow-x-auto p-4 text-xs font-mono leading-relaxed select-text">
        <pre className="m-0 overflow-visible">
          <code
            dangerouslySetInnerHTML={{ __html: highlightCode(code, displayName) }}
            className="block whitespace-pre text-[#d4d4d4]"
          />
        </pre>
      </div>
    </div>
  );
};
