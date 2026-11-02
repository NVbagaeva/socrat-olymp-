'use client';

import { useMemo, useState } from 'react';
import { Tex } from '@/components/ui/Tex';
import { krugHtml } from '@/lib/zadanie14/krugHtml';
import type { TochkaKruga } from '@/lib/zadanie14/krug';
import { u } from '@/lib/zadanie14/ugol';

interface Shag {
  tochki: [number, number][];
  text: string;
}

interface Maket {
  id: string;
  title: string;
  delenie: number;
  /** Точки, которые уже стоят до первого шага (подписаны). */
  fon: [number, number][];
  shagi: Shag[];
}

const CHETVERTI: [number, number][] = [
  [1, 2],
  [1, 1],
  [3, 2],
  [2, 1],
];

const MAKETY: Maket[] = [
  {
    id: 'chetverti',
    title: 'Четверти',
    delenie: 4,
    fon: [],
    shagi: [
      {
        tochki: [],
        text: 'Полный оборот — это длина всей окружности: $2\\pi$. Оси делят окружность на четыре равные дуги, поэтому каждая четверть — $2\\pi:4=\\dfrac{\\pi}{2}$.',
      },
      {
        tochki: [[1, 2]],
        text: 'Одна четверть от точки $(1;\\,0)$ против часовой стрелки — верхняя точка: $\\dfrac{\\pi}{2}$.',
      },
      {
        tochki: [[1, 1]],
        text: 'Две четверти — половина окружности: $2\\cdot\\dfrac{\\pi}{2}=\\pi$, левая точка.',
      },
      {
        tochki: [[3, 2]],
        text: 'Три четверти: $3\\cdot\\dfrac{\\pi}{2}=\\dfrac{3\\pi}{2}$, нижняя точка.',
      },
      {
        tochki: [[2, 1]],
        text: 'Четыре четверти — полный оборот, мы вернулись в начало: $2\\pi$.',
      },
    ],
  },
  {
    id: 'popolam',
    title: 'Пополам',
    delenie: 8,
    fon: CHETVERTI,
    shagi: [
      {
        tochki: [],
        text: 'Делим каждую четверть пополам: $\\dfrac{\\pi}{2}:2=\\dfrac{\\pi}{4}$. Окружность разбивается на восемь равных дуг.',
      },
      { tochki: [[1, 4]], text: 'Середина первой четверти: $\\dfrac{\\pi}{4}$.' },
      {
        tochki: [[3, 4]],
        text: 'Ещё $\\dfrac{\\pi}{4}$ после $\\dfrac{\\pi}{2}$: $\\dfrac{\\pi}{2}+\\dfrac{\\pi}{4}=\\dfrac{3\\pi}{4}$, то есть три восьмых дуги.',
      },
      { tochki: [[5, 4]], text: '$\\pi+\\dfrac{\\pi}{4}=\\dfrac{5\\pi}{4}$.' },
      {
        tochki: [[7, 4]],
        text: '$\\dfrac{3\\pi}{2}+\\dfrac{\\pi}{4}=\\dfrac{7\\pi}{4}$. В числителе — сколько раз отложили $\\dfrac{\\pi}{4}$.',
      },
    ],
  },
  {
    id: 'na-tri',
    title: 'На три части',
    delenie: 12,
    fon: CHETVERTI,
    shagi: [
      {
        tochki: [],
        text: 'Делим каждую четверть на три равные части: $\\dfrac{\\pi}{2}:3=\\dfrac{\\pi}{6}$. Окружность разбивается на двенадцать дуг.',
      },
      { tochki: [[1, 6]], text: 'Одна часть: $\\dfrac{\\pi}{6}$.' },
      {
        tochki: [[1, 3]],
        text: 'Две части: $2\\cdot\\dfrac{\\pi}{6}=\\dfrac{2\\pi}{6}=\\dfrac{\\pi}{3}$ — дробь сокращается.',
      },
      {
        tochki: [
          [2, 3],
          [5, 6],
        ],
        text: 'Во второй четверти: $\\dfrac{4\\pi}{6}=\\dfrac{2\\pi}{3}$ и $\\dfrac{5\\pi}{6}$.',
      },
      {
        tochki: [
          [7, 6],
          [4, 3],
        ],
        text: 'В третьей: $\\dfrac{7\\pi}{6}$ и $\\dfrac{8\\pi}{6}=\\dfrac{4\\pi}{3}$.',
      },
      {
        tochki: [
          [5, 3],
          [11, 6],
        ],
        text: 'В четвёртой: $\\dfrac{10\\pi}{6}=\\dfrac{5\\pi}{3}$ и $\\dfrac{11\\pi}{6}$.',
      },
    ],
  },
];

/**
 * Три макета деления окружности по шагам: на четверти, пополам, на три
 * части. Каждый шаг добавляет точки и объясняет деление словами.
 */
export function KrugDelenie14() {
  const [m, setM] = useState(0);
  const [shag, setShag] = useState(0);
  const maket = MAKETY[m] as Maket;
  const html = useMemo(() => {
    const novye = maket.shagi.slice(0, shag + 1).flatMap((s) => s.tochki);
    const posledniy = (maket.shagi[shag] as Shag).tochki;
    const tochki: TochkaKruga[] = [
      ...maket.fon.map(([n, d]) => ({ ugol: u(n, d) })),
      ...novye.map(([n, d]) => ({
        ugol: u(n, d),
        akcent: posledniy.some(([a, b]) => a === n && b === d),
      })),
    ];
    return krugHtml({ delenie: maket.delenie, tochki });
  }, [maket, shag]);
  const vybrat = (i: number) => {
    setM(i);
    setShag(0);
  };
  return (
    <div className="z14-inter">
      <div className="z14-inter__knopki" role="group" aria-label="Макет">
        {MAKETY.map((x, i) => (
          <button
            key={x.id}
            type="button"
            className="z14-inter__knopka"
            aria-pressed={i === m}
            onClick={() => vybrat(i)}
          >
            {x.title}
          </button>
        ))}
      </div>
      <div className="z14-inter__krug" dangerouslySetInnerHTML={{ __html: html }} />
      <p className="z14-inter__text" aria-live="polite">
        <Tex text={(maket.shagi[shag] as Shag).text} />
      </p>
      <div className="z14-inter__nav">
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          disabled={shag === 0}
          onClick={() => setShag(shag - 1)}
        >
          Назад
        </button>
        <span className="z14-inter__schet">
          Шаг {shag + 1} из {maket.shagi.length}
        </span>
        <button
          type="button"
          className="btn btn--primary btn--sm"
          disabled={shag === maket.shagi.length - 1}
          onClick={() => setShag(shag + 1)}
        >
          Дальше
        </button>
      </div>
    </div>
  );
}
