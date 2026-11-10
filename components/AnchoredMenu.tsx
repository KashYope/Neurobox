import React, { useLayoutEffect, useRef } from 'react';
import { X } from 'lucide-react';

export const AnchoredMenu: React.FC<{
  anchor: React.RefObject<HTMLButtonElement>; title: string; closeLabel: string;
  width?: number;
  onClose: () => void; children: React.ReactNode;
}> = ({ anchor, title, closeLabel, width: preferredWidth = 320, onClose, children }) => {
  const ref = useRef<HTMLDialogElement>(null);
  const closing = useRef(false);
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const place = () => {
      const box = anchor.current?.getBoundingClientRect();
      if (!box) return;
      const width = Math.min(preferredWidth, window.innerWidth - 32);
      const top = Math.max(16, box.top);
      dialog.style.width = `${width}px`;
      dialog.style.left = `${Math.max(16, Math.min(box.right - width, window.innerWidth - width - 16))}px`;
      dialog.style.top = `${top}px`;
      dialog.style.maxHeight = `${Math.max(44, window.innerHeight - top - 16)}px`;
    };
    place();
    dialog.showModal();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      dialog.close();
      anchor.current?.focus({ preventScroll: true });
    };
  }, [anchor, preferredWidth]);
  const close = () => {
    if (closing.current) return;
    closing.current = true;
    if (!ref.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { onClose(); return; }
    const animation = ref.current.animate([
      { clipPath: 'inset(0 0 0 0 round 12px)' },
      { clipPath: 'inset(0 0 calc(100% - 44px) calc(100% - 44px) round 12px)' }
    ], { duration: 160, easing: 'ease-in', fill: 'forwards' });
    void animation.finished.then(onClose, onClose);
  };
  return <dialog ref={ref} aria-label={title} id="ndee-secondary-menu" onCancel={event => { event.preventDefault(); close(); }} onClick={event => {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
  }} className="ndee-anchored-menu">
    <div className="flex h-11 items-center justify-between"><h2 className="pl-4 text-lg font-semibold">{title}</h2><button autoFocus type="button" className="ndee-focus flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" aria-label={closeLabel} onClick={close}><X aria-hidden="true" className="h-5 w-5" /></button></div>
    <div className="grid gap-1 p-2">{children}</div>
  </dialog>;
};
