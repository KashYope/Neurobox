import React, { useId } from 'react';
import type { AssessmentLocale, ReflectionReport } from './model';
import { resultCopy } from './resources';

// Les valeurs manquantes ne sont jamais assimilées à un score nul.
export function ProfileRadar({ report, locale, labels }: { report: ReflectionReport; locale: AssessmentLocale; labels: Record<string, string> }) {
  const id = useId();
  const copy = resultCopy[locale];
  const point = (index: number, score: number) => {
    const angle = -Math.PI / 2 + index * 2 * Math.PI / report.domains.length;
    return { x: 240 + Math.cos(angle) * 132 * score / 100, y: 192 + Math.sin(angle) * 132 * score / 100 };
  };
  const allPresent = report.domains.every(domain => domain.score !== null);
  return <section className="my-6 border-y py-6" aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`} className="text-xl font-semibold">{copy.chart}</h2>
    <p id={`${id}-description`} className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--ndee-muted)]">{copy.chartDescription}</p>
    <svg role="img" aria-labelledby={`${id}-title ${id}-description`} viewBox="0 0 480 390" className="mx-auto mt-4 block w-full max-w-xl">
      {[25, 50, 75, 100].map(level => <g key={level}>
        <polygon points={report.domains.map((_, index) => { const p = point(index, level); return `${p.x},${p.y}`; }).join(' ')} fill="none" stroke="var(--ndee-border)" />
      </g>)}
      {report.domains.map((domain, index) => {
        const end = point(index, 100);
        const label = point(index, 126);
        return <g key={domain.domain}><line x1="240" y1="192" x2={end.x} y2={end.y} stroke="var(--ndee-border)" strokeDasharray={domain.complete ? undefined : '4 4'} /><text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="var(--ndee-ink)">{copy.shortLabels[index]}</text></g>;
      })}
      {allPresent && <polygon points={report.domains.map((domain, index) => { const p = point(index, domain.score!); return `${p.x},${p.y}`; }).join(' ')} fill="var(--ndee-primary)" fillOpacity="0.12" stroke="none" />}
      {report.domains.map((domain, index) => {
        const nextIndex = (index + 1) % report.domains.length;
        const next = report.domains[nextIndex];
        const p = point(index, domain.score ?? 100);
        const q = point(nextIndex, next.score ?? 100);
        return <g key={domain.domain}>
          {domain.score !== null && next.score !== null && <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="var(--ndee-primary)" strokeWidth="3" strokeDasharray={domain.complete && next.complete ? undefined : '5 4'} />}
          <circle cx={p.x} cy={p.y} r="5" fill={domain.complete ? 'var(--ndee-primary)' : 'var(--ndee-paper, white)'} stroke="var(--ndee-primary)" strokeWidth="2"><title>{`${labels[domain.domain]} : ${domain.score === null ? copy.missing : `${domain.score} % · ${domain.complete ? copy.complete : copy.partial}`}`}</title></circle>
        </g>;
      })}
    </svg>
    <details><summary className="ndee-focus cursor-pointer py-3 text-sm font-semibold">{copy.values}</summary><dl className="divide-y">{report.domains.map(domain => <div key={domain.domain} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><dt>{labels[domain.domain]}</dt><dd>{domain.score === null ? copy.missing : `${domain.score} % · ${domain.answered}/${domain.total} · ${domain.complete ? copy.complete : copy.partial}`}</dd></div>)}</dl></details>
  </section>;
}
