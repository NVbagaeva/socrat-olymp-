import type { Metadata } from 'next';
import { TIPY_18 } from '@/content/zadanie18/trenazher';
import { OPORNYE_18 } from '@/content/zadanie18/opornye';
import { zadacha2 } from '@/lib/povyshennye/chast2';
import { svgSkhemy } from '@/lib/skhemy/svg';
import { cssTemy } from '@/lib/skhemy/tema';
import { VID_ISHODNYY, type ZhivayaSkhema } from '@/lib/skhemy/tipy';
import { POROGI_CHERTEZHA } from '@/lib/skhemy/vidimye';
import { scenaOpornoy18, scenaOpornoyTochno18 } from '@/lib/zadanie18/opornye';
import { scena18 } from '@/lib/zadanie18/trenazher/sceny';
import { POSTROENIYA_18 } from '@/lib/zadanie18/trenazher/uslovie';
import { TIPY_S_VIDIMYMI_18 } from '@/lib/zadanie18/trenazher/vidimye';
import '@/components/skhemy/skhemy.css';
import '../chertezhi/chertezhi.css';
import './chertezhi-18.css';
/* Снимок «до»: чертежи кода до перехода на видимые параметры и чертёж
   условия без построений (коммит d748c18, тот же размер 360 × 250, тема
   в цвете; оформление темы — одно на страницу). */
import DO from './do.json';

/* Обзор чертежей второй части (№18): все типы сцен генератора и
   тренажёра по три набора чисел — «до», «после» (чертёж условия: лист
   ученика с «Чертежом к условию», тренажёр до подсказок) и чертёж
   учителя (с построениями решения). Ниже — опорные задачи, у которых
   изменилось начальное положение, и чертежи условий №18 вариантов
   повышенной сложности. Служебная страница, в поиск не попадает. */
export const metadata: Metadata = {
  title: 'Будет на ЕГЭ — чертежи №18: до и после',
  robots: { index: false, follow: false },
};

const SOST = { lit: new Set<string>(), shag: null, podpisi: true };
const SOST_UCHITEL = { ...SOST, uchitel: true };

/** SVG без встроенного оформления темы: оно одно на странице. */
function bezStilya(svg: string): string {
  return svg.replace(/<style>[\s\S]*?<\/style>/g, '');
}

function risunok(sk: ZhivayaSkhema, uchitel = false): string {
  return bezStilya(
    svgSkhemy(sk, sk.nachalo, VID_ISHODNYY, uchitel ? SOST_UCHITEL : SOST, {
      W: 360,
      H: 250,
      opisanie: '',
      tema: 'cvet',
    }),
  );
}

const P = POROGI_CHERTEZHA;
const PRAVILA = [
  'Схематично, но верно по смыслу: касание, перпендикулярность, параллельность, точка на прямой и окружности, порядок точек, тип фигуры, «что больше» и равенства — как в задаче (сверяется с чертежом в точной пропорции).',
  `Крайние пропорции сглажены: радиусы — не больше ${String(P.otnoshenieRadiusov).replace('.', ',')} : 1, подписанные отрезки — не больше ${P.otnoshenieOtrezkov} : 1. Числа в подписях — настоящие.`,
  `Мелочи нет: наименьший радиус — не меньше ${Math.round(P.radiusDolya * 100)} % размера чертежа, подписанный отрезок — не короче ${P.otrezokMm} мм на листе (${P.shirinaMm} мм — ширина чертежа), угол — не уже ${P.ugol}°, подписанные точки — не ближе ${String(P.tochkiMm).replace('.', ',')} мм.`,
  'Чертёж условия — только данные: построения решения (высоты, радиусы в точки касания, точки пересечения, засечки доказываемых равенств) — у учителя и в подсказках.',
  'Пороги проверяет pnpm test:chertezhi-18 (шаг CI «Проверить чертежи №18»).',
];

const OPORNYE_IZMENENY = OPORNYE_18.filter(
  (o) => scenaOpornoy18(o.id) !== scenaOpornoyTochno18(o.id),
);

const POVYSH = Object.keys(DO.povysh).map((k) => {
  const i = k.indexOf(' ');
  return { kl: k, s: k.slice(0, i), p: JSON.parse(k.slice(i + 1)) as Record<string, number> };
});

function chtoIzmeneno(id: string): string[] {
  const out: string[] = [];
  if (TIPY_S_VIDIMYMI_18.includes(id)) out.push('видимые параметры');
  const p = POSTROENIYA_18[id];
  if (p?.skryt !== undefined) out.push(`на чертеже условия скрыто: ${p.skryt.join(', ')}`);
  if (p?.vyvod !== undefined) out.push(`засечки-выводы: ${p.vyvod.join(', ')}`);
  return out;
}

function Ris({ podpis, svg }: { podpis: string; svg: string | null }) {
  return (
    <figure className="sg18__ris">
      <figcaption>{podpis}</figcaption>
      {svg === null ? (
        <p className="sg18__net">—</p>
      ) : (
        <span className="skh" dangerouslySetInnerHTML={{ __html: svg }} />
      )}
    </figure>
  );
}

export default function Page() {
  const doTipy = DO.tipy as Record<string, string>;
  const doOpornye = DO.opornye as Record<string, string>;
  const doPovysh = DO.povysh as Record<string, string>;
  return (
    <main className="sg-ch sg18">
      <style>{cssTemy()}</style>
      <h1>Чертежи №18: до и после</h1>
      <p className="sg-ch__lead">
        Все типы сцен генератора и тренажёра №18 — по три набора чисел: «до» (точная пропорция и все
        построения на чертеже ученика), «после» — чертёж условия (лист ученика с «Чертежом к
        условию», тренажёр до подсказок) и чертёж учителя (с построениями решения).
      </p>
      <h2>Правила</h2>
      <ol className="sg-ch__pravila">
        {PRAVILA.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ol>

      <nav className="sg18__nav" aria-label="Типы задач">
        {TIPY_18.map((t) => (
          <a key={t.id} href={`#${t.id}`}>
            {t.id}
          </a>
        ))}
        <a href="#opornye">опорные задачи</a>
        <a href="#povyshennye">повышенные</a>
      </nav>

      {TIPY_18.map((t) => (
        <section key={t.id} id={t.id} className="sg18__tip">
          <h2>
            {t.nazvanie} <code>{t.id}</code>
          </h2>
          {chtoIzmeneno(t.id).length === 0 ? null : (
            <p className="sg-ch__note">{chtoIzmeneno(t.id).join(' · ')}</p>
          )}
          {t.varianty.map((p, i) => {
            const sk = scena18(t.id, p);
            const kl = `${t.id}#${i + 1}`;
            return (
              <div key={kl} className="sg18__ryad">
                <p className="sg18__chisla">
                  {i + 1}: {JSON.stringify(p)}
                </p>
                <Ris podpis="до" svg={doTipy[kl] ?? null} />
                <Ris podpis="после: чертёж условия" svg={risunok(sk)} />
                <Ris podpis="после: у учителя" svg={risunok(sk, true)} />
              </div>
            );
          })}
        </section>
      ))}

      <section id="opornye" className="sg18__tip">
        <h2>Опорные задачи: начальное положение</h2>
        <p className="sg-ch__note">
          Живые чертежи опорных задач с крайними числами начинают с читаемого положения; подписи —
          числа задачи. Потянули точку — чертёж и подписи снова живые.
        </p>
        {OPORNYE_IZMENENY.map((o) => (
          <div key={o.id} className="sg18__ryad sg18__ryad--2">
            <p className="sg18__chisla">{o.id}</p>
            <Ris podpis="до" svg={doOpornye[o.id] ?? null} />
            <Ris podpis="после" svg={risunok(scenaOpornoy18(o.id)!)} />
          </div>
        ))}
      </section>

      <section id="povyshennye" className="sg18__tip">
        <h2>Варианты повышенной сложности: чертежи условий №18</h2>
        <p className="sg-ch__note">
          На листе ученика — только с «Чертежом к условию» (по умолчанию выключен); у учителя и в
          разборе — всегда.
        </p>
        {POVYSH.map((z) => (
          <div key={z.kl} className="sg18__ryad sg18__ryad--2">
            <p className="sg18__chisla">{z.kl}</p>
            <Ris podpis="до" svg={doPovysh[z.kl] ?? null} />
            <Ris podpis="после" svg={zadacha2({ s: z.s, p: z.p }).risunok} />
          </div>
        ))}
      </section>
    </main>
  );
}
