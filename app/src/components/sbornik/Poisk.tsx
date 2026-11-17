'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

export interface PunktPoiska {
  /** Что показать: «1.2.17» или «1.10. Выражения с модулем». */
  zagolovok: string;
  /** Пояснение под заголовком. */
  poyasnenie: string;
  href: string;
  /** Строка для поиска: номер, название, описание — в нижнем регистре. */
  klyuch: string;
}

/**
 * Поиск по сборнику: номер задачи («1.2.17», «1.2»), номер главы или
 * слово из темы («модуль», «корни»). Индекс собран на сборке.
 */
export function PoiskSbornika({ punkty }: { punkty: readonly PunktPoiska[] }) {
  const [q, setQ] = useState('');
  const naydeno = useMemo(() => {
    const s = q.trim().toLowerCase().replace(',', '.');
    if (s.length === 0) return [];
    const nomer = /^\d+(\.\d+){0,2}$/.test(s);
    return punkty
      .filter((p) => (nomer ? p.zagolovok.startsWith(s) : p.klyuch.includes(s)))
      .slice(0, 12);
  }, [q, punkty]);
  return (
    <div className="sb-poisk-sbornika">
      <label className="sb-poisk-sbornika__label" htmlFor="sb-poisk">
        Найти задачу или тему
      </label>
      <input
        id="sb-poisk"
        className="sb-poisk-sbornika__pole"
        type="search"
        inputMode="search"
        autoComplete="off"
        placeholder="Номер (1.2.17) или тема (модуль, корни)"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {q.trim() === '' ? null : naydeno.length === 0 ? (
        <p className="sb-poisk-sbornika__pusto">Ничего не нашлось. Попробуйте номер задачи или другое слово.</p>
      ) : (
        <ul className="sb-poisk-sbornika__spisok">
          {naydeno.map((p) => (
            <li key={p.href}>
              <Link href={p.href}>
                <b>{p.zagolovok}</b> <span>{p.poyasnenie}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
