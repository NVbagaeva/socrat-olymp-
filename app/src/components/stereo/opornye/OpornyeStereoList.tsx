'use client';

import { clsx } from 'clsx';
import { PrepCardLink } from '@/components/tasks/prep/PrepScroll';
import { OPORNYE_3 } from '@/content/stereo/opornye3';
import { opornye3 } from '@/lib/stereo/opornye3/progress';
import { IkGalochka, IkVpered } from '../metodika/Ikonki';

export interface BlokKartochka3 {
  id: string;
  slug: string;
  no: number;
  nazvanie: string;
  umenie: string;
  lead: string;
  /** Ключи задач блока: по ним считается «решено». */
  zadachi: string[];
  gotov: boolean;
  /** Пиктограмма блока — SVG движка («стекло», без подписей); нет — пусто. */
  piktogramma: string | null;
  /** Пиктограмма-картинка, когда вида движком нет: адрес с версией. */
  kartinka: string | null;
}

type Status = 'proyden' | 'vProcesse' | 'neNachat' | 'skoro';

/** Значок статуса: галочка, полукруг «в процессе», пустой кружок. */
function ZnakStatusa({ status }: { status: Status }) {
  if (status === 'proyden') return <IkGalochka className="o3-chip__ik" />;
  return <span className={`o3-chip__tochka o3-chip__tochka--${status}`} aria-hidden="true" />;
}

/**
 * Список блоков опорных задач №3 — сеткой карточек (на телефоне —
 * списком): номер, название, статус «Пройден / В процессе / Не начат»,
 * пиктограмма тела, полоса «n из 10». Пройденный блок — зелёной
 * заливкой, текущий — синей обводкой. Блоки, которые ещё пишутся, —
 * «Скоро», без полосы и без ссылки.
 */
export function OpornyeStereoList({
  bloki,
  listHref,
}: {
  bloki: BlokKartochka3[];
  listHref: string;
}) {
  const progress = opornye3.useProgress();
  const statusy: Status[] = bloki.map((b) => {
    if (!b.gotov) return 'skoro';
    const zakryto = b.zadachi.filter((id) => progress.outcomes[id] !== undefined).length;
    if (zakryto === 0) return 'neNachat';
    return zakryto === b.zadachi.length ? 'proyden' : 'vProcesse';
  });
  /* Текущий блок — начатый, а если такого нет — первый не начатый. */
  const tekushchiy = statusy.includes('vProcesse')
    ? statusy.indexOf('vProcesse')
    : statusy.indexOf('neNachat');

  return (
    <ul className="o3-karty">
      {bloki.map((b, i) => {
        const status = statusy[i] ?? 'skoro';
        const resheno = b.zadachi.filter((id) => progress.outcomes[id] === 'right').length;
        const n = b.zadachi.length;
        const telo = (
          <>
            <span className="o3-kart__no" aria-hidden="true">
              {status === 'proyden' ? <IkGalochka /> : b.no}
            </span>
            <span className="o3-kart__text">
              <span className="o3-kart__title">
                <span className="sr-only">Блок {b.no}. </span>
                {b.nazvanie}
              </span>
              <span className={clsx('o3-chip', `o3-chip--${status}`)}>
                <ZnakStatusa status={status} />
                {OPORNYE_3.status[status]}
              </span>
              <span className="o3-kart__umenie">
                {OPORNYE_3.umenie}: {b.umenie}
              </span>
            </span>
            {b.piktogramma !== null ? (
              <span
                className="o3-kart__pikt"
                aria-hidden="true"
                dangerouslySetInnerHTML={{ __html: b.piktogramma }}
              />
            ) : b.kartinka !== null ? (
              <span className="o3-kart__pikt" aria-hidden="true">
                {/* Картинка из public/ без оптимизации: статический экспорт. */}
                <img src={b.kartinka} alt="" width={96} height={84} loading="lazy" />
              </span>
            ) : null}
            {b.gotov ? (
              <span className="o3-kart__progress">
                <span
                  className={clsx('o3-polosa', status === 'proyden' && 'o3-polosa--uspeh')}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={n}
                  aria-valuenow={resheno}
                  aria-label={OPORNYE_3.resheno(resheno, n)}
                >
                  <span style={{ width: `${(100 * resheno) / n}%` }} />
                </span>
                <span className="o3-kart__n">{OPORNYE_3.izN(resheno, n)}</span>
              </span>
            ) : null}
          </>
        );
        const klass = clsx('o3-kart', `is-${status}`, i === tekushchiy && 'is-tekushchiy');
        return (
          <li key={b.id}>
            {b.gotov ? (
              <PrepCardLink className={klass} href={`${listHref}${b.slug}/`}>
                {telo}
                <IkVpered className="o3-kart__go" />
              </PrepCardLink>
            ) : (
              <div className={klass} aria-disabled="true">
                {telo}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
