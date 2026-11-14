import { FORMULY1, GRUPPY1_TON, SHAPKA1, TIPY1_OPASNO } from '@/content/planimetriya1';
import { O_ZADANII_1, ZADANIE1 } from '@/content/zadanie1';
import { typeset } from '@/lib/tex';
import { PROTOTIPY } from '@/lib/planimetriya/stseny';
import type { Blok } from '@/lib/planimetriya/stseny/dsl';
import { blokHref1, tipTrenazherHref1 } from '@/lib/planimetriya/trening/links';
import { opornyyDlya } from '@/lib/planimetriya/trenazher/dannye';
import { primer1 } from '@/lib/planimetriya/trening/primer';
import { klyuchProto } from '@/lib/planimetriya/trenazher/sessiya';
import { IllyustratsiyaShapki } from '../IllyustratsiyaShapki';
import { FormulyRamka, KartaGruppa, KartaShapka, KartaTip } from '../karta';
import { YakorTipa } from '../karta/YakorTipa';
import { GruppaProgress1 } from './GruppaProgress1';
import { IkonkaBloka1 } from './IkonkaBloka1';
import { Primer1Lazy, Primer1View } from './Primer1';

/**
 * Вкладка «О задании» №1: карта задания по типам («Стеклянная сцена»,
 * общие компоненты components/tasks/karta — как у №8, №3, №7 и №6).
 *
 * Шапка с широкой обложкой раздела (картинка целиком и на телефоне),
 * десять групп с прогрессом ученика, 75 типов с разобранным примером —
 * задача открытого банка с чертежом, закреплённым рядом с шагами
 * решения, — и блок «Что нужно знать». Условия, чертежи и решения — из
 * движка планиметрии, без правок.
 */

function tex(formula: string): string {
  return typeset(`$${formula}$`);
}

export function OZadanii1() {
  return (
    <div className="kz z1-karta">
      <YakorTipa />
      <KartaShapka
        nadzagolovok={SHAPKA1.nadzagolovok}
        zagolovok={SHAPKA1.zagolovok}
        lead={O_ZADANII_1.lead}
        fakty={SHAPKA1.fakty(PROTOTIPY.length)}
        opasnoTitle={SHAPKA1.opasnoTitle}
        /* «Чем опасно» — прежние «Типичные ошибки» и «Что в ответе». */
        opasno={[
          ...O_ZADANII_1.oshibki.map((o) => `<b>${o.title}.</b> ${typeset(o.text)}`),
          `<b>${O_ZADANII_1.format.title}.</b> ${typeset(O_ZADANII_1.format.text)}`,
        ]}
        oblozhkaShirokaya
        oblozhka={
          /* Шапка раздела — готовая картинка, как есть: целиком, без
             обрезки и пережатия, прозрачный фон на стекле шапки. */
          <IllyustratsiyaShapki
            art={ZADANIE1.art}
            alt={SHAPKA1.oblozhkaAlt}
            sizes="(min-width: 1024px) 480px, (min-width: 640px) 600px, 100vw"
          />
        }
      />

      <section className="kz-razdel" aria-labelledby="z1-gruppy-title">
        <div className="kz-razdel__head">
          <h3 className="stk-h3" id="z1-gruppy-title">
            {SHAPKA1.gruppyTitle}
          </h3>
          <p className="stk-lead">{SHAPKA1.gruppyLead}</p>
        </div>
        <div className="kz-gruppy">
          {O_ZADANII_1.tipy.map((g, gi) => {
            const blok = g.blok as Blok;
            const tipy = PROTOTIPY.filter((p) => p.blok === blok);
            return (
              <KartaGruppa
                key={blok}
                id={blok}
                nazvanie={typeset(g.title)}
                znakHtml=""
                znak={<IkonkaBloka1 blok={blok} />}
                ton={GRUPPY1_TON[blok]}
                tipov={tipy.length}
                progress={<GruppaProgress1 prototypes={tipy.map((p) => klyuchProto(p.id))} />}
                labels={SHAPKA1}
                open={gi === 0}
              >
                {tipy.map((p, i) => {
                  const k = klyuchProto(p.id);
                  const open = gi === 0 && i === 0;
                  const opasnoHtml = typeset(TIPY1_OPASNO[k] ?? '');
                  const trenirovatHref = tipTrenazherHref1(k);
                  const opornye = blokHref1(opornyyDlya(p.id, blok));
                  /* Раскрытый с самого начала пример — на сборке; остальные
                     приезжают файлом по раскрытию карточки. */
                  const ex = open ? primer1(k) : null;
                  return (
                    <KartaTip key={k} id={k} nazvanieHtml={typeset(p.nazvanie)} open={open}>
                      {ex !== null ? (
                        <Primer1View
                          primer={ex}
                          opasnoHtml={opasnoHtml}
                          trenirovatHref={trenirovatHref}
                          opornyeHref={opornye}
                        />
                      ) : (
                        <Primer1Lazy
                          tip={k}
                          opasnoHtml={opasnoHtml}
                          trenirovatHref={trenirovatHref}
                          opornyeHref={opornye}
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

      <section className="kz-razdel kz-znat" aria-labelledby="z1-znat-title">
        <div className="kz-razdel__head">
          <h3 className="stk-h3" id="z1-znat-title">
            {SHAPKA1.znatTitle}
          </h3>
          <p className="stk-lead">{SHAPKA1.znatLead}</p>
        </div>
        <div className="kz-znat__setka">
          {FORMULY1.map((blok) => (
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
