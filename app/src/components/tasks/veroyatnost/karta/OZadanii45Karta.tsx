import Link from 'next/link';
import type { ReactNode } from 'react';
import { FormulyRamka, KartaGruppa, KartaShapka, KartaTip } from '../../karta';
import { YakorTipa } from '../../karta/YakorTipa';
import type { Ton } from '../../steklo';
import { GruppaProgress45 } from './GruppaProgress45';
import { PrimerLazy45 } from './PrimerLazy45';
import { MetodKartinka } from '../MetodKartinka';
import { navykKind, navykiZadaniya } from '../metody';
import { tonMetoda } from '../trening/Trenazher45Tab';
import type { tekstyKarty45 } from '@/content/veroyatnost45';
import { assetUrl } from '@/lib/assetUrl';
import { typeset, typesetText } from '@/lib/tex';
import { BANK_4, BANK_5, PODGOTOVKA_4, PODGOTOVKA_5 } from '@/lib/veroyatnost/index';
import { bank4Pool, bank5Pool, versiyaRazborov } from '@/lib/veroyatnost/pool';
import {
  blokHref45,
  metodyHref45,
  opornyeHref45,
  tipTrenazherHref45,
  type Zadanie45,
} from '@/lib/veroyatnost/trening/links';
import '../trening/trening45.css';
import './karta45.css';

/**
 * Вкладка «О задании» №4 и №5 — карта задания по методам («Стеклянная
 * сцена», общие компоненты components/tasks/karta, как у №7 и №6).
 *
 * Шапка с обложкой раздела, группы — методы (значок — объёмная
 * иллюстрация метода, как есть) с прогрессом ученика, типы с разобранным
 * примером: условие, картинка к задаче, решение по шагам, рисунок метода,
 * «Где теряют балл». Ниже — «Что нужно знать» и прежние тексты «О
 * задании» раздела (`ob`, утверждены автором). Условия, картинки и
 * решения — из банка, без правок.
 */

export type Shapka45 = typeof tekstyKarty45 & {
  nadzagolovok: string;
  zagolovok: string;
  lead: string;
  fakty: { znachenie: string; podpis: string }[];
  /** Пункты «Чем опасно», уже набранные. */
  opasno: string[];
  oblozhkaAlt: string;
  gruppyTitle: string;
  gruppyLead: string;
  znatLead: string;
  metodyLink: string;
};

export interface OZadanii45Props {
  zadanie: Zadanie45;
  shapka: Shapka45;
  opasnoTipov: Record<string, string>;
  formuly: { id: string; nazvanie: string; ton: Ton; formuly: { tex: string; primer: string }[] }[];
  /** Прежние тексты «О задании» раздела — сворачиваемым блоком внизу. */
  ob: ReactNode;
}

function tex(formula: string): string {
  return typeset(`$${formula}$`);
}

/** Блок опорных задач на метод типа; нет такого — список блоков. */
function opornyeHref(zadanie: Zadanie45, metod: string): string {
  const blok = (zadanie === 4 ? PODGOTOVKA_4 : PODGOTOVKA_5).find((b) => b.metod === metod);
  return blok === undefined ? opornyeHref45(zadanie) : blokHref45(zadanie, blok.id);
}

/** Задача-пример типа: первый вариант сборника, нет — первый. */
function variantPrimera(zadanie: Zadanie45, id: string): number {
  const p = (zadanie === 4 ? BANK_4 : BANK_5).find((x) => x.id === id);
  return (p?.varianty.find((v) => v.source === 'sbornik') ?? p?.varianty[0])?.n ?? 1;
}

export function OZadanii45Karta({ zadanie, shapka, opasnoTipov, formuly, ob }: OZadanii45Props) {
  const pool = zadanie === 4 ? bank4Pool() : bank5Pool();
  const versiya = versiyaRazborov(pool);
  const metody = navykiZadaniya(zadanie).filter((m) =>
    pool.kinds.some((k) => navykKind(k) === m.id),
  );
  return (
    <div className="kz z45-karta">
      <YakorTipa />
      <KartaShapka
        nadzagolovok={shapka.nadzagolovok}
        zagolovok={shapka.zagolovok}
        lead={shapka.lead}
        fakty={shapka.fakty}
        opasnoTitle={shapka.opasnoTitle}
        opasno={shapka.opasno}
        oblozhka={
          /* Обложка раздела — готовая картинка, как есть: без обрезки и
             пережатия, прозрачный фон на стекле шапки. */
          <img
            src={assetUrl(`/images/task-0${zadanie}.webp`)}
            alt={shapka.oblozhkaAlt}
            width={512}
            height={512}
            decoding="async"
          />
        }
      />

      <section className="kz-razdel" aria-labelledby="z45-gruppy-title">
        <div className="kz-razdel__head">
          <h3 className="stk-h3" id="z45-gruppy-title">
            {shapka.gruppyTitle}
          </h3>
          <p className="stk-lead">{shapka.gruppyLead}</p>
        </div>
        <div className="kz-gruppy">
          {metody.map((m, gi) => {
            const tipy = pool.kinds.filter((k) => navykKind(k) === m.id);
            return (
              <KartaGruppa
                key={m.id}
                id={m.id}
                nazvanie={m.nazvanie}
                znakHtml=""
                znak={<MetodKartinka zadanie={zadanie} metod={m.id} nazvanie="" />}
                ton={tonMetoda(zadanie, m.id, gi)}
                tipov={tipy.length}
                progress={<GruppaProgress45 zadanie={zadanie} metod={m.id} />}
                labels={shapka}
                open={gi === 0}
              >
                {tipy.map((k, i) => {
                  const open = gi === 0 && i === 0;
                  const n = variantPrimera(zadanie, k.id);
                  const v = k.variants.find((x) => x.n === n);
                  const opasno = opasnoTipov[k.id];
                  const opasnoHtml = opasno === undefined ? undefined : typesetText(opasno);
                  const kartinka = v?.model?.illustration;
                  const trenirovatHref = tipTrenazherHref45(zadanie, k.id);
                  const opHref = opornyeHref(zadanie, m.id);
                  return (
                    <KartaTip
                      key={k.id}
                      id={k.id}
                      nazvanieHtml={typesetText(k.title)}
                      lead={typesetText(k.tip)}
                      open={open}
                    >
                      {v === undefined ? null : (
                        /* Пример открывается в браузере по раскрытию: закрытый
                           разбор в разметку страницы не уезжает (test:secrets). */
                        <PrimerLazy45
                          zadanie={zadanie}
                          kind={k.id}
                          n={n}
                          seal={v.seal}
                          versiya={versiya}
                          uslovieHtml={v.uslovie}
                          {...(kartinka === undefined ? {} : { kartinka })}
                          {...(opasnoHtml === undefined ? {} : { opasnoHtml })}
                          trenirovatHref={trenirovatHref}
                          opornyeHref={opHref}
                        />
                      )}
                    </KartaTip>
                  );
                })}
              </KartaGruppa>
            );
          })}
        </div>
      </section>

      <section className="kz-razdel kz-znat" aria-labelledby="z45-znat-title">
        <div className="kz-razdel__head">
          <h3 className="stk-h3" id="z45-znat-title">
            {shapka.znatTitle}
          </h3>
          <p className="stk-lead">{shapka.znatLead}</p>
        </div>
        <div className="kz-znat__setka">
          {formuly.map((blok) => (
            <FormulyRamka
              key={blok.id}
              nazvanie={blok.nazvanie}
              ton={blok.ton}
              formuly={blok.formuly.map((f) => ({ html: tex(f.tex), primerHtml: tex(f.primer) }))}
            />
          ))}
        </div>
        <p className="z45-karta__metody">
          <Link className="stk-ssylka" href={metodyHref45(zadanie)}>
            {shapka.metodyLink}
          </Link>
        </p>
      </section>

      {ob}
    </div>
  );
}
