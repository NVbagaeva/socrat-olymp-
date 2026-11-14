import type { ReactNode } from 'react';
import { FORMULY10, GRUPPY10_VID, SHAPKA10, TIPY10_OPASNO } from '@/content/prikladnye10';
import { assetUrl } from '@/lib/assetUrl';
import { typeset } from '@/lib/tex';
import { zadachiPrototipa } from '@/lib/zadanie10/bank/index';
import { kartinkiPrototipov } from '@/lib/zadanie10/illyustracii';
import { OPORNYE10_HREF, blokHref10, tipTrenazherHref10 } from '@/lib/zadanie10/links';
import { BLOKI_OPORNYH } from '@/lib/zadanie10/opornye';
import { GROUPS, prototype, prototypesOfGroup, PROTOTYPES } from '@/lib/zadanie10/prototypes';
import type { Params } from '@/lib/zadanie10/types';
import { FormulyRamka, KartaGruppa, KartaPrimer, KartaShapka, KartaTip } from '../karta';
import { YakorTipa } from '../karta/YakorTipa';
import { GruppaProgress10 } from './GruppaProgress10';
import { Kartinka10, type IllInfo } from './Kartinka10';
import { Most10 } from './Most10';
import { PrimerLazy10 } from './PrimerLazy10';
import { otvetTekstom, shagiIzResheniya10 } from './shagi10';

/**
 * Вкладка «О задании» №10: карта задания по типам («Стеклянная сцена»,
 * общие компоненты components/tasks/karta — как у №8, №3, №7 и №6).
 *
 * Шапка (что проверяет, балл, минуты, чем опасно) с обложкой раздела,
 * пять групп с прогрессом ученика, 34 типа с картинкой сюжета и
 * разобранным примером (условие, картинка, решение по шагам с таблицей
 * «Дано») и блок «Что нужно знать». Условия, картинки и решения — из
 * банка и решателя, без правок.
 */

function tex(formula: string): string {
  return typeset(`$${formula}$`);
}

/** Блок опорных задач, где отрабатывается навык прототипа. */
function opornyeHref(id: string): string {
  const blok = BLOKI_OPORNYH.find((b) => b.prototipy.includes(id));
  return blok === undefined ? OPORNYE10_HREF : blokHref10(blok.slug);
}

/** Задача-пример прототипа: первая задача ФИПИ, нет — первый аналог. */
function zadachaPrimera(id: string) {
  const { fipi, analogi } = zadachiPrototipa(id);
  return fipi[0] ?? analogi[0];
}

/**
 * Картинка сюжета к примеру — крупно, как есть; у моста ещё и чертёж
 * по числам примера (движок lib/zadanie10/chertezh).
 */
function risunokPrimera(id: string, ill: IllInfo | undefined, params: Params): ReactNode {
  if (ill === undefined && id !== 'P01') {
    return undefined;
  }
  return (
    <div className="z10-primer-risunok">
      {ill === undefined ? null : <Kartinka10 ill={ill} />}
      {id === 'P01' ? <Most10 params={params} rezhim="uchenik" /> : null}
    </div>
  );
}

/** Разобранный пример прототипа на сборке (первая раскрытая карточка). */
function primer(id: string) {
  const z = zadachaPrimera(id);
  if (z === undefined) {
    return null;
  }
  const s = prototype(id).solve(z.params);
  return {
    uslovieHtml: typeset(z.text),
    shagi: shagiIzResheniya10(s),
    otvet: otvetTekstom(s.answer),
  };
}

export function OZadanii10() {
  const kartinki = kartinkiPrototipov();
  return (
    <div className="kz z10-karta">
      <YakorTipa />
      <KartaShapka
        nadzagolovok={SHAPKA10.nadzagolovok}
        zagolovok={SHAPKA10.zagolovok}
        lead={SHAPKA10.lead}
        fakty={SHAPKA10.fakty(PROTOTYPES.length)}
        opasnoTitle={SHAPKA10.opasnoTitle}
        opasno={SHAPKA10.opasno.map((line) => typeset(line))}
        oblozhka={
          /* Обложка раздела — готовая картинка, как есть: без обрезки и
             пережатия, прозрачный фон на стекле шапки. */
          <img
            src={assetUrl('/images/task-10.webp')}
            alt={SHAPKA10.oblozhkaAlt}
            width={512}
            height={512}
            decoding="async"
          />
        }
      />

      <section className="kz-razdel" aria-labelledby="z10-gruppy-title">
        <div className="kz-razdel__head">
          <h3 className="stk-h3" id="z10-gruppy-title">
            {SHAPKA10.gruppyTitle}
          </h3>
          <p className="stk-lead">{SHAPKA10.gruppyLead}</p>
        </div>
        <div className="kz-gruppy">
          {GROUPS.map((g, gi) => {
            const vid = GRUPPY10_VID[g.id];
            const tipy = prototypesOfGroup(g.id);
            return (
              <KartaGruppa
                key={g.id}
                id={g.id}
                nazvanie={g.title}
                znakHtml={tex(vid.znak)}
                ton={vid.ton}
                tipov={tipy.length}
                progress={<GruppaProgress10 prototypes={tipy.map((p) => p.id)} />}
                labels={SHAPKA10}
                open={gi === 0}
              >
                {tipy.map((p, i) => {
                  const open = gi === 0 && i === 0;
                  const trenirovatHref = tipTrenazherHref10(p.id);
                  const opasno = TIPY10_OPASNO[p.id];
                  const opasnoHtml = opasno === undefined ? undefined : typeset(opasno);
                  const z = zadachaPrimera(p.id);
                  const ill = kartinki[p.id];
                  const risunok = z === undefined ? undefined : risunokPrimera(p.id, ill, z.params);
                  /* Раскрытый с самого начала пример набирается на сборке;
                     остальные собираются в браузере по раскрытию. */
                  const ex = open ? primer(p.id) : null;
                  return (
                    <KartaTip
                      key={p.id}
                      id={p.id}
                      nazvanieHtml={typeset(p.title)}
                      lead={typeset(`Найти: ${p.ask}`)}
                      {...(ill === undefined
                        ? {}
                        : { miniatyura: <Kartinka10 ill={ill} alt="" /> })}
                      open={open}
                    >
                      {ex !== null ? (
                        <KartaPrimer
                          uslovieHtml={ex.uslovieHtml}
                          {...(risunok === undefined ? {} : { risunok })}
                          shagi={ex.shagi}
                          otvet={ex.otvet}
                          {...(opasnoHtml === undefined ? {} : { opasnoHtml })}
                          trenirovatHref={trenirovatHref}
                          opornyeHref={opornyeHref(p.id)}
                          labels={SHAPKA10}
                        />
                      ) : z === undefined ? null : (
                        <PrimerLazy10
                          prototype={p.id}
                          klyuch={z.id}
                          {...(risunok === undefined ? {} : { risunok })}
                          opasnoHtml={opasnoHtml ?? ''}
                          trenirovatHref={trenirovatHref}
                          opornyeHref={opornyeHref(p.id)}
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

      <section className="kz-razdel kz-znat" aria-labelledby="z10-znat-title">
        <div className="kz-razdel__head">
          <h3 className="stk-h3" id="z10-znat-title">
            {SHAPKA10.znatTitle}
          </h3>
          <p className="stk-lead">{SHAPKA10.znatLead}</p>
        </div>
        <div className="kz-znat__setka">
          {FORMULY10.map((blok) => (
            <FormulyRamka
              key={blok.id}
              nazvanie={blok.nazvanie}
              ton={blok.ton}
              formuly={blok.formuly.map((f) => ({ html: tex(f.tex), primerHtml: tex(f.primer) }))}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
