import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

type MessageBodyProps = {
  content: string;
  className?: string;
  /** Use on primary-colored bubbles (agent / visitor) for readable links and code. */
  tone?: "default" | "inverted";
};

function buildComponents(tone: "default" | "inverted"): Components {
  const linkClass =
    tone === "inverted"
      ? "font-medium underline underline-offset-2 opacity-95"
      : "font-medium text-primary underline underline-offset-2";

  const inlineCodeClass =
    tone === "inverted"
      ? "rounded bg-white/15 px-1 py-0.5 text-[0.85em]"
      : "rounded bg-foreground/10 px-1 py-0.5 text-[0.85em]";

  const blockCodeClass =
    tone === "inverted"
      ? "block overflow-x-auto rounded-md bg-white/10 p-2 text-xs"
      : "block overflow-x-auto rounded-md bg-foreground/5 p-2 text-xs";

  return {
    p: ({ children }) => <p className="my-1.5 first:mt-0 last:mb-0">{children}</p>,
    ul: ({ children }) => <ul className="my-1.5 list-disc space-y-0.5 pl-4">{children}</ul>,
    ol: ({ children }) => <ol className="my-1.5 list-decimal space-y-0.5 pl-4">{children}</ol>,
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    h1: ({ children }) => <p className="my-1.5 text-base font-semibold">{children}</p>,
    h2: ({ children }) => <p className="my-1.5 text-sm font-semibold">{children}</p>,
    h3: ({ children }) => <p className="my-1.5 text-sm font-medium">{children}</p>,
    h4: ({ children }) => <p className="my-1 text-sm font-medium">{children}</p>,
    h5: ({ children }) => <p className="my-1 text-sm font-medium">{children}</p>,
    h6: ({ children }) => <p className="my-1 text-sm font-medium">{children}</p>,
    blockquote: ({ children }) => (
      <blockquote
        className={cn(
          "my-1.5 border-l-2 pl-3 italic",
          tone === "inverted" ? "border-white/40" : "border-border",
        )}
      >
        {children}
      </blockquote>
    ),
    hr: () => (
      <hr className={cn("my-2 border-t", tone === "inverted" ? "border-white/25" : "border-border")} />
    ),
    a: ({ children, ...props }) => (
      <a {...props} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {children}
      </a>
    ),
    code: ({ className, children, ...props }) => {
      const isBlock = className?.includes("language-");
      if (isBlock) {
        return (
          <code {...props} className={cn(blockCodeClass, className)}>
            {children}
          </code>
        );
      }
      return (
        <code {...props} className={inlineCodeClass}>
          {children}
        </code>
      );
    },
    pre: ({ children }) => <pre className="my-1.5 whitespace-pre-wrap">{children}</pre>,
  };
}

export function MessageBody({ content, className, tone = "default" }: MessageBodyProps) {
  if (!content.trim()) {
    return null;
  }

  return (
    <div className={cn("leading-relaxed break-words", className)}>
      <ReactMarkdown components={buildComponents(tone)}>{content}</ReactMarkdown>
    </div>
  );
}
