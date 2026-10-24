import { Details } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import { TeoriyaShell } from '@/components/tasks/teoriya/TeoriyaShell';
import {
  DELIMOST,
  GLAVY_13,
  ROL_YARLYK,
  TEORIYA_13,
  type Blok,
  type Primer,
  type TablitsaRuchnaya,
} from '@/content/teoriya13';
import { katex } from '@/lib/graph/katex';
import { UNIT_LABEL } from '@/lib/zadanie13/edinicy';
import { generate } from '@/lib/zadanie13/generate';
import { TABLE_FIELDS, TABLE_HEAD } from '@/lib/zadanie13/tablica';
import type { TableModel } from '@/lib/zadanie13/types';
import { DveShemy, LesenkaAnn, LesenkaDif } from './Risunki13';

/** Формула крупно (display), набранная на сервере. */
function Krupno({ tex, className }: { tex: string; className?: string }) {
  const html = katex.renderToString(tex, { throwOnError: true, displayMode: true });
  return <div className={className ?? 'z13-formula'} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Формула в ячейке таблицы: строчная, без переноса. */
function Yacheyka({ tex }: { tex: string }) {
  const html = katex.renderToString(tex, { throwOnError: true });
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Число из модели таблицы: целое — с пробелами по разрядам, дробь — до четырёх знаков. */
export function chislo(x: number): string {
  const r = Math.round(x * 10000) / 10000;
  const exact = Math.abs(r - x) < 1e-9;
  const [int, frac] = Math.abs(r).toFixed(4).replace(/0+$/, '').replace(/\.$/, '').split('.');
  const grouped =
    (int ?? '0').length > 4 ? (int ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, '\\,') : (int ?? '0');
  return `${exact ? '' : '\\approx '}${x < 0 ? '-' : ''}${grouped}${frac ? `{,}${frac}` : ''}`;
}

function PrimerBlok({ primer }: { primer: Primer }) {
  return (
    <Details title="Пример" className="z13-primer">
      <p className="z13-primer__uslovie">
        <Tex text={primer.uslovie} />
      </p>
      <ol className="z13-shagi">
        {primer.shagi.map((s) => (
          <li key={s.title}>
            <b className="z13-shagi__title">
              <Tex text={`${s.title}.`} />
            </b>{' '}
            <Tex text={s.text} />
            {s.tex ? <Krupno tex={s.tex} /> : null}
          </li>
        ))}
      </ol>
      {primer.otvet ? (
        <p className="z13-otvet">
          Ответ: <Tex text={primer.otvet} />
        </p>
      ) : null}
    </Details>
  );
}

function Tablitsa({
  head,
  labels,
  rows,
  itog,
  podpis,
}: {
  head: string[];
  labels: string[];
  rows: string[][];
  itog?: string[];
  podpis?: string;
}) {
  return (
    <figure className="z13-tablitsa">
      <div className="z13-tablitsa__scroll">
        <table>
          <thead>
            <tr>
              {head.map((h) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <th scope="row">
                  <Yacheyka tex={labels[i] ?? ''} />
                </th>
                {row.map((c, j) => (
                  <td key={j}>
                    <Yacheyka tex={c} />
                  </td>
                ))}
              </tr>
            ))}
            {itog ? (
              <tr className="z13-tablitsa__itog">
                <th scope="row">Итого</th>
                {itog.map((c, j) => (
                  <td key={j}>{c ? <Yacheyka tex={c} /> : null}</td>
                ))}
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {podpis ? (
        <figcaption>
          <Tex text={podpis} />
        </figcaption>
      ) : null}
    </figure>
  );
}

function TablitsaRuchnayaBlok({ t }: { t: TablitsaRuchnaya }) {
  const h = TABLE_HEAD[t.scheme];
  return (
    <Tablitsa
      head={[h.period[t.period], ...h.cols]}
      labels={t.labels}
      rows={t.rows}
      {...(t.itog ? { itog: t.itog } : {})}
      {...(t.podpis ? { podpis: t.podpis } : {})}
    />
  );
}

/** Таблица из модели движка: сокращённые строки 1, 2, 3, …, n. */
function TablitsaModeli({ m }: { m: TableModel }) {
  const h = TABLE_HEAD[m.scheme];
  const fields = TABLE_FIELDS[m.scheme];
  const labels: string[] = [];
  const rows: string[][] = [];
  for (const i of m.show) {
    if (i === 0) {
      labels.push('\\dots');
      rows.push(fields.map(() => '\\dots'));
      continue;
    }
    const row = m.rows[i - 1];
    if (!row) continue;
    labels.push(m.labels[i - 1] ?? String(i));
    rows.push(fields.map((f) => chislo(row[f] as number)));
  }
  const itog =
    m.totals && m.scheme === 'dif'
      ? ['', chislo(m.totals.change), chislo(m.totals.interest), '']
      : undefined;
  return (
    <Tablitsa
      head={[h.period[m.period], ...h.cols]}
      labels={labels}
      rows={rows}
      {...(itog ? { itog } : {})}
    />
  );
}

/** Разобранная задача из движка: условие, таблица, решение по шагам. */
function Razbor({
  title,
  prototypeId,
  seed,
}: {
  title: string;
  prototypeId: string;
  seed: string;
}) {
  const t = generate(prototypeId, seed);
  const units = UNIT_LABEL[t.units];
  const otvet = String(t.answer)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (
    <section className="z13-razbor">
      <h4 className="z13-razbor__title">
        <Tex text={title} />
      </h4>
      <div className="z13-razbor__uslovie">
        {t.condition.split('\n').map((line) => (
          <p key={line}>
            <Tex text={line} />
          </p>
        ))}
        {t.conditionTable ? (
          <Tablitsa
            head={t.conditionTable.head.slice(1)}
            labels={t.conditionTable.rows.map((r) => `\\text{${r[0] ?? ''}}`)}
            rows={t.conditionTable.rows.map((r) =>
              r.slice(1).map((c) => `\\text{${c.replace(/%/g, '\\%')}}`),
            )}
          />
        ) : null}
        {t.source === 'own' ? <p className="z13-razbor__metka">не из открытого банка</p> : null}
      </div>
      <Details title="Решение по шагам" className="z13-primer">
        <ol className="z13-shagi">
          {t.solution.map((s, i) => (
            <li key={i}>
              <b className="z13-shagi__title">
                <Tex text={`${s.title}.`} />
              </b>{' '}
              <Tex text={s.text} />
              {s.formula ? <Krupno tex={s.formula} /> : null}
              {s.table ? <TablitsaModeli m={t.tableModel} /> : null}
            </li>
          ))}
        </ol>
        <p className="z13-otvet">
          Ответ: {otvet}
          {units && units !== '%' ? ` ${units}` : units}
        </p>
      </Details>
    </section>
  );
}

function Risunok({ risunok }: { risunok: 'dve-shemy' | 'lesenka-dif' | 'lesenka-ann' }) {
  if (risunok === 'dve-shemy') return <DveShemy />;
  if (risunok === 'lesenka-dif') return <LesenkaDif />;
  return <LesenkaAnn />;
}

function BlokView({ b }: { b: Blok }) {
  switch (b.vid) {
    case 'kartochka':
      return (
        <section className={`z13-card z13-card--${b.rol}`}>
          <header className="z13-card__head">
            <span className="z13-card__yarlyk">{ROL_YARLYK[b.rol]}</span>
            <h4 className="z13-card__title">
              <Tex text={b.title} />
            </h4>
          </header>
          <div className="z13-card__body">
            <p>
              <Tex text={b.text} />
            </p>
            {b.tex ? <Krupno tex={b.tex} /> : null}
            {b.spisok ? (
              <ul className="z13-card__spisok">
                {b.spisok.map((s) => (
                  <li key={s}>
                    <Tex text={s} />
                  </li>
                ))}
              </ul>
            ) : null}
            {b.pochemu ? (
              <p className="z13-card__pochemu">
                <b>Почему это работает.</b> <Tex text={b.pochemu} />
              </p>
            ) : null}
            {b.primer ? <PrimerBlok primer={b.primer} /> : null}
          </div>
        </section>
      );
    case 'tablitsa':
      return (
        <section className="z13-blok">
          <h4 className="z13-blok__title">
            <Tex text={b.title} />
          </h4>
          <TablitsaRuchnayaBlok t={b.tablitsa} />
        </section>
      );
    case 'proporciya':
      return (
        <section className="z13-blok z13-proporciya">
          <h4 className="z13-blok__title">{b.title}</h4>
          <div className="z13-proporciya__zapis">
            {b.stroki.map(([l, r]) => (
              <div key={l} className="z13-proporciya__stroka">
                <Yacheyka tex={l} />
                <span aria-hidden="true">—</span>
                <Yacheyka tex={r} />
              </div>
            ))}
          </div>
          <Krupno tex={b.vyvod} />
        </section>
      );
    case 'risunok':
      return (
        <figure className="z13-blok z13-risunok">
          <h4 className="z13-blok__title">{b.title}</h4>
          <Risunok risunok={b.risunok} />
          <figcaption>
            <Tex text={b.podpis} />
          </figcaption>
        </figure>
      );
    case 'razbor':
      return <Razbor title={b.title} prototypeId={b.prototypeId} seed={b.seed} />;
    case 'priznaki':
      return (
        <section className="z13-blok">
          <h4 className="z13-blok__title">{b.title}</h4>
          <ul className="z13-priznaki">
            {b.stroki.map((s) => (
              <li key={s.tip}>
                <p className="z13-priznaki__vizhu">
                  <Tex text={s.vizhu} />
                </p>
                <p className="z13-priznaki__tip">
                  <b>{s.tip}</b> — <Tex text={s.pochemu} />
                </p>
              </li>
            ))}
          </ul>
        </section>
      );
    case 'opredeli':
      return (
        <section className="z13-blok">
          <h4 className="z13-blok__title">{b.title}</h4>
          <ol className="z13-opredeli">
            {b.zadachi.map((z) => (
              <li key={z.text}>
                <p>
                  <Tex text={z.text} />
                </p>
                <Details title="Показать схему и признак" className="z13-primer">
                  <p>
                    <b>{z.tip}.</b> <Tex text={z.priznak} />
                  </p>
                </Details>
              </li>
            ))}
          </ol>
        </section>
      );
    case 'delimost':
      return (
        <Details title="Признаки делимости" className="z13-primer z13-delimost">
          <ul>
            {DELIMOST.map((d) => (
              <li key={d.na}>
                <b>На {d.na}:</b> {d.pravilo}
              </li>
            ))}
          </ul>
        </Details>
      );
  }
}

/**
 * Вкладка «Теория» задания №13: главы подряд, липкое содержание рядом
 * (общая оболочка TeoriyaShell, та же, что у №2, №4 и №11).
 * Страница серверная: формулы и разборы движка собираются на сборке.
 */
export function Teoriya13({ vkladka }: { vkladka: string }) {
  const tela = Object.fromEntries(
    GLAVY_13.map((g) => [
      g.id,
      <div className="z13-glava" key={g.id}>
        <p className="z13-glava__lead">
          <Tex text={g.lead} />
        </p>
        {g.podrazdely.map((p) => (
          <section className="z13-podrazdel" id={p.id} key={p.id}>
            <h3 className="z13-podrazdel__title">{p.title}</h3>
            {p.bloki.map((b, i) => (
              <BlokView b={b} key={i} />
            ))}
          </section>
        ))}
      </div>,
    ]),
  );
  return (
    <TeoriyaShell
      vkladka={vkladka}
      razdely={GLAVY_13.map((g) => ({
        id: g.id,
        title: g.title.replace(/\$/g, ''),
        podpunkty: g.podrazdely.map((p) => ({ id: p.id, title: p.title })),
      }))}
      tela={tela}
      dekor={{ kartinka: <LesenkaDif />, note: TEORIYA_13.dekor }}
      trackKey={TEORIYA_13.trackKey}
    />
  );
}
