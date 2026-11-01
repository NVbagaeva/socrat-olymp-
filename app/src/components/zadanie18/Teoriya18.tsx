import Link from 'next/link';
import { Callout, Details } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import { TeoriyaShell } from '@/components/tasks/teoriya/TeoriyaShell';
import { ZADANIE18 } from '@/content/zadanie18';
import { skhema18 } from '@/content/zadanie18/spisok';
import {
  GLAVY_18,
  TEORIYA_18_UI as UI,
  type Fakt18,
  type Glava18,
} from '@/content/zadanie18/teoriya';
import { katex } from '@/lib/graph/katex';
import { svgSkhemy } from '@/lib/skhemy/svg';
import { VID_ISHODNYY } from '@/lib/skhemy/tipy';
import { ZADANIYA } from '@/lib/paths';
import { risunokTeorii18 } from '@/lib/zadanie18/teoriya';
import '@/components/skhemy/skhemy.css';

const BASE = `${ZADANIYA}/${ZADANIE18.slug}`;
/* Группа «g» — главное на чертеже теории: подсвечена всегда. */
const SOST = { lit: new Set(['g']), shag: null, podpisi: true };

function Formula({ tex }: { tex: string }) {
  const html = katex.renderToString(tex, { throwOnError: true, displayMode: true });
  return <div className="z18-t__formula" dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Чертёж факта: строка SVG движка схем, набранная на сборке. */
function Risunok({ id, alt }: { id: string; alt: string }) {
  const sk = risunokTeorii18(id);
  if (sk === undefined) return null;
  const svg = svgSkhemy(sk, sk.nachalo, VID_ISHODNYY, SOST, { W: 360, H: 240, opisanie: alt });
  return <div className="skh z18-t__risunok" dangerouslySetInnerHTML={{ __html: svg }} />;
}

function Fakt({ f }: { f: Fakt18 }) {
  return (
    <section className="z18-t__fakt" id={`t18-${f.id}`}>
      <div className="z18-t__shapka">
        <h4 className="z18-t__title">
          <Tex text={f.title} />
        </h4>
        {f.ssylka === undefined ? null : (
          <span
            className={`z18-t__ssylka z18-t__ssylka--${f.ssylka}`}
            title={f.ssylka === 'mozhno' ? UI.mozhnoPodskazka : UI.dokazhiPodskazka}
          >
            {f.ssylka === 'mozhno' ? UI.mozhno : UI.dokazhi}
          </span>
        )}
      </div>
      <div
        className={f.risunok === undefined ? 'z18-t__telo' : 'z18-t__telo z18-t__telo--s-risunkom'}
      >
        <div className="z18-t__tekst">
          <p>
            <Tex text={f.tekst} />
          </p>
          {f.formula === undefined ? null : <Formula tex={f.formula} />}
        </div>
        {f.risunok === undefined ? null : <Risunok id={f.risunok} alt={f.title} />}
      </div>
      {f.dok === undefined ? null : (
        <Details className="z18-podrobno" title={UI.pochemu}>
          {f.dok.map((a, i) => (
            <p key={i}>
              <Tex text={a} />
            </p>
          ))}
        </Details>
      )}
      {f.skhemy === undefined ? null : (
        <p className="z18-t__skhemy">
          <span className="z18-t__skhemy-metka">{UI.skhemy}:</span>
          {f.skhemy.map((id) => {
            const s = skhema18(id);
            return s === undefined ? null : (
              <Link key={id} className="chip" href={`${BASE}/skhemy/${id}/`}>
                {s.no}. {s.nazvanie}
              </Link>
            );
          })}
        </p>
      )}
    </section>
  );
}

function Telo({ g }: { g: Glava18 }) {
  return (
    <div className="z18-t">
      <p className="z18-t__lead">
        <Tex text={g.lead} />
      </p>
      {g.fakty.map((f) => (
        <Fakt f={f} key={f.id} />
      ))}
      <Callout tone="zapomni" label={UI.zapomni}>
        <p>
          <Tex text={g.zapomni} />
        </p>
      </Callout>
    </div>
  );
}

/** Значок колонки содержания: вписанный угол — та же сцена, что в главе. */
function Dekor() {
  return <Risunok id="vpisannyy" alt="" />;
}

/**
 * Вкладка «Теория» задания №18: главы подряд, содержание рядом —
 * общая оболочка теории (TeoriyaShell). Страница серверная: формулы
 * и чертежи набираются на сборке. Тексты — content/zadanie18/teoriya.ts.
 */
export function Teoriya18({ vkladka }: { vkladka: string }) {
  const tela = Object.fromEntries(GLAVY_18.map((g) => [g.id, <Telo g={g} key={g.id} />]));
  return (
    <TeoriyaShell
      vkladka={vkladka}
      razdely={GLAVY_18.map((g) => ({
        id: g.id,
        title: g.title,
        podpunkty: g.fakty.map((f) => ({ id: `t18-${f.id}`, title: f.title })),
      }))}
      tela={tela}
      dekor={{ kartinka: <Dekor />, note: UI.dekor }}
      trackKey="18"
    />
  );
}
