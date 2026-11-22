'use client';

/**
 * Страница для PDF /kabinet/progress/pechat/?u=…|klass=…&from=&to=&z=:
 * сводка ученика с лентой или таблица класса — в печатном виде. Кнопка
 * «Сохранить PDF» открывает окно печати, где выбирают «Сохранить как PDF»
 * (решение В-11): KaTeX и шрифты выходят как на экране.
 */

import { useEffect, useState } from 'react';
import { Button, EmptyState } from '@/components/ui';
import { NeedLogin } from '@/components/dz/common';
import { PROGRESS } from '@/content/progressUchitel';
import { useSessionUser } from '@/lib/auth/session';
import type { KlassView, UchenikView, ZadachaView } from '@/lib/zhurnal/api';
import { ISKHODY, MESTA, dataRu, nomerEgeRazdela, podpisRazdela, tochnost, vremya } from '@/lib/zhurnal/vid';
import { errorCode, param, zhurnalApi } from './common';
import './progressUchitel.css';

type Dannye =
  | { vid: 'uchenik'; u: UchenikView; lenta: ZadachaView[] }
  | { vid: 'klass'; k: KlassView };

export function ProgressPechat() {
  const user = useSessionUser();
  const [d, setD] = useState<Dannye | null>(null);
  const [error, setError] = useState<string | null>(null);
  const u = param('u');
  const klass = param('klass');
  const from = param('from') ?? '';
  const to = param('to') ?? '';
  const zParam = param('z');
  const taskNo = zParam === null ? null : Number(zParam);

  useEffect(() => {
    if (user === null || user.role !== 'tutor') return;
    let alive = true;
    void (async () => {
      try {
        const api = await zhurnalApi();
        const p = { from, to, taskNo };
        if (u !== null) {
          const lenta: ZadachaView[] = [];
          let before: string | null = null;
          for (let i = 0; i < 40; i += 1) {
            const l: ZadachaView[] = await api.uchitelLenta(u, p, before);
            lenta.push(...l);
            if (l.length < 50) break;
            before = l[l.length - 1]?.started_at ?? null;
          }
          const got = await api.uchitelUchenik(u, p);
          if (alive) setD({ vid: 'uchenik', u: got, lenta });
        } else if (klass !== null) {
          const k = await api.uchitelKlass(klass, p);
          if (alive) setD({ vid: 'klass', k });
        }
      } catch (e) {
        if (alive) setError(errorCode(e) === 'not_your_student' ? PROGRESS.neTvoy : PROGRESS.oshibka);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user, u, klass, from, to, taskNo]);

  if (user === null) return <NeedLogin text={PROGRESS.nuzhenVkhodUchitelya} />;
  if (user.role !== 'tutor') return <EmptyState title={PROGRESS.tolkoUchitel} description={PROGRESS.tolkoUchitelLead} />;
  if (error !== null) return <EmptyState title={error} description={PROGRESS.oshibkaLead} />;
  if (d === null) return <p className="pu-zagruzka">{PROGRESS.zagruzka}</p>;

  const imya = d.vid === 'uchenik' ? d.u.name : d.k.class.name;

  return (
    <div className="pu pu-pechat">
      <div className="pu-pechat__panel">
        <Button onClick={() => window.print()}>{PROGRESS.vygruzka.pechat}</Button>
        <p className="t-caption">{PROGRESS.vygruzka.pechatPodskazka}</p>
      </div>
      <h1 className="t-h2">{PROGRESS.pechat.zagolovok(imya)}</h1>
      <p className="t-caption">
        {PROGRESS.pechat.period(dataRu(from), dataRu(to))}
        {taskNo === null ? '' : ` · ${podpisRazdela(taskNo)}`}
        {' · '}
        {PROGRESS.pechat.sozdano(dataRu(new Date().toISOString(), true))}
      </p>

      {d.vid === 'uchenik' ? (
        <>
          <table className="pu-tablica">
            <tbody>
              <tr>
                <th scope="row">{PROGRESS.vremya.aktivnoe}</th>
                <td>
                  {vremya(d.u.svodka.active_ms)} (общее — {vremya(d.u.svodka.total_ms)})
                </td>
              </tr>
              <tr>
                <th scope="row">{PROGRESS.uchenik.reshenoZadach}</th>
                <td>{d.u.svodka.solved}</td>
              </tr>
              {d.u.svodka.po_zadaniyam.map((z) => {
                const p = tochnost(z.right, z.solved);
                return (
                  <tr key={z.task_no}>
                    <th scope="row">{podpisRazdela(z.task_no)}</th>
                    <td>
                      {p === null ? PROGRESS.uchenik.tochnostRano : `${p} %`} из {z.solved}
                    </td>
                  </tr>
                );
              })}
              {d.u.svodka.varianty.map((v) => (
                <tr key={v.id}>
                  <th scope="row">{v.title ?? 'Вариант'}</th>
                  <td>
                    {v.primary_score ?? '—'} из {v.max_score ?? '—'} перв., {v.test_score ?? '—'} тест.
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <h2 className="t-h3">{PROGRESS.uchenik.lenta}</h2>
          <table className="pu-tablica">
            <thead>
              <tr>
                {PROGRESS.excel.uchenik.slice(0, 7).map((h) => (
                  <th key={h} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.lenta.map((z) => (
                <tr key={z.id}>
                  <td>{dataRu(z.started_at, true)}</td>
                  <td>№{nomerEgeRazdela(z.task_no)}</td>
                  <td>{z.kind}</td>
                  <td>{MESTA[z.place] ?? z.place}</td>
                  <td>{z.outcome === undefined ? PROGRESS.uchenik.nePrisvoeno : ISKHODY[z.outcome]}</td>
                  <td>{z.last_answer ?? ''}</td>
                  <td>{z.answer_key ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <table className="pu-tablica">
          <thead>
            <tr>
              {PROGRESS.excel.klass.map((h) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {d.k.karta.map((c) => {
              const name = d.k.ucheniki.find((s) => s.id === c.id)?.name ?? '';
              return (
                <tr key={`${c.id}|${c.task_no}`}>
                  <td>{name}</td>
                  <td>{podpisRazdela(c.task_no)}</td>
                  <td>{c.solved}</td>
                  <td>{c.right}</td>
                  <td>{c.solved === 0 ? '—' : Math.round((100 * c.right) / c.solved)}</td>
                  <td>{Math.round(c.active_ms / 60000)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
