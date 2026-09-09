import type { ReactNode } from 'react';
import { X } from 'lucide-react';

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative w-full max-w-[560px] max-h-[85vh] rounded-t-3xl border-t flex flex-col safe-bottom"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1 -mr-1" style={{ color: 'var(--text-dim)' }}>
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-4 pb-6">{children}</div>
      </div>
    </div>
  );
}
