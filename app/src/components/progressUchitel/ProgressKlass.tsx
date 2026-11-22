'use client';

/**
 * Прогресс класса /kabinet/progress/klass/?id=…: тепловая карта «ученики ×
 * задания» (доля верных за период), активность за неделю, кто давно не
 * заходил, кто не начал текущее ДЗ, выгрузка. Данные — функция базы
 * uchitel_klass: она сама проверяет, что класс учителя.
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { Button, Card, EmptyState } from '@/components/ui';
import { NeedLogin } from '@/components/dz/common';
import { PROGRESS } from '@/content/progressUchitel';
import { useSessionUser } from '@/lib/auth/session';
import { klassHref } from '@/lib/dz/links';
import { downloadXlsx, xlsx } from '@/lib/xlsx';
import type { KlassView } from '@/lib/zhurnal/api';
import { ZHURNAL_RAZDELY } from '@/lib/zhurnal/config';
import { progressPechatHref, progressUchenikHref } from '@/lib/zhurnal/links';
import {
  DAVNO_DNEY,
  dataRu,
  dneyBez,
  nomerEgeRazdela,
  periodIz,
  podpisRazdela,
  razdelyDlyaPokaza,
  stupen,
  zadach,
  vremya,
  type PeriodId,
} from '@/lib/zhurnal/vid';
import { imyaFayla, strokiKlassa } from '@/lib/zhurnal/vygruzka';
import { Filtry, errorCode, param, zhurnalApi } from './common';
import './progressUchitel.css';

const t = PROGRESS.klass;

export function ProgressKlass() {
  const user = useSessionUser();
  const [period, setPeriod] = useState<PeriodId>('30');
  const [taskNo, setTaskNo] = useState<number | null>(null);
  const [data, setData] = useState<KlassView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const classId = param('id');

  useEffect(() => {
    if (user === null || user.role !== 'tutor' || classId === null) return;
    let alive = true;
    void (async () => {
      try {
        const api = await zhurnalApi();
        const got = await api.uchitelKlass(classId, { ...periodIz(period), taskNo: null });
        if (alive) {
          setData(got);
          setError(null);
        }
      } catch (e) {
        if (alive) setError(errorCode(e) === 'forbidden' ? PROGRESS.tolkoUchitel : PROGRESS.oshibka);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user, classId, period]);

  if (user === null) return <NeedLogin text={PROGRESS.nuzhenVkhodUchitelya} />;
  if (user.role !== 'tutor') return <EmptyState title={PROGRESS.tolkoUchitel} description={PROGRESS.tolkoUchitelLead} />;
  if (error !== null) return <EmptyState title={error} description={PROGRESS.oshibkaLead} />;
  if (data === null || classId === null) return <p className="pu-zagruzka">{PROGRESS.zagruzka}</p>;

  const { from, to } = periodIz(period);
  const razdely = razdelyDlyaPokaza(ZHURNAL_RAZDELY).filter((n) => taskNo === null || n === taskNo);
  const yacheyka = new Map(data.karta.map((c) => [`${c.id}|${c.task_no}`, c]));
  const davno = data.ucheniki.filter((u) => {
    const d = dneyBez(u.last_day);
    return d === null || d > DAVNO_DNEY;
  });
  const neNachali = data.ucheniki.filter((u) => (u.ne_nachal_dz ?? []).length > 0);

  function excel() {
    if (data === null) return;
    downloadXlsx(imyaFayla(data.class.name, from, to), xlsx(PROGRESS.excel.list, strokiKlassa(data), [28, 30, 10, 10, 12, 18]));
  }

  return (
    <div className="pu kab-stack">
      <div className="kab-title-row">
        <div>
          <Link className="pu-nazad" href={klassHref(classId)}>
            ← {t.nazad}
          </Link>
          <h1 className="t-h2">{t.zagolovok(data.class.name)}</h1>
        </div>
        <div className="kab-actions">
          <Button variant="secondary" size="sm" onClick={excel}>
            {PROGRESS.vygruzka.excel}
          </Button>
          <Link className="btn btn--secondary btn--sm" href={progressPechatHref({ klass: classId, from, to, z: taskNo })}>
            {PROGRESS.vygruzka.pdf}
          </Link>
        </div>
      </div>

      <Filtry period={period} onPeriod={setPeriod} taskNo={taskNo} onTaskNo={setTaskNo} />

      {data.ucheniki.length === 0 ? (
        <EmptyState title={t.pusto} description={t.pustoLead} />
      ) : (
        <Card title={t.karta}>
          <p className="t-caption pu-lead">{t.kartaLead}</p>
          <div className="pu-karta-wrap">
            <table className="pu-karta">
              <thead>
                <tr>
                  <th scope="col" className="pu-karta__imya">
                    {t.uchenik}
                  </th>
                  {razdely.map((n) => (
                    <th key={n} scope="col" title={podpisRazdela(n)}>
                      №{nomerEgeRazdela(n)}
                    </th>
                  ))}
                  <th scope="col">{t.nedelya}</th>
                </tr>
              </thead>
              <tbody>
                {data.ucheniki.map((u) => (
                  <tr key={u.id}>
                    <th scope="row" className="pu-karta__imya">
                      <Link href={progressUchenikHref(u.id, classId)}>{u.name}</Link>
                    </th>
                    {razdely.map((n) => {
                      const c = yacheyka.get(`${u.id}|${n}`);
                      const solved = c?.solved ?? 0;
                      const right = c?.right ?? 0;
                      const s = stupen(right, solved);
                      const p = solved === 0 ? null : Math.round((100 * right) / solved);
                      return (
                        <td
                          key={n}
                          className={clsx('pu-cell', `pu-cell--${s}`, solved > 0 && solved < 3 && 'pu-cell--malo')}
                          title={
                            p === null
                              ? t.legenda.net
                              : solved < 3
                                ? t.malo(solved)
                                : `${podpisRazdela(n)}: ${t.yacheyka(p, solved)}`
                          }
                        >
                          {p === null ? '—' : `${p}%`}
                        </td>
                      );
                    })}
                    <td className="pu-nedelya">
                      {zadach(u.nedelya.solved)}
                      {' · '}
                      {vremya(u.nedelya.active_ms)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.karta.length === 0 ? <p className="t-caption">{t.pustoKarta}</p> : null}
          <p className="pu-legenda t-caption">
            {(['net', 'slabo', 'sredne', 'khorosho', 'otlichno'] as const).map((k, i) => (
              <span key={k}>
                <i className={`pu-cell pu-cell--${i}`} aria-hidden /> {t.legenda[k]}
              </span>
            ))}
          </p>
          {data.skryto > 0 ? <p className="t-caption">{t.skryto(data.skryto)}</p> : null}
        </Card>
      )}

      <div className="kab-grid">
        <Card title={t.davno}>
          <p className="t-caption pu-lead">{t.davnoLead}</p>
          {davno.length === 0 ? (
            <p>{t.davnoPusto}</p>
          ) : (
            <ul className="pu-spisok">
              {davno.map((u) => {
                const d = dneyBez(u.last_day);
                return (
                  <li key={u.id}>
                    <Link href={progressUchenikHref(u.id, classId)}>{u.name}</Link>
                    <span className="t-caption">{d === null ? t.nikogda : t.dneyNazad(d)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <Card title={t.neNachali}>
          {neNachali.length === 0 ? (
            <p>{t.neNachaliPusto}</p>
          ) : (
            <ul className="pu-spisok">
              {neNachali.map((u) => (
                <li key={u.id}>
                  <Link href={progressUchenikHref(u.id, classId)}>{u.name}</Link>
                  <span className="t-caption">
                    {(u.ne_nachal_dz ?? [])
                      .map((h) => (h.due_at === null ? h.title : `${h.title} — до ${dataRu(h.due_at, true)}`))
                      .join('; ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
