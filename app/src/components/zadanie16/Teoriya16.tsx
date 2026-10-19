import { Badge, EmptyState } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import { TeoriyaShell } from '@/components/tasks/veroyatnost/teoriya/TeoriyaShell';
import { PROGRESS_16 } from '@/content/zadanie16';
import {
  BLOKI_16,
  GLAVY_16,
  punktyGlavy16,
  ZADANIY_V_RABOTE,
  type Glava16,
  type Kartochka16,
  type Opornaya16,
  type PunktNomer16,
  type Rabota16 as RabotaData,
} from '@/content/teoriya16';
import { katex } from '@/lib/graph/katex';
import { typeset } from '@/lib/tex';
import { Chertezh16 } from './Chertezh16';
import { Rabota16 } from './Rabota16';

/** Формула крупно (display), набранная на сервере. */
function Krupno({ tex }: { tex: string }) {
  const html = katex.renderToString(tex, { throwOnError: true, displayMode: true });
  return <div className="z16-card__formula" dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Ответ-множество строчной формулой. */
function otvetHtml(tex: string): string {
  return katex.renderToString(tex, { throwOnError: true });
}

/** Заголовок пункта главы: номер «3.1» и название, якорь — для содержания. */
function Zagolovok({ p }: { p: PunktNomer16 }) {
  return (
    <h4 className={`z16-blok__title z16-blok__title--${p.vid}`} id={p.id}>
      <span className="z16-blok__no">{p.no}</span>
      <Tex text={p.title} />
    </h4>
  );
}

function Gotovitsya({ text }: { text: string }) {
  return <EmptyState className="z16-pusto" title={BLOKI_16.gotovitsya} description={text} />;
}

function Kartochka({ k }: { k: Kartochka16 }) {
  return (
    <section className={`z16-card${k.ton ? ` z16-card--${k.ton}` : ''}`}>
      <h5 className="z16-card__title">
        <Tex text={k.title} />
      </h5>
      {k.text === undefined ? null : (
        <p className="z16-card__text">
          <Tex text={k.text} />
        </p>
      )}
      {k.tex === undefined ? null : <Krupno tex={k.tex} />}
      {k.chertezh === undefined ? null : <Chertezh16 spec={k.chertezh} />}
    </section>
  );
}

function Opornaya({ o }: { o: Opornaya16 }) {
  return (
    <section className="z16-card z16-card--opornaya">
      <p className="z16-card__text">
        <Tex text={o.uslovie} />
      </p>
      <h5 className="z16-card__podtitle">{BLOKI_16.reshenie}</h5>
      <ol className="z16-card__shagi">
        {o.shagi.map((s) => (
          <li key={s}>
            <Tex text={s} />
          </li>
        ))}
      </ol>
      {o.chertezh === undefined ? null : <Chertezh16 spec={o.chertezh} />}
      <p className="z16-card__otvet">
        {BLOKI_16.otvet}: <span dangerouslySetInnerHTML={{ __html: otvetHtml(o.otvet) }} />
      </p>
    </section>
  );
}

function Rabota({ r, odna }: { r: RabotaData; odna: boolean }) {
  return (
    <section className="z16-rabota-blok">
      {odna ? null : <h5 className="z16-card__podtitle">{r.title}</h5>}
      {r.zadaniya.length === 0 ? (
        <Gotovitsya text={BLOKI_16.gotovitsyaRabota(ZADANIY_V_RABOTE)} />
      ) : (
        <Rabota16
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

/** Тело главы: пункты теории, опорные задачи, тренировочные работы. */
function Telo({ g, nomer }: { g: Glava16; nomer: number }) {
  const punkty = punktyGlavy16(g, nomer);
  if (g.skoro) {
    return (
      <div className="z16-glava z16-glava--skoro">
        <p className="z16-glava__lead">{BLOKI_16.skoroText}</p>
        <ul className="z16-skoro">
          {punkty.map((p) => (
            <li className="z16-skoro__item" id={p.id} key={p.id}>
              <span className="z16-blok__no">{p.no}</span>
              <span className="z16-skoro__title">{p.title}</span>
              <Badge tone="neutral">{BLOKI_16.skoro}</Badge>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  const po = (vid: PunktNomer16['vid']) => punkty.filter((p) => p.vid === vid);
  const opornyePunkt = po('opornye')[0];
  const rabotyPunkt = po('raboty')[0];
  return (
    <div className="z16-glava">
      {g.lead === undefined ? null : (
        <p className="z16-glava__lead">
          <Tex text={g.lead} />
        </p>
      )}

      <div className="z16-blok z16-blok--teoriya">
        <p className="z16-blok__vid">{BLOKI_16.teoriya}</p>
        {g.teoriya.map((t, i) => {
          const p = po('teoriya')[i];
          return (
            <div className="z16-punkt" key={t.id}>
              {p === undefined ? null : <Zagolovok p={p} />}
              {t.kartochki.length === 0 ? (
                <Gotovitsya text={BLOKI_16.gotovitsyaTeoriya} />
              ) : (
                <div className="z16-grid">
                  {t.kartochki.map((k) => (
                    <Kartochka k={k} key={k.title} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="z16-blok z16-blok--opornye">
        {opornyePunkt === undefined ? null : <Zagolovok p={opornyePunkt} />}
        {g.opornye.length === 0 ? (
          <Gotovitsya text={BLOKI_16.gotovitsyaOpornye} />
        ) : (
          g.opornye.map((o) => <Opornaya o={o} key={o.id} />)
        )}
      </div>

      <div className="z16-blok z16-blok--raboty">
        {rabotyPunkt === undefined ? null : <Zagolovok p={rabotyPunkt} />}
        {g.raboty.map((r) => (
          <Rabota r={r} odna={g.raboty.length === 1} key={r.id} />
        ))}
      </div>
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
 * Вкладка «Теория» задания №16: главы подряд, содержание рядом —
 * общая оболочка теории (TeoriyaShell), та же, что у №2, №4 и №11.
 * В содержании у главы подпункты с номерами: «3.1 Метод параболы»,
 * «3.3 Опорные задачи». Тексты — content/teoriya16.ts.
 */
export function Teoriya16({ vkladka }: { vkladka: string }) {
  const tela = Object.fromEntries(
    GLAVY_16.map((g, i) => [g.id, <Telo g={g} nomer={i + 1} key={g.id} />]),
  );
  return (
    <TeoriyaShell
      vkladka={vkladka}
      razdely={GLAVY_16.map((g, i) => ({
        id: g.id,
        title: g.title,
        podpunkty: punktyGlavy16(g, i + 1).map((p) => ({ id: p.id, title: `${p.no} ${p.title}` })),
      }))}
      tela={tela}
      dekor={{ kartinka: <Dekor />, note: 'Знаки — по промежуткам, ответ — по штриховке' }}
      trackKey={PROGRESS_16.teoriyaKey}
    />
  );
}
