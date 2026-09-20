'use client';

import { clsx } from 'clsx';
import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { AtomVykladki, ZnakVykladki } from '@/lib/tex';

export interface VykladkaKlientProps {
  /** Утверждения шага, каждое — атомы со знаками между ними (lib/tex.ts). */
  vykladka: readonly (readonly AtomVykladki[])[];
  className?: string;
}

/** Строка выкладки: утверждение, первый атом и сколько атомов в строке. */
type Stroka = readonly [utverzhdenie: number, nachalo: number, dlina: number];

/** Где стоит знак в строке: с отбивкой с обеих сторон или с одной. */
type Polozhenie = 'nachalo' | 'sredi' | 'konets';

const ZNAKI: Record<
  ZnakVykladki,
  { glif: string; klass: string; otbivka: string; rasporka: CSSProperties }
> = {
  /* Знак отношения и бинарные знаки — как их набирает KaTeX: тот же
     класс, та же отбивка (thick 0,2778em и medium 0,2222em) и та же
     распорка по высоте. */
  '=': { glif: '=', klass: 'mrel', otbivka: '0.2778em', rasporka: { height: '0.3669em' } },
  '+': {
    glif: '+',
    klass: 'mbin',
    otbivka: '0.2222em',
    rasporka: { height: '0.6444em', verticalAlign: '-0.0833em' },
  },
  '-': {
    glif: '−',
    klass: 'mbin',
    otbivka: '0.2222em',
    rasporka: { height: '0.6444em', verticalAlign: '-0.0833em' },
  },
};

/**
 * Знак между атомами — разметкой KaTeX, без самого KaTeX: браузер
 * его не грузит. В начале строки знак без отбивки слева, в конце —
 * без отбивки справа: строки выкладки выровнены по левому краю.
 */
function Znak({ vid, polozhenie }: { vid: ZnakVykladki; polozhenie: Polozhenie }) {
  const z = ZNAKI[vid];
  const otbivka = <span className="mspace" style={{ marginRight: z.otbivka }} />;
  return (
    <span className="katex vykladka__znak" aria-hidden="true">
      <span className="katex-html">
        <span className="base">
          <span className="strut" style={z.rasporka} />
          {polozhenie === 'nachalo' ? null : otbivka}
          <span className={z.klass}>{z.glif}</span>
          {polozhenie === 'konets' ? null : otbivka}
        </span>
      </span>
    </span>
  );
}

/** Каждый атом своей строкой — до примерки и без скриптов. */
function poOdnomu(vykladka: VykladkaKlientProps['vykladka']): Stroka[] {
  return vykladka.flatMap((atomy, u) => atomy.map((_, i) => [u, i, 1] as const));
}

/** Ширины проб по ключу: атомы «u-i», знаки «=|sredi» и т. п. */
type Shiriny = Map<string, number>;

/**
 * Ширина строки из атомов nachalo..nachalo+dlina−1 утверждения:
 * сумма ширин атомов и знаков между ними, плюс знак в начале, если
 * строка продолжает утверждение, и знак в конце, если утверждение
 * продолжается дальше. Атомы и знаки стоят встык, других ширин нет.
 */
function shirinaStroki(
  atomy: readonly AtomVykladki[],
  u: number,
  nachalo: number,
  dlina: number,
  shiriny: Shiriny,
): number {
  const w = (klyuch: string) => shiriny.get(klyuch) ?? 0;
  let summa = 0;
  for (let i = nachalo; i < nachalo + dlina; i += 1) {
    const znak = atomy[i]?.znak;
    if (i > nachalo && znak !== undefined) {
      summa += w(`${znak}|sredi`);
    }
    summa += w(`${u}-${i}`);
  }
  const pervyy = atomy[nachalo]?.znak;
  if (nachalo > 0 && pervyy !== undefined) {
    summa += w(`${pervyy}|nachalo`);
  }
  const sleduyushchiy = atomy[nachalo + dlina]?.znak;
  if (sleduyushchiy !== undefined) {
    summa += w(`${sleduyushchiy}|konets`);
  }
  return summa;
}

/**
 * Разбить утверждение на строки по ширине колонки.
 *
 * Жадно: строка тянется до самой дальней границы, на которой ещё
 * влезает. Границы — перед атомами: сначала только по «=» (уровень
 * 1); не влезает даже до ближайшего «=» — берутся и «+», «−»
 * (уровень 2); не влезает и так — строка обрывается на ближайшей
 * допустимой границе, рвать атом негде. Граница уровня 0 (после
 * одного обозначения вроде «P =») не берётся никогда.
 */
function razbitUtverzhdenie(
  atomy: readonly AtomVykladki[],
  u: number,
  shirina: number,
  shiriny: Shiriny,
): Stroka[] {
  const n = atomy.length;
  const stroki: Stroka[] = [];
  let nachalo = 0;
  while (nachalo < n) {
    const granitsy = (uroven: 1 | 2) => {
      const rez: number[] = [];
      for (let b = nachalo + 1; b < n; b += 1) {
        const ur = atomy[b]?.uroven ?? 1;
        if (ur !== 0 && ur <= uroven) {
          rez.push(b);
        }
      }
      rez.push(n);
      return rez;
    };
    const vlezaet = (b: number) =>
      shirinaStroki(atomy, u, nachalo, b - nachalo, shiriny) <= shirina;
    const po1 = granitsy(1).filter(vlezaet);
    const po2 = po1.length > 0 ? po1 : granitsy(2).filter(vlezaet);
    const konets = po2.length > 0 ? (po2.at(-1) ?? n) : (granitsy(2)[0] ?? n);
    stroki.push([u, nachalo, konets - nachalo]);
    nachalo = konets;
  }
  return stroki;
}

/**
 * Выкладка — формула, которая рвётся по правилам тетради.
 *
 * Атомы и знаки между ними приходят с сервера; здесь они собираются
 * в строки по ширине колонки. Помещается утверждение целиком — оно
 * стоит одной строкой без повторных знаков; нет — рвётся по «=»,
 * а кусок между двумя «=», не влезающий целиком, — по «+» и «−»;
 * знак на разрыве стоит дважды: в конце строки и в начале
 * следующей. После одного обозначения («P =») строку не обрывают.
 * Самостоятельные выкладки шага (через «,\quad» в шаблоне) идут
 * каждая с новой строки, и знак между ними не дублируется.
 * Ничего не прокручивается.
 *
 * Примерка: у каждого атома и у каждого знака в разметке стоит
 * невидимая проба, сжатая в точку с обрезкой, — её scrollWidth и
 * есть ширина; ширина строки складывается из них, потому что атомы
 * и знаки стоят встык. Примерка повторяется при изменении ширины
 * колонки и после загрузки шрифтов KaTeX. До неё (и без скриптов)
 * каждый атом стоит своей строкой: так ничего не вылезет за край.
 */
export function VykladkaKlient({ vykladka, className }: VykladkaKlientProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [stroki, setStroki] = useState<Stroka[]>(() => poOdnomu(vykladka));

  useLayoutEffect(() => {
    const blok = ref.current;
    if (blok === null) {
      return undefined;
    }
    const primerit = () => {
      const shiriny: Shiriny = new Map();
      for (const proba of blok.querySelectorAll<HTMLElement>('[data-proba]')) {
        shiriny.set(proba.dataset['proba'] ?? '', proba.scrollWidth);
      }
      const novye = vykladka.flatMap((atomy, u) =>
        razbitUtverzhdenie(atomy, u, blok.clientWidth, shiriny),
      );
      /* Тот же набор строк — то же состояние: иначе наблюдатель
         ширины и отрисовка гоняли бы друг друга по кругу. */
      setStroki((byli) =>
        byli.length === novye.length && byli.every((b, i) => b.every((x, k) => x === novye[i]?.[k]))
          ? byli
          : novye,
      );
    };
    primerit();
    const nablyudatel = new ResizeObserver(primerit);
    nablyudatel.observe(blok);
    /* Пока шрифты KaTeX не подгрузились, проба меряется запасным
       шрифтом и врёт; с приходом шрифтов примерка повторяется. */
    const shrifty = document.fonts;
    shrifty.addEventListener('loadingdone', primerit);
    return () => {
      nablyudatel.disconnect();
      shrifty.removeEventListener('loadingdone', primerit);
    };
  }, [vykladka]);

  const znaki = Object.keys(ZNAKI) as ZnakVykladki[];
  const polozheniya: Polozhenie[] = ['nachalo', 'sredi', 'konets'];

  return (
    <div ref={ref} className={clsx('vykladka', className)}>
      {vykladka.map((atomy, u) =>
        atomy.map((atom, i) => (
          <span
            key={`p${u}-${i}`}
            className="vykladka__proba"
            data-proba={`${u}-${i}`}
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: atom.html }}
          />
        )),
      )}
      {znaki.map((vid) =>
        polozheniya.map((polozhenie) => (
          <span
            key={`z${vid}${polozhenie}`}
            className="vykladka__proba"
            data-proba={`${vid}|${polozhenie}`}
          >
            <Znak vid={vid} polozhenie={polozhenie} />
          </span>
        )),
      )}
      {stroki.map(([u, nachalo, dlina]) => {
        const atomy = vykladka[u] ?? [];
        const pervyy = atomy[nachalo]?.znak;
        const sleduyushchiy = atomy[nachalo + dlina]?.znak;
        return (
          <span key={`s${u}-${nachalo}`} className="vykladka__stroka">
            {nachalo > 0 && pervyy !== undefined ? (
              <Znak vid={pervyy} polozhenie="nachalo" />
            ) : null}
            {atomy.slice(nachalo, nachalo + dlina).map((atom, k) => (
              <span key={nachalo + k} className="vykladka__atom">
                {k > 0 && atom.znak !== undefined ? (
                  <Znak vid={atom.znak} polozhenie="sredi" />
                ) : null}
                <span dangerouslySetInnerHTML={{ __html: atom.html }} />
              </span>
            ))}
            {sleduyushchiy !== undefined ? <Znak vid={sleduyushchiy} polozhenie="konets" /> : null}
          </span>
        );
      })}
    </div>
  );
}
