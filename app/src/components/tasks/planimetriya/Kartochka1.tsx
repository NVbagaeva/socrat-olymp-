import { clsx } from 'clsx';
import { Tex } from '@/components/ui/Tex';
import { Display } from '@/components/tasks/theory/rich/parts';
import { RAZBOR_1 } from '@/content/zadanie1';
import { TEORIYA_1_TEKSTY, type Fakt1, type Kartochka1 as K1 } from '@/content/teoriya1';
import { BANK_FIPI } from '@/lib/planimetriya/bank/fipi';
import { renderPlan } from '@/lib/planimetriya/render';
import { prototip } from '@/lib/planimetriya/stseny';
import type { Params } from '@/lib/planimetriya/stseny/dsl';
import { risunokTeorii } from '@/lib/planimetriya/teoriya';
import { Razbor1 } from './Razbor1';
import { ZhivoyChertezh } from './ZhivoyChertezh';

/** Рисунок теории по ключу: рисует движок планиметрии на сборке. */
export function RisunokTeorii({ id, className }: { id: string; className?: string }) {
  const r = risunokTeorii(id);
  return (
    <span
      className={clsx('pl-wrap', className)}
      dangerouslySetInnerHTML={{ __html: renderPlan(r.scena, r.optsii) }}
    />
  );
}

/**
 * Строка «Где на ЕГЭ»: номера прототипов. Задан адрес тренажёра —
 * номер ведёт в тренажёр на этот прототип; иначе — плашка с названием
 * прототипа во всплывающей подсказке.
 */
export function GdeNaEge({
  prototipy,
  trenazher,
}: {
  prototipy: readonly number[];
  trenazher?: (proto: number) => string;
}) {
  if (prototipy.length === 0) return null;
  return (
    <p className="z1-gde">
      <span className="z1-gde__label">{TEORIYA_1_TEKSTY.gdeNaEge}:</span>
      {prototipy.map((p) => {
        const title = `Прототип ${p}: ${prototip(p).nazvanie.replace(/\$/g, '')}`;
        return trenazher === undefined ? (
          <span className="z1-gde__chip" title={title} key={p}>
            {p}
          </span>
        ) : (
          <a className="z1-gde__chip" href={trenazher(p)} title={title} key={p}>
            {p}
          </a>
        );
      })}
    </p>
  );
}

/** «Пример»: задача открытого банка с решением по шагам — раскрывается по нажатию. */
function Primer({ n }: { n: number }) {
  const z = BANK_FIPI.find((x) => x.n === n);
  if (z === undefined) return null;
  const params = { ...prototip(z.proto).primer, ...z.params } as Params;
  return (
    <details className="z1-primer">
      <summary className="z1-primer__summary">
        {TEORIYA_1_TEKSTY.primer}: {RAZBOR_1.zadacha(n).toLowerCase()}
      </summary>
      <Razbor1 proto={z.proto} params={params} title={RAZBOR_1.zadacha(n)} />
    </details>
  );
}

/**
 * Карточка справочника задания №1: заголовок, текст своими словами,
 * формула KaTeX, таблица значений, «Где на ЕГЭ», чертёж движка (или
 * живой чертёж) и раскрывающийся «Пример». Разметка и стили — карточки
 * теории №12 (qth-card), своего у карточки только «Где на ЕГЭ» и
 * «Пример».
 */
export function Kartochka1({
  k,
  trenazher,
  bezPrimera = false,
}: {
  k: K1;
  trenazher?: (proto: number) => string;
  /** Печать справочника и шпаргалки: без примера. */
  bezPrimera?: boolean;
}) {
  const est = k.risunok !== undefined || k.zhivoy !== undefined;
  return (
    <li className={clsx('qth-card z1-k', est && 'qth-card--chart')} id={`k-${k.id}`}>
      <h4 className="qth-card__title">
        <Tex text={k.title} />
      </h4>
      <div className="qth-card__text">
        {k.formula === undefined ? null : (
          <div className="qth-card__formula">
            <Display tex={k.formula} />
          </div>
        )}
        {k.tekst.map((t) => (
          <p className="qth-card__p" key={t}>
            <Tex text={t} />
          </p>
        ))}
        {k.tablica === undefined ? null : (
          <table className="qth-card__table">
            <thead>
              <tr>
                {k.tablica.head.map((c, i) => (
                  <th key={i} scope="col">
                    <Tex text={c} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {k.tablica.rows.map((row) => (
                <tr key={row[0]}>
                  {row.map((c, i) => (
                    <td key={i}>
                      <Tex text={c} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <GdeNaEge prototipy={k.prototipy} trenazher={trenazher} />
      </div>
      {k.zhivoy !== undefined ? (
        <figure className="qth-card__chart z1-k__pic z1-k__pic--zhivoy">
          <ZhivoyChertezh id={k.zhivoy} />
          <figcaption className="z1-k__podpis">{TEORIYA_1_TEKSTY.zhivoyPodpis}</figcaption>
        </figure>
      ) : k.risunok !== undefined ? (
        <RisunokTeorii id={k.risunok} className="qth-card__chart z1-k__pic" />
      ) : null}
      {k.primer === undefined || bezPrimera ? null : <Primer n={k.primer} />}
    </li>
  );
}

/** Мини-карточка полезного факта: номер, формулировка, формула, чертёж, прототипы. */
export function Fakt({ f, trenazher }: { f: Fakt1; trenazher?: (proto: number) => string }) {
  return (
    <li className="z1-fakt" id={`fakt-${f.no}`}>
      <div className="z1-fakt__text">
        <p className="z1-fakt__no">
          {TEORIYA_1_TEKSTY.fakt} {f.no}
        </p>
        <h4 className="z1-fakt__title">
          <Tex text={f.title} />
        </h4>
        <p className="z1-fakt__p">
          <Tex text={f.tekst} />
        </p>
        {f.formula === undefined ? null : <Display tex={f.formula} />}
        <GdeNaEge prototipy={f.prototipy} trenazher={trenazher} />
      </div>
      <RisunokTeorii id={f.risunok} className="z1-fakt__pic" />
    </li>
  );
}
