import { FORMULY11, GRUPPY11_TON, SHAPKA11, TIPY11_OPASNO } from '@/content/tekstovye11';
import { assetUrl } from '@/lib/assetUrl';
import { typeset, typesetKrupno } from '@/lib/tex';
import { OPORNYE11_HREF, blokHref11, tipTrenazherHref11 } from '@/lib/zadanie11/links';
import { SUBTYPES, subtype } from '@/lib/zadanie11/prototypes';
import { SECTIONS } from '@/lib/zadanie11/taxonomy';
import { dannyeTrenazhera } from '@/lib/zadanie11/trenazher/dannye';
import { lite11 } from '@/lib/zadanie11/trening/dannye-server';
import { razobrat11 } from '@/lib/zadanie11/trening/reshatel';
import { FormulyRamka, KartaGruppa, KartaPrimer, KartaShapka, KartaTip } from '../karta';
import { YakorTipa } from '../karta/YakorTipa';
import { GruppaProgress11 } from './GruppaProgress11';
import { Kartinka11, estKartinka11 } from './Kartinka11';
import { otvetPrimera11 } from './otvetPrimera11';
import { Piktogramma, ZNACHOK_RAZDELA } from './Piktogrammy';
import { PrimerLazy11 } from './PrimerLazy11';
import { shagi11 } from './shagi11';

/**
 * Вкладка «О задании» №11: карта задания по типам («Стеклянная сцена»,
 * общие компоненты components/tasks/karta — как у №8, №3, №7 и №6).
 *
 * Шапка (что проверяет, балл, минуты, чем опасно) с обложкой раздела,
 * девять групп-разделов с прогрессом ученика, 68 типов с разобранным
 * примером (условие, решение этапами с таблицей модели, «Где теряют
 * балл») и блок «Что нужно знать». Чертежей у №11 нет — пример в одну
 * колонку; место под картинку к задаче есть (lib/zadanie11/kartinki.ts),
 * пустых рамок нет. Условия и решения — из банка и функций подтипов,
 * без правок.
 */

function tex(formula: string): string {
  return typeset(`$${formula}$`);
}

/** Опорный блок подтипа: свой блок раздела или нужный перед ним. */
function opornyeHref(podtip: string): string {
  const s = dannyeTrenazhera().ssylki[subtype(podtip).section];
  return s.opornyy === null ? OPORNYE11_HREF : blokHref11(s.opornyy.slug);
}

/** Задача-пример подтипа: первая задача открытого банка или разминки, нет — первый аналог. */
function zadachaPrimera(podtip: string) {
  const bank = dannyeTrenazhera().bank.filter((b) => b.id === podtip);
  const b = bank.find((x) => x.analog === undefined) ?? bank[0];
  return b === undefined ? undefined : lite11(b);
}

/** Разобранный пример подтипа на сборке (первая раскрытая карточка). */
function primer(podtip: string) {
  const z = zadachaPrimera(podtip);
  if (z === undefined) {
    return null;
  }
  const r = razobrat11(subtype(podtip).solve(z.params));
  return {
    uslovieHtml: typesetKrupno(z.text),
    shagi: shagi11(r),
    otvet: otvetPrimera11(r, z.vybory),
  };
}

export function OZadanii11() {
  return (
    <div className="kz z11-karta">
      <YakorTipa />
      <KartaShapka
        nadzagolovok={SHAPKA11.nadzagolovok}
        zagolovok={SHAPKA11.zagolovok}
        lead={SHAPKA11.lead}
        fakty={SHAPKA11.fakty(SUBTYPES.length)}
        opasnoTitle={SHAPKA11.opasnoTitle}
        opasno={SHAPKA11.opasno.map((line) => typeset(line))}
        oblozhka={
          /* Обложка раздела — готовая картинка, как есть: без обрезки и
             пережатия, прозрачный фон на стекле шапки. */
          <img
            src={assetUrl('/images/task-11.webp')}
            alt={SHAPKA11.oblozhkaAlt}
            width={512}
            height={512}
            decoding="async"
          />
        }
      />

      <section className="kz-razdel" aria-labelledby="z11-gruppy-title">
        <div className="kz-razdel__head">
          <h3 className="stk-h3" id="z11-gruppy-title">
            {SHAPKA11.gruppyTitle}
          </h3>
          <p className="stk-lead">{SHAPKA11.gruppyLead}</p>
        </div>
        <div className="kz-gruppy">
          {SECTIONS.map((s, gi) => {
            const tipy = SUBTYPES.filter((st) => st.section === s.id);
            return (
              <KartaGruppa
                key={s.id}
                id={s.id}
                nazvanie={s.razminka === true ? `${s.nazvanie} · ${SHAPKA11.razminka}` : s.nazvanie}
                znakHtml=""
                znak={<Piktogramma name={ZNACHOK_RAZDELA[s.id]} />}
                ton={GRUPPY11_TON[s.id]}
                tipov={tipy.length}
                progress={<GruppaProgress11 podtipy={tipy.map((st) => st.id)} />}
                labels={SHAPKA11}
                open={gi === 0}
              >
                {tipy.map((st, i) => {
                  const open = gi === 0 && i === 0;
                  const trenirovatHref = tipTrenazherHref11(st.id);
                  const opasno = TIPY11_OPASNO[st.id];
                  const opasnoHtml = opasno === undefined ? undefined : typeset(opasno);
                  const z = zadachaPrimera(st.id);
                  /* Раскрытый с самого начала пример набирается на сборке;
                     остальные собираются в браузере по раскрытию. */
                  const ex = open ? primer(st.id) : null;
                  /* Картинка к задаче — только если она есть (сейчас нет ни одной). */
                  const kartinka = estKartinka11(st.id) ? <Kartinka11 podtip={st.id} /> : undefined;
                  return (
                    <KartaTip key={st.id} id={st.id} nazvanieHtml={typeset(st.title)} open={open}>
                      {ex !== null ? (
                        <KartaPrimer
                          uslovieHtml={ex.uslovieHtml}
                          {...(kartinka === undefined ? {} : { risunok: kartinka })}
                          shagi={ex.shagi}
                          otvet={ex.otvet}
                          {...(opasnoHtml === undefined ? {} : { opasnoHtml })}
                          trenirovatHref={trenirovatHref}
                          opornyeHref={opornyeHref(st.id)}
                          labels={SHAPKA11}
                        />
                      ) : z === undefined ? null : (
                        <PrimerLazy11
                          prototype={st.id}
                          klyuch={z.id}
                          opasnoHtml={opasnoHtml ?? ''}
                          trenirovatHref={trenirovatHref}
                          opornyeHref={opornyeHref(st.id)}
                          {...(kartinka === undefined ? {} : { risunok: kartinka })}
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

      <section className="kz-razdel kz-znat" aria-labelledby="z11-znat-title">
        <div className="kz-razdel__head">
          <h3 className="stk-h3" id="z11-znat-title">
            {SHAPKA11.znatTitle}
          </h3>
          <p className="stk-lead">{SHAPKA11.znatLead}</p>
        </div>
        <div className="kz-znat__setka">
          {FORMULY11.map((blok) => (
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
