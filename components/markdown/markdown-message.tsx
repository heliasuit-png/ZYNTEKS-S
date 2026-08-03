"use client";

import { useRef, useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import Markdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

import "highlight.js/styles/github-dark.css";

function collectText(children: ReactNode): string {
  if (children === null || children === undefined || children === false) {
    return "";
  }
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children.map(collectText).join("");
  }
  if (
    typeof children === "object" &&
    "props" in (children as { props?: { children?: ReactNode } }) &&
    (children as { props?: { children?: ReactNode } }).props
  ) {
    return collectText(
      (children as { props: { children?: ReactNode } }).props.children,
    );
  }
  return "";
}

function CodeBlock({ children }: { children: ReactNode }) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    const text = preRef.current?.innerText ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be unavailable (e.g. insecure context); ignore.
    }
  }

  return (
    <div className="group relative my-3">
      <button
        type="button"
        onClick={copy}
        aria-label="Copy code"
        className="absolute right-2 top-2 flex items-center gap-1 rounded-md border border-zt-border bg-zt-surface/80 px-2 py-1 text-xs text-zt-muted opacity-0 transition-opacity hover:text-zt-text group-hover:opacity-100"
      >
        {copied ? (
          <Check className="size-3.5 text-zt-success" aria-hidden />
        ) : (
          <Copy className="size-3.5" aria-hidden />
        )}
        {copied ? "Copied" : "Copy"}
      </button>
      <pre
        ref={preRef}
        className="overflow-x-auto rounded-xl border border-zt-border bg-[#0d1117] p-4 text-sm leading-relaxed"
      >
        {children}
      </pre>
    </div>
  );
}

const components: Components = {
  pre({ children }) {
    return <CodeBlock>{children}</CodeBlock>;
  },
  code({ className, children, ...props }: ComponentPropsWithoutRef<"code">) {
    const text = collectText(children);
    const isBlock = /language-/.test(className ?? "") || text.includes("\n");
    if (isBlock) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-zt-surface-2 px-1.5 py-0.5 text-[0.85em] text-zt-text">
        {children}
      </code>
    );
  },
  a({ children, ...props }) {
    return (
      <a
        {...props}
        target="_blank"
        rel="noopener noreferrer"
        className="text-zt-primary underline underline-offset-2 hover:text-zt-primary/80"
      >
        {children}
      </a>
    );
  },
  ul({ children }) {
    return <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>;
  },
  h1({ children }) {
    return <h1 className="mb-2 mt-4 text-lg font-semibold">{children}</h1>;
  },
  h2({ children }) {
    return <h2 className="mb-2 mt-4 text-base font-semibold">{children}</h2>;
  },
  h3({ children }) {
    return <h3 className="mb-1 mt-3 text-sm font-semibold">{children}</h3>;
  },
  p({ children }) {
    return <p className="my-2 leading-relaxed">{children}</p>;
  },
  blockquote({ children }) {
    return (
      <blockquote className="my-2 border-l-2 border-zt-border pl-3 text-zt-muted">
        {children}
      </blockquote>
    );
  },
  table({ children }) {
    return (
      <div className="my-3 overflow-x-auto">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    );
  },
  th({ children }) {
    return (
      <th className="border border-zt-border bg-zt-surface-2 px-3 py-1.5 text-left font-medium">
        {children}
      </th>
    );
  },
  td({ children }) {
    return <td className="border border-zt-border px-3 py-1.5">{children}</td>;
  },
};

export function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="text-sm text-zt-text [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
        components={components}
      >
        {content}
      </Markdown>
    </div>
  );
}
