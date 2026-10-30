import { Badge, EmptyState } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import { TeoriyaShell } from '@/components/tasks/teoriya/TeoriyaShell';
import { PROGRESS_16 } from '@/content/zadanie16';
import {
  BLOKI_16,
  GLAVY_16,
  PRIMER_OTVETA_16,
  punktyGlavy16,
  ZADANIY_V_RABOTE,
  type Glava16,
  type Kartochka16,
  type Opornaya16,
  type Rabota16 as RabotaData,
  type Ton16,
  type Variant16,
} from '@/content/teoriya16';
import { katex } from '@/lib/graph/katex';
import { typeset } from '@/lib/tex';
import { Chertezh16 } from './Chertezh16';
import { Rabota16 } from './Rabota16';
import { VkladkiGlavy16 } from './VkladkiGlavy16';

/** Формула крупно (display), набранная на сервере. */
function Krupno({ tex }: { tex: string }) {
  const html = katex.renderToString(tex, { throwOnError: true, displayMode: true });
  return <div className="z16-card__formula" dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Ответ-множество строчной формулой. */
function otvetHtml(tex: string): string {
  return katex.renderToString(tex, { throwOnError: true });
}

/** «Ответ: x ∈ …» — плашкой под примером. */
function Otvet({ tex, zacherknut }: { tex: string; zacherknut?: boolean }) {
  return (
    <p className={zacherknut ? 'z16-otvet z16-otvet--neverno' : 'z16-otvet'}>
      <span className="z16-otvet__label">{BLOKI_16.otvet}:</span>{' '}
      <span dangerouslySetInnerHTML={{ __html: otvetHtml(`x\\in${tex}`) }} />
    </p>
  );
}

/** Значки меток карточек: книга, «!», лампочка, ось, предупреждение. */
export function Znachok16({ ton }: { ton: Ton16 }) {
  const d: Record<Ton16, string> = {
    opredelenie:
      'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20',
    vazhno: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8v5M12 16.5v.5',
    vyvod:
      'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
    primer:
      'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20',
    oshibka: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9 9l6 6M15 9l-6 6',
    ogranicheniya:
      'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
    algoritm: 'M4 6h2M4 12h2M4 18h2M9 6h11M9 12h11M9 18h11',
  };
  return (
    <svg className="z16-metka__ikonka" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={d[ton]} />
    </svg>
  );
}

function Variant({ v, verno }: { v: Variant16; verno: boolean }) {
  return (
    <div className={verno ? 'z16-variant z16-variant--verno' : 'z16-variant z16-variant--neverno'}>
      <p className="z16-variant__metka">{verno ? BLOKI_16.verno : BLOKI_16.neverno}</p>
      <p className="z16-variant__title">
        <Tex text={v.title} />
      </p>
      {v.text === undefined ? null : (
        <p className="z16-card__text">
          <Tex text={v.text} />
        </p>
      )}
      {v.chertezh === undefined ? null : <Chertezh16 spec={v.chertezh} />}
      {v.otvet === undefined ? null : <Otvet tex={v.otvet} zacherknut={!verno} />}
    </div>
  );
}

function Kartochka({ k }: { k: Kartochka16 }) {
  return (
    <section className={`z16-card z16-card--${k.ton} z16-shir--${k.shirina ?? 2}`}>
      <p className="z16-metka">
        <Znachok16 ton={k.ton} />
        {k.metka ?? BLOKI_16.metki[k.ton]}
      </p>
      {k.title === undefined ? null : (
        <h5 className="z16-card__title">
          <Tex text={k.title} />
        </h5>
      )}
      {k.text === undefined ? null : (
        <p className="z16-card__text">
          <Tex text={k.text} />
        </p>
      )}
      {k.tex === undefined ? null : <Krupno tex={k.tex} />}
      {k.plitki === undefined ? null : (
        <ul className="z16-plitki">
          {k.plitki.map((p) => (
            <li className="z16-plitka" key={p.tex}>
              <span
                className="z16-plitka__tex"
                dangerouslySetInnerHTML={{ __html: otvetHtml(p.tex) }}
              />
              <span className="z16-plitka__text">
                <Tex text={p.text} />
              </span>
            </li>
          ))}
        </ul>
      )}
      {k.shagi === undefined ? null : (
        <ol className="z16-shagi">
          {k.shagi.map((s) => (
            <li key={s}>
              <Tex text={s} />
            </li>
          ))}
        </ol>
      )}
      {k.chertezh === undefined ? null : <Chertezh16 spec={k.chertezh} />}
      {k.sravnenie === undefined ? null : (
        <div className="z16-sravnenie">
          <Variant v={k.sravnenie.neverno} verno={false} />
          <Variant v={k.sravnenie.verno} verno />
        </div>
      )}
      {k.podpis === undefined ? null : (
        <p className="z16-card__podpis">
          <Tex text={k.podpis} />
        </p>
      )}
      {k.otvet === undefined ? null : <Otvet tex={k.otvet} />}
      {k.itog === undefined ? null : (
        <p className="z16-card__itog">
          <Tex text={k.itog} />
        </p>
      )}
    </section>
  );
}

function Gotovitsya({ text }: { text: string }) {
  return <EmptyState className="z16-pusto" title={BLOKI_16.gotovitsya} description={text} />;
}

function Opornaya({ o }: { o: Opornaya16 }) {
  return (
    <section className="z16-card z16-card--primer">
      <p className="z16-card__text">
        <Tex text={o.uslovie} />
      </p>
      <h5 className="z16-card__title">{BLOKI_16.reshenie}</h5>
      <ol className="z16-shagi">
        {o.shagi.map((s) => (
          <li key={s}>
            <Tex text={s} />
          </li>
        ))}
      </ol>
      {o.chertezh === undefined ? null : <Chertezh16 spec={o.chertezh} />}
      <Otvet tex={o.otvet} />
    </section>
  );
}

function Rabota({ r, odna }: { r: RabotaData; odna: boolean }) {
  return (
    <section className="z16-rabota-blok">
      {odna ? null : <h5 className="z16-card__title">{r.title}</h5>}
      {r.zadaniya.length === 0 ? (
        <Gotovitsya text={BLOKI_16.gotovitsyaRabota(ZADANIY_V_RABOTE)} />
      ) : (
        <Rabota16
          primerHtml={typeset(PRIMER_OTVETA_16)}
          zadaniya={r.zadaniya.map((z) => ({
            id: z.id,
            uslovieHtml: typeset(z.uslovie),
            otvet: z.otvet,
            otvetHtml: otvetHtml(z.otvet),
          }))}
        />
      )}
    </section>
  );
}

/** Тело главы: вкладки «Теория» · «Разбор» · «Тренировочная работа». */
function Telo({ g, nomer }: { g: Glava16; nomer: number }) {
  if (g.skoro) {
    return (
      <div className="z16-glava z16-glava--skoro">
        <Badge tone="neutral">{BLOKI_16.skoro}</Badge>
        <p className="z16-glava__lead">{BLOKI_16.skoroText}</p>
      </div>
    );
  }
  const punkty = punktyGlavy16(g, nomer);
  const teoriya = (
    <div className="z16-punkty">
      {g.teoriya.map((t, i) => {
        const p = punkty[i];
        return (
          <div className="z16-punkt" key={t.id}>
            {p === undefined ? null : (
              <h4 className="z16-punkt__title" id={p.id}>
                <span className="z16-punkt__no">{p.no}</span>
                <Tex text={p.title} />
              </h4>
            )}
            {t.kartochki.length === 0 ? (
              <Gotovitsya text={BLOKI_16.gotovitsyaTeoriya} />
            ) : (
              <div className="z16-grid">
                {t.kartochki.map((k, j) => (
                  <Kartochka k={k} key={j} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
  const razbor =
    g.opornye.length === 0 ? (
      <Gotovitsya text={BLOKI_16.gotovitsyaRazbor} />
    ) : (
      <div className="z16-punkty">
        {g.opornye.map((o) => (
          <Opornaya o={o} key={o.id} />
        ))}
      </div>
    );
  const raboty = (
    <div className="z16-punkty">
      {g.raboty.map((r) => (
        <Rabota r={r} odna={g.raboty.length === 1} key={r.id} />
      ))}
    </div>
  );
  return (
    <div className="z16-glava">
      {g.lead === undefined ? null : (
        <p className="z16-glava__lead">
          <Tex text={g.lead} />
        </p>
      )}
      <VkladkiGlavy16
        paneli={[
          { id: 'teoriya', label: BLOKI_16.teoriya, telo: teoriya },
          { id: 'razbor', label: BLOKI_16.razbor, telo: razbor },
          { id: 'rabota', label: BLOKI_16.rabota, telo: raboty },
        ]}
      />
    </div>
  );
}

/** Значок колонки содержания: прямая метода интервалов. */
function Dekor() {
  return (
    <Chertezh16
      className="z16-dekor"
      spec={{
        vid: 'pryamaya',
        tochki: [
          { x: -1, tex: 'a', zakrashena: true },
          { x: 1, tex: 'b', zakrashena: false },
        ],
        znaki: ['+', '-', '+'],
        shtrikh: [{ ot: 0, do: 1 }],
      }}
    />
  );
}

/**
 * Вкладка «Теория» задания №16 (макет docs/mockups/zadanie-16/
 * teoriya.png): главы подряд, содержание рядом — общая оболочка
 * теории (TeoriyaShell), та же, что у №2, №4 и №11. На телефоне
 * содержание открывается шторкой. Главы «Скоро» — с замком.
 * Тексты — content/teoriya16.ts.
 */
export function Teoriya16({ vkladka }: { vkladka: string }) {
  const tela = Object.fromEntries(
    GLAVY_16.map((g, i) => [g.id, <Telo g={g} nomer={i + 1} key={g.id} />]),
  );
  return (
    <TeoriyaShell
      vkladka={vkladka}
      razdely={GLAVY_16.map((g) => ({
        id: g.id,
        title: g.title,
        ...(g.skoro ? { skoro: true } : {}),
      }))}
      tela={tela}
      dekor={{ kartinka: <Dekor />, note: 'Знаки — по промежуткам, ответ — по штриховке' }}
      trackKey={PROGRESS_16.teoriyaKey}
    />
  );
}
