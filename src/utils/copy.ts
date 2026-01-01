import { useState, useRef, useEffect } from "react";

export function useSecureClipboard() {
  const [toast, setToast] = useState<string | null>(null);
  const clearTimer = useRef<number | null>(null);
  const lastCopied = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (clearTimer.current) window.clearTimeout(clearTimer.current);
    };
  }, []);

  const copyWithAutoClear = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      lastCopied.current = text;
      setToast(`Copied ${label} to clipboard`);

      if (clearTimer.current) window.clearTimeout(clearTimer.current);

      clearTimer.current = window.setTimeout(async () => {
        try {
          const current = await navigator.clipboard.readText();
          if (current === lastCopied.current) {
            await navigator.clipboard.writeText("");
          }
        } catch {
        } finally {
          clearTimer.current = null;
          lastCopied.current = null;
        }
      }, 25000);

      window.setTimeout(() => setToast(null), 1200);
    } catch (err) {
      setToast("Failed to copy");
    }
  };

  return { toast, copyWithAutoClear };
}
