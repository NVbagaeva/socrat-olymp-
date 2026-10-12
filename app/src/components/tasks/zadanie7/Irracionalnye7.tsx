import { RamkaPrimer, RamkaVazhno, RamkaVyvod } from '@/components/teoriya/Ramki';
import { Tex } from '@/components/ui/Tex';
import {
  IRRACIONALNYE_7,
  ROLI_IRR_7,
  type SkhemaIrr7,
  type StrokaIrr7,
  type VidIrr7,
} from '@/content/teoriya7-irr';
import { TEORIYA_7_TEKSTY } from '@/content/teoriya7';
import { GrafikIrr7 } from './GrafikIrr7';
import { GdeNaEge7 } from './GdeNaEge7';

const B = IRRACIONALNYE_7;

/**
 * Раздел «Иррациональные уравнения» теории №7 — большой блок на всю
 * ширину: вступление, легенда ролей, карточки видов со схемами
 * равносильных переходов, живой рисунок посторонних корней, рамка про
 * подстановку и итоговая таблица. Данные — content/teoriya7-irr.ts.
 *
 * Схема — HTML и KaTeX, не картинка: слева исходное уравнение в рамке,
 * стрелка ⇔, справа система с фигурной скобкой. Строки окрашены по роли
 * и подписаны словом («решаем», «проверяем обязательно», «выполняется
 * само») — в ч/б печати роль читается без цвета. На телефоне стрелка
 * поворачивается вниз, схема идёт в столбик.
 */

/** Фигурная скобка системы: тянется на высоту строк, толщина штриха постоянна. */
function Skobka() {
  return (
    <svg
      className="z7-sx__skobka"
      viewBox="0 0 10 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M9 1 C5 1 5 6 5 14 L5 40 C5 46 3.5 49.5 1 50 C3.5 50.5 5 54 5 60 L5 86 C5 94 5 99 9 99"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function Stroka({ s }: { s: StrokaIrr7 }) {
  return (
    <div className={`z7-sx__stroka z7-sx__stroka--${s.rol}`}>
      <span className="z7-sx__rol">
        {s.rol === 'samo' ? <span aria-hidden="true">✓ </span> : null}
        {ROLI_IRR_7[s.rol].slovo}
      </span>
      <span className="z7-sx__formula">
        {s.tex ? <Tex text={`$\\displaystyle ${s.tex}$`} /> : <b>{s.tekst}</b>}
      </span>
      {s.prichina ? (
        <span className="z7-sx__prichina">
          <Tex text={`— ${s.prichina}`} />
        </span>
      ) : null}
    </div>
  );
}

/** Схема-переход: исходное ⇔ система (или ветки «если …»). */
export function SkhemaIrr7({ skhema, kompakt = false }: { skhema: SkhemaIrr7; kompakt?: boolean }) {
  return (
    <div className={kompakt ? 'z7-sx z7-sx--kompakt' : 'z7-sx'}>
      <div className="z7-sx__iskh">
        <Tex text={`$\\displaystyle ${skhema.iskhodnoe}$`} />
      </div>
      <div className="z7-sx__vetki">
        {skhema.vetki.map((v) => (
          <div className="z7-sx__vetka" key={v.esli ?? 'odna'}>
            {v.esli ? (
              <span className="z7-sx__esli">
                <Tex text={`если $${v.esli}$`} />
              </span>
            ) : null}
            <span className="z7-sx__strelka" aria-label="равносильно">
              <Tex text="$\iff$" />
            </span>
            <div className="z7-sx__itog">
              <div className={v.sistema.length > 1 ? 'z7-sx__sistema' : 'z7-sx__odna'}>
                {v.sistema.length > 1 ? <Skobka /> : null}
                <div className="z7-sx__stroki">
                  {v.sistema.map((s) => (
                    <Stroka s={s} key={`${s.rol}${s.tex ?? s.tekst}`} />
                  ))}
                </div>
              </div>
              {(v.samo ?? []).map((s) => (
                <Stroka s={s} key={`${s.rol}${s.tex ?? s.tekst}`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Легенда ролей над блоком: одна на все схемы. */
function Legenda() {
  return (
    <ul className="z7-irr__legenda" aria-label="Цвета в схемах">
      {(['uravnenie', 'uslovie', 'samo'] as const).map((r) => (
        <li className={`z7-irr__rol z7-irr__rol--${r}`} key={r}>
          <span className="z7-irr__rol-slovo">
            {r === 'samo' ? '✓ ' : ''}
            {ROLI_IRR_7[r].slovo}
          </span>
          <span className="z7-irr__rol-opisanie">{ROLI_IRR_7[r].legenda}</span>
        </li>
      ))}
    </ul>
  );
}

function Primer({ p }: { p: VidIrr7['primery'][number] }) {
  const istochnik = p.bank ? `**${TEORIYA_7_TEKSTY.fipi}**` : `**${TEORIYA_7_TEKSTY.analog}**`;
  return (
    <details className="z7-primer z7-irr__primer">
      <summary className="z7-primer__summary">
        <span className="z7-irr__primer-knopka">{TEORIYA_7_TEKSTY.primer} ▸</span>{' '}
        <span className="z7-irr__primer-title">
          {p.title}
          {p.lovushka ? <span className="z7-irr__lovushka">ловушка</span> : null}
        </span>
      </summary>
      <RamkaPrimer
        title={p.title}
        uslovie={`${istochnik} ${p.uslovie}`}
        shagi={p.shagi}
        otvet={p.otvet}
      />
    </details>
  );
}

function Vid({ v, trenazher }: { v: VidIrr7; trenazher?: string }) {
  const k = v.kartochka;
  return (
    <article className={`z7-irr__vid z7-irr__vid--${v.ton}`} id={`k-${k.id}`}>
      <header className="z7-irr__vid-shapka">
        <span className="z7-irr__metka">{v.metka}</span>
        <h4 className="z7-irr__vid-title">
          <Tex text={k.title} />
        </h4>
      </header>
      <SkhemaIrr7 skhema={v.skhema} />
      <div className="z7-irr__poyasneniya">
        {v.poyasneniya.map((p) => (
          <p className={`z7-irr__poyasnenie z7-irr__poyasnenie--${p.rol}`} key={p.tekst}>
            <span className="z7-irr__poyasnenie-rol">
              {p.rol === 'samo' ? '✓ ' : ''}
              {p.rol === 'uslovie' ? 'Обязательно' : 'Не проверяем'}
            </span>
            <Tex text={p.tekst} />
          </p>
        ))}
      </div>
      {v.ramki.map((r) =>
        r.vid === 'pochemu' ? (
          <RamkaVyvod title={r.title} key={r.title}>
            <ol className="z7-irr__pochemu">
              {(r.shagi ?? []).map((s) => (
                <li key={s}>
                  <Tex text={s} />
                </li>
              ))}
            </ol>
          </RamkaVyvod>
        ) : (
          <RamkaVazhno title={r.title} key={r.title}>
            {(r.paras ?? []).map((t) => (
              <p className="ramka__p" key={t}>
                <Tex text={t} />
              </p>
            ))}
          </RamkaVazhno>
        ),
      )}
      {v.grafik ? <GrafikIrr7 /> : null}
      {v.zametka ? (
        <p className="z7-irr__zametka">
          <Tex text={v.zametka} />
        </p>
      ) : null}
      {trenazher ? <GdeNaEge7 prototipy={k.prototipy} trenazher={trenazher} /> : null}
      <div className="z7-irr__primery">
        {v.primery.map((p) => (
          <Primer p={p} key={p.id} />
        ))}
      </div>
    </article>
  );
}

/** Итоговая таблица: строки в цветах карточек. */
export function TablicaIrr7({ kompakt = false }: { kompakt?: boolean }) {
  const t = B.tablica;
  return (
    <div className={kompakt ? 'z7-irr__tablica z7-irr__tablica--kompakt' : 'z7-irr__tablica'}>
      {kompakt ? null : (
        <p className="z7-tablica__title">
          <Tex text={t.title} />
        </p>
      )}
      <table>
        <thead>
          <tr>
            {t.head.map((h) => (
              <th scope="col" key={h}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {t.rows.map((r) => (
            <tr className={`z7-irr__tr z7-irr__tr--${r.ton}`} key={r.cells[0]}>
              {r.cells.map((c, i) =>
                i === 0 ? (
                  <th scope="row" key={c}>
                    <Tex text={c} />
                  </th>
                ) : (
                  <td key={`${i}${c}`}>
                    <Tex text={c} />
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Irracionalnye7({ trenazher }: { trenazher?: string }) {
  return (
    <section className="z7-irr">
      <div className="z7-irr__vstuplenie">
        {B.vstuplenie.map((t) => (
          <p key={t}>
            <Tex text={t} />
          </p>
        ))}
      </div>
      <Legenda />
      <div className="z7-irr__vidy">
        {B.vidy.map((v) => (
          <Vid v={v} key={v.kartochka.id} {...(trenazher ? { trenazher } : {})} />
        ))}
      </div>
      <RamkaVazhno title={B.podstanovka.title}>
        {B.podstanovka.paras.map((t) => (
          <p className="ramka__p" key={t}>
            <Tex text={t} />
          </p>
        ))}
      </RamkaVazhno>
      <TablicaIrr7 />
    </section>
  );
}
