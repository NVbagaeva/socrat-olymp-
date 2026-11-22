'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Card, EmptyState, Metric, MetricRow } from '@/components/ui';
import { AUTH_HREF } from '@/lib/auth/config';
import { ISTOCHNIK_VARIANTA, iskhodSlovami, nomerZadaniya, vremya } from '@/lib/zhurnal/ekrany';
import { uchenikHref } from '@/lib/zhurnal/links';
import { Bystro, Oshibka, Uslovie, kogda, nazvanieRazdela, queryParam, useDostup, useZagruzka, zhurnalApi } from './obshchee';
import { HodResheniya } from './ZadachaProsmotr';
import './progress2.css';

/**
 * Вариант ученика: баллы, время и каждая задача — ответ ученика, верный
 * ответ, время, подсказки. Задача раскрывается: условие и попытки.
 */
export function VariantProsmotr() {
  const { user, zamena } = useDostup('tutor');
  const [id] = useState(() => queryParam('id'));
  const [studentId] = useState(() => queryParam('uchenik'));
  const [classId] = useState(() => queryParam('klass'));
  const mozhno = zamena === null && user !== null && id !== null && studentId !== null;
  const { data, oshibka } = useZagruzka(mozhno ? `${studentId}|${id}` : null, async () =>
    (await zhurnalApi()).uchitelVariant(studentId ?? '', id ?? ''),
  );

  if (zamena !== null) return zamena;
  if (id === null || studentId === null) {
    return (
      <EmptyState
        title="Вариант не выбран"
        description="Вариант открывается со страницы ученика."
        action={
          <Link className="btn btn--primary" href={AUTH_HREF.kabinet}>
            В кабинет
          </Link>
        }
      />
    );
  }
  const zadachi = data?.zadachi ?? [];

  return (
    <div className="pr2" data-page="variant-uchenika">
      <Link className="dz-back pr2__back" href={uchenikHref(studentId, classId)}>
        ← К ученику
      </Link>
      {oshibka !== null ? <Oshibka code={oshibka} /> : null}
      {data === null ? (
        oshibka === null ? (
          <p className="pr2__status" role="status">
            Загрузка…
          </p>
        ) : null
      ) : (
        <>
          <header className="pr2__head">
            <h1 className="t-h1 pr2__title">{data.title ?? ISTOCHNIK_VARIANTA[data.source]}</h1>
            <p className="pr2__pod">
              {ISTOCHNIK_VARIANTA[data.source]}
              {data.finished_at === undefined ? ' · не завершён' : ` · ${kogda(data.finished_at)}`}
            </p>
          </header>
          <div className="pr2__grid">
            <Card className="stk-glass stk-glass--warm pr2-card pr2-card--wide" data-section="itogi">
              <MetricRow columns={3}>
                <Metric
                  size="compact"
                  value={`${data.primary_score ?? '—'} из ${data.max_score ?? '—'}`}
                  label="первичный балл"
                />
                <Metric size="compact" value={data.test_score ?? '—'} label="тестовый балл" />
                <Metric
                  size="compact"
                  value={<span title={`Общее время: ${vremya(data.total_ms)}`}>{vremya(data.active_ms)}</span>}
                  label="активное время"
                />
              </MetricRow>
            </Card>
            <Card className="stk-glass pr2-card pr2-card--wide" title="Задачи варианта" data-section="zadachi">
              {zadachi.length === 0 ? (
                <p className="pr2-note">
                  По задачам этого варианта записей нет: в журнал идут задачи разделов, где он включён.
                </p>
              ) : (
                <ul className="pr2-zv">
                  {zadachi.map((z) => {
                    const i = iskhodSlovami(z);
                    return (
                      <li key={z.id} className="pr2-zv__item">
                        <details>
                          <summary className="pr2-zv__row">
                            <span className="pr2-zv__no">{nomerZadaniya(z.task_no)}</span>
                            <span className="pr2-zv__name">{nazvanieRazdela(z.task_no)}</span>
                            <span className="pr2-zv__otvet">
                              <span className="pr2-zv__lbl">ответ ученика</span> {z.last_answer ?? '—'}
                            </span>
                            <span className="pr2-zv__otvet">
                              <span className="pr2-zv__lbl">верный</span> {z.answer_key ?? '—'}
                            </span>
                            <span className="pr2-zv__ishod" data-ton={i.ton}>
                              {i.text}
                              {z.bystro === true ? <Bystro ms={z.active_ms} /> : null}
                            </span>
                            <span className="pr2-zv__vremya">{vremya(z.active_ms)}</span>
                          </summary>
                          <div className="pr2-zv__telo">
                            <Uslovie z={z} />
                            <HodResheniya z={z} uchitel />
                          </div>
                        </details>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
