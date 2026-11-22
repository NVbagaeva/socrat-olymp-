'use client';

/**
 * Провал внутрь: задача ученика /kabinet/progress/zadacha/?u=…&id=… —
 * условие с теми же числами и чертежом, верный ответ, каждая попытка с
 * ответом как есть, подсказки, время. Только учителю этого ученика
 * (uchitel_zadacha проверяет связь на сервере).
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge, Card, EmptyState, Tooltip } from '@/components/ui';
import { NeedLogin } from '@/components/dz/common';
import { PROGRESS } from '@/content/progressUchitel';
import { assetUrl } from '@/lib/assetUrl';
import { useSessionUser } from '@/lib/auth/session';
import type { ZadachaView } from '@/lib/zhurnal/api';
import { progressUchenikHref } from '@/lib/zhurnal/links';
import { pokazatZadachu, type PokazZadachi } from '@/lib/zhurnal/pokaz';
import { ISKHODY, MESTA, dataRu, podpisRazdela } from '@/lib/zhurnal/vid';
import { Vremya, errorCode, param, zhurnalApi } from './common';
import './progressUchitel.css';

const t = PROGRESS.zadacha;

export function ProgressZadacha() {
  const user = useSessionUser();
  const [z, setZ] = useState<ZadachaView | null>(null);
  const [pokaz, setPokaz] = useState<PokazZadachi | null>(null);
  const [error, setError] = useState<string | null>(null);
  const u = param('u');
  const id = param('id');

  useEffect(() => {
    if (user === null || user.role !== 'tutor' || u === null || id === null) return;
    let alive = true;
    void (async () => {
      try {
        const got = await (await zhurnalApi()).uchitelZadacha(u, id);
        if (!alive) return;
        setZ(got);
        const p = await pokazatZadachu(got);
        if (alive) setPokaz(p);
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

  if (user === null) return <NeedLogin text={PROGRESS.nuzhenVkhodUchitelya} />;
  if (user.role !== 'tutor') return <EmptyState title={PROGRESS.tolkoUchitel} description={PROGRESS.tolkoUchitelLead} />;
  if (error !== null) return <EmptyState title={error} description={PROGRESS.oshibkaLead} />;
  if (z === null || u === null) return <p className="pu-zagruzka">{PROGRESS.zagruzka}</p>;

  const otvet = pokaz?.otvet ?? z.answer_key ?? null;
  const popytki = z.popytki ?? [];

  return (
    <div className="pu kab-stack kab-narrow">
      <div>
        <Link className="pu-nazad" href={progressUchenikHref(u)}>
          ← {t.nazad}
        </Link>
        <h1 className="t-h2">{podpisRazdela(z.task_no)}</h1>
        <p className="t-caption">
          {MESTA[z.place] ?? z.place} · тип {z.kind} · {dataRu(z.started_at, true)}
        </p>
      </div>

      <Card
        title={t.kakVidel}
        action={<Badge tone={z.outcome === 'right' ? 'success' : z.outcome === 'wrong' ? 'error' : 'neutral'}>{z.outcome === undefined ? PROGRESS.uchenik.nePrisvoeno : ISKHODY[z.outcome]}</Badge>}
      >
        {pokaz === null ? (
          <p>{PROGRESS.zagruzka}</p>
        ) : (
          <>
            {pokaz.poZapisi ? <p className="pu-vnimanie">{t.poZapisi}</p> : null}
            {pokaz.risunok === null ? null : (
              <img className="pu-risunok" src={assetUrl(pokaz.risunok)} alt="" decoding="async" />
            )}
            {pokaz.uslovieHtml === null ? (
              <p>{t.netPokaza}</p>
            ) : (
              <div className="pu-uslovie" dangerouslySetInnerHTML={{ __html: pokaz.uslovieHtml }} />
            )}
          </>
        )}
        <p className="pu-otvet">
          <b>{t.vernyy}:</b> {otvet ?? t.vernyyNeizvesten}
        </p>
        <p className="t-caption">{z.verified ? t.proverka.server : t.proverka.brauzer}</p>
      </Card>

      <Card title={t.popytki}>
        {popytki.length === 0 ? (
          <p>{t.popytkiPusto}</p>
        ) : (
          <ol className="pu-popytki">
            {popytki.map((p) => (
              <li key={p.n} className={p.ok ? 'pu-popytka--da' : 'pu-popytka--net'}>
                <span className="pu-popytka__otvet">«{p.answer}»</span>
                <span className="t-caption">
                  {p.vid === 'format' ? t.format : p.vid === 'fraction' ? t.drob : p.ok ? 'верно' : 'неверно'}
                  {' · '}
                  {new Date(p.at).toLocaleTimeString('ru-RU', { timeZone: 'Europe/Moscow' })}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card>
        <dl className="pu-svoystva">
          <dt>{t.podskazka}</dt>
          <dd>
            {t.shagovOtkryto(z.hint_steps)}
            {z.hint_wrong.length > 0 ? `; ${t.oshibkiNaShagakh(z.hint_wrong.join(', '))}` : ''}
          </dd>
          <dt>{t.svoystvo}</dt>
          <dd>{z.shown_fact ? t.da : t.net}</dd>
          <dt>{t.reshenie}</dt>
          <dd>{z.shown_solution ? t.da : t.net}</dd>
          <dt>{t.propusk}</dt>
          <dd>{z.skipped ? t.propushchena : t.net}</dd>
          <dt>{t.vremya}</dt>
          <dd>
            <Vremya active={z.active_ms} total={z.total_ms} />
            {z.bystro === true ? (
              <>
                {' '}
                <Tooltip content={PROGRESS.uchenik.bystroPodskazka}>
                  <span className="pu-bystro">{PROGRESS.uchenik.bystro}</span>
                </Tooltip>
              </>
            ) : null}
          </dd>
        </dl>
      </Card>
    </div>
  );
}
