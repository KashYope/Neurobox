import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export function SiteDialog({ title, closeLabel, onClose, children }: { title: string; closeLabel: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => { dialog?.close(); previous?.focus(); };
  }, []);
  return <dialog ref={ref} aria-label={title} onCancel={event => { event.preventDefault(); onClose(); }} className="ndee-surface w-[calc(100%_-_2rem)] max-w-lg rounded-2xl p-6 backdrop:bg-black/45">
    <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-xl">{title}</h2><button type="button" className="ndee-focus flex h-11 w-11 items-center justify-center rounded-xl" aria-label={closeLabel} onClick={onClose}><X /></button></div>
    {children}
  </dialog>;
}
