"use client";

import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

interface MarkdownPreviewProps {
  content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <div className="markdown-preview h-full min-h-0 overflow-auto bg-white px-5 py-4">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
