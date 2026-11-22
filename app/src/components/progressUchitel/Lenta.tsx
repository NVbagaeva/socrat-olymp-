'use client';

/**
 * Лента «что решал, когда, сколько по времени»: задачи по дням, новые
 * сверху. У учителя строка ведёт в задачу и может нести пометку «очень
 * быстро»; у ученика — без ссылок и без пометок.
 */

import Link from 'next/link';
import { clsx } from 'clsx';
import { Badge, Tooltip } from '@/components/ui';
import { PROGRESS } from '@/content/progressUchitel';
import type { ZadachaView } from '@/lib/zhurnal/api';
import { ISKHODY, MESTA, dataRu, podpisRazdela } from '@/lib/zhurnal/vid';
import { Vremya } from './common';

const t = PROGRESS.uchenik;

const TON: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  right: 'success',
  hinted: 'warning',
  wrong: 'error',
  revealed: 'warning',
  skipped: 'neutral',
  left: 'neutral',
};

export function Lenta({
  zadachi,
  href,
}: {
  zadachi: readonly ZadachaView[];
  /** Ссылка на задачу (учитель); нет — строки без ссылок (ученик). */
  href?: (z: ZadachaView) => string;
}) {
  if (zadachi.length === 0) return <p>{t.lentaPusto}</p>;
  const dni = new Map<string, ZadachaView[]>();
  for (const z of zadachi) {
    const day = dataRu(z.started_at);
    dni.set(day, [...(dni.get(day) ?? []), z]);
  }
  return (
    <div className="pu-lenta">
      {[...dni.entries()].map(([day, list]) => (
        <section key={day} className="pu-lenta__den">
          <h3 className="pu-lenta__data">{day}</h3>
          <ul className="pu-lenta__spisok">
            {list.map((z) => {
              const zagolovok = `${podpisRazdela(z.task_no)} · ${MESTA[z.place] ?? z.place}`;
              const iskhod = z.outcome === undefined ? t.nePrisvoeno : (ISKHODY[z.outcome] ?? z.outcome);
              const detali = [
                z.attempts_n > 0 ? t.popytok(z.attempts_n) : null,
                z.hint_steps > 0 ? t.podskazki(z.hint_steps) : null,
                z.shown_solution ? t.reshenie : null,
                z.shown_fact ? t.svoystvo : null,
              ].filter((x): x is string => x !== null);
              const telo = (
                <>
                  <span className="pu-lenta__vremya">
                    {new Date(z.started_at).toLocaleTimeString('ru-RU', {
                      timeZone: 'Europe/Moscow',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="pu-lenta__glavnoe">
                    <span className="pu-lenta__zag">{zagolovok}</span>
                    <span className="t-caption">
                      тип {z.kind}
                      {z.last_answer === undefined ? '' : ` · ответ «${z.last_answer}»`}
                      {detali.length === 0 ? '' : ` · ${detali.join(', ')}`}
                    </span>
                  </span>
                </>
              );
              return (
                <li key={z.id} className={clsx('pu-lenta__z', href !== undefined && 'pu-lenta__z--ssylka')}>
                  {href === undefined ? (
                    <div className="pu-lenta__ssylka">{telo}</div>
                  ) : (
                    <Link className="pu-lenta__ssylka" href={href(z)}>
                      {telo}
                    </Link>
                  )}
                  <span className="pu-lenta__itog">
                    <Badge tone={TON[z.outcome ?? 'left'] ?? 'neutral'}>{iskhod}</Badge>
                    <Vremya active={z.active_ms} total={z.total_ms} />
                    {z.bystro === true ? (
                      <Tooltip content={t.bystroPodskazka}>
                        <span className="pu-bystro">{t.bystro}</span>
                      </Tooltip>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
