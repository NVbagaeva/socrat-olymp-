'use client';

/**
 * Колокольчик в шапке (docs/kabinet-uvedomleniya.md, PR 3б): ссылка на
 * уведомления со счётчиком непрочитанных. Счётчик обновляется при
 * загрузке, раз в минуту, пока вкладка видна, при возврате на вкладку и
 * когда уведомления прочитаны на странице (событие `uvedomleniya:obnovit`).
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { NavIcon } from '@/components/ui/NavIcons';
import { UVED } from '@/content/uvedomleniya';
import { UVED_HREF } from '@/lib/uvedomleniya/links';
import { schetchik } from '@/lib/uvedomleniya/model';
import { OBNOVIT } from '@/lib/uvedomleniya/sobytiya';
import './uvedomleniya.css';


export function Kolokolchik() {
  const [n, setN] = useState(0);

  useEffect(() => {
    let alive = true;
    const zagruzit = async () => {
      if (document.visibilityState === 'hidden') return;
      try {
        const got = await (await import('@/lib/uvedomleniya/api')).uvedomleniyaSchet();
        if (alive) setN(got);
      } catch {
        /* Нет связи — счётчик прежний. */
      }
    };
    void zagruzit();
    const timer = window.setInterval(() => void zagruzit(), 60_000);
    const naVkladku = () => void zagruzit();
    document.addEventListener('visibilitychange', naVkladku);
    window.addEventListener(OBNOVIT, naVkladku);
    return () => {
      alive = false;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', naVkladku);
      window.removeEventListener(OBNOVIT, naVkladku);
    };
  }, []);

  const s = schetchik(n);
  return (
    <Link
      href={UVED_HREF.centr}
      className="bell kolokolchik"
      aria-label={s === null ? UVED.kolokolchik : UVED.kolokolchikNovyh(s)}
      data-schet={n}
    >
      <NavIcon name="notifications" />
      {s === null ? null : (
        <span className="kolokolchik__schet" aria-hidden="true">
          {s}
        </span>
      )}
    </Link>
  );
}
