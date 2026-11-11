import { OPORNYE } from '@/content/opornye';
import { VYCHISLENIYA } from '@/content/vychisleniya';
import {
  DELIMOST8,
  FORMULY8,
  GRUPPY8,
  SHAPKA8,
  TIPY8,
  shagiTipa,
  type Gruppa8,
} from '@/content/vychisleniya8';
import { generate } from '@/lib/vychisleniya/generate';
import { ru } from '@/lib/vychisleniya/numbers';
import { prototypeById } from '@/lib/vychisleniya/prototypes';
import { ZADANIYA } from '@/lib/paths';
import { typeset } from '@/lib/tex';
import type { Shag } from '../steklo';
import {
  FormulyRamka,
  KartaPodgruppa,
  KartaPrimer,
  KartaShapka,
  KartaTip,
  Svernut,
} from '../karta';
import { Gruppa8 as Gruppa8Kartochka } from './Gruppa8';

/**
 * Вкладка «О задании» №8: карта задания по типам.
 *
 * Шапка (что проверяет, балл, минуты, чем опасно), пять групп с
 * прогрессом ученика, 26 типов с разобранным примером из генератора,
 * блок «Что нужно знать» и признаки делимости. Формулы набираются
 * KaTeX на сборке; прогресс — из хранилища браузера (Gruppa8).
 */

const BASE = `${ZADANIYA}/${VYCHISLENIYA.slug}`;

/** Пример типа: задача генератора на постоянном seed, базовый уровень, если он есть. */
function primer(prototype: string) {
  for (let i = 1; i <= 5; i += 1) {
    try {
      return generate(prototype, `o-zadanii#${i}`, 'base');
    } catch {
      /* Параметры не подобрались — следующий seed. */
    }
  }
  return null;
}

function tex(formula: string): string {
  return typeset(`$${formula}$`);
}

function TipySpisok({
  gruppa,
  ids,
  openFirst,
}: {
  gruppa: Gruppa8;
  ids: string[];
  openFirst: boolean;
}) {
  return (
    <>
      {ids.map((id, i) => {
        const proto = prototypeById(id);
        const teksty = TIPY8[id];
        if (proto === undefined || teksty === undefined) {
          return null;
        }
        const ex = primer(id);
        const podpisi = ex === null ? null : shagiTipa(id, ex.podtip);
        const shagi: Shag[] =
          ex === null
            ? []
            : ex.razbor.map((line, k) => ({
                chtoHtml: typeset(podpisi?.[k] ?? ''),
                formulaHtml: typeset(line),
              }));
        return (
          <KartaTip
            key={id}
            id={id}
            nazvanieHtml={typeset(teksty.nazvanie)}
            lead={teksty.lead}
            kod={id}
            open={openFirst && i === 0}
          >
            {ex === null ? null : (
              <KartaPrimer
                uslovieHtml={typeset(ex.uslovie)}
                shagi={shagi}
                otvet={ru(ex.otvet)}
                opasnoHtml={typeset(teksty.opasno)}
                trenirovatHref={`${BASE}/trenazher/?tip=${encodeURIComponent(id)}`}
                opornyeHref={`${BASE}/${OPORNYE.tail}${gruppa.opornye}/`}
                labels={SHAPKA8}
              />
            )}
          </KartaTip>
        );
      })}
    </>
  );
}

export function VychisleniyaAbout() {
  return (
    <div className="kz z8-karta">
      <KartaShapka
        nadzagolovok={SHAPKA8.nadzagolovok}
        zagolovok={SHAPKA8.zagolovok}
        lead={SHAPKA8.lead}
        fakty={SHAPKA8.fakty}
        opasnoTitle={SHAPKA8.opasnoTitle}
        opasno={SHAPKA8.opasno.map((line) => typeset(line))}
      />

      <section className="kz-razdel" aria-labelledby="z8-gruppy-title">
        <div className="kz-razdel__head">
          <h3 className="stk-h3" id="z8-gruppy-title">
            {SHAPKA8.gruppyTitle}
          </h3>
          <p className="stk-lead">{SHAPKA8.gruppyLead}</p>
        </div>
        <div className="kz-gruppy">
          {GRUPPY8.map((g, gi) => (
            <Gruppa8Kartochka
              key={g.id}
              id={g.id}
              nazvanie={g.nazvanie}
              znakHtml={tex(g.znak)}
              ton={g.ton}
              prototypes={g.prototypes}
              open={gi === 0}
            >
              {g.podgruppy === undefined ? (
                <TipySpisok gruppa={g} ids={g.prototypes} openFirst={gi === 0} />
              ) : (
                g.podgruppy.map((pod, pi) => (
                  <div className="kz-tipy__podgruppa" key={pod.nazvanie}>
                    <KartaPodgruppa>{pod.nazvanie}</KartaPodgruppa>
                    <TipySpisok gruppa={g} ids={pod.prototypes} openFirst={gi === 0 && pi === 0} />
                  </div>
                ))
              )}
            </Gruppa8Kartochka>
          ))}
        </div>
      </section>

      <section className="kz-razdel kz-znat" aria-labelledby="z8-znat-title">
        <div className="kz-razdel__head">
          <h3 className="stk-h3" id="z8-znat-title">
            {SHAPKA8.znatTitle}
          </h3>
          <p className="stk-lead">{SHAPKA8.znatLead}</p>
        </div>
        <div className="kz-znat__setka">
          {FORMULY8.map((blok) => (
            <FormulyRamka
              key={blok.id}
              nazvanie={blok.nazvanie}
              ton={blok.ton}
              formuly={blok.formuly.map((f) => ({ html: tex(f.tex), primerHtml: tex(f.primer) }))}
            />
          ))}
        </div>
        <Svernut title={SHAPKA8.delimostTitle}>
          <ul className="kz-delimost">
            {DELIMOST8.map((row) => (
              <li key={row.na}>
                <b>на {row.na}</b>
                <span>{row.pravilo}</span>
                <i>{row.primer}</i>
              </li>
            ))}
          </ul>
        </Svernut>
      </section>
    </div>
  );
}
