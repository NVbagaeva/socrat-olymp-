'use client';

/**
 * Сводка за период — общая для учителя и ученика: время, решено,
 * точность по заданиям, тестовый балл по вариантам, слабые типы,
 * календарь активности. Пометок для учителя здесь нет: они только в
 * ленте учителя.
 */

import Link from 'next/link';
import { clsx } from 'clsx';
import { Card, Metric } from '@/components/ui';
import { PROGRESS } from '@/content/progressUchitel';
import type { Svodka } from '@/lib/zhurnal/api';
import {
  ISTOCHNIKI_VARIANTA,
  istochnikVarianta,
  dataRu,
  podpisRazdela,
  sdvig,
  stupen,
  tochnost,
  vremya,
  zadach,
} from '@/lib/zhurnal/vid';
import { Vremya } from './common';

const t = PROGRESS.uchenik;

export function SvodkaBlok({
  s,
  to,
  dney,
  variantHref,
  slabyeTitle = t.slabye,
}: {
  s: Svodka;
  to: string;
  dney: number;
  variantHref: (id: string) => string;
  slabyeTitle?: string;
}) {
  const p = tochnost(s.right, s.solved);
  return (
    <>
      <div className="pu-metriki">
        <Metric value={<Vremya active={s.active_ms} total={s.total_ms} />} label={PROGRESS.vremya.aktivnoe} />
        <Metric value={s.solved} label={t.reshenoZadach} />
        <Metric value={p === null ? '—' : `${p} %`} label={t.tochnost} />
      </div>

      <div className="kab-grid">
        <Card title={t.poZadaniyam}>
          {s.po_zadaniyam.length === 0 ? (
            <p>{t.lentaPusto}</p>
          ) : (
            <ul className="pu-polosy">
              {s.po_zadaniyam.map((z) => {
                const pz = tochnost(z.right, z.solved);
                return (
                  <li key={z.task_no}>
                    <span className="pu-polosy__imya">{podpisRazdela(z.task_no)}</span>
                    <span className="pu-polosy__dorozhka" aria-hidden>
                      <span
                        className={clsx('pu-polosy__polosa', `pu-cell--${stupen(z.right, z.solved)}`)}
                        style={{ width: `${pz ?? 0}%` }}
                      />
                    </span>
                    <span className="pu-polosy__chislo">
                      {pz === null ? t.tochnostRano : `${pz} %`} · {zadach(z.solved)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title={slabyeTitle}>
          {s.slabye.length === 0 ? (
            <p>{t.slabyePusto}</p>
          ) : (
            <ol className="pu-spisok pu-spisok--num">
              {s.slabye.map((w) => (
                <li key={`${w.task_no}|${w.kind}`}>
                  <span>
                    {podpisRazdela(w.task_no)}, тип {w.kind}
                  </span>
                  <span className="t-caption">
                    {Math.round((100 * w.right) / w.solved)} % из {w.solved}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card title={t.varianty}>
          {s.varianty.length === 0 ? (
            <p>{t.variantyPusto}</p>
          ) : (
            <>
              <Dinamika ballY={s.varianty.map((v) => v.test_score ?? null)} />
              <ul className="pu-spisok">
                {[...s.varianty].reverse().map((v) => (
                  <li key={v.id}>
                    <Link href={variantHref(v.id)}>
                      {v.title ?? ISTOCHNIKI_VARIANTA[istochnikVarianta(v)]}
                      {v.finished_at === undefined ? '' : `, ${dataRu(v.finished_at)}`}
                    </Link>
                    <span className="t-caption">
                      {/* Откуда вариант: собранный, серия, повышенной сложности, месяца, от учителя. */}
                      {ISTOCHNIKI_VARIANTA[istochnikVarianta(v)] ?? ''}
                      {v.primary_score !== undefined && v.max_score !== undefined
                        ? ` · ${t.pervichnyy(v.primary_score, v.max_score)}`
                        : ''}
                      {v.test_score !== undefined ? ` · ${t.testovyy(v.test_score)}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>

      <Card title={t.kalendar}>
        <Kalendar dni={s.dni} to={to} dney={Math.min(dney, 182)} />
      </Card>
    </>
  );
}

/** Динамика тестового балла: ломаная по вариантам, 0–100. */
function Dinamika({ ballY }: { ballY: (number | null)[] }) {
  const tochki = ballY.map((b, i) => [i, b] as const).filter((x): x is readonly [number, number] => x[1] !== null);
  if (tochki.length < 2) return null;
  const w = 300;
  const h = 80;
  const n = Math.max(1, ballY.length - 1);
  const xy = tochki.map(([i, b]) => `${((i / n) * (w - 16) + 8).toFixed(1)},${(h - 8 - (b / 100) * (h - 16)).toFixed(1)}`);
  return (
    <svg className="pu-dinamika" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Тестовый балл: ${tochki.map((x) => x[1]).join(', ')}`}>
      <polyline points={xy.join(' ')} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" />
      {xy.map((p, i) => {
        const [x, y] = p.split(',');
        return <circle key={i} cx={x} cy={y} r="4" fill="var(--color-accent)" />;
      })}
    </svg>
  );
}

/** Календарь: недели столбцами, дни строками, цвет — сколько решено. */
function Kalendar({ dni, to, dney }: { dni: Svodka['dni']; to: string; dney: number }) {
  const po = new Map(dni.map((d) => [d.day, d]));
  const vse: string[] = [];
  for (let i = dney - 1; i >= 0; i -= 1) vse.push(sdvig(to, i));
  const max = Math.max(1, ...dni.map((d) => d.solved));
  return (
    <div className="pu-kalendar" role="list">
      {vse.map((day) => {
        const d = po.get(day);
        const n = d?.solved ?? 0;
        const l = n === 0 ? 0 : Math.min(5, Math.ceil((5 * n) / max));
        const podpis = t.kalendarDen(dataRu(day), zadach(n), vremya(d?.active_ms ?? 0));
        return <span key={day} role="listitem" className="pu-den" data-l={l} title={podpis} aria-label={podpis} />;
      })}
    </div>
  );
}
