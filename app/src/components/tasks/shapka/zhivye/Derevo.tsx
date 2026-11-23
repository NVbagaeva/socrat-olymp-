'use client';

import { useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { ZhivoyProps } from './tip';
import { Formula, ZhivoyKoren, type Tochka } from './obshchee';
import { Kubik, useBrosok } from './kubik';
import { useVrashchenie } from './tri';
import './kost.css';

/** Узлы дерева — по картинке (квадрат 260). */
const KOREN: Tochka = [44, 116];
const UZLY: Tochka[] = [
  [141, 66],
  [140, 147],
];
const LISTYA: Tochka[] = [
  [216, 34],
  [216, 79],
  [216, 116],
  [217, 156],
];
/** Вероятности: первый шаг и второй из каждого узла. */
const P1 = ['0{,}6', '0{,}4'];
const P1N = [0.6, 0.4];
const P2 = [
  ['0{,}3', '0{,}7'],
  ['0{,}5', '0{,}5'],
];
const P2N = [
  [0.3, 0.7],
  [0.5, 0.5],
];
const P_TEKST = (s: string) => s.replace('{,}', ',');

function krivaya(p: Tochka, q: Tochka): string {
  const dx = (q[0] - p[0]) / 2;
  return `M${p[0]} ${p[1]}C${p[0] + dx} ${p[1]} ${q[0] - dx} ${q[1]} ${q[0]} ${q[1]}`;
}

const chislo2 = (v: number) => (Math.round(v * 1000) / 1000).toString().replace('.', '{,}');

function Uzel({ p, r, or }: { p: Tochka; r: number; or: boolean }) {
  return (
    <g aria-hidden="true">
      <circle
        cx={p[0]}
        cy={p[1]}
        r={r}
        fill={or ? 'url(#der-or)' : 'url(#der-shar)'}
        stroke={or ? '#e07a2f' : 'rgb(61 121 224 / 0.6)'}
        strokeWidth={1.4}
      />
      <ellipse
        cx={p[0] - r * 0.35}
        cy={p[1] - r * 0.38}
        rx={r * 0.33}
        ry={r * 0.2}
        fill="rgb(255 255 255 / 0.85)"
      />
    </g>
  );
}

/**
 * №5 «Вероятность: сложная»: дерево вероятностей и игральная кость.
 * Нажатие на ветку (лист) подсвечивает путь от корня, на рёбрах —
 * вероятности, внизу — их произведение. Кость можно покрутить и
 * подбросить нажатием. Стрелки вверх и вниз выбирают путь, влево и
 * вправо крутят кость, Enter подбрасывает её.
 */
export default function Derevo({ label, tiho, avtofokus }: ZhivoyProps) {
  const [list, setList] = useState(3);
  const vr = useVrashchenie({ azimut: 30, vysota: 32 }, tiho);
  const { ugly, pod, letit, brosit } = useBrosok(tiho, { rx: 0, ry: 0, rz: 12 });
  const [vypalo, setVypalo] = useState<number | null>(null);
  const uzel = list < 2 ? 0 : 1;
  const vetka = list % 2;

  const brosok = () => {
    if (letit) return;
    const k = 1 + Math.floor(Math.random() * 6);
    setVypalo(null);
    brosit(k, () => setVypalo(k));
  };

  const naStrelku = (d: Tochka, e: KeyboardEvent) => {
    if (d[1] !== 0) setList((v) => Math.max(0, Math.min(3, v + Math.sign(d[1]))));
    else vr.naStrelku(d, e);
  };

  const onKostUp = (e: PointerEvent<HTMLDivElement>) => {
    vr.pointer.onPointerUp(e);
    if (!vr.bylPovorot()) brosok();
  };

  const rebra = [
    ...UZLY.map((u, i) => ({
      id: `k${i}`,
      p: KOREN,
      q: u,
      tex: P1[i]!,
      put: i === uzel,
      l: i * 2 + 1,
    })),
    ...LISTYA.map((l, i) => {
      const u = i < 2 ? 0 : 1;
      return {
        id: `l${i}`,
        p: UZLY[u]!,
        q: l,
        tex: P2[u]![i % 2]!,
        put: i === list,
        l: i,
      };
    }),
  ];
  const proizv = P1N[uzel]! * P2N[uzel]![vetka]!;

  return (
    <ZhivoyKoren label={label} avtofokus={avtofokus} naStrelku={naStrelku} naEnter={brosok}>
      <svg viewBox="0 0 260 260" aria-hidden="true">
        <defs>
          <radialGradient id="der-shar" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="0.6" stopColor="#c6dbfa" stopOpacity="0.75" />
            <stop offset="1" stopColor="#7aa3e6" stopOpacity="0.8" />
          </radialGradient>
          <radialGradient id="der-or" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#fff3e4" />
            <stop offset="0.6" stopColor="#ffc27a" />
            <stop offset="1" stopColor="#e07a2f" />
          </radialGradient>
        </defs>
        {rebra.map((r) => (
          <g key={r.id}>
            <path
              d={krivaya(r.p, r.q)}
              fill="none"
              stroke={r.put ? 'rgb(255 190 120 / 0.55)' : 'rgb(190 212 248 / 0.7)'}
              strokeWidth={9}
              strokeLinecap="round"
            />
            <path
              className="derevo__lin"
              d={krivaya(r.p, r.q)}
              fill="none"
              stroke={r.put ? '#f08a2c' : 'var(--blue-600)'}
              strokeWidth={r.put ? 3 : 1.8}
              strokeLinecap="round"
            />
          </g>
        ))}
        {rebra.map((r) => (
          <text
            key={`t${r.id}`}
            className={`derevo__p ${r.put ? 'is-put' : ''}`}
            x={(r.p[0] + r.q[0]) / 2}
            y={(r.p[1] + r.q[1]) / 2 - 7}
            textAnchor="middle"
          >
            {P_TEKST(r.tex)}
          </text>
        ))}
        <Uzel p={KOREN} r={13} or={false} />
        {UZLY.map((u, i) => (
          <Uzel key={i} p={u} r={10} or={i === uzel} />
        ))}
        {LISTYA.map((l, i) => (
          <Uzel key={i} p={l} r={10} or={i === list} />
        ))}
        {/* Ветки нажимаются: невидимая широкая полоса по ребру к листу. */}
        {LISTYA.map((l, i) => {
          const u = UZLY[i < 2 ? 0 : 1]!;
          return (
            <g
              key={`h${i}`}
              className="derevo__vetka"
              onClick={() => setList(i)}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <path className="derevo__hit" d={krivaya(u, l)} />
              <circle cx={l[0]} cy={l[1]} r={14} fill="transparent" />
            </g>
          );
        })}
        <ellipse cx={168} cy={244} rx={40 - pod * 10} ry={7} fill="rgb(31 95 208 / 0.12)" />
        <Kubik b={vr.b} ugly={ugly} m={22} c={[168, 208]} pod={pod} podsvetka={vypalo} />
      </svg>
      <div
        className="zhv--3d"
        style={{ position: 'absolute', left: '50%', top: '66%', width: '32%', height: '34%' }}
        onPointerDown={vr.pointer.onPointerDown}
        onPointerMove={vr.pointer.onPointerMove}
        onPointerUp={onKostUp}
        onPointerEnter={vr.pointer.onPointerEnter}
        onPointerLeave={vr.pointer.onPointerLeave}
        aria-hidden="true"
      />
      <span className="zhv__plashka" style={{ left: '30%' }}>
        <Formula tex={`P=${P1[uzel]}\\cdot${P2[uzel]![vetka]}=${chislo2(proizv)}`} />
      </span>
    </ZhivoyKoren>
  );
}
