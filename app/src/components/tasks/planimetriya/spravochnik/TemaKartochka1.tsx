import { clsx } from 'clsx';
import { Tex } from '@/components/ui/Tex';
import { Display } from '@/components/tasks/theory/rich/parts';
import {
  BLOKI_SPRAVOCHNIKA,
  SPRAVOCHNIK_1,
  novayaTema1,
  type Primer,
  type Tema1,
  type Utverzhdenie,
} from '@/content/spravochnik1';
import { zadachaPrimera } from '@/lib/planimetriya/spravochnik-zadachi';
import {
  chertezhPrimera,
  chertezhTemy,
  type RisunokSpravochnika,
} from '@/lib/planimetriya/spravochnik-chertezhi';
import { renderPlan } from '@/lib/planimetriya/render';
import { prototip } from '@/lib/planimetriya/stseny';

/** Вид блока карточки: цвет рамки, ярлыка и заливки (spravochnik1-web.css). */
type Vid = 'def' | 'svo' | 'pri' | 'teo' | 'vaz' | 'pri-men';

/**
 * Чертёж движка. Высота фигуры 220 px на компьютере (на узком экране
 * SVG ужимается по ширине колонки); несколько рисунков стоят рядом.
 */
function Chertezh({
  risunki,
  className,
  vysota = 220,
}: {
  risunki: RisunokSpravochnika[];
  className?: string;
  vysota?: number;
}) {
  const shirina = risunki.length > 1 ? Math.round(360 / Math.min(risunki.length, 2)) : 360;
  const v = risunki.length > 2 ? Math.round(vysota * 0.62) : vysota;
  return (
    <figure className={clsx('spr1-chertezh', risunki.length > 1 && 'spr1-chertezh--neskolko', className)}>
      {risunki.map((r, i) => (
        <span
          className="pl-wrap spr1-chertezh__ris"
          key={i}
          dangerouslySetInnerHTML={{
            __html: renderPlan(r.scena, { ...r.optsii, vysota: v, shirina }),
          }}
        />
      ))}
    </figure>
  );
}

/** Блок с ярлыком: «Определение», «Свойство», «Признак». */
function Blok({ vid, label, children }: { vid: Vid; label: string; children: React.ReactNode }) {
  return (
    <section className={`spr1-blok spr1-blok--${vid}`}>
      <span className="spr1-blok__label">{label}</span>
      {children}
    </section>
  );
}

function Utverzhdeniya({ spisok }: { spisok: readonly Utverzhdenie[] }) {
  return (
    <ul className="spr1-blok__list">
      {spisok.map((u) => (
        <li className="spr1-blok__item" key={u.tekst}>
          <Tex text={u.tekst} />
          {u.formula === undefined ? null : (
            <span className="spr1-blok__formula">
              <Display tex={u.formula} />
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Один разбор: откуда, условие, чертёж с числами, шаги, ответ. */
function Razbor({ temaId, nomer, p }: { temaId: string; nomer: number; p: Primer }) {
  const z = zadachaPrimera(p);
  const izBanka = 'fipi' in p.istochnik;
  return (
    <article className="spr1-razbor">
      <header className="spr1-razbor__head">
        <span className="spr1-razbor__no">{nomer + 1}</span>
        <h5 className="spr1-razbor__title">
          <Tex text={p.title} />
        </h5>
        <span className={clsx('spr1-razbor__ist', !izBanka && 'spr1-razbor__ist--ne')}>
          {'fipi' in p.istochnik ? SPRAVOCHNIK_1.fipi(p.istochnik.fipi) : SPRAVOCHNIK_1.neIzBanka}
        </span>
      </header>
      <div className="spr1-razbor__body">
        <div className="spr1-razbor__uslovie">
          <p className="spr1-razbor__tekst">
            <Tex text={z.uslovie} />
          </p>
          <Chertezh risunki={[chertezhPrimera(temaId, nomer, p)]} vysota={170} className="spr1-razbor__ris" />
        </div>
        <ol className="spr1-razbor__shagi">
          {p.shagi.map((s, i) => (
            <li className="spr1-razbor__shag" key={i}>
              <span className="spr1-razbor__etap">
                <Tex text={s.etap} />
              </span>
              {s.tekst === undefined ? null : (
                <span className="spr1-razbor__poyasnenie">
                  <Tex text={s.tekst} />
                </span>
              )}
              {(s.tex ?? []).map((f) => (
                <span className="spr1-razbor__vykladka" key={f}>
                  <Display tex={f} />
                </span>
              ))}
            </li>
          ))}
        </ol>
        <p className="spr1-razbor__otvet">
          <span className="spr1-razbor__otvet-label">{SPRAVOCHNIK_1.otvet}:</span>{' '}
          <Display tex={p.otvet} />
        </p>
      </div>
    </article>
  );
}

/** Строка «Где на ЕГЭ»: номер прототипа открывает тренажёр на нём. */
function GdeNaEge({
  prototipy,
  trenazher,
}: {
  prototipy: readonly number[];
  trenazher?: (proto: number) => string;
}) {
  if (prototipy.length === 0) return null;
  return (
    <p className="spr1-ege">
      <span className="spr1-ege__label">{BLOKI_SPRAVOCHNIKA.prototipy}:</span>
      {prototipy.map((n) => {
        const title = SPRAVOCHNIK_1.gdeNaEgeTitle(n, prototip(n).nazvanie.replace(/\$/g, ''));
        return trenazher === undefined ? (
          <span className="spr1-ege__chip" title={title} key={n}>
            №{n}
          </span>
        ) : (
          <a className="spr1-ege__chip" href={trenazher(n)} title={title} key={n}>
            №{n}
          </a>
        );
      })}
    </p>
  );
}

/** Текст карточки для поиска: заголовок и формулировки, без TeX. */
function tekstPoiska(t: Tema1): string {
  const chasti = [
    t.title,
    ...(t.opredeleniya ?? []).map((u) => u.tekst),
    ...(t.svoystva ?? []).map((u) => u.tekst),
    ...(t.priznaki ?? []).map((u) => u.tekst),
    ...(t.teoremy ?? []).flatMap((x) => [x.nazvanie ?? '', x.slovami]),
  ];
  return chasti
    .join(' ')
    .replace(/\$[^$]*\$/g, ' ')
    .replace(/\*\*/g, '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Карточка-тема справочника: заголовок, чертёж, цветные блоки
 * («Определение», «Свойство», «Признак», «Теорема / формула», «Как
 * применять», «Важно»), разбор, раскрывающийся внутри карточки, и
 * «Где на ЕГЭ». Разбор — <details>: открывается без скрипта, его
 * состояние в адресе не хранится.
 *
 * Якорь карточки — #k-<id>; якоря прежних карточек теории, которые
 * эта заменяет, стоят здесь же пустыми метками: ссылки «Повторить
 * теорию» из тренажёра и генератора не ломаются.
 */
export function TemaKartochka1({
  t,
  trenazher,
}: {
  t: Tema1;
  trenazher?: (proto: number) => string;
}) {
  const ch = chertezhTemy(t.id);
  const risunki = Array.isArray(ch) ? ch : [ch];
  const starye = (t.zamenyaet ?? []).filter((id) => id !== t.id && novayaTema1(id)?.id === t.id);
  return (
    <li
      className={clsx('spr1-card', t.shirokaya === true && 'spr1-card--wide')}
      id={`k-${t.id}`}
      data-spr-poisk={tekstPoiska(t)}
    >
      {starye.map((id) => (
        <span className="spr1-card__yakor" id={`k-${id}`} key={id} aria-hidden="true" />
      ))}
      <h4 className="spr1-card__title">
        <Tex text={t.title} />
      </h4>
      <div className="spr1-card__glavnoe">
        <div className="spr1-card__bloki">
          {t.opredeleniya === undefined ? null : (
            <Blok vid="def" label={BLOKI_SPRAVOCHNIKA.opredeleniya}>
              <Utverzhdeniya spisok={t.opredeleniya} />
            </Blok>
          )}
          {t.teoremy === undefined ? null : (
            <Blok vid="teo" label={BLOKI_SPRAVOCHNIKA.teoremy}>
              <ul className="spr1-blok__list">
                {t.teoremy.map((th) => (
                  <li className="spr1-blok__item" key={th.slovami}>
                    {th.nazvanie === undefined ? null : (
                      <strong className="spr1-blok__nazvanie">
                        <Tex text={th.nazvanie} />.{' '}
                      </strong>
                    )}
                    <Tex text={th.slovami} />
                    <span className="spr1-blok__formula">
                      <Display tex={th.formula} />
                    </span>
                    {th.dop === undefined ? null : (
                      <span className="spr1-blok__dop">
                        <span className="spr1-blok__dop-podpis">
                          <Tex text={th.dop.podpis} />:
                        </span>
                        <span className="spr1-blok__formula">
                          <Display tex={th.dop.formula} />
                        </span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </Blok>
          )}
          {t.svoystva === undefined ? null : (
            <Blok vid="svo" label={BLOKI_SPRAVOCHNIKA.svoystva}>
              <Utverzhdeniya spisok={t.svoystva} />
            </Blok>
          )}
          {t.priznaki === undefined ? null : (
            <Blok vid="pri" label={BLOKI_SPRAVOCHNIKA.priznaki}>
              <Utverzhdeniya spisok={t.priznaki} />
            </Blok>
          )}
        </div>
        <Chertezh risunki={risunki} className="spr1-card__ris" />
      </div>
      {t.tablica === undefined ? null : (
        <div className="spr1-tablica-wrap">
          <table className="spr1-tablica">
            <thead>
              <tr>
                {t.tablica.head.map((c, i) => (
                  <th key={i} scope="col">
                    <Tex text={c} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {t.tablica.rows.map((row) => (
                <tr key={row[0]}>
                  {row.map((c, i) =>
                    i === 0 ? (
                      <th scope="row" key={i}>
                        <Tex text={c} />
                      </th>
                    ) : (
                      <td key={i}>
                        <Tex text={c} />
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {t.primenenie === undefined && t.vazhno === undefined ? null : (
        <div className="spr1-card__niz">
          {t.primenenie === undefined ? null : (
            <Blok vid="pri-men" label={BLOKI_SPRAVOCHNIKA.primenenie}>
              <ol className="spr1-blok__list spr1-blok__list--nomera">
                {t.primenenie.map((x) => (
                  <li className="spr1-blok__item" key={x}>
                    <Tex text={x} />
                  </li>
                ))}
              </ol>
            </Blok>
          )}
          {t.vazhno === undefined ? null : (
            <Blok vid="vaz" label={BLOKI_SPRAVOCHNIKA.vazhno}>
              <ul className="spr1-blok__list">
                {t.vazhno.map((x) => (
                  <li className="spr1-blok__item" key={x}>
                    <Tex text={x} />
                  </li>
                ))}
              </ul>
            </Blok>
          )}
        </div>
      )}
      {t.primery === undefined || t.primery.length === 0 ? null : (
        <details className="spr1-primer">
          <summary className="spr1-primer__knopka">
            <span className="spr1-primer__otkryt">{SPRAVOCHNIK_1.primer} ▸</span>
            <span className="spr1-primer__zakryt">{SPRAVOCHNIK_1.svernut} ▴</span>
          </summary>
          <div className="spr1-primer__telo">
            {t.primery.map((p, i) => (
              <Razbor temaId={t.id} nomer={i} p={p} key={i} />
            ))}
          </div>
        </details>
      )}
      <GdeNaEge prototipy={t.prototipy} trenazher={trenazher} />
    </li>
  );
}
