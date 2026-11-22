'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Card, EmptyState, Metric, MetricRow } from '@/components/ui';
import { AUTH_HREF } from '@/lib/auth/config';
import { ZHURNAL_RAZDELY } from '@/lib/zhurnal/config';
import { period, tochnost, vremya, type PeriodId } from '@/lib/zhurnal/ekrany';
import { Filtry, Kalendar, Lenta, Oshibka, PoZadaniyam, Varianty, useDostup, useZagruzka, zhurnalApi } from './obshchee';
import './progress2.css';

/**
 * «Моя статистика» — ученик о себе: время, решено, точность по
 * заданиям, дни занятий, варианты, последние задачи. Упрощённый вид:
 * пометок для учителя база ученику не отдаёт, и экран их не рисует.
 */
export function MoyaStatistika() {
  const { user, zamena } = useDostup('student');
  const [periodId, setPeriodId] = useState<PeriodId>('7');
  const [taskNo, setTaskNo] = useState<number | null>(null);
  const [now] = useState(() => Date.now());
  const p = { ...period(periodId, now), taskNo };
  const { data, oshibka, obnovlyaetsya } = useZagruzka(
    zamena === null && user !== null ? `${p.from}|${p.to}|${taskNo}` : null,
    async () => {
      const api = await zhurnalApi();
      const [svodka, lenta] = await Promise.all([api.moyaStatistika(p), api.moyaLenta(p)]);
      return { svodka, lenta };
    },
  );

  if (zamena !== null) return zamena;
  const s = data?.svodka ?? null;

  return (
    <div className="pr2" data-page="moya-statistika">
      <Link className="dz-back pr2__back" href={AUTH_HREF.kabinet}>
        ← В кабинет
      </Link>
      <header className="pr2__head">
        <h1 className="t-h1 pr2__title">Моя статистика</h1>
      </header>
      <Filtry periodId={periodId} onPeriod={setPeriodId} taskNo={taskNo} onTaskNo={setTaskNo} zadaniya={ZHURNAL_RAZDELY} />

      {oshibka !== null ? <Oshibka code={oshibka} /> : null}
      {data === null || s === null ? (
        oshibka === null ? (
          <p className="pr2__status" role="status">
            Загрузка…
          </p>
        ) : null
      ) : s.solved === 0 && s.varianty.length === 0 && data.lenta.length === 0 ? (
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
        <div className="pr2__grid" aria-busy={obnovlyaetsya}>
          <Card className="stk-glass pr2-card pr2-card--wide" data-section="itogi">
            <MetricRow columns={3}>
              <Metric size="compact" value={vremya(s.active_ms)} label="время за задачами" />
              <Metric size="compact" value={s.solved} label="решено задач" />
              <Metric
                size="compact"
                value={tochnost(s.right, s.solved) === null ? '—' : `${tochnost(s.right, s.solved)}%`}
                label="точность"
              />
            </MetricRow>
            <p className="pr2-note">
              Время считается, пока страница открыта и есть действия: после двух минут без действий
              счёт встаёт на паузу.
            </p>
          </Card>
          <Card className="stk-glass pr2-card" title="По заданиям" data-section="zadaniya">
            <PoZadaniyam svodka={s} />
          </Card>
          <Card className="stk-glass pr2-card" title="Дни занятий" data-section="dni">
            <Kalendar from={p.from} to={p.to} dni={s.dni} />
          </Card>
          {s.varianty.length === 0 ? null : (
            <Card className="stk-glass stk-glass--warm pr2-card pr2-card--wide" title="Варианты" data-section="varianty">
              <Varianty varianty={s.varianty} ssylka={() => null} />
            </Card>
          )}
          <Card className="stk-glass pr2-card pr2-card--wide" title="Последние задачи" data-section="lenta">
            <Lenta zadachi={data.lenta} ssylka={() => null} uchitel={false} />
          </Card>
        </div>
      )}
    </div>
  );
}
