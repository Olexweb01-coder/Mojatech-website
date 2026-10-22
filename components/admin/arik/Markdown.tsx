"use client";
import { memo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/* Arik's replies, formatted: headings, lists, tables, code. Raw HTML in a reply
 * is never run, so a reply cannot inject anything into the app. */

function CodeBlock({ children, lang }: { children: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mjr-code">
      <div className="mjr-code-bar">
        <span>{lang || "text"}</span>
        <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(children); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} }}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre><code>{children}</code></pre>
    </div>
  );
}

function Markdown({ text }: { text: string }) {
  return (
    <div className="mjr-md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => href?.startsWith("/") ? <a href={href}>{children}</a> : <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
          table: ({ children }) => <div className="mjr-table" data-noswipe><table>{children}</table></div>,
          code: ({ className, children }) => {
            const lang = /language-(\w+)/.exec(className || "")?.[1];
            const raw = String(children ?? "");
            if (!lang && !raw.includes("\n")) return <code className="mjr-inline">{children}</code>;
            return <CodeBlock lang={lang}>{raw.replace(/\n$/, "")}</CodeBlock>;
          },
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

export default memo(Markdown);
