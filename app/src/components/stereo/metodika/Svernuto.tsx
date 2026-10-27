'use client';

import { useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { IkVniz } from './Ikonki';

/**
 * Блок, который на телефоне свёрнут до заголовка, а на компьютере
 * открыт всегда (макеты №3: шаги алгоритма, «Решение», «Важно»,
 * «Лайфхак»).
 *
 * Заголовок стоит дважды: простой строкой — для компьютера и кнопкой
 * с aria-expanded — для телефона. Лишний из них скрыт display: none
 * и не попадает ни на экран, ни в дерево доступности, поэтому
 * на компьютере нет кнопки, которая ничего не делает. Ширина
 * переключения — та же, что у сайта (767.98 px, metodika.css).
 */
export function Svernuto({
  zagolovok,
  children,
  className,
  otkryto = false,
}: {
  zagolovok: ReactNode;
  children: ReactNode;
  className?: string;
  /** Открыт ли блок на телефоне сразу. */
  otkryto?: boolean;
}) {
  const [open, setOpen] = useState(otkryto);
  return (
    <div className={clsx('o3-svr', open && 'is-open', className)}>
      <div className="o3-svr__head o3-desk">{zagolovok}</div>
      <button
        type="button"
        className="o3-svr__head o3-svr__knopka o3-mob"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {zagolovok}
        <IkVniz className="o3-svr__ugol" />
      </button>
      <div className="o3-svr__telo">{children}</div>
    </div>
  );
}
