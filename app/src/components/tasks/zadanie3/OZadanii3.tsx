import { Chertezh3d } from '@/components/stereo/Chertezh3d';
import { FormulyRamka, KartaGruppa, KartaShapka, KartaTip } from '../karta';
import { FORMULY3, GRUPPY3, PODOBIE3, SHAPKA3, TIPY3 } from '@/content/zadanie3';
import { blokHref3, tipTrenazherHref3 } from '@/lib/zadanie3/links';
import { primer3 } from '@/lib/zadanie3/primery';
import { texPlain, typeset } from '@/lib/tex';
import { CHERTEZHI_FORMUL, chertezhPodobiya } from './chertezhiFormul';
import { Figurka } from './Figurka';
import { GruppaProgress3 } from './GruppaProgress3';
import { Primer3, Primer3Lazy } from './Primer3';
import { YakorTipa } from './YakorTipa';
import './zadanie3.css';

/**
 * Вкладка «О задании» №3: карта задания по типам в «Стеклянной сцене».
 *
 * Шапка (что проверяет, балл, минуты, чем опасно), семь групп с
 * прогрессом ученика, пятнадцать типов с разобранным примером, блок
 * «Что нужно знать» с чертежами и рамка «Подобные тела». Компоненты —
 * общая карта задания (components/tasks/karta), как у №8. Формулы
 * набраны KaTeX на сборке; первый пример лежит в разметке, остальные
 * приезжают по раскрытию карточки типа.
 */

function tex(formula: string): string {
  return typeset(`$${formula}$`);
}

export function OZadanii3() {
  return (
    <div className="kz z3-karta">
      <YakorTipa />
      <KartaShapka
        nadzagolovok={SHAPKA3.nadzagolovok}
        zagolovok={SHAPKA3.zagolovok}
        lead={SHAPKA3.lead}
        fakty={SHAPKA3.fakty}
        opasnoTitle={SHAPKA3.opasnoTitle}
        opasno={SHAPKA3.opasno.map((line) => typeset(line))}
      />

      <section className="kz-razdel" id="tipy" aria-labelledby="z3-gruppy-title">
        <div className="kz-razdel__head">
          <h3 className="stk-h3" id="z3-gruppy-title">
            {SHAPKA3.gruppyTitle}
          </h3>
          <p className="stk-lead">{SHAPKA3.gruppyLead}</p>
        </div>
        <div className="kz-gruppy">
          {GRUPPY3.map((g, gi) => (
            <KartaGruppa
              key={g.id}
              id={g.id}
              nazvanie={g.nazvanie}
              znakHtml=""
              znak={<Figurka prototip={g.znak} />}
              ton={g.ton}
              tipov={g.tipy.length}
              progress={<GruppaProgress3 gruppa={g.id} />}
              labels={SHAPKA3}
              open={gi === 0}
            >
              {g.tipy.map((tip, ti) => {
                const teksty = TIPY3[tip];
                if (teksty === undefined) {
                  return null;
                }
                const open = gi === 0 && ti === 0;
                const trenirovatHref = tipTrenazherHref3(tip);
                const opornyeHref = blokHref3(teksty.opornye);
                /* Раскрытый с самого начала пример лежит в разметке;
                   остальные четырнадцать приезжают по раскрытию. */
                const srazu = open ? primer3(tip) : null;
                return (
                  <KartaTip
                    key={tip}
                    id={tip}
                    nazvanieHtml={typeset(teksty.nazvanie)}
                    lead={texPlain(teksty.lead)}
                    open={open}
                  >
                    {srazu === null ? (
                      <Primer3Lazy
                        tip={tip}
                        trenirovatHref={trenirovatHref}
                        opornyeHref={opornyeHref}
                      />
                    ) : (
                      <Primer3
                        primer={srazu}
                        trenirovatHref={trenirovatHref}
                        opornyeHref={opornyeHref}
                      />
                    )}
                  </KartaTip>
                );
              })}
            </KartaGruppa>
          ))}
        </div>
      </section>

      <section className="kz-razdel kz-znat" id="chto-nuzhno-znat" aria-labelledby="z3-znat-title">
        <div className="kz-razdel__head">
          <h3 className="stk-h3" id="z3-znat-title">
            {SHAPKA3.znatTitle}
          </h3>
          <p className="stk-lead">{SHAPKA3.znatLead}</p>
        </div>
        <div className="kz-znat__setka">
          {FORMULY3.map((blok) => (
            <FormulyRamka
              key={blok.id}
              nazvanie={blok.nazvanie}
              ton={blok.ton}
              formuly={blok.formuly.map((f, i) => ({
                html: tex(f.tex),
                primerHtml: tex(f.primer),
                ...(i === 0
                  ? { risunok: <Chertezh3d model={CHERTEZHI_FORMUL[blok.id]()} tema="ekran" /> }
                  : {}),
              }))}
            />
          ))}
        </div>

        <section
          className="z3-podobie stk-glass stk-glass--warm"
          aria-labelledby="z3-podobie-title"
        >
          <h4 className="z3-podobie__zag" id="z3-podobie-title">
            {PODOBIE3.nazvanie}
          </h4>
          <div className="z3-podobie__telo">
            <div className="z3-podobie__chertezh">
              <Chertezh3d model={chertezhPodobiya(PODOBIE3.alt)} tema="ekran" />
            </div>
            <div>
              <p
                className="stk-lead"
                dangerouslySetInnerHTML={{ __html: typeset(PODOBIE3.lead) }}
              />
              <ul className="z3-podobie__stroki">
                {PODOBIE3.stroki.map((s) => (
                  <li key={s.vo}>
                    <span>{s.chto}</span>
                    <b
                      dangerouslySetInnerHTML={{
                        __html: `${PODOBIE3.vRaz} ${tex(s.vo)} ${PODOBIE3.raz}`,
                      }}
                    />
                    <i>{PODOBIE3.pri(s.primer)}</i>
                  </li>
                ))}
              </ul>
              <p
                className="z3-podobie__primer"
                dangerouslySetInnerHTML={{ __html: typeset(PODOBIE3.primer) }}
              />
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}
