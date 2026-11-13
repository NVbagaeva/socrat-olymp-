import { O_ZADANII_9 } from '@/content/proizvodnaya';
import { GRUPPY9_VID, SHAPKA9, TIPY9_OPASNO, TIPY_BLOKA9, ZNAT9 } from '@/content/proizvodnaya9';
import { assetUrl } from '@/lib/assetUrl';
import { OPORNYE9_HREF, blokHref9, tipTrenazherHref9, tipYakor9 } from '@/lib/proizvodnaya/links';
import { PROTOTYPES } from '@/lib/proizvodnaya/prototypes';
import { prototypesOfGroup } from '@/lib/proizvodnaya/skills';
import { typeset } from '@/lib/tex';
import { FormulyRamka, KartaGruppa, KartaShapka, KartaTip } from '../karta';
import { YakorTipa } from '../karta/YakorTipa';
import { GruppaProgress9 } from './GruppaProgress9';
import { primer9 } from './primer9';
import { PrimerKarta9, PrimerKarta9Lazy } from './PrimerKarta9';

/**
 * Вкладка «О задании» №9: карта задания по типам («Стеклянная сцена»,
 * общие компоненты components/tasks/karta — как у №8, №3, №7, №6, №2).
 *
 * Шапка (что проверяет, балл, минуты, чем опасно) с обложкой раздела,
 * пять групп с прогрессом ученика, 31 тип с разобранным примером
 * (условие, чертёж — закреплён рядом с шагами, решение по шагам) и
 * блок «Что нужно знать». Условия, чертежи и решения — из генератора,
 * без правок.
 */

function tex(formula: string): string {
  return typeset(`$${formula}$`);
}

/** Блок опорных задач, где отрабатывается навык прототипа. */
function opornyeHref(id: string): string {
  const blok = Object.entries(TIPY_BLOKA9).find(([, tipy]) => tipy.includes(id))?.[0];
  return blok === undefined ? OPORNYE9_HREF : blokHref9(blok);
}

export function OZadanii9() {
  return (
    <div className="kz z9-karta">
      <YakorTipa />
      <KartaShapka
        nadzagolovok={SHAPKA9.nadzagolovok}
        zagolovok={SHAPKA9.zagolovok}
        lead={SHAPKA9.lead}
        fakty={SHAPKA9.fakty(PROTOTYPES.length)}
        opasnoTitle={SHAPKA9.opasnoTitle}
        opasno={SHAPKA9.opasno.map((line) => typeset(line))}
        oblozhka={
          /* Обложка раздела — готовая картинка, как есть: без обрезки и
             пережатия, прозрачный фон на стекле шапки. */
          <img
            src={assetUrl('/images/task-09.webp')}
            alt={SHAPKA9.oblozhkaAlt}
            width={512}
            height={512}
            decoding="async"
          />
        }
      />

      <section className="kz-razdel" aria-labelledby="z9-gruppy-title">
        <div className="kz-razdel__head">
          <h3 className="stk-h3" id="z9-gruppy-title">
            {SHAPKA9.gruppyTitle}
          </h3>
          <p className="stk-lead">{SHAPKA9.gruppyLead}</p>
        </div>
        <div className="kz-gruppy">
          {O_ZADANII_9.gruppy.map((g, gi) => {
            const vid = GRUPPY9_VID[g.id];
            const tipy = prototypesOfGroup(g.id);
            return (
              <KartaGruppa
                key={g.id}
                id={g.id}
                nazvanie={g.title}
                znakHtml={tex(vid.znak)}
                ton={vid.ton}
                tipov={tipy.length}
                progress={<GruppaProgress9 prototypes={tipy.map((p) => p.id)} />}
                labels={SHAPKA9}
                open={gi === 0}
              >
                {tipy.map((p, i) => {
                  const open = gi === 0 && i === 0;
                  const opasnoHtml = typeset(TIPY9_OPASNO[p.id] ?? '');
                  const props = {
                    opasnoHtml,
                    trenirovatHref: tipTrenazherHref9(p.id),
                    opornyeHref: opornyeHref(p.id),
                  };
                  return (
                    <KartaTip
                      key={p.id}
                      id={tipYakor9(p.id)}
                      nazvanieHtml={typeset(p.nazvanie)}
                      lead={typeset(p.kratko)}
                      open={open}
                    >
                      {/* Раскрытый с самого начала пример собирается на сборке;
                          остальные — в браузере по раскрытию. */}
                      {open ? (
                        <PrimerKarta9 primer={primer9(p.id)} {...props} />
                      ) : (
                        <PrimerKarta9Lazy prototip={p.id} {...props} />
                      )}
                    </KartaTip>
                  );
                })}
              </KartaGruppa>
            );
          })}
        </div>
      </section>

      <section className="kz-razdel kz-znat" aria-labelledby="z9-znat-title">
        <div className="kz-razdel__head">
          <h3 className="stk-h3" id="z9-znat-title">
            {SHAPKA9.znatTitle}
          </h3>
          <p className="stk-lead">{SHAPKA9.znatLead}</p>
        </div>
        <div className="kz-znat__setka">
          {ZNAT9.map((blok) => (
            <FormulyRamka
              key={blok.id}
              nazvanie={blok.nazvanie}
              ton={blok.ton}
              formuly={blok.formuly.map((f) => ({
                html: tex(f.tex),
                primerHtml: typeset(f.primer),
              }))}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
