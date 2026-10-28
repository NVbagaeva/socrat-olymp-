'use client';

import { pechatat } from '@/lib/sheet/pechat';

/** Кнопка «Скачать PDF / Печать» над печатной страницей: видна только на экране. */
export function PechatKnopka1({ label, lead }: { label: string; lead: string }) {
  return (
    <div className="z1-print-bar">
      <button type="button" className="btn btn--primary" onClick={() => void pechatat()}>
        {label}
      </button>
      <span className="z1-print-bar__lead">{lead}</span>
    </div>
  );
}
