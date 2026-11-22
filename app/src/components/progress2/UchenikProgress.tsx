'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button, Card, EmptyState, Metric, MetricRow } from '@/components/ui';
import { AUTH_HREF } from '@/lib/auth/config';
import type { ZadachaView } from '@/lib/zhurnal/api';
import { ZHURNAL_RAZDELY } from '@/lib/zhurnal/config';
import { nomerZadaniya, period, tochnost, uchenikXlsx, vremya, type PeriodId } from '@/lib/zhurnal/ekrany';
import {
  klassProgressHref,
  pechatUchenikaHref,
  variantUchenikaHref,
  zadachaUchenikaHref,
} from '@/lib/zhurnal/links';
import {
  Filtry,
  Kalendar,
  Lenta,
  Oshibka,
  PoZadaniyam,
  Varianty,
  denSlovami,
  nazvanieRazdela,
  queryParam,
  useDostup,
  useZagruzka,
  zhurnalApi,
} from './obshchee';
import './progress2.css';

/** Какая задача куда ведёт: задача варианта — в вариант, остальные — в задачу. */
export function ssylkaZadachi(studentId: string, classId: string | null) {
  return (z: ZadachaView): string =>
    z.place === 'variant' && z.place_ref !== undefined
      ? variantUchenikaHref(studentId, z.place_ref, classId)
      : zadachaUchenikaHref(studentId, z.id, classId);
}

/**
 * Прогресс ученика для учителя: сводка за период, точность по заданиям,
 * тестовый балл по вариантам, пять слабых типов, календарь и лента.
 */
export function UchenikProgress() {
  const { user, zamena } = useDostup('tutor');
  const [studentId] = useState(() => queryParam('id'));
  const [classId] = useState(() => queryParam('klass'));
  const [periodId, setPeriodId] = useState<PeriodId>('30');
  const [taskNo, setTaskNo] = useState<number | null>(null);
  const [now] = useState(() => Date.now());
  const [eshche, setEshche] = useState<ZadachaView[]>([]);
  const [konets, setKonets] = useState(false);
  const p = { ...period(periodId, now), taskNo };
  const klyuch = zamena === null && user !== null && studentId !== null ? `${studentId}|${p.from}|${p.to}|${taskNo}` : null;
  const { data, oshibka, obnovlyaetsya } = useZagruzka(klyuch, async () => {
    const api = await zhurnalApi();
    const [uchenik, lenta] = await Promise.all([
      api.uchitelUchenik(studentId ?? '', p),
      api.uchitelLenta(studentId ?? '', p),
    ]);
    setEshche([]);
    setKonets(lenta.length < 50);
    return { uchenik, lenta };
  });

  if (zamena !== null) return zamena;
  if (studentId === null) {
    return (
      <EmptyState
        title="Ученик не выбран"
        description="Прогресс ученика открывается из прогресса класса."
        action={
          <Link className="btn btn--primary" href={AUTH_HREF.kabinet}>
            В кабинет
          </Link>
        }
      />
    );
  }

  const lenta = data === null ? [] : [...data.lenta, ...eshche];
  const svodka = data?.uchenik.svodka ?? null;

  async function dalshe() {
    const poslednyaya = lenta[lenta.length - 1];
    if (poslednyaya === undefined) return;
    const next = await (await zhurnalApi()).uchitelLenta(studentId ?? '', p, poslednyaya.started_at);
    setEshche((prev) => [...prev, ...next]);
    setKonets(next.length < 50);
  }

  async function skachat() {
    if (data === null) return;
    const { xlsx, downloadXlsx } = await import('@/lib/xlsx');
    const t = uchenikXlsx(data.uchenik, lenta, p.from, p.to);
    downloadXlsx(`Прогресс — ${data.uchenik.name} — ${p.to}.xlsx`, xlsx('Ученик', t.rows, t.widths));
  }

  return (
    <div className="pr2" data-page="uchenik-progress">
      <Link className="dz-back pr2__back" href={classId === null ? AUTH_HREF.kabinet : klassProgressHref(classId)}>
        {classId === null ? '← В кабинет' : '← К прогрессу класса'}
      </Link>
      <header className="pr2__head">
        <h1 className="t-h1 pr2__title">{data === null ? 'Прогресс ученика' : data.uchenik.name}</h1>
        {data === null ? null : (
          <p className="pr2__pod">Записи видны с {denSlovami(data.uchenik.s)} — со дня вступления в класс.</p>
        )}
      </header>

      <Filtry periodId={periodId} onPeriod={setPeriodId} taskNo={taskNo} onTaskNo={setTaskNo} zadaniya={ZHURNAL_RAZDELY}>
        <Button variant="secondary" size="sm" onClick={() => void skachat()} disabled={data === null}>
          Скачать Excel
        </Button>
        <Link
          className="btn btn--ghost btn--sm"
          href={pechatUchenikaHref(studentId, p.from, p.to, classId)}
          target="_blank"
          rel="noopener"
        >
          Печать / PDF
        </Link>
      </Filtry>

      {oshibka !== null ? <Oshibka code={oshibka} /> : null}
      {data === null || svodka === null ? (
        oshibka === null ? (
          <p className="pr2__status" role="status">
            Загрузка…
          </p>
        ) : null
      ) : (
        <div className="pr2__grid" aria-busy={obnovlyaetsya}>
          {data.uchenik.progress_allowed ? null : (
            <p className="pr2-note pr2-card--wide">
              Журнал этого ученика не ведётся: ждём согласия родителя.
            </p>
          )}
          <Card className="stk-glass pr2-card pr2-card--wide" data-section="itogi">
            <MetricRow columns={3}>
              <Metric
                size="compact"
                value={<span title={`Общее время: ${vremya(svodka.total_ms)}`}>{vremya(svodka.active_ms)}</span>}
                label="активное время"
              />
              <Metric size="compact" value={svodka.solved} label="решено задач" />
              <Metric
                size="compact"
                value={tochnost(svodka.right, svodka.solved) === null ? '—' : `${tochnost(svodka.right, svodka.solved)}%`}
                label="точность"
              />
            </MetricRow>
          </Card>

          <Card className="stk-glass pr2-card" title="Точность по заданиям" data-section="zadaniya">
            <PoZadaniyam svodka={svodka} />
          </Card>

          <Card className="stk-glass stk-glass--warm pr2-card" title="Пять самых слабых типов" data-section="slabye">
            {svodka.slabye.length === 0 ? (
              <p className="pr2-note">Тип попадает сюда после трёх решённых задач.</p>
            ) : (
              <ul className="pr2-spisok">
                {svodka.slabye.map((s) => (
                  <li key={`${s.task_no}:${s.kind}`}>
                    <span>
                      <b>{nomerZadaniya(s.task_no)}</b> {s.kind}
                      <span className="pr2-lenta__tip"> · {nazvanieRazdela(s.task_no)}</span>
                    </span>
                    <span>
                      {s.right} из {s.solved} · {tochnost(s.right, s.solved)}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="stk-glass pr2-card" title="Тестовый балл по вариантам" data-section="varianty">
            <Varianty varianty={svodka.varianty} ssylka={(v) => variantUchenikaHref(studentId, v.id, classId)} />
          </Card>

          <Card className="stk-glass pr2-card" title="Календарь активности" data-section="dni">
            <Kalendar from={p.from} to={p.to} dni={svodka.dni} min={data.uchenik.s} />
          </Card>

          <Card className="stk-glass pr2-card pr2-card--wide" title="Что решал" data-section="lenta">
            <Lenta zadachi={lenta} ssylka={ssylkaZadachi(studentId, classId)} uchitel />
            {konets || lenta.length === 0 ? null : (
              <Button variant="ghost" size="sm" className="pr2-eshche" onClick={() => void dalshe()}>
                Показать ещё
              </Button>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
