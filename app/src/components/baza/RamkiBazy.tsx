import { Abzacy, RamkaPrimer } from '@/components/teoriya/Ramki';
import { Tex } from '@/components/ui/Tex';
import type { BlokTeorii, RazborTeorii, Razvilka, ShagRazbora } from '@/lib/baza/types';
import { katex } from '@/lib/graph/katex';
import './ramkiBazy.css';

/**
 * Рамки теории базы поверх общих рамок сайта (components/teoriya/
 * Ramki.tsx): раскрывающийся «Пример», рамка «Случай», задача внутри
 * «Важно» / «Вывода» / «Лайфхака», схема-развилка и таблица.
 * Раскрывающийся пример — <details class="teor-primer">, как кнопка
 * «Пример» теории №7 и справочника №1; оформление рамок — «стеклянный»
 * слой components/tasks/teoriya/teoriya-steklo.css, своё — baza.css.
 */

function Formula({ tex, className }: { tex: string; className: string }) {
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(tex, { throwOnError: true, displayMode: true }),
      }}
    />
  );
}

/** Разбор в рамке «Пример»: шаги с подписями — что делаем и почему. */
export function RazborRamka({ razbor }: { razbor: RazborTeorii }) {
  return (
    <RamkaPrimer
      title={razbor.title}
      {...(razbor.uslovie === undefined ? {} : { uslovie: razbor.uslovie })}
      shagi={razbor.shagi}
      otvet={razbor.otvet}
    />
  );
}

/** Кнопка «Пример»: открывает разбор. Без скрипта — <details>. */
export function PrimerRaskryt({ razbor }: { razbor: RazborTeorii }) {
  return (
    <details className="teor-primer baza-razbor">
      <summary>
        <span className="baza-razbor__otkryt" aria-hidden="true">
          Пример ▸
        </span>
        <span className="baza-razbor__zakryt" aria-hidden="true">
          Свернуть ▴
        </span>
        <span className="baza-razbor__title">
          <span className="sr-only">Пример: </span>
          <Tex text={razbor.title} />
        </span>
      </summary>
      <RazborRamka razbor={razbor} />
    </details>
  );
}

function Shagi({ shagi }: { shagi: readonly ShagRazbora[] }) {
  return (
    <ol className="ramka__shagi">
      {shagi.map((shag) => (
        <li className="ramka__shag" key={shag.label}>
          <span className="ramka__shag-label">
            <Tex text={shag.label} />
          </span>
          {(shag.formuly ?? []).map((f) => (
            <Formula tex={f} className="ramka__formula" key={f} />
          ))}
          {(shag.paras ?? []).map((p) => (
            <p className="ramka__p" key={p}>
              <Tex text={p} />
            </p>
          ))}
        </li>
      ))}
    </ol>
  );
}

/** Задача-обоснование внутри «Важно», «Вывода», «Лайфхака»: видна сразу. */
export function ZadachaVRamke({ razbor }: { razbor: RazborTeorii }) {
  return (
    <div className="baza-rz">
      <p className="baza-rz__metka">
        Задача · <Tex text={razbor.title} />
      </p>
      {razbor.uslovie === undefined ? null : (
        <p className="ramka__p ramka__uslovie">
          <Tex text={razbor.uslovie} />
        </p>
      )}
      <Shagi shagi={razbor.shagi} />
      <p className="ramka__otvet">
        <Tex text={razbor.otvet} />
      </p>
    </div>
  );
}

/** Рамка «Случай» (или «Вид»): условие → вывод → почему → пример → запись ответа. */
export function RamkaSluchay({ b }: { b: Extract<BlokTeorii, { vid: 'sluchay' }> }) {
  return (
    <section className={`ramka teor-ramka baza-sluchay baza-ton--${b.ton}`}>
      <span className="ramka__plashka">{b.metka}</span>
      <h4 className="ramka__zagolovok">
        <Tex text={b.title} zagolovok />
      </h4>
      {b.formula === undefined ? null : <Formula tex={b.formula} className="ramka__formula" />}
      <p className="baza-sluchay__vyvod">
        <span className="baza-sluchay__strelka" aria-hidden="true">
          ⇒
        </span>
        <span>
          <Tex text={b.vyvod} />
        </span>
      </p>
      <Abzacy paras={b.paras} />
      <div className="baza-sluchay__primery">
        {b.razbory.map((r) => (
          <PrimerRaskryt razbor={r} key={r.title} />
        ))}
      </div>
      <p className="baza-sluchay__zapis">
        <Tex text={`**Как записать ответ.** ${b.zapis}`} />
      </p>
    </section>
  );
}

/** Узел схемы. Вложенный узел с тремя ветками и больше — столбиком: в половине ширины ветки тесно. */
function Uzel({ u, vlozhen = false }: { u: Razvilka; vlozhen?: boolean }) {
  const stolbik = u.vetki.length > 3 || (vlozhen && u.vetki.length > 2);
  return (
    <div className="baza-rv__uzel">
      <p className="baza-rv__vopros">
        <Tex text={u.vopros} />
      </p>
      <ul className={stolbik ? 'baza-rv__vetki is-stolbik' : 'baza-rv__vetki'}>
        {u.vetki.map((v) => (
          <li className={`baza-rv__vetka baza-ton--${v.ton}`} key={v.esli}>
            <span className="baza-rv__esli">
              <Tex text={v.esli} />
            </span>
            {v.itog === undefined ? null : (
              <p className="baza-rv__itog">
                <Tex text={v.itog} />
              </p>
            )}
            {v.formula === undefined ? null : (
              <Formula tex={v.formula} className="baza-rv__formula" />
            )}
            {v.punkty === undefined ? null : (
              <ul className="baza-rv__punkty">
                {v.punkty.map((p) => (
                  <li key={p}>
                    <Tex text={p} />
                  </li>
                ))}
              </ul>
            )}
            {v.dalshe === undefined ? null : <Uzel u={v.dalshe} vlozhen />}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Схема-развилка: вопрос, под ним ветки — каждая со своим условием и
 * цветом исхода. На компьютере ветки рядом и соединены линиями, на
 * телефоне идут столбиком. Цвет дублируется словами итога — схема
 * читается и в ч/б печати.
 */
export function SkhemaRazvilka({ title, razvilka }: { title?: string; razvilka: Razvilka }) {
  return (
    <figure className="baza-rv">
      {title === undefined ? null : (
        <figcaption className="baza-rv__title">
          <Tex text={title} />
        </figcaption>
      )}
      <Uzel u={razvilka} />
    </figure>
  );
}

/** Таблица: на телефоне строка — карточка, заголовок столбца — подпись ячейки. */
export function TablicaBazy({
  title,
  head,
  rows,
}: {
  title?: string;
  head: readonly string[];
  rows: readonly (readonly string[])[];
}) {
  return (
    <div className="baza-tablica">
      {title === undefined ? null : (
        <p className="baza-tablica__title">
          <Tex text={title} />
        </p>
      )}
      <table>
        <thead>
          <tr>
            {head.map((h) => (
              <th scope="col" key={h}>
                <Tex text={h} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.join('|')}>
              {r.map((c, i) => (
                <td key={`${i}-${c}`} data-label={head[i] ?? ''}>
                  <Tex text={c} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
