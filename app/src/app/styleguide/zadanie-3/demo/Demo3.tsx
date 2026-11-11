import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { Chertezh3d } from '@/components/stereo/Chertezh3d';
import {
  FormulyRamka,
  KartaGruppa,
  KartaGruppaProgress,
  KartaPrimer,
  KartaShapka,
  KartaTip,
} from '@/components/tasks/karta';
import { Metka, Polosa, Znak, type Shag } from '@/components/tasks/steklo';
import '@/components/tasks/trening';
import { TIPY_3 } from '@/content/stereo/tipy';
import { baseCenter, box, regularPrism, regularPyramid, vertex } from '@/lib/solid/figures';
import type { Model } from '@/lib/solid/model';
import { ORTHO_AZIMUTH, ORTHO_ELEVATION, orthoAt } from '@/lib/solid/project';
import { renderSolid } from '@/lib/solid/render';
import { vybratVidSolid } from '@/lib/solid/vid';
import { BLOKI_3, zadachiBloka } from '@/lib/stereo/opornye3/bloki';
import { RAZBORY_3, type RazborStereo } from '@/lib/stereo/razbory3';
import { typeset } from '@/lib/tex';
import { prototypeById } from '@/lib/zadanie3';
import { Demo3Opornaya, Demo3Primer, Demo3Trenazher, type ZadachaDemo } from './Demo3Klient';
import {
  FORMULY3,
  GRUPPY3,
  NAVYKI3,
  PODOBIE3,
  SHAPKA3,
  TIPY3_NAZVANIYA,
  ZADACHI_DEMO,
  type Gruppa3,
  type Variant3,
} from './demo3Data';

/* Демо двух вариантов оформления трёх вкладок №3 — «О задании»,
   «Опорные задачи», «Тренажёр» — на общих компонентах №8
   (components/tasks/karta, trening, steklo) и настоящих данных №3.

   Чертежи живые: движок lib/solid, первый кадр нарисован на сборке,
   сам движок приезжает по первому касанию. Тренажёр и опорная задача
   работают по-настоящему (ввод, проверка, подсказка, решение, итоги);
   прогресс ученика — образец. */

const tex = (s: string) => typeset(`$${s}$`);
const ru = (x: number) => String(x).replace('.', ',');
const VID = orthoAt(ORTHO_AZIMUTH, ORTHO_ELEVATION);

/* ── Фигуры ──────────────────────────────────────────────────── */

function modelPrototipa(id: string, n = 1): Model {
  const p = prototypeById(id);
  const v = p?.varianty.find((item) => item.n === n);
  if (p === undefined || v === undefined) {
    throw new Error(`Нет варианта ${id}#${n}`);
  }
  return vybratVidSolid(p.chertezh(v.params)).model;
}

/** Значок группы: фигура прототипа без подписей и построений. */
function Figurka({ prototip }: { prototip: string }) {
  const m = modelPrototipa(prototip);
  const golaya: Model = { alt: m.alt, bodies: m.bodies, ...(m.rakurs ? { rakurs: m.rakurs } : {}) };
  const svg = renderSolid(golaya, {
    view: orthoAt(m.rakurs?.azimuth ?? ORTHO_AZIMUTH, m.rakurs?.elevation ?? ORTHO_ELEVATION),
    tema: 'ekran',
    bezPodpisey: true,
  });
  return <span className="d3-figurka" dangerouslySetInnerHTML={{ __html: svg }} />;
}

/** Чертежи к формулам: величины из формулы подписаны на отрезках цветом. */
const CHERTEZHI_FORMUL: Record<string, () => Model> = {
  parallelepiped: () => {
    const b = box(4, 3, 2);
    return {
      alt: 'Прямоугольный параллелепипед с рёбрами a, b, c и диагональю d',
      bodies: [b],
      lines: [
        { a: vertex(b, 'A'), b: vertex(b, 'B'), label: 'a' },
        { a: vertex(b, 'B'), b: vertex(b, 'C'), label: 'b' },
        { a: vertex(b, 'C'), b: vertex(b, 'C1'), label: 'c' },
        { a: vertex(b, 'A'), b: vertex(b, 'C1'), label: 'd' },
      ],
    };
  },
  prizma: () => {
    const b = regularPrism(3, 2, 3);
    return {
      alt: 'Треугольная призма с высотой h',
      bodies: [b],
      lines: [{ a: vertex(b, 'A'), b: vertex(b, 'A1'), label: 'h' }],
    };
  },
  piramida: () => {
    const b = regularPyramid(4, 2.2, 3);
    const o = baseCenter(b, 4);
    return {
      alt: 'Четырёхугольная пирамида с высотой h',
      bodies: [b],
      lines: [{ a: o, b: vertex(b, 'S'), label: 'h' }],
      marks: [{ p: o }],
    };
  },
  cilindr: () => ({
    alt: 'Цилиндр с радиусом r и высотой h',
    bodies: [{ kind: 'cylinder', base: [0, 0, 0], r: 1.5, h: 3 }],
    lines: [
      { a: [0, 0, 0], b: [1.5, 0, 0], label: 'r' },
      { a: [0, 0, 0], b: [0, 0, 3], label: 'h' },
    ],
  }),
  konus: () => ({
    alt: 'Конус с радиусом r, высотой h и образующей l',
    bodies: [{ kind: 'cone', base: [0, 0, 0], r: 1.5, h: 2.2 }],
    lines: [
      { a: [0, 0, 0], b: [1.5, 0, 0], label: 'r' },
      { a: [0, 0, 0], b: [0, 0, 2.2], label: 'h' },
      { a: [1.5, 0, 0], b: [0, 0, 2.2], label: 'l' },
    ],
  }),
  shar: () => ({
    alt: 'Шар радиуса R',
    bodies: [{ kind: 'sphere', center: [0, 0, 0], r: 1.5 }],
    lines: [{ a: [0, 0, 0], b: [1.5, 0, 0], label: 'R' }],
    marks: [{ p: [0, 0, 0] }],
  }),
};

function StatichnyyChertezh({ model }: { model: Model }) {
  const svg = renderSolid(model, { view: VID, tema: 'ekran', ustoychivo: true });
  return <span className="d3-statika" dangerouslySetInnerHTML={{ __html: svg }} />;
}

/* ── «О задании» ─────────────────────────────────────────────── */

const LABELS_GRUPPY = {
  tipov: (n: number) => `${n} ${n === 1 ? 'тип' : n < 5 ? 'типа' : 'типов'}`,
  povtorit: SHAPKA3.povtorit,
  neNachato: SHAPKA3.neNachato,
  resheno: (resheno: number, verno: number) => `решено ${resheno} · верно ${verno}`,
};

function shagovNaChertezhe(m: Model): number {
  const items = [
    ...(m.lines ?? []),
    ...(m.sections ?? []),
    ...(m.angles ?? []),
    ...(m.marks ?? []),
    ...(m.measures ?? []),
    ...(m.notes ?? []),
  ];
  return Math.max(0, ...items.map((x) => x.shag ?? 0));
}

function shagiRazbora(razbor: RazborStereo): Shag[] {
  return razbor.shagi.map((s) => ({
    chtoHtml: `<b>${typeset(s.chto)}.</b> ${s.zachem.map((p) => typeset(p)).join(' ')}`,
    formulaHtml: (s.formuly ?? []).map((f) => `<div>${tex(f)}</div>`).join(''),
  }));
}

function Primer({ tip, v }: { tip: string; v: Variant3 }) {
  const razbor = RAZBORY_3.find((r) => r.tip === tip);
  if (razbor === undefined) {
    return null;
  }
  const model = razbor.model();
  const n = shagovNaChertezhe(model);
  const shagi = shagiRazbora(razbor);
  const otvet =
    razbor.otvetTex === undefined ? ru(razbor.otvet) : razbor.otvetTex.replace(/\$/g, '');
  const trenirovatHref = '#trenazher';
  const opornyeHref = '#opornye';
  if (v === 'b') {
    /* Вариант Б: чертёж закреплён рядом, шаг подсвечивает своё на чертеже. */
    const svg = renderSolid(model, { view: VID, ustoychivo: true, tema: 'ekran', shag: 0 });
    return (
      <div className="kz-primer d3-primer-b">
        <p className="kz-primer__metka">{SHAPKA3.primer}</p>
        <div className="kz-uslovie" dangerouslySetInnerHTML={{ __html: typeset(razbor.uslovie) }} />
        <Demo3Primer
          model={model}
          svg={svg}
          azimuth={ORTHO_AZIMUTH}
          elevation={ORTHO_ELEVATION}
          shagovChertezha={n}
          shagi={shagi}
        />
        <p className="kz-otvet">
          {SHAPKA3.otvet}: <b>{otvet}</b>
        </p>
        <div className="kz-knopki">
          <a className="stk-btn stk-btn--primary" href={trenirovatHref}>
            {SHAPKA3.trenirovat}
          </a>
          <a className="stk-btn stk-btn--tihaya" href={opornyeHref}>
            {SHAPKA3.opornye}
          </a>
        </div>
      </div>
    );
  }
  return (
    <KartaPrimer
      uslovieHtml={typeset(razbor.uslovie)}
      risunok={
        <Chertezh3d
          model={model}
          tema="ekran"
          shagi={razbor.shagi.slice(0, n).map((s) => s.chto)}
          uslovie="Чертёж условия"
        />
      }
      shagi={shagi}
      otvet={otvet}
      trenirovatHref={trenirovatHref}
      opornyeHref={`${opornyeHref}`}
      labels={SHAPKA3}
    />
  );
}

function progressGruppy(g: Gruppa3) {
  return { resheno: g.resheno, verno: g.verno, povtorit: g.oshibokIz5 >= 2 };
}

/** Какие типы раскрыты сразу: многогранник, тело вращения, комбинация. */
const OTKRYTYE = new Set(['diagonali', 'konus', 'sfera-komb']);

function OZadanii({ v }: { v: Variant3 }) {
  return (
    <div className={clsx('kz', v === 'b' && 'd3-kz-b')}>
      <KartaShapka
        nadzagolovok={SHAPKA3.nadzagolovok}
        zagolovok={SHAPKA3.zagolovok}
        lead={SHAPKA3.lead}
        fakty={SHAPKA3.fakty}
        opasnoTitle={SHAPKA3.opasnoTitle}
        opasno={SHAPKA3.opasno.map((line) => typeset(line))}
      />

      <section className="kz-razdel" aria-labelledby="d3-gruppy">
        <div className="kz-razdel__head">
          <h3 className="stk-h3" id="d3-gruppy">
            {SHAPKA3.gruppyTitle}
          </h3>
          <p className="stk-lead">{SHAPKA3.gruppyLead}</p>
        </div>
        <div className="kz-gruppy">
          {GRUPPY3.map((g) => (
            <KartaGruppa
              key={g.id}
              id={g.id}
              nazvanie={g.nazvanie}
              znakHtml=""
              znak={<Figurka prototip={g.znak} />}
              ton={g.ton}
              tipov={g.tipy.length}
              progress={<KartaGruppaProgress progress={progressGruppy(g)} labels={LABELS_GRUPPY} />}
              labels={LABELS_GRUPPY}
              open={g.tipy.some((t) => OTKRYTYE.has(t))}
            >
              {g.tipy.map((id) => {
                const teksty = TIPY3_NAZVANIYA[id];
                if (teksty === undefined) {
                  return null;
                }
                return (
                  <KartaTip
                    key={id}
                    id={id}
                    nazvanieHtml={typeset(teksty.nazvanie)}
                    lead={teksty.lead.replace(/\$/g, '')}
                    open={OTKRYTYE.has(id)}
                  >
                    <Primer tip={id} v={v} />
                  </KartaTip>
                );
              })}
            </KartaGruppa>
          ))}
        </div>
      </section>

      <section className="kz-razdel kz-znat" aria-labelledby="d3-znat">
        <div className="kz-razdel__head">
          <h3 className="stk-h3" id="d3-znat">
            {SHAPKA3.znatTitle}
          </h3>
          <p className="stk-lead">{SHAPKA3.znatLead}</p>
        </div>
        {v === 'a' ? (
          <div className="kz-znat__setka">
            {FORMULY3.map((blok) => {
              const model = CHERTEZHI_FORMUL[blok.id]?.();
              return (
                <FormulyRamka
                  key={blok.id}
                  nazvanie={blok.nazvanie}
                  ton={blok.ton}
                  formuly={blok.formuly.map((f, i) => ({
                    html: tex(f.tex),
                    primerHtml: tex(f.primer),
                    ...(i === 0 && model !== undefined
                      ? { risunok: <StatichnyyChertezh model={model} /> }
                      : {}),
                  }))}
                />
              );
            })}
          </div>
        ) : (
          <div className="d3-lenta">
            {FORMULY3.map((blok) => {
              const model = CHERTEZHI_FORMUL[blok.id]?.();
              return (
                <section
                  className={clsx('d3-figura stk-glass', `stk-ton--${blok.ton}`)}
                  key={blok.id}
                >
                  <h4 className="d3-figura__zag">{blok.nazvanie}</h4>
                  {model === undefined ? null : (
                    <div className="d3-figura__chertezh">
                      <Chertezh3d model={model} tema="ekran" />
                    </div>
                  )}
                  <ul className="d3-figura__formuly">
                    {blok.formuly.map((f) => (
                      <li key={f.tex}>
                        <span
                          className="kz-ramka__formula"
                          dangerouslySetInnerHTML={{ __html: tex(f.tex) }}
                        />
                        <span className="kz-ramka__primer">
                          <i>например</i>{' '}
                          <span dangerouslySetInnerHTML={{ __html: tex(f.primer) }} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}

        <section className="d3-podobie stk-glass stk-glass--warm">
          <h4 className="d3-podobie__zag">{PODOBIE3.nazvanie}</h4>
          <div className="d3-podobie__telo">
            <div className="d3-podobie__chertezh">
              <StatichnyyChertezh
                model={{
                  alt: 'Два куба: с ребром 1 и с ребром 2',
                  bodies: [
                    { ...box(1, 1, 1), names: [] },
                    {
                      ...box(2, 2, 2),
                      names: [],
                      vertices: box(2, 2, 2).vertices.map(([x, y, z]) => [x + 2.2, y, z]),
                    },
                  ],
                  lines: [
                    { a: [0, 0, 0], b: [1, 0, 0], label: 'a' },
                    { a: [2.2, 0, 0], b: [4.2, 0, 0], label: '2a' },
                  ],
                }}
              />
            </div>
            <div>
              <p
                className="stk-lead"
                dangerouslySetInnerHTML={{ __html: typeset(PODOBIE3.lead) }}
              />
              <ul className="d3-podobie__stroki">
                {PODOBIE3.stroki.map((s) => (
                  <li key={s.vo}>
                    <span>{s.chto}</span>
                    <b dangerouslySetInnerHTML={{ __html: `в ${tex(s.vo)} раз` }} />
                    <i>при k = 2: в {s.primer}</i>
                  </li>
                ))}
              </ul>
              <p
                className="d3-podobie__primer"
                dangerouslySetInnerHTML={{ __html: typeset(PODOBIE3.primer) }}
              />
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}

/* ── «Опорные задачи» ────────────────────────────────────────── */

const VIDY: Record<string, string> = {
  chislo: 'ответ числом',
  nazhmi: 'нажать на чертеже',
  vybor: 'выбрать вариант',
  ploskiy: 'выбрать плоский чертёж',
};

function Opornye({ v }: { v: Variant3 }) {
  const blok = BLOKI_3.find((b) => b.slug === 'obem-i-ploshchad');
  const zadachi = blok === undefined ? [] : zadachiBloka(blok.id);
  /* Образец прогресса навыков. */
  const resheno = [14, 10, 6, 0, 3, 0];
  return (
    <div className="d3-opornye">
      <div className="kz-razdel__head">
        <h3 className="stk-h3">Блоки по навыкам</h3>
        <p className="stk-lead">
          В каждом блоке задачи идут от простой к сложной. На карточке — только навык и ваш
          прогресс.
        </p>
      </div>
      <ul className={clsx('d3-navyki', v === 'b' && 'd3-navyki--b')}>
        {NAVYKI3.map((n, i) => {
          const vsego = n.bloki.length * 10;
          const done = resheno[i] ?? 0;
          return (
            <li key={n.id}>
              <a className={clsx('d3-navyk stk-glass', `stk-ton--${n.ton}`)} href="#opornye-blok">
                <Znak html="" figura={<Figurka prototip={n.znak} />} ton={n.ton} />
                <span className="d3-navyk__text">
                  <b>{n.nazvanie}</b>
                  <span>{n.lead}</span>
                </span>
                <span className="d3-navyk__progress">
                  <span>{done === 0 ? 'Ещё не решали' : `${done} из ${vsego}`}</span>
                  <Polosa dolya={done / vsego} />
                </span>
              </a>
            </li>
          );
        })}
      </ul>

      <section className="d3-blok" id="opornye-blok" aria-labelledby="d3-blok-zag">
        <div className="d3-blok__head">
          <Metka>Блок открыт</Metka>
          <h3 className="stk-h3" id="d3-blok-zag">
            Объём и площадь куба и параллелепипеда
          </h3>
          <p className="stk-lead">10 задач · от простой к сложной · решено 2</p>
        </div>
        <ol className="d3-blok__zadachi">
          {zadachi.map((z, i) => {
            if (z.vid !== 'chislo' || i > 5) {
              return (
                <li className="d3-zakryta stk-glass" key={z.id}>
                  <span className="d3-zakryta__no">{i + 1}</span>
                  <span className="d3-zakryta__text">
                    <b>{z.kratko}</b>
                    <span>{VIDY[z.vid]}</span>
                  </span>
                  <span className="d3-zvezdy" aria-label={`Сложность ${z.uroven} из 3`}>
                    {'★'.repeat(z.uroven)}
                  </span>
                </li>
              );
            }
            const pervyy = z.podskazka[0];
            return (
              <li key={z.id}>
                <Demo3Opornaya
                  no={i + 1}
                  uroven={z.uroven}
                  kratko={z.kratko}
                  uslovieHtml={typeset(z.uslovie)}
                  risunok={<Chertezh3d model={z.model} tema="ekran" />}
                  otvet={z.otvet}
                  podskazka={
                    pervyy === undefined
                      ? null
                      : {
                          voprosHtml: typeset(pervyy.vopros),
                          varianty: pervyy.varianty.map((t) => typeset(t)),
                          verno: pervyy.verno,
                          vyvodHtml: typeset(pervyy.vyvod),
                        }
                  }
                  shagi={z.uchenik.map((s) => ({
                    chtoHtml: typeset(s.chto),
                    formulaHtml: s.formula === undefined ? '' : tex(s.formula),
                  }))}
                  otkryta={i === 0}
                />
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

/* ── «Тренажёр» ──────────────────────────────────────────────── */

function zadachaDemo(prototip: string, n: number, gruppa: string): ZadachaDemo {
  const p = prototypeById(prototip);
  const varianty = p?.varianty.filter((item) => item.n >= n).slice(0, 3) ?? [];
  if (p === undefined || varianty.length === 0) {
    throw new Error(`Нет прототипа ${prototip}`);
  }
  const tip = TIPY_3.find((t) => (t.prototipy ?? []).includes(Number(prototip.slice(4))));
  return {
    gruppa,
    tipHtml: typeset(TIPY3_NAZVANIYA[tip?.id ?? '']?.nazvanie ?? p.nazvanie),
    varianty: varianty.map((variant) => {
      const hint = p.podskazka?.(variant.params)[0];
      return {
        id: `${prototip}#${variant.n}`,
        uslovieHtml: typeset(p.uslovie(variant.params)),
        otvet: ru(p.otvet(variant.params)),
        podskazkaHtml: hint === undefined ? null : typeset(hint.question),
        shagi: p.shagi(variant.params).map((s) => ({ chtoHtml: typeset(s.text), formulaHtml: '' })),
        risunok: (
          <Chertezh3d
            key={`${prototip}#${variant.n}`}
            model={vybratVidSolid(p.chertezh(variant.params)).model}
            tema="ekran"
          />
        ),
      };
    }),
  };
}

function Trenazher() {
  const gruppy = GRUPPY3.map((g) => ({
    id: g.id,
    nazvanie: g.nazvanie,
    znakHtml: '',
    znak: <Figurka prototip={g.znak} />,
    ton: g.ton,
    tipy: g.tipy.map((id) => ({
      id,
      nazvanieHtml: typeset(TIPY3_NAZVANIYA[id]?.nazvanie ?? id),
    })),
    resheno: g.resheno,
    verno: g.verno,
    povtorit: g.oshibokIz5 >= 2,
  }));
  return (
    <Demo3Trenazher
      gruppy={gruppy}
      zadachi={ZADACHI_DEMO.map((z) => zadachaDemo(z.prototip, z.n, z.gruppa))}
    />
  );
}

/* ── Страница ────────────────────────────────────────────────── */

function Razdel({ id, nazvanie, children }: { id: string; nazvanie: string; children: ReactNode }) {
  return (
    <section className="d3-razdel" id={id}>
      <h2 className="d3-razdel__zag">{nazvanie}</h2>
      {children}
    </section>
  );
}

export function Demo3({ v }: { v: Variant3 }) {
  return (
    <main className={clsx('d3', `d3--${v}`)}>
      <p className="d3-sluzhebnoe">
        Демо №3 · вариант {v === 'a' ? 'А «Витрина»' : 'Б «Сцена»'} ·{' '}
        <a href={`/styleguide/zadanie-3/demo/${v === 'a' ? 'b' : 'a'}/`}>
          открыть вариант {v === 'a' ? 'Б' : 'А'}
        </a>
      </p>
      <nav className="d3-vkladki" aria-label="Вкладки задания">
        <a href="#o-zadanii">О задании</a>
        <a href="#opornye">Опорные задачи</a>
        <a href="#trenazher">Тренажёр</a>
      </nav>
      <Razdel id="o-zadanii" nazvanie="О задании">
        <OZadanii v={v} />
      </Razdel>
      <Razdel id="opornye" nazvanie="Опорные задачи">
        <Opornye v={v} />
      </Razdel>
      <Razdel id="trenazher" nazvanie="Тренажёр">
        <Trenazher />
      </Razdel>
    </main>
  );
}
