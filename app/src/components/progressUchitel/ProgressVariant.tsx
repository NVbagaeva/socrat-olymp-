'use client';

/**
 * Вариант ученика /kabinet/progress/variant/?u=…&id=… (учитель) или
 * ?id=… (сам ученик): дата, первичный и тестовый балл, по каждой задаче —
 * ответ ученика, верный ответ, время, подсказки. Учитель проваливается в
 * задачу; у ученика строки без ссылок и без пометок.
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card, EmptyState } from '@/components/ui';
import { NeedLogin } from '@/components/dz/common';
import { PROGRESS } from '@/content/progressUchitel';
import { useSessionUser } from '@/lib/auth/session';
import type { VariantView } from '@/lib/zhurnal/api';
import { PROGRESS_HREF, progressUchenikHref, progressZadachaHref } from '@/lib/zhurnal/links';
import { ISTOCHNIKI_VARIANTA, dataRu, nomerEgeRazdela } from '@/lib/zhurnal/vid';
import { Vremya, errorCode, param, zhurnalApi } from './common';
import './progressUchitel.css';

const t = PROGRESS.variant;

export function ProgressVariant() {
  const user = useSessionUser();
  const [v, setV] = useState<VariantView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const u = param('u');
  const id = param('id');
  const uchitel = u !== null;

  useEffect(() => {
    if (user === null || id === null) return;
    let alive = true;
    void (async () => {
      try {
        const api = await zhurnalApi();
        const got = u === null ? await api.moyVariant(id) : await api.uchitelVariant(u, id);
        if (alive) setV(got);
      } catch (e) {
        const code = errorCode(e);
        if (alive)
          setError(code === 'not_your_student' ? PROGRESS.neTvoy : code === 'not_found' ? PROGRESS.neNaydeno : PROGRESS.oshibka);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user, u, id]);

  if (user === null) return <NeedLogin text={PROGRESS.nuzhenVkhod} />;
  if (error !== null) return <EmptyState title={error} description={PROGRESS.oshibkaLead} />;
  if (v === null && id !== null) return <p className="pu-zagruzka">{PROGRESS.zagruzka}</p>;
  if (v === null) return <EmptyState title={PROGRESS.neNaydeno} description={PROGRESS.oshibkaLead} />;

  return (
    <div className="pu kab-stack">
      <div>
        <Link className="pu-nazad" href={uchitel ? progressUchenikHref(u) : PROGRESS_HREF.statistika}>
          ← {t.nazad}
        </Link>
        <h1 className="t-h2">{v.title ?? ISTOCHNIKI_VARIANTA[v.source]}</h1>
        <p className="t-caption">
          {v.finished_at === undefined ? '' : dataRu(v.finished_at, true)}
          {v.primary_score !== undefined && v.max_score !== undefined
            ? ` · ${PROGRESS.uchenik.pervichnyy(v.primary_score, v.max_score)}`
            : ''}
          {v.test_score !== undefined ? ` · ${PROGRESS.uchenik.testovyy(v.test_score)}` : ''}
          {' · '}
          <Vremya active={v.active_ms} total={v.total_ms} />
        </p>
      </div>
      <Card>
        <div className="pu-karta-wrap">
          <table className="pu-tablica">
            <thead>
              <tr>
                <th scope="col">{t.zadanie}</th>
                <th scope="col">{t.otvetUchenika}</th>
                <th scope="col">{t.vernyy}</th>
                <th scope="col">{t.vremya}</th>
                <th scope="col">{t.podskazki}</th>
              </tr>
            </thead>
            <tbody>
              {(v.zadachi ?? []).map((z) => {
                const nomer = `№${nomerEgeRazdela(z.task_no)}`;
                return (
                  <tr key={z.id} className={z.outcome === 'right' || z.outcome === 'hinted' ? 'pu-str--da' : 'pu-str--net'}>
                    <th scope="row">
                      {uchitel ? <Link href={progressZadachaHref(u, z.id)}>{nomer}</Link> : nomer}
                    </th>
                    <td>{z.last_answer ?? t.netOtveta}</td>
                    <td>{z.answer_key ?? t.netOtveta}</td>
                    <td>
                      <Vremya active={z.active_ms} total={z.total_ms} />
                    </td>
                    <td>{z.hint_steps > 0 ? z.hint_steps : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
