'use client';

/** Общие части экранов прогресса: загрузка, фильтры, время, календарь, лента. */

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { EmptyState, ProgressBar } from '@/components/ui';
import { tasksOf } from '@/content/tasks';
import { AUTH_HREF } from '@/lib/auth/config';
import { useSessionUser, type SessionUser } from '@/lib/auth/session';
import { assetUrl } from '@/lib/assetUrl';
import { sanitizeHtml } from '@/lib/dz/sanitize';
import { typeset } from '@/lib/tex';
import type { Svodka, VariantView, ZadachaView } from '@/lib/zhurnal/api';
import {
  ISTOCHNIK_VARIANTA,
  MESTO,
  PERIODY,
  dniPerioda,
  iskhodSlovami,
  nomerZadaniya,
  stupenDnya,
  tochnost,
  vremya,
  type PeriodId,
} from '@/lib/zhurnal/ekrany';

export const zhurnalApi = () => import('@/lib/zhurnal/api');

/** Параметр адреса страницы (страницы статические: читаем в браузере). */
export function queryParam(name: string): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(name);
}

const NAZVANIYA = new Map(
  tasksOf('profile')
    .filter((t) => t.hranenie !== undefined)
    .map((t) => [t.hranenie as number, t.name]),
);

export const nazvanieRazdela = (taskNo: number): string => NAZVANIYA.get(taskNo) ?? '';

export function kogda(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function denSlovami(day: string): string {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
}

/** Что показать вместо экрана: вход, не та роль. null — экран показывается. */
export function useDostup(role: SessionUser['role']): { user: SessionUser | null; zamena: ReactNode } {
  const user = useSessionUser();
  if (user === null) {
    return {
      user,
      zamena: (
        <EmptyState
          title="Прогресс — в кабинете"
          description="После входа здесь появятся решённые задачи и время занятий."
          action={
            <Link className="btn btn--primary" href={AUTH_HREF.voyti}>
              Войти
            </Link>
          }
        />
      ),
    };
  }
  if (user.role !== role) {
    return {
      user,
      zamena: (
        <EmptyState
          title={role === 'tutor' ? 'Экран для учителя' : 'Экран для ученика'}
          description={
            role === 'tutor'
              ? 'Прогресс учеников виден учителю класса. Своя статистика — в кабинете.'
              : 'Прогресс учеников — в кабинете, в карточке класса.'
          }
          action={
            <Link className="btn btn--primary" href={AUTH_HREF.kabinet}>
              В кабинет
            </Link>
          }
        />
      ),
    };
  }
  return { user, zamena: null };
}

type Sostoyanie<T> = { data: T | null; oshibka: string | null; klyuch: string | null };

/**
 * Данные экрана. `klyuch` — от чего зависит запрос: сменился — данные
 * запрашиваются заново, прежние остаются на экране до ответа.
 */
export function useZagruzka<T>(
  klyuch: string | null,
  zagruzit: () => Promise<T>,
): { data: T | null; oshibka: string | null; obnovlyaetsya: boolean } {
  const [s, setS] = useState<Sostoyanie<T>>({ data: null, oshibka: null, klyuch: null });
  useEffect(() => {
    if (klyuch === null) return undefined;
    let alive = true;
    zagruzit().then(
      (data) => {
        if (alive) setS({ data, oshibka: null, klyuch });
      },
      (e: unknown) => {
        const code = e instanceof Error && 'code' in e ? String((e as { code: string }).code) : 'unknown';
        if (alive) setS((prev) => ({ data: prev.data, oshibka: code, klyuch }));
      },
    );
    return () => {
      alive = false;
    };
    // Запрос зависит только от ключа: функция собирается из тех же значений.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [klyuch]);
  return { data: s.data, oshibka: s.oshibka, obnovlyaetsya: klyuch !== null && s.klyuch !== klyuch };
}

const OSHIBKI: Record<string, string> = {
  not_your_student: 'Этого ученика нет среди ваших учеников: журнал виден только учителю класса, пока ученик в нём.',
  forbidden: 'Этот экран доступен учителю своего класса.',
  not_found: 'Запись не найдена: она сделана до вступления ученика в класс или уже удалена по сроку хранения.',
};

export function Oshibka({ code }: { code: string }) {
  return (
    <p className="pr2-oshibka" role="alert">
      {OSHIBKI[code] ?? 'Данные не загрузились. Проверьте соединение и обновите страницу.'}
    </p>
  );
}

/** Период и задание. `zadaniya` — что предложить в списке; пусто — без выбора задания. */
export function Filtry({
  periodId,
  onPeriod,
  taskNo,
  onTaskNo,
  zadaniya,
  children,
}: {
  periodId: PeriodId;
  onPeriod: (id: PeriodId) => void;
  taskNo?: number | null;
  onTaskNo?: (taskNo: number | null) => void;
  zadaniya?: readonly number[];
  children?: ReactNode;
}) {
  return (
    <div className="pr2-filtry" data-section="filtry">
      <div className="pr2-period" role="group" aria-label="Период">
        {PERIODY.map((p) => (
          <button
            key={p.id}
            type="button"
            className="pr2-period__btn"
            aria-pressed={periodId === p.id}
            onClick={() => onPeriod(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>
      {onTaskNo !== undefined && zadaniya !== undefined && zadaniya.length > 0 ? (
        <label className="pr2-razdel">
          <span className="pr2-razdel__lbl">Задание</span>
          <select
            className="input pr2-razdel__select"
            value={taskNo ?? ''}
            onChange={(e) => onTaskNo(e.target.value === '' ? null : Number(e.target.value))}
          >
            <option value="">Все</option>
            {zadaniya.map((n) => (
              <option key={n} value={n}>
                {nomerZadaniya(n)} {nazvanieRazdela(n)}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {children === undefined ? null : <div className="pr2-filtry__deystviya">{children}</div>}
    </div>
  );
}

/** Активное время; общее — во всплывающей подсказке. */
export function Vremya({ active, total }: { active: number; total?: number }) {
  const podskazka = total === undefined || total <= 0 ? undefined : `Общее время: ${vremya(total)}`;
  return (
    <span className="pr2-vremya" title={podskazka} tabIndex={podskazka === undefined ? undefined : 0}>
      {vremya(active)}
      {podskazka === undefined ? null : <span className="sr-only"> ({podskazka})</span>}
    </span>
  );
}

/** Мягкая пометка для учителя: сигнал, а не вывод. */
export function Bystro({ ms }: { ms: number }) {
  const tekst = `Верный ответ за ${vremya(ms)} — быстрее, чем обычно на этом типе`;
  return (
    <span className="pr2-bystro" title={tekst} tabIndex={0}>
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 4.6V8l2.3 1.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      очень быстро
      <span className="sr-only">. {tekst}</span>
    </span>
  );
}

export function PoZadaniyam({ svodka }: { svodka: Svodka }) {
  if (svodka.po_zadaniyam.length === 0) {
    return <p className="pr2-note">Решённых задач за период нет.</p>;
  }
  return (
    <ul className="pr2-zadaniya">
      {svodka.po_zadaniyam.map((t) => (
        <li key={t.task_no} className="pr2-zadaniya__row">
          <span className="pr2-zadaniya__no">{nomerZadaniya(t.task_no)}</span>
          <span className="pr2-zadaniya__name">{nazvanieRazdela(t.task_no)}</span>
          <span className="pr2-zadaniya__schet">
            {t.right} из {t.solved}
            {tochnost(t.right, t.solved) === null ? null : <> · {tochnost(t.right, t.solved)}%</>}
          </span>
          <ProgressBar
            className="pr2-zadaniya__bar"
            value={tochnost(t.right, t.solved) ?? 0}
            label={`${nomerZadaniya(t.task_no)}: верно ${t.right} из ${t.solved}`}
          />
          <span className="pr2-zadaniya__vremya">{vremya(t.active_ms)}</span>
        </li>
      ))}
    </ul>
  );
}

export function Kalendar({
  from,
  to,
  dni,
  min,
}: {
  from: string;
  to: string;
  dni: Svodka['dni'];
  min?: string;
}) {
  const vse = dniPerioda(from, to, dni, min);
  const opis = (d: { day: string; solved: number; active_ms: number }) =>
    `${denSlovami(d.day)}: ${d.active_ms > 0 ? `${vremya(d.active_ms)}, задач — ${d.solved}` : 'без занятий'}`;
  return (
    <>
      <ol className="pr2-dni" aria-label="Календарь занятий">
        {vse.map((d) => (
          <li key={d.day} className="pr2-dni__den" data-l={stupenDnya(d.active_ms)} title={opis(d)}>
            <span className="sr-only">{opis(d)}</span>
          </li>
        ))}
      </ol>
      <p className="pr2-dni__legenda" aria-hidden="true">
        меньше <i data-l="1" /> <i data-l="2" /> <i data-l="3" /> <i data-l="4" /> больше
      </p>
    </>
  );
}

/** Динамика тестового балла по вариантам: столбики с числами. */
export function Varianty({
  varianty,
  ssylka,
}: {
  varianty: readonly VariantView[];
  ssylka: (v: VariantView) => string | null;
}) {
  if (varianty.length === 0) {
    return <p className="pr2-note">Вариантов за период нет.</p>;
  }
  return (
    <ul className="pr2-varianty">
      {varianty.map((v) => {
        const adres = ssylka(v);
        const nazvanie = v.title ?? ISTOCHNIK_VARIANTA[v.source];
        return (
          <li key={v.id} className="pr2-varianty__row">
            <span className="pr2-varianty__title">
              {adres === null ? nazvanie : <Link href={adres}>{nazvanie}</Link>}
            </span>
            <span className="pr2-varianty__kogda">
              {v.finished_at === undefined ? '' : kogda(v.finished_at)} · {vremya(v.active_ms)}
            </span>
            <span className="pr2-varianty__ball">
              {v.primary_score ?? '—'} из {v.max_score ?? '—'}
            </span>
            <span
              className="pr2-varianty__test"
              style={{ ['--pr2-dolya' as string]: `${v.test_score ?? 0}%` }}
              aria-label={v.test_score === undefined ? 'тестовый балл не считается' : `тестовый балл ${v.test_score}`}
            >
              <b>{v.test_score ?? '—'}</b>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Лента «что решал, когда, сколько по времени». */
export function Lenta({
  zadachi,
  ssylka,
  uchitel,
}: {
  zadachi: readonly ZadachaView[];
  ssylka: (z: ZadachaView) => string | null;
  uchitel: boolean;
}) {
  if (zadachi.length === 0) {
    return <p className="pr2-note">Задач за период нет.</p>;
  }
  return (
    <ul className="pr2-lenta">
      {zadachi.map((z) => {
        const i = iskhodSlovami(z);
        const adres = ssylka(z);
        const chto = (
          <>
            {MESTO[z.place] ?? z.place}
            <span className="pr2-lenta__tip"> · {z.kind}</span>
          </>
        );
        return (
          <li key={z.id} className="pr2-lenta__row">
            <span className="pr2-lenta__no">{nomerZadaniya(z.task_no)}</span>
            <span className="pr2-lenta__chto">{adres === null ? chto : <Link href={adres}>{chto}</Link>}</span>
            <span className="pr2-lenta__ishod" data-ton={i.ton}>
              {i.text}
              {uchitel && z.bystro === true ? <Bystro ms={z.active_ms} /> : null}
            </span>
            <span className="pr2-lenta__vremya">
              <Vremya active={z.active_ms} total={z.total_ms} />
            </span>
            <span className="pr2-lenta__kogda">{kogda(z.started_at)}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** Условие задачи, каким его видел ученик: сохранённое в журнале. */
export function Uslovie({ z }: { z: Pick<ZadachaView, 'uslovie_tex' | 'risunok'> }) {
  if (z.uslovie_tex === undefined) {
    return <p className="pr2-note">Условие этой задачи в журнале не сохранено.</p>;
  }
  /* №8 пишет условие в TeX, банк №5 и опорные — готовой разметкой. */
  const html = z.uslovie_tex.includes('<') ? sanitizeHtml(z.uslovie_tex) : typeset(z.uslovie_tex);
  return (
    <div className="pr2-uslovie">
      <div className="pr2-uslovie__tekst" dangerouslySetInnerHTML={{ __html: html }} />
      {z.risunok === undefined ? null : (
        /* Картинка задачи банка — тот же файл сайта, что видел ученик. */
        <img className="pr2-uslovie__risunok" src={assetUrl(z.risunok)} alt="Рисунок к условию" decoding="async" />
      )}
    </div>
  );
}
