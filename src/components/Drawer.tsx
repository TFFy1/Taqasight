import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

/** Right-hand detail drawer: overlay click + Escape close, focus moved in. */
export function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close panel details"
        className="absolute inset-0 cursor-pointer bg-black/55"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-line bg-bg-deep shadow-pop animate-rise"
      >
        <header className="flex items-center justify-between gap-3 border-b border-line/60 px-5 py-4">
          <div className="min-w-0 font-display text-lg font-semibold">{title}</div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-md p-1.5 text-text-mid transition-colors hover:bg-surface-2 hover:text-text-hi"
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </aside>
    </div>
  );
}
