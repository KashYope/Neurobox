import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { AssessmentLocale } from './model';
import { getCopy } from './copy';

export const AssessmentDialog: React.FC<{ title: string; closeLabel: string; onClose: () => void; children: React.ReactNode }> = ({ title, closeLabel, onClose, children }) => {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} aria-label={title} onCancel={event => { event.preventDefault(); onClose(); }} className="ndee-surface w-[calc(100%_-_2rem)] max-w-lg rounded-3xl p-6 backdrop:bg-black/45">
    <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-bold">{title}</h2><button type="button" onClick={onClose} aria-label={closeLabel} className="ndee-focus flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"><X /></button></div>
    {children}
  </dialog>;
};

export const QrScanner: React.FC<{ locale: AssessmentLocale; onScan: (value: string) => Promise<boolean> }> = ({ locale, onScan }) => {
  const t = getCopy(locale);
  const callback = useRef(onScan);
  callback.current = onScan;
  const [error, setError] = useState<'camera' | 'scan' | null>(null);
  const scanned = useRef(false);
  const [attempt, setAttempt] = useState(0);
  const elementId = React.useId().replace(/:/g, '_');
  useEffect(() => {
    let disposed = false;
    scanned.current = false;
    const scanner = new Html5Qrcode(elementId);
    const started = scanner.start({ facingMode: 'environment' }, { fps: 8, qrbox: { width: 240, height: 240 } }, value => {
      if (disposed || scanned.current) return;
      scanned.current = true;
      void callback.current(value).then(success => { if (!disposed && !success) setError('scan'); }).catch(() => { if (!disposed) setError('scan'); });
    }, () => undefined).catch(() => { if (!disposed) setError('camera'); });
    return () => {
      disposed = true;
      // Attendre aussi une autorisation caméra encore en cours avant de libérer le flux.
      void started.then(async () => { if (scanner.isScanning) await scanner.stop(); scanner.clear(); }).catch(() => undefined);
    };
  }, [elementId, attempt]);
  return <><p className="mb-3 text-sm">{t.camera}</p><div id={elementId} className="overflow-hidden rounded-xl" />{error && <p role="alert" className="mt-3 text-sm text-rose-800">{error === 'camera' ? t.cameraError : t.invalidQr} <button onClick={() => { scanned.current = false; setError(null); if (error === 'camera') setAttempt(value => value + 1); }} className="underline">{t.retry}</button></p>}</>;
};
