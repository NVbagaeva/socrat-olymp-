import fs from 'node:fs';
import path from 'node:path';
import Image from 'next/image';
import Link from 'next/link';
import {
  FormulyRamka,
  KartaGruppa,
  KartaPrimer,
  KartaShapka,
  KartaTip,
  Svernut,
} from '../../karta';
import { YakorTipa } from '../../karta/YakorTipa';
import { Kartinka45, primerIzRazbora } from './Primer45';
import { GruppaProgress45 } from './GruppaProgress45';
import { PrimerLazy45 } from './PrimerLazy45';
import { MetodKartinka } from '../MetodKartinka';
import { navykKind, navykiZadaniya } from '../metody';
import { tonMetoda } from '../trening/Trenazher45Tab';
import { FORMULY4, SHAPKA4, TIPY4_OPASNO } from '@/content/veroyatnost4';
import { FOTO_4, O_ZADANII_4, STATISTIKA_4, V_ZADANII_5 } from '@/content/veroyatnost-o-zadanii';
import { assetUrl, bezVersii } from '@/lib/assetUrl';
import { typeset, typesetText } from '@/lib/tex';
import { BANK_4, PODGOTOVKA_4 } from '@/lib/veroyatnost/index';
import { bank4Pool, versiyaRazborov } from '@/lib/veroyatnost/pool';
import { otkrytRazbor } from '@/lib/veroyatnost/razbor';
import {
  blokHref45,
  metodyHref45,
  opornyeHref45,
  tipTrenazherHref45,
} from '@/lib/veroyatnost/trening/links';
import '../trening/trening45.css';
import './karta45.css';

/**
 * Вкладка «О задании» №4 — карта задания по методам («Стеклянная сцена»,
 * общие компоненты components/tasks/karta, как у №7 и №6).
 *
 * Шапка с обложкой раздела, группы — методы (значок — объёмная
 * иллюстрация метода, как есть) с прогрессом ученика, 25 типов с
 * разобранным примером: условие, картинка к задаче, решение по шагам,
 * рисунок метода, «Где теряют балл». Ниже — «Что нужно знать» и прежние
 * тексты «О задании» с фотографией (утверждены автором). Условия,
 * картинки и решения — из банка, без правок.
 */

function tex(formula: string): string {
  return typeset(`$${formula}$`);
}

/** Лежит ли фотография на месте (смотрится на сборке). */
function fotoEst(): boolean {
  try {
    return fs.statSync(path.join(process.cwd(), 'public', bezVersii(FOTO_4.src))).isFile();
  } catch {
    return false;
  }
}

/** Блок опорных задач на метод типа; нет такого — список блоков. */
function opornyeHref(metod: string): string {
  const blok = PODGOTOVKA_4.find((b) => b.metod === metod);
  return blok === undefined ? opornyeHref45(4) : blokHref45(4, blok.id);
}

/** Задача-пример типа: первый вариант сборника, нет — первый. */
function variantPrimera(id: string): number {
  const p = BANK_4.find((x) => x.id === id);
  return (p?.varianty.find((v) => v.source === 'sbornik') ?? p?.varianty[0])?.n ?? 1;
}

export function OZadanii4Karta() {
  const pool = bank4Pool();
  const versiya = versiyaRazborov(pool);
  const metody = navykiZadaniya(4).filter((m) => pool.kinds.some((k) => navykKind(k) === m.id));
  const { istoriya, reshaemost, zadachi, vazhno } = O_ZADANII_4;
  return (
    <div className="kz z45-karta">
      <YakorTipa />
      <KartaShapka
        nadzagolovok={SHAPKA4.nadzagolovok}
        zagolovok={SHAPKA4.zagolovok}
        lead={SHAPKA4.lead}
        fakty={SHAPKA4.fakty(pool.kinds.length, metody.length)}
        opasnoTitle={SHAPKA4.opasnoTitle}
        opasno={SHAPKA4.opasno.map((line) => typesetText(line))}
        oblozhka={
          /* Обложка раздела — готовая картинка, как есть: без обрезки и
             пережатия, прозрачный фон на стекле шапки. */
          <img
            src={assetUrl('/images/task-04.webp')}
            alt={SHAPKA4.oblozhkaAlt}
            width={512}
            height={512}
            decoding="async"
          />
        }
      />

      <section className="kz-razdel" aria-labelledby="z4-gruppy-title">
        <div className="kz-razdel__head">
          <h3 className="stk-h3" id="z4-gruppy-title">
            {SHAPKA4.gruppyTitle}
          </h3>
          <p className="stk-lead">{SHAPKA4.gruppyLead}</p>
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
                znak={<MetodKartinka zadanie={4} metod={m.id} nazvanie="" />}
                ton={tonMetoda(4, m.id, gi)}
                tipov={tipy.length}
                progress={<GruppaProgress45 zadanie={4} metod={m.id} />}
                labels={SHAPKA4}
                open={gi === 0}
              >
                {tipy.map((k, i) => {
                  const open = gi === 0 && i === 0;
                  const n = variantPrimera(k.id);
                  const v = k.variants.find((x) => x.n === n);
                  const opasno = TIPY4_OPASNO[k.id];
                  const opasnoHtml = opasno === undefined ? undefined : typesetText(opasno);
                  const kartinka = v?.model?.illustration;
                  const trenirovatHref = tipTrenazherHref45(4, k.id);
                  const opHref = opornyeHref(m.id);
                  /* Раскрытый с самого начала пример набирается на сборке;
                     остальные открываются в браузере по раскрытию. */
                  const primer =
                    open && v !== undefined
                      ? primerIzRazbora(
                          otkrytRazbor(v.steps, v.seal),
                          SHAPKA4.metod,
                          SHAPKA4.risunok,
                        )
                      : null;
                  return (
                    <KartaTip
                      key={k.id}
                      id={k.id}
                      nazvanieHtml={typesetText(k.title)}
                      lead={typesetText(k.tip)}
                      open={open}
                    >
                      {v === undefined ? null : primer !== null ? (
                        <KartaPrimer
                          uslovieHtml={v.uslovie}
                          {...(kartinka === undefined
                            ? {}
                            : { risunok: <Kartinka45 {...kartinka} /> })}
                          shagi={primer.shagi}
                          posle={primer.posle}
                          otvet={primer.otvet}
                          {...(opasnoHtml === undefined ? {} : { opasnoHtml })}
                          trenirovatHref={trenirovatHref}
                          opornyeHref={opHref}
                          labels={SHAPKA4}
                        />
                      ) : (
                        <PrimerLazy45
                          zadanie={4}
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

      <section className="kz-razdel kz-znat" aria-labelledby="z4-znat-title">
        <div className="kz-razdel__head">
          <h3 className="stk-h3" id="z4-znat-title">
            {SHAPKA4.znatTitle}
          </h3>
          <p className="stk-lead">{SHAPKA4.znatLead}</p>
        </div>
        <div className="kz-znat__setka">
          {FORMULY4.map((blok) => (
            <FormulyRamka
              key={blok.id}
              nazvanie={blok.nazvanie}
              ton={blok.ton}
              formuly={blok.formuly.map((f) => ({ html: tex(f.tex), primerHtml: tex(f.primer) }))}
            />
          ))}
        </div>
        <p className="z45-karta__metody">
          <Link className="stk-ssylka" href={metodyHref45(4)}>
            {SHAPKA4.metodyLink}
          </Link>
        </p>
      </section>

      {/* Прежние тексты «О задании» — утверждены автором, без правок. */}
      <Svernut title={SHAPKA4.obZadanii} className="z45-ob">
        <div className="z45-ob__setka">
          <section className="z45-ob__blok">
            <p className="z45-ob__stat">
              <b>{STATISTIKA_4.znachenie}</b> {STATISTIKA_4.podpis(STATISTIKA_4.god)}
            </p>
            <p className="z45-ob__istochnik">{STATISTIKA_4.istochnik}</p>
            <p>{reshaemost.text}</p>
          </section>
          <section className="z45-ob__blok">
            <h4 className="stk-h4">{zadachi.title}</h4>
            <p>{zadachi.text}</p>
            <div className="z45-ob__plashka">
              <p>
                <b>{V_ZADANII_5.title}</b>
              </p>
              <p>{V_ZADANII_5.text}</p>
              <p>
                <a className="stk-ssylka" href={V_ZADANII_5.href}>
                  {V_ZADANII_5.ssylka}
                </a>
              </p>
            </div>
            <p>
              {zadachi.razbor.do}
              <a className="stk-ssylka" href={metodyHref45(4)}>
                {zadachi.razbor.ssylka}
              </a>
              {zadachi.razbor.posle}
            </p>
          </section>
          <section className="z45-ob__blok">
            <h4 className="stk-h4">{vazhno.title}</h4>
            <p>{vazhno.text}</p>
          </section>
          <section className="z45-ob__blok z45-ob__istoriya">
            <h4 className="stk-h4">{istoriya.title}</h4>
            <p>{istoriya.text}</p>
            {fotoEst() ? (
              <figure className="z45-ob__foto">
                {/* Фотография — как есть, целиком. */}
                <Image
                  src={FOTO_4.src}
                  alt={FOTO_4.alt}
                  width={FOTO_4.width}
                  height={FOTO_4.height}
                  sizes="(max-width: 720px) 100vw, 640px"
                />
                <figcaption>{istoriya.podpis}</figcaption>
              </figure>
            ) : null}
          </section>
        </div>
      </Svernut>
    </div>
  );
}
