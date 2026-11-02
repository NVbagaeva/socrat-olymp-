import { Badge, Callout } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import { TeoriyaShell } from '@/components/tasks/teoriya/TeoriyaShell';
import { GLAVY_14 } from '@/content/teoriya14';
import { PROGRESS_14, SKORO_14, TIPY_14 } from '@/content/zadanie14';
import { katex } from '@/lib/graph/katex';
import { krugSerii } from '@/lib/zadanie14/krugHtml';
import { s, u } from '@/lib/zadanie14/ugol';
import type { BlokTeorii14, Glava14, Primer14 } from '@/lib/zadanie14/teoriyaTipy';
import { Krug14, Risunok14View } from './Krug14';

function display(tex: string): string {
  return katex.renderToString(tex, { throwOnError: true, displayMode: true });
}

/** Разобранный пример: условие, шаги, рисунок, ответ. */
export function Primer14View({ p }: { p: Primer14 }) {
  return (
    <div className="z14-primer flow">
      <p className="z14-primer__uslovie">
        <Tex text={p.uslovie} />
      </p>
      <ol className="z14-shagi">
        {p.shagi.map((sh, i) => (
          <li key={i}>
            <Tex text={sh} />
          </li>
        ))}
      </ol>
      {p.risunok === undefined ? null : <Risunok14View r={p.risunok} />}
      {p.otvet === undefined ? null : (
        <p className="z14-otvet">
          <b>Ответ: </b>
          <Tex text={p.otvet} />
        </p>
      )}
    </div>
  );
}

const TON = {
  vazhno: { tone: 'vazhno', metka: 'Важно' },
  zapomni: { tone: 'zapomni', metka: 'Запомни' },
  vyvod: { tone: 'zapomni', metka: 'Вывод' },
  layfhak: { tone: 'layfhak', metka: 'Лайфхак' },
} as const;

function Blok({ b }: { b: BlokTeorii14 }) {
  switch (b.vid) {
    case 'p':
      return (
        <p>
          <Tex text={b.text} />
        </p>
      );
    case 'formula':
      return <div className="z14-formula" dangerouslySetInnerHTML={{ __html: display(b.tex) }} />;
    case 'spisok': {
      const items = b.punkty.map((t, i) => (
        <li key={i}>
          <Tex text={t} />
        </li>
      ));
      return b.numeraciya ? (
        <ol className="z14-spisok">{items}</ol>
      ) : (
        <ul className="z14-spisok">{items}</ul>
      );
    }
    case 'ramka': {
      const t = TON[b.ton];
      return (
        <Callout tone={t.tone} label={b.metka ?? t.metka} primer={<Primer14View p={b.primer} />}>
          <Tex text={b.text} />
        </Callout>
      );
    }
    case 'primer':
      return (
        <section className="z14-razbor">
          <h5 className="z14-razbor__title">{b.title ?? 'Пример'}</h5>
          <Primer14View p={b.primer} />
        </section>
      );
    case 'risunok':
      return <Risunok14View r={b.risunok} />;
    case 'tablica':
      return (
        <div className="z14-tablica-wrap">
          <table className="z14-tablica">
            <thead>
              <tr>
                {b.zagolovki.map((z, i) => (
                  <th key={i} scope="col">
                    <Tex text={z} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.stroki.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    <td key={j}>
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
}

function Telo({ g }: { g: Glava14 }) {
  if (g.skoro) {
    const tip = TIPY_14.find((t) => t.id === g.id);
    return (
      <div className="z14-glava z14-glava--skoro flow">
        <Badge tone="neutral">{SKORO_14}</Badge>
        {g.lead === undefined ? null : (
          <p>
            <Tex text={g.lead} />
          </p>
        )}
        {tip?.podtipy === undefined ? null : (
          <ul className="z14-spisok">
            {tip.podtipy.map((p) => (
              <li key={p.id}>{p.title}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }
  return (
    <div className="z14-glava">
      {g.lead === undefined ? null : (
        <p className="z14-glava__lead">
          <Tex text={g.lead} />
        </p>
      )}
      {g.punkty.map((p) => (
        <section className="z14-punkt flow" key={p.id} aria-labelledby={p.id}>
          <h4 className="z14-punkt__title" id={p.id}>
            <span className="z14-punkt__no">{p.no}</span> <Tex text={p.title} />
          </h4>
          {p.bloki.map((b, i) => (
            <Blok b={b} key={i} />
          ))}
        </section>
      ))}
    </div>
  );
}

/**
 * Вкладка «Теория» №14: главы по типам уравнений, содержание рядом
 * (общая оболочка TeoriyaShell). Готова глава «Тригонометрические
 * уравнения» с пунктами 3.0–3.12; остальные — «Скоро».
 * Тексты — content/teoriya14.ts.
 */
export function Teoriya14({ vkladka }: { vkladka: string }) {
  const tela = Object.fromEntries(GLAVY_14.map((g) => [g.id, <Telo g={g} key={g.id} />]));
  return (
    <TeoriyaShell
      vkladka={vkladka}
      razdely={GLAVY_14.map((g) => ({
        id: g.id,
        title: g.title,
        ...(g.skoro ? { skoro: true } : {}),
        ...(g.punkty.length > 0
          ? {
              podpunkty: g.punkty.map((p) => ({
                id: p.id,
                title: `${p.no}. ${p.title.replace(/\$[^$]*\$/g, '…')}`,
              })),
            }
          : {}),
      }))}
      tela={tela}
      dekor={{
        kartinka: <Krug14 spec={krugSerii([s(u(1, 6)), s(u(5, 6))])} className="z14-dekor" />,
        note: 'Значения читаем с окружности, а не зубрим',
      }}
      trackKey={PROGRESS_14.teoriyaKey}
    />
  );
}
