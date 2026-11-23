import type { ReactNode } from 'react';
import { Breadcrumbs } from '@/components/ui';
import { EtoZheV } from '@/components/level/EtoZheV';
import KATALOG from '@/content/karta/katalog.json';
import { SHAPKA_TEKSTY as T, kartinkaShapki, shapkaRazdela } from '@/content/shapki';
import { chastRazdela, maxBall, nomerRazdela, razdel, type RazdelKod } from '@/content/struktura';
import { tasksPage, vseRazdely } from '@/content/tasks';
import { assetUrl } from '@/lib/assetUrl';
import { KARTA_ZHURNALY } from '@/lib/karta/katalog';
import { opornyeRazdela } from '@/lib/shapka/opornyeRazdela';
import { ChasyIkonka, ZvezdaIkonka } from '@/components/tasks/stsena';
import { KoltsoProgressa } from './KoltsoProgressa';
import { ZhivayaKartinka } from './ZhivayaKartinka';
import '@/components/tasks/steklo/steklo.css';
import './shapka.css';

export interface SectionHeaderProps {
  kod: RazdelKod;
  /** Переключатель раздела на телефоне и планшете (вместо крошек). */
  pereklyuchatel?: ReactNode;
  /** Под чипами: кнопка «Продолжить подготовку» у хаба «Графики функций». */
  actions?: ReactNode;
}

/** Типы тренажёра раздела по каталогу «Карты ЕГЭ». */
function tipyRazdela(hranenie: number): string[] {
  const r = KATALOG.razdely.find((x) => x.no === hranenie);
  return r === undefined ? [] : r.gruppy.flatMap((g) => g.tipy);
}

/**
 * Шапка раздела — одна на все разделы обеих частей. Слева крошки,
 * заголовок «Задание №N. Название» (номер — по действующей структуре
 * экзамена), чипы уровня, части, балла и времени, описание в две строки
 * и ссылка «Это же в базе». Справа — стеклянная картинка в кольце
 * прогресса; по первому касанию она оживает (ZhivayaKartinka).
 *
 * Всё, что в шапке написано, берётся из структуры (content/struktura.js),
 * списка разделов (content/tasks.ts) и content/shapki.ts — у раздела
 * нет своей копии заголовка или балла.
 */
export function SectionHeader({ kod, pereklyuchatel, actions }: SectionHeaderProps) {
  const s = shapkaRazdela(kod);
  const { hranenie } = razdel(kod);
  const task = vseRazdely.find((t) => t.kod === kod);
  if (task === undefined) throw new Error(`Нет раздела ${kod}`);
  const nomer = nomerRazdela(kod);
  const chast = chastRazdela(kod);
  const ball = maxBall(kod);
  const { src560, src280 } = kartinkaShapki(s);
  const title = T.zagolovok(nomer, task.name);
  const korotko =
    task.shortTitle === undefined || task.name.length <= 24
      ? null
      : T.zagolovok(nomer, task.shortTitle);
  const opornye = opornyeRazdela(hranenie);

  return (
    <>
      <Breadcrumbs
        className="shapka-crumbs"
        items={[
          { label: T.krohi.glavnaya, href: '/' },
          {
            label: T.krohi.bank,
            href: chast === 2 ? `${tasksPage.href}?part=2` : tasksPage.href,
          },
          { label: `№${nomer}` },
        ]}
      />
      {pereklyuchatel === undefined ? null : (
        <div className="shapka-pereklyuchatel">{pereklyuchatel}</div>
      )}
      <header className="shapka" data-razdel={kod}>
        {/* На телефоне — короткое название, как в меню: полное в узкой
            колонке ломается на четыре строки. */}
        <h1
          className={
            korotko === null
              ? 't-h1 shapka__title'
              : 't-h1 shapka__title shapka__title--est-korotko'
          }
        >
          <span className="shapka__title-polno">{title}</span>
          {korotko === null ? null : <span className="shapka__title-korotko">{korotko}</span>}
        </h1>
        <div className="shapka__text">
          <ul className="shapka__chipy">
            <li className="shapka__chip shapka__chip--uroven">{T.uroven}</li>
            <li className="shapka__chip">{T.chast(chast)}</li>
            <li className="shapka__chip shapka__chip--warm">
              <span className="shapka__chip-ik" aria-hidden="true">
                <ZvezdaIkonka />
              </span>
              {T.ball(ball)}
            </li>
            <li className="shapka__chip">
              <span className="shapka__chip-ik" aria-hidden="true">
                <ChasyIkonka />
              </span>
              {T.minuty(s.minuty)}
            </li>
          </ul>
          <p className="shapka__lead">{s.lead}</p>
          <EtoZheV level="profile" slug={task.slug} />
          {actions === undefined ? null : <div className="shapka__actions">{actions}</div>}
        </div>
        <div className="shapka__media">
          <KoltsoProgressa
            hranenie={hranenie}
            logKey={KARTA_ZHURNALY[hranenie] ?? null}
            tipy={tipyRazdela(hranenie)}
            opornye={opornye === null ? null : opornye.ids}
          >
            <ZhivayaKartinka
              kod={kod}
              src560={assetUrl(src560)}
              src280={assetUrl(src280)}
              alt={`${title}: стеклянная иллюстрация`}
              label={s.opisanie}
              podskazka={s.podskazka}
              vid={s.vid}
              obyomnaya={s.obyomnaya}
            />
          </KoltsoProgressa>
        </div>
      </header>
    </>
  );
}
