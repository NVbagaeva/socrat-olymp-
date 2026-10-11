'use client';

/** Кнопка «Скачать PDF / Печать» над печатной страницей: видна только на экране. */
export function PechatKnopka1({ label, lead }: { label: string; lead: string }) {
  return (
    <div className="z1-print-bar">
      <button type="button" className="btn btn--primary" onClick={() => window.print()}>
        {label}
      </button>
      <span className="z1-print-bar__lead">{lead}</span>
    </div>
  );
}
