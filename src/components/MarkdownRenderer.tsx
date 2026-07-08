import React from "react";
import ReactMarkdown from "react-markdown";
import { CodeBlock } from "./CodeBlock";

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const components = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || "");
      const codeVal = String(children).replace(/\n$/, "");
      
      return !inline && match ? (
        <CodeBlock language={match[1]} code={codeVal} />
      ) : !inline ? (
        <CodeBlock language="text" code={codeVal} />
      ) : (
        <code
          className="rounded bg-[#1d1f21] border border-[#242729] px-1.5 py-0.5 font-mono text-xs text-blue-400 font-semibold"
          {...props}
        >
          {children}
        </code>
      );
    },
    p: ({ children }: any) => (
      <p className="mb-3.5 last:mb-0 leading-relaxed text-[#f0f0f0]">
        {children}
      </p>
    ),
    h1: ({ children }: any) => (
      <h1 className="text-2xl font-bold tracking-tight text-white mt-6 mb-3 font-sans">
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-xl font-semibold tracking-tight text-white mt-5 mb-2.5 font-sans">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-lg font-medium tracking-tight text-white mt-4 mb-2 font-sans">
        {children}
      </h3>
    ),
    ul: ({ children }: any) => (
      <ul className="list-disc pl-6 mb-4 space-y-1.5 text-[#e0e0e0]">
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal pl-6 mb-4 space-y-1.5 text-[#e0e0e0]">
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li className="leading-relaxed pl-1">{children}</li>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-blue-500 bg-[#131517] pl-4 py-2.5 my-4 italic rounded-r text-[#a0a0a0]">
        {children}
      </blockquote>
    ),
    a: ({ children, href }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300 hover:underline font-medium transition-colors"
      >
        {children}
      </a>
    ),
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-5 rounded-lg border border-[#242729] bg-[#131517] shadow-sm">
        <table className="w-full text-left text-sm border-collapse">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="bg-[#1d1f21] text-xs uppercase tracking-wider text-[#a0a0a0] font-semibold border-b border-[#242729]">
        {children}
      </thead>
    ),
    tbody: ({ children }: any) => (
      <tbody className="divide-y divide-[#242729]">
        {children}
      </tbody>
    ),
    tr: ({ children }: any) => (
      <tr className="hover:bg-[#1d1f21]/40 transition-colors">
        {children}
      </tr>
    ),
    th: ({ children }: any) => (
      <th className="px-4 py-3 font-semibold border-b border-[#242729] text-white">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="px-4 py-3 text-[#e0e0e0]">
        {children}
      </td>
    ),
  };

  return (
    <div className="markdown-body select-text">
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
};
