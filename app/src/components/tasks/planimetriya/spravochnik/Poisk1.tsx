'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { SPRAVOCHNIK_1 } from '@/content/spravochnik1/tipy';

/** Слова запроса: нижний регистр, «ё» → «е». */
function slova(q: string): string[] {
  return q.toLowerCase().replace(/ё/g, 'е').split(/\s+/).filter(Boolean);
}

/**
 * Поиск по темам справочника. Карточки рисует сервер (формулы KaTeX и
 * чертежи движка — на сборке), поэтому поиск не перерисовывает их, а
 * прячет: у каждой карточки есть data-spr-poisk — заголовок и
 * формулировки без формул. Раздел, в котором не осталось карточек,
 * прячется целиком. Ctrl/⌘ + K и «/» ставят курсор в поле.
 */
export function Poisk1() {
  const [q, setQ] = useState('');
  const [pusto, setPusto] = useState(false);
  const pole = useRef<HTMLInputElement>(null);
  const id = useId();

  /* Фильтр — в обработчике ввода, а не в эффекте: прячем карточки и
     сразу знаем, осталось ли что-то. */
  function iskat(novyy: string): void {
    setQ(novyy);
    const zapros = slova(novyy);
    const kartochki = document.querySelectorAll<HTMLElement>('[data-spr-poisk]');
    let vidno = 0;
    kartochki.forEach((k) => {
      const tekst = k.dataset.sprPoisk ?? '';
      const da = zapros.every((s) => tekst.includes(s));
      k.hidden = !da;
      if (da) vidno += 1;
    });
    document.querySelectorAll<HTMLElement>('.vteor-razdel').forEach((r) => {
      const est = r.querySelector('[data-spr-poisk]:not([hidden])') !== null;
      r.hidden = zapros.length > 0 && !est;
    });
    setPusto(zapros.length > 0 && vidno === 0);
  }

  useEffect(() => {
    function klavisha(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const vPole = tag === 'INPUT' || tag === 'TEXTAREA';
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        pole.current?.focus();
      } else if (e.key === '/' && !vPole) {
        e.preventDefault();
        pole.current?.focus();
      }
    }
    window.addEventListener('keydown', klavisha);
    return () => window.removeEventListener('keydown', klavisha);
  }, []);

  return (
    <div className="spr1-poisk" role="search">
      <label className="spr1-poisk__label" htmlFor={id}>
        {SPRAVOCHNIK_1.poiskLabel}
      </label>
      <svg className="spr1-poisk__ikonka" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4 4" />
      </svg>
      <input
        ref={pole}
        id={id}
        className="spr1-poisk__pole"
        type="search"
        placeholder={SPRAVOCHNIK_1.poisk}
        value={q}
        onChange={(e) => iskat(e.target.value)}
        autoComplete="off"
      />
      <kbd className="spr1-poisk__kbd" aria-hidden="true">
        ⌘K
      </kbd>
      {pusto ? (
        <p className="spr1-poisk__pusto" role="status">
          {SPRAVOCHNIK_1.nichego}
        </p>
      ) : null}
    </div>
  );
}
