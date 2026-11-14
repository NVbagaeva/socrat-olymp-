'use client';

/**
 * ДЗ внутри раздела (№7, №8 и дальше):
 *   - ученику — плашка «Домашнее задание до 15.11 · сделано 4 из 14»
 *     над вкладками, если в ДЗ есть пункты этого раздела;
 *   - репетитору — кнопка «В домашнее задание» у набора карточек, блока
 *     опорных, задачи, выбранных тем тренажёра и плавающая плашка «В
 *     черновике ДЗ: 7 · Открыть» внизу экрана.
 * Гостю и при выключенном входе — ничего: SDK базы в первую загрузку
 * не попадает (модуль грузится только у вошедшего).
 */

import { clsx } from 'clsx';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { dueRu } from '@/content/dz';
import { DZK } from '@/content/dzIstochniki';
import { Ikonka } from '@/components/tasks/steklo';
import { AUTH_ENABLED } from '@/lib/auth/config';
import { useSessionUser } from '@/lib/auth/session';
import type { HwListItem } from '@/lib/dz/api';
import {
  dobavit,
  estVChernovike,
  useChernovik,
  zagruzitChernovik,
  type NovyyPunkt,
} from '@/lib/dz/chernovik';
import { RAZDELY_DZ_KLIENT } from '@/lib/dz/katalog/zagruzka';
import { DZ_HREF, homeworkHref } from '@/lib/dz/links';
import { statusOf } from '@/lib/dz/results';
import './dz-razdel.css';

export function useTutor(): boolean {
  const user = useSessionUser();
  return AUTH_ENABLED && user !== null && user.role === 'tutor';
}

/** Черновик загружается, как только видно, что вошёл репетитор. */
function useChernovikRepetitora() {
  const tutor = useTutor();
  const ch = useChernovik();
  useEffect(() => {
    if (tutor && ch.status === 'net') void zagruzitChernovik();
  }, [tutor, ch.status]);
  return { tutor, ch };
}

/** Кнопка «В домашнее задание». Только репетитору. */
export function VDzKnopka({
  punkt,
  chto,
  label = DZK.knopka.dobavit,
  className,
  malaya = false,
}: {
  punkt: NovyyPunkt;
  /** Что добавляем — для подписи кнопке экранного диктора. */
  chto: string;
  label?: string;
  className?: string;
  malaya?: boolean;
}) {
  const { tutor, ch } = useChernovikRepetitora();
  /* Раздел ещё не подключён к ДЗ — кнопки нет. */
  if (!tutor || !(RAZDELY_DZ_KLIENT as readonly number[]).includes(punkt.no)) return null;
  const est = ch.status === 'gotovo' && estVChernovike(punkt);
  return (
    <button
      type="button"
      className={clsx(
        'dzr-knopka stk-btn',
        malaya ? 'stk-btn--sm' : 'stk-btn--tihaya',
        est && 'is-est',
        className,
      )}
      data-block="dz-v-chernovik"
      aria-label={est ? `${DZK.knopka.dobavleno}: ${chto}` : DZK.knopka.aria(chto)}
      aria-pressed={est}
      disabled={ch.status === 'gruzitsya'}
      onClick={() => {
        if (!est) void dobavit(punkt);
      }}
    >
      <Ikonka name={est ? 'da' : 'plus'} /> {est ? DZK.knopka.dobavleno : label}
    </button>
  );
}

/**
 * Плашка «В черновике ДЗ: 7 · Открыть» — внизу экрана, левее кнопки
 * «?» и на её высоте (тот же --fab-lift): ничего не перекрывает.
 * Портал в body — как у «?»: предок с backdrop-filter сломал бы fixed.
 */
export function ChernovikPlashka() {
  const { tutor, ch } = useChernovikRepetitora();
  /* Репетитор известен только в браузере: на сборке здесь пусто. */
  if (
    !tutor ||
    typeof document === 'undefined' ||
    ch.status !== 'gotovo' ||
    ch.sostav.punkty.length === 0
  )
    return null;
  return createPortal(
    <aside
      className="dzr-plashka stk-glass"
      aria-label={DZK.plashka.aria}
      data-block="dz-chernovik-plashka"
    >
      <span className="dzr-plashka__text">{DZK.plashka.text(ch.sostav.punkty.length)}</span>
      <Link className="stk-btn stk-btn--primary stk-btn--sm dzr-plashka__go" href={DZ_HREF.vydat}>
        {DZK.plashka.otkryt}
      </Link>
    </aside>,
    document.body,
  );
}

/** Открытые ДЗ ученика с пунктами раздела no, ближайший срок — первым. */
function otkrytye(items: readonly HwListItem[], no: number): HwListItem[] {
  return items
    .filter((item) => item.hw.sections.includes(no))
    .filter((item) => {
      const s = statusOf(item.hw, item.recipients[0] ?? { startedAt: null, submittedAt: null });
      return s === 'new' || s === 'started' || s === 'late';
    })
    .sort((a, b) => Date.parse(a.hw.dueAt ?? '9999') - Date.parse(b.hw.dueAt ?? '9999'));
}

/** Ученику: «Домашнее задание до 15.11 · сделано 4 из 14». */
export function DzPlashkaUchenika({ no }: { no: number }) {
  const user = useSessionUser();
  const [items, setItems] = useState<HwListItem[]>([]);
  const student = AUTH_ENABLED && user !== null && user.role === 'student';
  useEffect(() => {
    if (!student) return;
    let alive = true;
    void (async () => {
      const { listHomework } = await import('@/lib/dz/api');
      const list = await listHomework('student').catch(() => []);
      if (alive) setItems(otkrytye(list, no));
    })();
    return () => {
      alive = false;
    };
  }, [student, no]);
  const first = items[0];
  if (!student || first === undefined) return null;
  return (
    <p className="dzr-uchenik stk-glass" role="status" data-block="dz-plashka">
      <span>
        {DZK.uchenik.plashka(
          first.hw.dueAt === null ? null : dueRu(first.hw.dueAt),
          first.done,
          first.tasks,
        )}
      </span>
      <Link className="stk-btn stk-btn--primary stk-btn--sm" href={homeworkHref(first.hw.id)}>
        {DZK.uchenik.otkryt}
      </Link>
    </p>
  );
}

/** Всё о ДЗ в разделе: плашка ученику и черновик репетитору. */
export function DzVRazdele({ no }: { no: number }) {
  return (
    <>
      <DzPlashkaUchenika no={no} />
      <ChernovikPlashka />
    </>
  );
}

/**
 * Карточки раздела: наборы (подтемы колоды) — каждый кнопкой в черновик
 * ДЗ. Только репетитору и только в подключённых к ДЗ разделах.
 */
export function VDzNabory({
  no,
  nabory,
}: {
  no: number;
  nabory: readonly { id: string; title: string; podpis: string }[];
}) {
  const tutor = useTutor();
  if (!tutor || !(RAZDELY_DZ_KLIENT as readonly number[]).includes(no)) return null;
  return (
    <details className="dzr-nabory stk-glass" data-block="dz-nabory">
      <summary className="stk-summary">
        {DZK.knopka.dobavit}: наборы карточек
        <span className="stk-shevron" aria-hidden="true" />
      </summary>
      <ul className="dzr-nabory__spisok">
        {nabory.map((t) => (
          <li key={t.id}>
            <span dangerouslySetInnerHTML={{ __html: t.title }} />
            <VDzKnopka
              malaya
              punkt={{ ist: 'kartochki', no, podtema: t.id, kartochki: null }}
              chto={`набор «${t.podpis}»`}
              label="В ДЗ"
            />
          </li>
        ))}
      </ul>
    </details>
  );
}
