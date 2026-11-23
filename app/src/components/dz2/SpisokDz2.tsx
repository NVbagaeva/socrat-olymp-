'use client';

/**
 * Домашние задания учителя /kabinet/dz2/: черновики, шаблоны, выданные
 * (docs/kabinet-dz2.md). Действия: открыть черновик или шаблон в мастере,
 * «Повторить» (копия в черновик — выдать другому классу), «В шаблоны»,
 * удалить черновик или шаблон, закрыть или открыть приём.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Card, EmptyState } from '@/components/ui';
import { Confirm, NeedLogin } from '@/components/dz/common';
import { DZ2 } from '@/content/dz2';
import { useSessionUser } from '@/lib/auth/session';
import type { Dz2Kratko } from '@/lib/dz2/api';
import type * as Dz2ApiModule from '@/lib/dz2/api';
import { useKorzina } from '@/lib/dz2/korzina';
import { DZ2_HREF, dz2ItogiHref, dz2VydatHref } from '@/lib/dz2/links';
import { dataRu } from '@/lib/zhurnal/vid';
import './dz2.css';

const t = DZ2.spisok;
type Dz2Api = typeof Dz2ApiModule;

export function SpisokDz2() {
  const user = useSessionUser();
  const router = useRouter();
  const k = useKorzina();
  const [list, setList] = useState<Dz2Kratko[] | null>(null);
  const [error, setError] = useState(false);
  const [udalit, setUdalit] = useState<Dz2Kratko | null>(null);
  /* «Сейчас» — на момент загрузки списка: отрисовка остаётся чистой. */
  const [seychas, setSeychas] = useState(0);

  const load = useCallback(async () => {
    try {
      setList(await (await import('@/lib/dz2/api')).dz2Spisok());
      setSeychas(Date.now());
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    if (user === null || user.role !== 'tutor') return;
    let alive = true;
    void (async () => {
      try {
        const got = await (await import('@/lib/dz2/api')).dz2Spisok();
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
  }, [user]);

  if (user === null) return <NeedLogin text="Войдите в кабинет учителя." />;
  if (user.role !== 'tutor') return <EmptyState title={DZ2.tolkoUchitel} description={DZ2.tolkoUchitelLead} />;

  async function act(run: (api: Dz2Api) => Promise<unknown>) {
    try {
      await run(await import('@/lib/dz2/api'));
      await load();
    } catch {
      setError(true);
    }
  }

  async function kopiya(id: string, status: 'draft' | 'template') {
    try {
      const novyy = await (await import('@/lib/dz2/api')).dz2Copy(id, status);
      if (status === 'draft') router.push(dz2VydatHref(novyy));
      else await load();
    } catch {
      setError(true);
    }
  }

  return (
    <div className="dz2 kab-stack">
      <div className="kab-title-row">
        <div>
          <h1 className="t-h2">{t.zagolovok}</h1>
          <p className="t-caption">{t.lead}</p>
        </div>
        <Link className="btn btn--primary" href={DZ2_HREF.vydat}>
          {t.novoe}
          {k.elementy.length > 0 ? ` (${k.elementy.length})` : ''}
        </Link>
      </div>
      {error ? (
        <p className="dz2-oshibka" role="alert">
          {DZ2.master.oshibkaBazy('unknown')}
        </p>
      ) : null}
      {list === null ? null : list.length === 0 ? (
        <EmptyState title={t.pusto} description={t.pustoLead} />
      ) : (
        <div className="dz2-spisok">
          {list.map((d) => (
            <Card key={d.id} className="dz2-kartochka">
              <div className="dz2-kartochka__verh">
                <Badge tone={d.status === 'published' ? 'success' : d.status === 'closed' ? 'neutral' : 'info'}>
                  {t.statusy[d.status]}
                </Badge>
                <h2 className="dz2-kartochka__nazvanie">{d.title}</h2>
              </div>
              <p className="t-caption">
                {[
                  t.elementov(d.items),
                  d.due_at === undefined ? null : t.srok(dataRu(d.due_at, true)),
                  d.publish_at !== undefined && Date.parse(d.publish_at) > seychas
                    ? t.otlozheno(dataRu(d.publish_at, true))
                    : null,
                  d.status === 'published' || d.status === 'closed' ? t.sdali(d.submitted, d.recipients) : null,
                ]
                  .filter((x): x is string => x !== null)
                  .join(' · ')}
              </p>
              <div className="kab-actions">
                {d.status === 'draft' ? (
                  <Link className="btn btn--secondary btn--sm" href={dz2VydatHref(d.id)}>
                    {t.otkryt}
                  </Link>
                ) : null}
                {d.status === 'template' ? (
                  <Button size="sm" variant="secondary" onClick={() => void kopiya(d.id, 'draft')}>
                    {t.izShablona}
                  </Button>
                ) : null}
                {d.status === 'published' || d.status === 'closed' ? (
                  <Link className="btn btn--primary btn--sm" href={dz2ItogiHref(d.id)}>
                    {t.itogi}
                  </Link>
                ) : null}
                {d.status === 'published' || d.status === 'closed' ? (
                  <Button size="sm" variant="secondary" onClick={() => void kopiya(d.id, 'draft')} title={t.povtoritPodskazka}>
                    {t.povtorit}
                  </Button>
                ) : null}
                {d.status !== 'template' ? (
                  <Button size="sm" variant="ghost" onClick={() => void kopiya(d.id, 'template')}>
                    {t.vShablon}
                  </Button>
                ) : null}
                {d.status === 'published' ? (
                  <Button size="sm" variant="ghost" onClick={() => void act((api) => api.dz2Edit(d.id, { closed: true }))}>
                    {t.zakryt}
                  </Button>
                ) : null}
                {d.status === 'closed' ? (
                  <Button size="sm" variant="ghost" onClick={() => void act((api) => api.dz2Edit(d.id, { closed: false }))}>
                    {t.otkrytPriem}
                  </Button>
                ) : null}
                {d.status === 'draft' || d.status === 'template' ? (
                  <Button size="sm" variant="ghost" onClick={() => setUdalit(d)}>
                    {t.udalit}
                  </Button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
      <Confirm
        open={udalit !== null}
        title={t.udalitVopros}
        text={udalit?.title}
        action={t.udalit}
        danger
        onCancel={() => setUdalit(null)}
        onConfirm={() => {
          const d = udalit;
          setUdalit(null);
          if (d !== null) void act((api) => api.dz2Delete(d.id));
        }}
      />
    </div>
  );
}
