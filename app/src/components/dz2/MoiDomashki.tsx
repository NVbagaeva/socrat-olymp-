'use client';

/**
 * «Мои домашки» ученика /kabinet/domashki/ и карточка в кабинете
 * (docs/kabinet-dz2.md, PR 2в): ДЗ новой выдачи с дедлайном по Москве,
 * статусом и тем, сколько элементов выполнено.
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge, Card, EmptyState } from '@/components/ui';
import type { BadgeTone } from '@/components/ui/Badge';
import { NeedLogin } from '@/components/dz/common';
import { DZ2 } from '@/content/dz2';
import { useSessionUser } from '@/lib/auth/session';
import { DZ2_HREF, dz2ReshatHref } from '@/lib/dz2/links';
import {
  aktivnaya,
  poryadok,
  sdano,
  type MoyaDomashka,
  type StatusUchenika,
} from '@/lib/dz2/uchenik';
import { dataRu } from '@/lib/zhurnal/vid';
import './dz2.css';

const t = DZ2.uchenik;

type Ton = BadgeTone;

export function tonStatusa(s: StatusUchenika): Ton {
  if (s === 'submitted') return 'success';
  if (s === 'late') return 'warning';
  if (s === 'missed') return 'error';
  if (s === 'returned') return 'warning';
  if (s === 'in_progress') return 'info';
  return 'neutral';
}

/** Загрузка «Моих домашек»: null — ещё грузится. */
function useMoi(vkl: boolean): { list: MoyaDomashka[] | null; error: boolean; seychas: number } {
  const [list, setList] = useState<MoyaDomashka[] | null>(null);
  const [error, setError] = useState(false);
  const [seychas, setSeychas] = useState(0);
  useEffect(() => {
    if (!vkl) return;
    let alive = true;
    void (async () => {
      try {
        const got = await (await import('@/lib/dz2/api')).dz2Moi();
        if (alive) {
          setList(got);
          setSeychas(Date.now());
        }
      } catch {
        if (alive) setError(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [vkl]);
  return { list, error, seychas };
}

function Stroka({ d }: { d: MoyaDomashka }) {
  const deystvie = sdano(d.status)
    ? t.posmotret
    : d.status === 'not_started'
      ? t.otkryt
      : t.prodolzhit;
  return (
    <Card className="dz2-kartochka dz2-u-kartochka" data-dz2={d.id} data-status={d.status}>
      <div className="dz2-kartochka__verh">
        <Badge tone={tonStatusa(d.status)}>{t.statusy[d.status]}</Badge>
        {d.kontrol ? <Badge tone="info">{t.kontrol}</Badge> : null}
        <h2 className="dz2-kartochka__nazvanie">{d.title}</h2>
      </div>
      <p className="t-caption">
        {[
          d.due_at === undefined ? t.bezSroka : t.srok(dataRu(d.due_at, true)),
          t.elementov(d.items_done, d.items),
          d.tutor_name === undefined ? null : t.ot(d.tutor_name),
        ]
          .filter((x): x is string => x !== null)
          .join(' · ')}
      </p>
      <div
        className="dz2-u-polosa"
        role="progressbar"
        aria-label={t.elementov(d.items_done, d.items)}
        aria-valuemin={0}
        aria-valuemax={d.items}
        aria-valuenow={d.items_done}
      >
        <span
          style={{ width: `${d.items === 0 ? 0 : Math.round((d.items_done / d.items) * 100)}%` }}
        />
      </div>
      <div className="kab-actions">
        <Link
          className={sdano(d.status) ? 'btn btn--secondary btn--sm' : 'btn btn--primary btn--sm'}
          href={dz2ReshatHref(d.id)}
        >
          {deystvie}
        </Link>
      </div>
    </Card>
  );
}

export function MoiDomashki() {
  const user = useSessionUser();
  const { list, error, seychas } = useMoi(user !== null && user.role === 'student');

  if (user === null) return <NeedLogin text="Войди в кабинет ученика." />;
  if (user.role !== 'student')
    return <EmptyState title={t.tolkoUchenik} description={t.tolkoUchenikLead} />;

  const vse = list === null ? [] : poryadok(list, seychas);
  const aktivnye = vse.filter((d) => aktivnaya(d, seychas));
  const proshlye = vse.filter((d) => !aktivnaya(d, seychas));

  return (
    <div className="dz2 dz2-u kab-stack" data-page="moi-domashki">
      <div className="dz2-u-zag">
        <h1 className="t-h2">{t.zagolovok}</h1>
        <p className="t-caption">{t.lead}</p>
      </div>
      {error ? (
        <p className="dz2-oshibka" role="alert">
          {t.oshibka('unknown')}
        </p>
      ) : null}
      {list === null ? null : list.length === 0 ? (
        <EmptyState title={t.pusto} description={t.pustoLead} />
      ) : (
        <>
          {aktivnye.length > 0 ? (
            <section className="dz2-spisok" aria-labelledby="dz2-u-aktivnye">
              <h2 className="dz2-podzag" id="dz2-u-aktivnye">
                {t.aktivnye}
              </h2>
              {aktivnye.map((d) => (
                <Stroka key={d.id} d={d} />
              ))}
            </section>
          ) : null}
          {proshlye.length > 0 ? (
            <section className="dz2-spisok" aria-labelledby="dz2-u-proshlye">
              <h2 className="dz2-podzag" id="dz2-u-proshlye">
                {t.proshlye}
              </h2>
              {proshlye.map((d) => (
                <Stroka key={d.id} d={d} />
              ))}
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

/** Карточка в кабинете ученика: до трёх активных ДЗ и ссылка на все. */
export function MoiDomashkiKartochka() {
  const { list, seychas } = useMoi(true);
  const aktivnye =
    list === null ? [] : poryadok(list, seychas).filter((d) => aktivnaya(d, seychas));
  return (
    <Card className="kabinet__card" title={t.zagolovok} data-section="dz2-uchenik">
      {list === null ? (
        <p className="auth-form__muted">…</p>
      ) : aktivnye.length === 0 ? (
        <p className="auth-form__text">{t.kartochkaPusto}</p>
      ) : (
        <ul className="dz2-u-mini">
          {aktivnye.slice(0, 3).map((d) => (
            <li key={d.id} className="dz2-u-mini__stroka">
              <Link href={dz2ReshatHref(d.id)}>{d.title}</Link>
              <span className="t-caption">
                {t.statusy[d.status]} ·{' '}
                {d.due_at === undefined ? t.bezSroka : t.srok(dataRu(d.due_at, true))}
              </span>
            </li>
          ))}
        </ul>
      )}
      <Link className="btn btn--secondary" href={DZ2_HREF.moi}>
        {t.vseDomashki}
        {aktivnye.length > 0 ? ` (${aktivnye.length})` : ''}
      </Link>
    </Card>
  );
}
