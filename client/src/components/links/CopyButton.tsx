import { useEffect, useRef, useState } from "react";
import { useToast } from "../../hooks/useToast";

interface CopyButtonProps {
  text: string;
  label?: string;
}

export function CopyButton({ text, label = "Copy short link" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      toast.error("Copy failed — select the link and copy manually");
      return;
    }
    setCopied(true);
    toast.success("Short link copied");
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Copied" : label}
      title={copied ? "Copied!" : label}
      className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
    >
      {copied ? (
        <svg className="size-4 text-emerald-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg className="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M8 2a1 1 0 0 0 0 2h2a1 1 0 1 0 0-2H8Z" />
          <path d="M3 5a1 1 0 0 1 1-1h3a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Zm0 5a1 1 0 0 1 1-1h3a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Zm-1 5a1 1 0 1 0 0 2h3a1 1 0 1 0 0-2H2Z" />
          <path
            fillRule="evenodd"
            d="M12 3H6a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3Zm1 6.5a1 1 0 0 1-1 1H9a1 1 0 0 1 0-2h6a1 1 0 0 1 0 2Z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  );
}
