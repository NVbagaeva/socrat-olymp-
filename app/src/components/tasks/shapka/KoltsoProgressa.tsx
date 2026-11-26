'use client';

import { clsx } from 'clsx';
import { useEffect, useId, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { SHAPKA_TEKSTY as T } from '@/content/shapki';
import { AUTH_HREF } from '@/lib/auth/config';
import { useSessionUser } from '@/lib/auth/session';
import { createLogStore, type LogStore } from '@/lib/progressLog';
import { skolkoOsvoeno } from '@/lib/shapka/osvoenie';

export interface KoltsoProgressaProps {
  /** Номер хранения раздела: ключи прогресса. */
  hranenie: number;
  /** Ключ журнала попыток раздела; null — тренажёра с журналом нет. */
  logKey: string | null;
  /** Типы тренажёра (каталог «Карты ЕГЭ»). */
  tipy: readonly string[];
  /** Опорные задачи раздела в форме хранилища; null — их нет. */
  opornye: readonly string[] | null;
  /** Картинка или живой чертёж внутри кольца. */
  children: ReactNode;
}

/* Журнал на ключ — один на страницу: шапка остаётся при смене вкладок. */
const zhurnaly = new Map<string, LogStore>();
function zhurnal(key: string): LogStore {
  let s = zhurnaly.get(key);
  if (s === undefined) {
    s = createLogStore(key);
    zhurnaly.set(key, s);
  }
  return s;
}
const PUSTOY = createLogStore('budetege:shapka:pusto:v1');

const VIDEL = (h: number) => `budetege:shapka:proyden:${h}`;

/**
 * Кольцо прогресса шапки раздела — одно на все разделы. Тонкая
 * стеклянная дорожка вокруг картинки, оранжевая дуга со светящейся
 * точкой на конце (как кольцо «До ЕГЭ осталось» на главной) и подпись
 * «Пройдено N из M» под ним.
 *
 * Счёт везде один: решённые опорные задачи раздела плюс освоенные типы
 * тренажёра (lib/shapka/osvoenie.ts). Источник — журнал попыток: у
 * вошедшего он синхронизируется с кабинетом, у гостя живёт в браузере.
 * Гостю кольцо рисуется пунктиром и зовёт войти.
 *
 * Само кольцо жесты не ловит (pointer-events: none): картинку внутри
 * можно крутить и тянуть. Ловит только подпись — по наведению или
 * нажатию она раскрывает разбивку.
 */
export function KoltsoProgressa({
  hranenie,
  logKey,
  tipy,
  opornye,
  children,
}: KoltsoProgressaProps) {
  const id = useId().replace(/:/g, '');
  const user = useSessionUser();
  const log = (logKey === null ? PUSTOY : zhurnal(logKey)).use();
  /* Счёт опорных задач — после первой отрисовки, отдельным куском. */
  const [opResheno, setOpResheno] = useState(0);
  const [Schyot, setSchyot] = useState<ComponentType<{
    hranenie: number;
    ids: readonly string[];
    soobshchit: (n: number) => void;
  }> | null>(null);
  useEffect(() => {
    if (opornye === null || opornye.length === 0) return;
    let zhiv = true;
    void import('./OpornyeSchyot').then((m) => {
      if (zhiv) setSchyot(() => m.default);
    });
    return () => {
      zhiv = false;
    };
  }, [opornye]);

  const tr = useMemo<[number, number] | null>(
    () => (tipy.length === 0 ? null : [skolkoOsvoeno(log, tipy), tipy.length]),
    [log, tipy],
  );
  const op: [number, number] | null =
    opornye === null || opornye.length === 0
      ? null
      : [Math.min(opResheno, opornye.length), opornye.length];
  const n = (op?.[0] ?? 0) + (tr?.[0] ?? 0);
  const iz = (op?.[1] ?? 0) + (tr?.[1] ?? 0);
  const dolya = iz === 0 ? 0 : n / iz;
  const gotovo = iz > 0 && n >= iz;
  const gost = user === null;

  /* Вспышка при 100 % — один раз: потом дуга просто золотая. */
  const [vspyshka, setVspyshka] = useState(false);
  useEffect(() => {
    if (!gotovo) return;
    try {
      if (window.localStorage.getItem(VIDEL(hranenie)) !== null) return;
      window.localStorage.setItem(VIDEL(hranenie), '1');
    } catch {
      return;
    }
    const nachalo = window.requestAnimationFrame(() => setVspyshka(true));
    const konec = window.setTimeout(() => setVspyshka(false), 1600);
    return () => {
      window.cancelAnimationFrame(nachalo);
      window.clearTimeout(konec);
    };
  }, [gotovo, hranenie]);

  const [otkryto, setOtkryto] = useState(false);
  const razbivka = T.razbivka(op, tr);
  const podpis = T.proydeno(n, iz);

  return (
    <div
      className={clsx(
        'koltso',
        gost && 'koltso--gost',
        gotovo && 'koltso--gotovo',
        vspyshka && 'koltso--vspyshka',
      )}
      style={{ '--koltso-p': dolya } as React.CSSProperties}
    >
      {Schyot === null || opornye === null ? null : (
        <Schyot hranenie={hranenie} ids={opornye} soobshchit={setOpResheno} />
      )}
      <div className="koltso__krug">
        <div className="koltso__media">{children}</div>
        <svg className="koltso__svg" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id={`kg-${id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--chertezh-akcent-svet)" />
              <stop offset="0.5" stopColor="var(--chertezh-akcent)" />
              <stop offset="1" stopColor="var(--chertezh-akcent)" />
            </linearGradient>
            <linearGradient id={`kz-${id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--chertezh-zoloto)" />
              <stop offset="0.5" stopColor="var(--chertezh-zoloto)" />
              <stop offset="1" stopColor="var(--chertezh-zoloto)" />
            </linearGradient>
          </defs>
          <circle className="koltso__lozhe" cx="100" cy="100" r="96" />
          {dolya > 0 ? (
            <>
              <circle className="koltso__svet" cx="100" cy="100" r="96" pathLength="100" />
              <circle
                className="koltso__hod"
                cx="100"
                cy="100"
                r="96"
                pathLength="100"
                stroke={`url(#${gotovo ? 'kz' : 'kg'}-${id})`}
              />
              <g className="koltso__golova">
                <circle cx="100" cy="4" r="3.4" />
              </g>
            </>
          ) : null}
        </svg>
      </div>
      <div
        className="koltso__podpis"
        onMouseEnter={() => setOtkryto(true)}
        onMouseLeave={() => setOtkryto(false)}
      >
        {!gost && iz === 0 ? null : gost ? (
          <a className="koltso__tekst koltso__tekst--gost" href={AUTH_HREF.voyti}>
            {T.gost}
          </a>
        ) : (
          <button
            type="button"
            className="koltso__tekst"
            aria-expanded={otkryto}
            aria-controls={`kr-${id}`}
            onClick={() => setOtkryto((v) => !v)}
            onBlur={() => setOtkryto(false)}
          >
            {gotovo ? (
              <span className="koltso__galochka">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="m5 12.5 4.5 4.5L19 7.5" />
                </svg>
                {T.proyden}
              </span>
            ) : (
              podpis
            )}
          </button>
        )}
        {gost || razbivka === '' ? null : (
          <span id={`kr-${id}`} role="status" className="koltso__razbivka" hidden={!otkryto}>
            {gotovo ? `${podpis}: ` : ''}
            {razbivka}
          </span>
        )}
      </div>
    </div>
  );
}
