import React from 'react';

interface ScoreRowProps {
  label: string; detail: string; score: number | null; onClick: () => void;
}

export const ScoreRow: React.FC<ScoreRowProps> = ({ label, detail, score, onClick }) => {
  const percent = score === null ? 0 : Math.max(0, Math.min(100, score));
  const content = <><span className="min-w-0"><span className="block">{label}</span><span className="mt-1 block text-xs font-normal">{detail}</span></span><span className="shrink-0">{score === null ? '—' : `${score}%`}</span></>;
  return <button onClick={onClick} className="ndee-focus relative block min-h-14 w-full rounded-xl border border-[var(--ndee-border)] bg-white text-left text-sm font-semibold text-[var(--ndee-ink)]">
    <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" aria-hidden="true">
      <span className="absolute inset-y-0 left-0 bg-[var(--ndee-primary-strong)]" style={{ width: `${percent}%` }} />
    </span>
    <span className="relative flex items-center justify-between gap-4 px-4 py-3">{content}</span>
    {/* Même mise en page : blanc sur la zone remplie, sombre ailleurs, même au milieu d'un mot. */}
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-between gap-4 px-4 py-3 text-white" style={{ clipPath: `inset(0 ${100 - percent}% 0 0)` }}>{content}</span>
  </button>;
};
