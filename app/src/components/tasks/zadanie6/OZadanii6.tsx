import { FORMULY6, GRUPPY6_VID, SHAPKA6, TIPY6_OPASNO } from '@/content/sluchainye6';
import { assetUrl } from '@/lib/assetUrl';
import { typeset } from '@/lib/tex';
import { zadachiPrototipa } from '@/lib/zadanie6/bank/index';
import { OPORNYE6_HREF, blokHref6, tipTrenazherHref6 } from '@/lib/zadanie6/links';
import { BLOKI_OPORNYH } from '@/lib/zadanie6/opornye';
import { GROUPS, prototype, prototypesOfGroup, PROTOTYPES } from '@/lib/zadanie6/prototypes';
import { FormulyRamka, KartaGruppa, KartaPrimer, KartaShapka, KartaTip } from '../karta';
import { YakorTipa } from '../karta/YakorTipa';
import { GruppaProgress6 } from './GruppaProgress6';
import { PrimerLazy6 } from './PrimerLazy6';
import { Ris6 } from './Ris6';
import { otvetTekstom, shagiIzResheniya6 } from './shagi6';

/**
 * Вкладка «О задании» №6: карта задания по типам («Стеклянная сцена»,
 * общие компоненты components/tasks/karta — как у №8, №3 и №7).
 *
 * Шапка (что проверяет, балл, минуты, чем опасно) с обложкой раздела,
 * пять групп с прогрессом ученика, 15 типов с разобранным примером
 * (условие, рисунок, вопрос, решение по шагам) и блок «Что нужно знать».
 * Условия, рисунки и решения — из банка и решателя, без правок.
 */

function tex(formula: string): string {
  return typeset(`$${formula}$`);
}

/** Блок опорных задач, где отрабатывается навык прототипа. */
function opornyeHref(id: string): string {
  const blok = BLOKI_OPORNYH.find((b) => b.prototipy.includes(id));
  return blok === undefined ? OPORNYE6_HREF : blokHref6(blok.slug);
}

/** Задача-пример прототипа: первая исходная, нет — первый аналог. */
function zadachaPrimera(id: string) {
  const { istochniki, analogi } = zadachiPrototipa(id);
  return istochniki[0] ?? analogi[0];
}

/** Разобранный пример прототипа на сборке (первая раскрытая карточка). */
function primer(id: string) {
  const z = zadachaPrimera(id);
  if (z === undefined) {
    return null;
  }
  const p = prototype(id);
  const s = p.solve(z.params);
  const ris = p.ris(z.params);
  return {
    uslovieHtml: typeset(z.text),
    risunok:
      ris === undefined && z.posle === undefined ? undefined : (
        <>
          {ris === undefined ? null : <Ris6 ris={ris} />}
          {z.posle === undefined ? null : (
            <div className="kz-uslovie" dangerouslySetInnerHTML={{ __html: typeset(z.posle) }} />
          )}
        </>
      ),
    shagi: shagiIzResheniya6(s),
    otvet: otvetTekstom(s.answer),
  };
}

export function OZadanii6() {
  return (
    <div className="kz z6-karta">
      <YakorTipa />
      <KartaShapka
        nadzagolovok={SHAPKA6.nadzagolovok}
        zagolovok={SHAPKA6.zagolovok}
        lead={SHAPKA6.lead}
        fakty={SHAPKA6.fakty(PROTOTYPES.length)}
        opasnoTitle={SHAPKA6.opasnoTitle}
        opasno={SHAPKA6.opasno.map((line) => typeset(line))}
        oblozhka={
          /* Обложка раздела — готовая картинка, как есть: без обрезки и
             пережатия, прозрачный фон на стекле шапки. */
          <img
            src={assetUrl('/images/task-06.webp')}
            alt={SHAPKA6.oblozhkaAlt}
            width={512}
            height={512}
            decoding="async"
          />
        }
      />

      <section className="kz-razdel" aria-labelledby="z6-gruppy-title">
        <div className="kz-razdel__head">
          <h3 className="stk-h3" id="z6-gruppy-title">
            {SHAPKA6.gruppyTitle}
          </h3>
          <p className="stk-lead">{SHAPKA6.gruppyLead}</p>
        </div>
        <div className="kz-gruppy">
          {GROUPS.map((g, gi) => {
            const vid = GRUPPY6_VID[g.id];
            const tipy = prototypesOfGroup(g.id);
            return (
              <KartaGruppa
                key={g.id}
                id={g.id}
                nazvanie={g.title}
                znakHtml={tex(vid.znak)}
                ton={vid.ton}
                tipov={tipy.length}
                progress={<GruppaProgress6 prototypes={tipy.map((p) => p.id)} />}
                labels={SHAPKA6}
                open={gi === 0}
              >
                {tipy.map((p, i) => {
                  const open = gi === 0 && i === 0;
                  const trenirovatHref = tipTrenazherHref6(p.id);
                  const opasno = TIPY6_OPASNO[p.id];
                  const opasnoHtml = opasno === undefined ? undefined : typeset(opasno);
                  const z = zadachaPrimera(p.id);
                  /* Раскрытый с самого начала пример набирается на сборке;
                     остальные собираются в браузере по раскрытию. */
                  const ex = open ? primer(p.id) : null;
                  return (
                    <KartaTip
                      key={p.id}
                      id={p.id}
                      nazvanieHtml={typeset(p.title)}
                      lead={typeset(p.formula)}
                      open={open}
                    >
                      {ex !== null ? (
                        <KartaPrimer
                          uslovieHtml={ex.uslovieHtml}
                          {...(ex.risunok === undefined ? {} : { risunok: ex.risunok })}
                          shagi={ex.shagi}
                          otvet={ex.otvet}
                          {...(opasnoHtml === undefined ? {} : { opasnoHtml })}
                          trenirovatHref={trenirovatHref}
                          opornyeHref={opornyeHref(p.id)}
                          labels={SHAPKA6}
                        />
                      ) : z === undefined ? null : (
                        <PrimerLazy6
                          prototype={p.id}
                          klyuch={z.id}
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

      <section className="kz-razdel kz-znat" aria-labelledby="z6-znat-title">
        <div className="kz-razdel__head">
          <h3 className="stk-h3" id="z6-znat-title">
            {SHAPKA6.znatTitle}
          </h3>
          <p className="stk-lead">{SHAPKA6.znatLead}</p>
        </div>
        <div className="kz-znat__setka">
          {FORMULY6.map((blok) => (
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
