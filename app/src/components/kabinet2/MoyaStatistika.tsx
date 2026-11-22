'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card, EmptyState, Metric, MetricRow, ProgressBar } from '@/components/ui';
import { nomerRazdela } from '@/content/struktura';
import { tasksOf } from '@/content/tasks';
import { AUTH_HREF } from '@/lib/auth/config';
import { useSessionUser } from '@/lib/auth/session';
import {
  dniPerioda,
  stupenDnya,
  tochnost,
  vremyaSlovami,
  zagruzitSvodku,
  type StrokaLenty,
  type Svodka,
} from '@/lib/zhurnal/svodka';
import './kabinet2.css';

const PERIODY = [
  { dney: 7, label: '7 дней' },
  { dney: 30, label: '30 дней' },
  { dney: 90, label: '3 месяца' },
] as const;

const ISTOCHNIK: Record<StrokaLenty['source'], string> = {
  trainer: 'тренажёр',
  opornye: 'опорная задача',
  cards: 'карточка',
  variant: 'вариант',
  homework: 'домашнее задание',
};

const ISHOD: Record<StrokaLenty['outcome'], { text: string; ton: 'da' | 'net' | 'tiho' }> = {
  right: { text: 'верно', ton: 'da' },
  hinted: { text: 'верно с подсказкой', ton: 'da' },
  wrong: { text: 'с ошибкой', ton: 'net' },
  revealed: { text: 'открыто решение', ton: 'tiho' },
  skipped: { text: 'пропущено', ton: 'tiho' },
};

const NAZVANIYA = new Map(
  tasksOf('profile')
    .filter((t) => t.hranenie !== undefined)
    .map((t) => [t.hranenie as number, t.name]),
);

function zadanie(taskNo: number): string {
  let nomer = taskNo;
  try {
    nomer = nomerRazdela(taskNo);
  } catch {
    /* Раздел убран из структуры — остаётся номер хранения. */
  }
  return `№${nomer}`;
}

function kogda(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function denSlovami(day: string): string {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
}

/**
 * «Моя статистика» — ученик о себе, по журналу решения: время, решено,
 * точность по заданиям, дни занятий, варианты, последние задачи.
 * Упрощённый вид: пометок для учителя здесь нет.
 */
export function MoyaStatistika() {
  const user = useSessionUser();
  const [dney, setDney] = useState<number>(7);
  const [data, setData] = useState<{ svodka: Svodka; lenta: StrokaLenty[] } | null>(null);
  const [oshibka, setOshibka] = useState(false);
  const [zagruzheno, setZagruzheno] = useState<number | null>(null);
  const uchenik = user !== null && user.role === 'student';

  useEffect(() => {
    if (!uchenik) return undefined;
    let alive = true;
    zagruzitSvodku(dney).then(
      (next) => {
        if (!alive) return;
        setData(next);
        setOshibka(false);
        setZagruzheno(dney);
      },
      () => {
        if (alive) setOshibka(true);
      },
    );
    return () => {
      alive = false;
    };
  }, [dney, uchenik]);

  if (user === null) {
    return (
      <EmptyState
        title="Статистика — в кабинете"
        description="После входа здесь появятся время занятий и решённые задачи."
        action={
          <Link className="btn btn--primary" href={AUTH_HREF.voyti}>
            Войти
          </Link>
        }
      />
    );
  }
  if (!uchenik) {
    return (
      <EmptyState
        title="Статистика — для ученика"
        description="Прогресс учеников — в кабинете, в карточке класса."
        action={
          <Link className="btn btn--primary" href={AUTH_HREF.kabinet}>
            В кабинет
          </Link>
        }
      />
    );
  }

  const svodka = data?.svodka ?? null;
  const zakryto = svodka === null ? 0 : svodka.tasks.reduce((sum, t) => sum + t.closed, 0);
  const obshchaya = svodka === null ? null : tochnost(svodka.solved, zakryto);
  const dni = svodka === null ? [] : dniPerioda(svodka.from, svodka.to, svodka.days);
  const zanimalsya = dni.filter((d) => d.active_ms > 0).length;

  return (
    <div className="kab2" data-page="moya-statistika">
      <Link className="dz-back kab2__back" href={AUTH_HREF.kabinet}>
        ← В кабинет
      </Link>
      <header className="kab2__head">
        <h1 className="t-h1 kab2__title">Моя статистика</h1>
        <div className="kab2-period" role="group" aria-label="Период">
          {PERIODY.map((p) => (
            <button
              key={p.dney}
              type="button"
              className="kab2-period__btn"
              aria-pressed={dney === p.dney}
              onClick={() => setDney(p.dney)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      {oshibka ? (
        <p className="vo-warn" role="alert">
          Статистика не загрузилась. Проверьте соединение и обновите страницу.
        </p>
      ) : svodka === null ? (
        <p className="kab2__status" role="status">
          Загрузка…
        </p>
      ) : zakryto === 0 && svodka.works.length === 0 ? (
        <EmptyState
          title="За этот период задач нет"
          description="Решённые задачи тренажёра, опорные задачи, карточки и варианты появятся здесь."
          action={
            <Link className="btn btn--primary" href="/zadaniya/">
              К заданиям
            </Link>
          }
        />
      ) : (
        <div className="kab2__grid" aria-busy={zagruzheno !== dney}>
          <Card className="stk-glass kab2-card kab2-card--wide" data-section="itogi">
            <MetricRow columns={3}>
              <Metric value={vremyaSlovami(svodka.active_ms)} label="время за задачами" />
              <Metric value={svodka.solved} label="решено задач" />
              <Metric value={obshchaya === null ? '—' : `${obshchaya}%`} label="точность" />
            </MetricRow>
            <p className="kab2-card__note">
              Время считается, пока страница открыта и есть действия: после двух минут без
              действий счёт встаёт на паузу.
            </p>
          </Card>

          <Card className="stk-glass kab2-card" title="По заданиям" data-section="zadaniya">
            {svodka.tasks.length === 0 ? (
              <p className="kab2-card__note">Задач по заданиям за период нет.</p>
            ) : (
              <ul className="kab2-zadaniya">
                {svodka.tasks.map((t) => {
                  const p = tochnost(t.right, t.closed);
                  return (
                    <li key={t.task_no} className="kab2-zadaniya__row">
                      <span className="kab2-zadaniya__no">{zadanie(t.task_no)}</span>
                      <span className="kab2-zadaniya__name">{NAZVANIYA.get(t.task_no) ?? ''}</span>
                      <span className="kab2-zadaniya__schet">
                        {t.right} из {t.closed}
                      </span>
                      <ProgressBar
                        className="kab2-zadaniya__bar"
                        value={p ?? 0}
                        label={`${zadanie(t.task_no)}: верно ${t.right} из ${t.closed}`}
                      />
                      <span className="kab2-zadaniya__vremya">{vremyaSlovami(t.active_ms)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card
            className="stk-glass kab2-card"
            title="Дни занятий"
            action={
              <span className="kab2-card__schet">
                {zanimalsya} из {dni.length}
              </span>
            }
            data-section="dni"
          >
            <ol className="kab2-dni" aria-label="Календарь занятий">
              {dni.map((d) => (
                <li
                  key={d.day}
                  className="kab2-dni__den"
                  data-l={stupenDnya(d.active_ms)}
                  title={`${denSlovami(d.day)}: ${
                    d.active_ms > 0
                      ? `${vremyaSlovami(d.active_ms)}, задач — ${d.closed}`
                      : 'без занятий'
                  }`}
                >
                  <span className="sr-only">
                    {denSlovami(d.day)}:{' '}
                    {d.active_ms > 0
                      ? `${vremyaSlovami(d.active_ms)}, задач — ${d.closed}`
                      : 'без занятий'}
                  </span>
                </li>
              ))}
            </ol>
            <p className="kab2-dni__legenda" aria-hidden="true">
              меньше <i data-l="1" /> <i data-l="2" /> <i data-l="3" /> <i data-l="4" /> больше
            </p>
          </Card>

          {svodka.works.length === 0 ? null : (
            <Card className="stk-glass stk-glass--warm kab2-card" title="Варианты" data-section="varianty">
              <ul className="kab2-raboty">
                {svodka.works.map((w) => (
                  <li key={w.id} className="kab2-raboty__row">
                    <span className="kab2-raboty__title">{w.title ?? 'Вариант'}</span>
                    <span className="kab2-raboty__kogda">{kogda(w.finished_at)}</span>
                    <span className="kab2-raboty__ball">
                      {w.primary ?? '—'} из {w.max ?? '—'}
                      {w.test === null ? null : (
                        <>
                          {' '}
                          · <b>{w.test}</b> тест.
                        </>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="stk-glass kab2-card kab2-card--wide" title="Последние задачи" data-section="lenta">
            {data === null || data.lenta.length === 0 ? (
              <p className="kab2-card__note">Задач за период нет.</p>
            ) : (
              <ul className="kab2-lenta">
                {data.lenta.map((r) => (
                  <li key={r.id} className="kab2-lenta__row">
                    <span className="kab2-lenta__no">{zadanie(r.task_no)}</span>
                    <span className="kab2-lenta__chto">{ISTOCHNIK[r.source]}</span>
                    <span className="kab2-lenta__ishod" data-ton={ISHOD[r.outcome].ton}>
                      {ISHOD[r.outcome].text}
                    </span>
                    <span className="kab2-lenta__vremya">{vremyaSlovami(r.active_ms)}</span>
                    <span className="kab2-lenta__kogda">{kogda(r.started_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
