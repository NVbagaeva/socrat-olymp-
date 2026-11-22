'use client';

/**
 * Ученик глазами учителя /kabinet/progress/uchenik/?id=…: сводка за
 * период, точность по заданиям, тестовый балл по вариантам, слабые типы,
 * календарь активности и лента. Фильтры периода и задания, выгрузка в
 * Excel и PDF. Доступ проверяет база (uchitel_uchenik): чужого ученика
 * она не отдаст.
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button, Card, EmptyState } from '@/components/ui';
import { NeedLogin } from '@/components/dz/common';
import { PROGRESS } from '@/content/progressUchitel';
import { useSessionUser } from '@/lib/auth/session';
import { klassHref } from '@/lib/dz/links';
import { downloadXlsx, xlsx } from '@/lib/xlsx';
import type { UchenikView, ZadachaView } from '@/lib/zhurnal/api';
import { progressPechatHref, progressVariantHref, progressZadachaHref } from '@/lib/zhurnal/links';
import { PERIODY, dataRu, periodIz, type PeriodId } from '@/lib/zhurnal/vid';
import { imyaFayla, strokiUchenika } from '@/lib/zhurnal/vygruzka';
import { Filtry, errorCode, param, zhurnalApi } from './common';
import { Lenta } from './Lenta';
import { SvodkaBlok } from './SvodkaBlok';
import './progressUchitel.css';

const t = PROGRESS.uchenik;

export function ProgressUchenik() {
  const user = useSessionUser();
  const [period, setPeriod] = useState<PeriodId>('30');
  const [taskNo, setTaskNo] = useState<number | null>(null);
  const [data, setData] = useState<UchenikView | null>(null);
  const [lenta, setLenta] = useState<ZadachaView[]>([]);
  const [eshche, setEshche] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const id = param('id');
  const klass = param('klass');

  useEffect(() => {
    if (user === null || user.role !== 'tutor' || id === null) return;
    let alive = true;
    void (async () => {
      try {
        const api = await zhurnalApi();
        const p = { ...periodIz(period), taskNo };
        const [u, l] = await Promise.all([api.uchitelUchenik(id, p), api.uchitelLenta(id, p)]);
        if (!alive) return;
        setData(u);
        setError(null);
        setLenta(l);
        setEshche(l.length === 50);
      } catch (e) {
        if (alive) setError(errorCode(e) === 'not_your_student' ? PROGRESS.neTvoy : PROGRESS.oshibka);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user, id, period, taskNo]);

  if (user === null) return <NeedLogin text={PROGRESS.nuzhenVkhodUchitelya} />;
  if (user.role !== 'tutor') return <EmptyState title={PROGRESS.tolkoUchitel} description={PROGRESS.tolkoUchitelLead} />;
  if (error !== null) return <EmptyState title={error} description={PROGRESS.oshibkaLead} />;
  if (data === null || id === null) return <p className="pu-zagruzka">{PROGRESS.zagruzka}</p>;

  const { from, to } = periodIz(period);
  const dney = PERIODY.find((p) => p.id === period)?.dney ?? 30;

  async function dalshe() {
    if (id === null) return;
    const posledn = lenta[lenta.length - 1];
    if (posledn === undefined) return;
    const api = await zhurnalApi();
    const l = await api.uchitelLenta(id, { from, to, taskNo }, posledn.started_at);
    setLenta([...lenta, ...l]);
    setEshche(l.length === 50);
  }

  async function excel() {
    if (id === null || data === null) return;
    /* Вся лента периода, не только показанная страница. */
    const api = await zhurnalApi();
    const vse: ZadachaView[] = [];
    let before: string | null = null;
    for (let i = 0; i < 40; i += 1) {
      const l: ZadachaView[] = await api.uchitelLenta(id, { from, to, taskNo }, before);
      vse.push(...l);
      if (l.length < 50) break;
      before = l[l.length - 1]?.started_at ?? null;
    }
    downloadXlsx(
      imyaFayla(data.name, from, to),
      xlsx(PROGRESS.excel.list, strokiUchenika(vse), [18, 28, 12, 18, 18, 16, 14, 9, 12, 12, 14, 14]),
    );
  }

  return (
    <div className="pu kab-stack">
      <div className="kab-title-row">
        <div>
          {klass === null ? null : (
            <Link className="pu-nazad" href={klassHref(klass)}>
              ← {t.nazad}
            </Link>
          )}
          <h1 className="t-h2">{data.name}</h1>
          <p className="t-caption">{t.sMomenta(dataRu(data.s))}</p>
        </div>
        <div className="kab-actions">
          <Button variant="secondary" size="sm" onClick={() => void excel()}>
            {PROGRESS.vygruzka.excel}
          </Button>
          <Link className="btn btn--secondary btn--sm" href={progressPechatHref({ u: id, from, to, z: taskNo })}>
            {PROGRESS.vygruzka.pdf}
          </Link>
        </div>
      </div>

      {data.progress_allowed ? null : <p className="pu-vnimanie">{t.bezSoglasiya}</p>}

      <Filtry period={period} onPeriod={setPeriod} taskNo={taskNo} onTaskNo={setTaskNo} />

      <SvodkaBlok s={data.svodka} to={to} dney={dney} variantHref={(v) => progressVariantHref(id, v)} />

      <Card title={t.lenta}>
        <Lenta zadachi={lenta} href={(z) => progressZadachaHref(id, z.id)} />
        {eshche ? (
          <Button variant="ghost" onClick={() => void dalshe()}>
            {t.eshche}
          </Button>
        ) : null}
      </Card>
    </div>
  );
}
