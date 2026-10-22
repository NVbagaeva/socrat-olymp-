'use client';

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

export interface PanelGlavy16 {
  id: string;
  label: string;
  /** Содержимое вкладки, набранное на сервере. */
  telo: ReactNode;
}

/**
 * Вкладки внутри главы теории №16: «Теория» · «Разбор» ·
 * «Тренировочная работа». Переключают содержимое на месте, адрес не
 * меняется: верхняя лента раздела (RazdelTabs) живёт в адресе, а эта —
 * внутри одной главы на длинной странице. Скрытые панели остаются в
 * разметке (hidden), поэтому поиск по странице и печать их видят.
 * Стрелки ←/→ переходят между вкладками, как в шаблоне WAI-ARIA Tabs.
 */
export function VkladkiGlavy16({ paneli }: { paneli: readonly PanelGlavy16[] }) {
  const [aktivnaya, setAktivnaya] = useState(paneli[0]?.id ?? '');
  const uid = useId().replace(/:/g, '');
  const knopki = useRef<(HTMLButtonElement | null)[]>([]);

  function klavisha(e: KeyboardEvent, i: number) {
    const shag = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (shag === 0) return;
    e.preventDefault();
    const j = (i + shag + paneli.length) % paneli.length;
    const p = paneli[j];
    if (p) {
      setAktivnaya(p.id);
      knopki.current[j]?.focus();
    }
  }

  return (
    <div className="z16-vkl">
      <div className="z16-vkl__lenta" role="tablist">
        {paneli.map((p, i) => (
          <button
            key={p.id}
            ref={(el) => {
              knopki.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${uid}-t-${p.id}`}
            aria-selected={p.id === aktivnaya}
            aria-controls={`${uid}-p-${p.id}`}
            tabIndex={p.id === aktivnaya ? 0 : -1}
            className={p.id === aktivnaya ? 'z16-vkl__knopka is-active' : 'z16-vkl__knopka'}
            onClick={() => setAktivnaya(p.id)}
            onKeyDown={(e) => klavisha(e, i)}
          >
            {p.label}
          </button>
        ))}
      </div>
      {paneli.map((p) => (
        <div
          key={p.id}
          role="tabpanel"
          id={`${uid}-p-${p.id}`}
          aria-labelledby={`${uid}-t-${p.id}`}
          hidden={p.id !== aktivnaya}
          className="z16-vkl__panel"
        >
          {p.telo}
        </div>
      ))}
    </div>
  );
}
