import { GRUPPY21_VID, SHAPKA21, TIPY21_OPASNO, ZNAT21 } from '@/content/naibolshee21';
import { GRUPPY21, prototypesOfGruppa } from '@/lib/zadanie21/gruppy';
import { OPORNYE21_HREF, blokHref21, tipTrenazherHref21 } from '@/lib/zadanie21/links';
import { BLOK_TIPA21 } from '@/lib/zadanie21/opornye';
import { PROTOTYPES } from '@/lib/zadanie21/prototypes';
import { zadachaPoKlyuchu } from '@/lib/zadanie21/zadacha';
import { typeset } from '@/lib/tex';
import { FormulyRamka, KartaGruppa, KartaPrimer, KartaShapka, KartaTip } from '../karta';
import { YakorTipa } from '../karta/YakorTipa';
import { GruppaProgress21 } from './GruppaProgress21';
import { otvetTekstom, shagi21 } from './shagi21';

/**
 * Вкладка «О задании»: карта задания по типам («Стеклянная сцена»,
 * общие компоненты components/tasks/karta — как у №9, №7, №2). Шапка
 * (что проверяет, балл, минуты, чем опасно), семь групп с прогрессом
 * ученика, 21 тип с разобранным примером и блок «Что нужно знать».
 *
 * Пример типа — задача с ключом «P01|primer»: в каталог тренажёра она
 * не входит, ответы тренажёра на странице не лежат. Все примеры
 * собираются на сборке.
 */

const tex = (formula: string): string => typeset(`$${formula}$`);

function opornyeHref(id: string): string {
  const blok = BLOK_TIPA21[id];
  return blok === undefined ? OPORNYE21_HREF : blokHref21(blok);
}

export function OZadanii21() {
  return (
    <div className="kz z21-karta">
      <YakorTipa />
      <KartaShapka
        nadzagolovok={SHAPKA21.nadzagolovok}
        zagolovok={SHAPKA21.zagolovok}
        lead={SHAPKA21.lead}
        fakty={SHAPKA21.fakty(PROTOTYPES.length)}
        opasnoTitle={SHAPKA21.opasnoTitle}
        opasno={SHAPKA21.opasno.map((line) => typeset(line))}
      />

      <section className="kz-razdel" aria-labelledby="z21-gruppy-title">
        <div className="kz-razdel__head">
          <h3 className="stk-h3" id="z21-gruppy-title">
            {SHAPKA21.gruppyTitle}
          </h3>
          <p className="stk-lead">{SHAPKA21.gruppyLead}</p>
        </div>
        <div className="kz-gruppy">
          {GRUPPY21.map((g, gi) => {
            const vid = GRUPPY21_VID[g.id];
            const tipy = prototypesOfGruppa(g.id);
            return (
              <KartaGruppa
                key={g.id}
                id={`g${g.id}`}
                nazvanie={g.title}
                znakHtml={tex(vid.znak)}
                ton={vid.ton}
                tipov={tipy.length}
                progress={<GruppaProgress21 prototypes={tipy.map((p) => p.id)} />}
                labels={SHAPKA21}
                open={gi === 0}
              >
                {tipy.map((p, i) => {
                  const z = zadachaPoKlyuchu(`${p.id}|primer`);
                  return (
                    <KartaTip
                      key={p.id}
                      id={p.id}
                      nazvanieHtml={typeset(p.title)}
                      lead={typeset(`Например: $${p.primer}$`)}
                      open={gi === 0 && i === 0}
                    >
                      <KartaPrimer
                        uslovieHtml={typeset(z.uslovie)}
                        shagi={shagi21(z.solved)}
                        otvet={otvetTekstom(z.solved.answer)}
                        opasnoHtml={typeset(TIPY21_OPASNO[p.id] ?? '')}
                        trenirovatHref={tipTrenazherHref21(p.id)}
                        opornyeHref={opornyeHref(p.id)}
                        labels={SHAPKA21}
                      />
                    </KartaTip>
                  );
                })}
              </KartaGruppa>
            );
          })}
        </div>
      </section>

      <section className="kz-razdel kz-znat" aria-labelledby="z21-znat-title">
        <div className="kz-razdel__head">
          <h3 className="stk-h3" id="z21-znat-title">
            {SHAPKA21.znatTitle}
          </h3>
          <p className="stk-lead">{SHAPKA21.znatLead}</p>
        </div>
        <div className="kz-znat__setka">
          {ZNAT21.map((blok) => (
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
