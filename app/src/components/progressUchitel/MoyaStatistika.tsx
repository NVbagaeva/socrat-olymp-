'use client';

/**
 * «Моя статистика» ученика /kabinet/statistika/: то же, что видит
 * учитель, но проще и без пометок для учителя — сводка, точность по
 * заданиям, варианты, что повторить, календарь и лента без ссылок.
 */

import { useEffect, useState } from 'react';
import { Card, EmptyState } from '@/components/ui';
import { NeedLogin } from '@/components/dz/common';
import { PROGRESS } from '@/content/progressUchitel';
import { useSessionUser } from '@/lib/auth/session';
import type { Svodka, ZadachaView } from '@/lib/zhurnal/api';
import { moyVariantHref } from '@/lib/zhurnal/links';
import { PERIODY, periodIz, type PeriodId } from '@/lib/zhurnal/vid';
import { Filtry, zhurnalApi } from './common';
import { Lenta } from './Lenta';
import { SvodkaBlok } from './SvodkaBlok';
import './progressUchitel.css';

const t = PROGRESS.statistika;

export function MoyaStatistika() {
  const user = useSessionUser();
  const [period, setPeriod] = useState<PeriodId>('30');
  const [taskNo, setTaskNo] = useState<number | null>(null);
  const [s, setS] = useState<Svodka | null>(null);
  const [lenta, setLenta] = useState<ZadachaView[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (user === null || user.role !== 'student') return;
    let alive = true;
    void (async () => {
      try {
        const api = await zhurnalApi();
        const p = { ...periodIz(period), taskNo };
        const [svodka, l] = await Promise.all([api.moyaStatistika(p), api.moyaLenta(p)]);
        if (!alive) return;
        setS(svodka);
        setLenta(l);
        setError(false);
      } catch {
        if (alive) setError(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user, period, taskNo]);

  if (user === null) return <NeedLogin text={PROGRESS.nuzhenVkhod} />;
  if (user.role !== 'student') return <EmptyState title={PROGRESS.tolkoUchenik} description={PROGRESS.oshibkaLead} />;
  if (error) return <EmptyState title={PROGRESS.oshibka} description={PROGRESS.oshibkaLead} />;
  if (s === null) return <p className="pu-zagruzka">{PROGRESS.zagruzka}</p>;

  const { to } = periodIz(period);
  const dney = PERIODY.find((p) => p.id === period)?.dney ?? 30;

  return (
    <div className="pu kab-stack">
      <div>
        <h1 className="t-h2">{t.zagolovok}</h1>
        <p className="t-caption">{t.lead}</p>
      </div>
      <Filtry period={period} onPeriod={setPeriod} taskNo={taskNo} onTaskNo={setTaskNo} />
      {s.solved === 0 && lenta.length === 0 ? (
        <EmptyState title={PROGRESS.uchenik.lentaPusto} description={t.pusto} />
      ) : (
        <>
          <SvodkaBlok s={s} to={to} dney={dney} variantHref={moyVariantHref} slabyeTitle={t.slabye} />
          <Card title={PROGRESS.uchenik.lenta}>
            <Lenta zadachi={lenta} />
          </Card>
        </>
      )}
    </div>
  );
}
