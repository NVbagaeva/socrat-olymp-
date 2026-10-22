import { useId } from 'react';
import { katex } from '@/lib/graph/katex';
import { geom16, type Chertezh16 as Spec, type Podpis16 } from '@/lib/zadanie16/chertezh';

/** Подпись KaTeX, набранная там, где отрисован чертёж (на сборке). */
function texHtml(tex: string): string {
  return katex.renderToString(tex, { throwOnError: true });
}

const R = 6;
/** Узоры штриховки: у каждой прямой системы свой цвет и наклон. */
const UZORY = [
  { id: 's0', ugol: 45, klass: 'z16-ch__hatch' },
  { id: 's1', ugol: -45, klass: 'z16-ch__hatch z16-ch__hatch--2' },
  { id: 's2', ugol: 45, klass: 'z16-ch__hatch z16-ch__hatch--3' },
  { id: 'it', ugol: 45, klass: 'z16-ch__hatch z16-ch__hatch--itog' },
] as const;

/**
 * Чертёж задания №16: числовая прямая метода интервалов, система
 * (прямые друг под другом и пересечение) или эскиз параболы. Линии,
 * точки и штриховка — SVG; числа, знаки и имена осей — KaTeX поверх
 * рисунка, каждая подпись в своей рамке из движка (рамки не
 * пересекаются — это проверяет scripts/check-zadanie16.mjs).
 * Геометрия — lib/zadanie16/chertezh.ts.
 */
export function Chertezh16({ spec, className }: { spec: Spec; className?: string }) {
  const g = geom16(spec);
  /* Штриховке нужен свой id узора: на странице чертежей много. */
  const uid = useId().replace(/:/g, '');
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;
  const polozhenie = (p: Podpis16) => {
    const r = p.ramka;
    const cx = (r.x1 + r.x2) / 2;
    const cy = (r.y1 + r.y2) / 2;
    if (p.vid === 'uslovie' || (p.vid === 'os' && g.oy && p.tex === 'y')) {
      return { left: pct(r.x1, g.w), top: pct(cy, g.h), transform: 'translate(0, -50%)' };
    }
    if (p.vid === 'os') {
      return { left: pct(r.x2, g.w), top: pct(r.y1, g.h), transform: 'translate(-100%, 0)' };
    }
    if (p.vid === 'chislo') {
      return { left: pct(cx, g.w), top: pct(r.y1, g.h), transform: 'translate(-50%, 0)' };
    }
    return { left: pct(cx, g.w), top: pct(cy, g.h), transform: 'translate(-50%, -50%)' };
  };
  return (
    <figure
      className={`z16-ch${className ? ` ${className}` : ''}`}
      role="img"
      aria-label={g.opisanie}
    >
      <svg
        className="z16-ch__svg"
        viewBox={`0 0 ${g.w} ${g.h}`}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          {UZORY.map((u) => (
            <pattern
              key={u.id}
              id={`${uid}-${u.id}`}
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
              patternTransform={`rotate(${u.ugol})`}
            >
              <line x1="0" y1="0" x2="0" y2="8" className={u.klass} />
            </pattern>
          ))}
        </defs>
        {g.napravlyayushchie.map((n, i) => (
          <line key={i} className="z16-ch__punktir" x1={n.x} y1={n.y1} x2={n.x} y2={n.y2} />
        ))}
        {g.ryady.map((r, ri) =>
          r.shtrikh.map((s, i) => {
            const uzor = r.itog ? 'it' : s.sloy === 1 ? 's1' : `s${r.tsvet}`;
            return (
              <rect
                key={`${ri}-${i}`}
                x={s.x1}
                y={r.osY - s.vys}
                width={Math.max(0, s.x2 - s.x1)}
                height={s.vys}
                fill={`url(#${uid}-${uzor})`}
              />
            );
          }),
        )}
        {g.dugi.map((d, i) => (
          <path key={i} className="z16-ch__duga" d={d} />
        ))}
        {g.krivaya === undefined ? null : <path className="z16-ch__krivaya" d={g.krivaya} />}
        {g.oy === undefined ? null : (
          <>
            <line className="z16-ch__os" x1={g.oy.x} y1={g.oy.y1} x2={g.oy.x} y2={g.oy.y2 + 2} />
            <path
              className="z16-ch__strelka"
              d={`M${g.oy.x - 6} ${g.oy.y2 + 12}L${g.oy.x} ${g.oy.y2}L${g.oy.x + 6} ${g.oy.y2 + 12}`}
            />
          </>
        )}
        {g.strelkaVniz === undefined ? null : (
          <>
            <line
              className="z16-ch__vniz"
              x1={g.strelkaVniz.x}
              y1={g.strelkaVniz.y1}
              x2={g.strelkaVniz.x}
              y2={g.strelkaVniz.y2 - 2}
            />
            <path
              className="z16-ch__vniz"
              d={`M${g.strelkaVniz.x - 6} ${g.strelkaVniz.y2 - 10}L${g.strelkaVniz.x} ${g.strelkaVniz.y2}L${g.strelkaVniz.x + 6} ${g.strelkaVniz.y2 - 10}`}
            />
          </>
        )}
        {g.ryady.map((r, ri) => (
          <g key={ri} className={r.itog ? 'z16-ch__ryad z16-ch__ryad--itog' : 'z16-ch__ryad'}>
            <line className="z16-ch__os" x1={2} y1={r.osY} x2={g.w - 6} y2={r.osY} />
            <path
              className="z16-ch__strelka"
              d={`M${g.w - 16} ${r.osY - 6}L${g.w - 4} ${r.osY}L${g.w - 16} ${r.osY + 6}`}
            />
            {r.tochki.map((t, i) => (
              <circle
                key={i}
                className={
                  t.zakrashena ? 'z16-ch__tochka' : 'z16-ch__tochka z16-ch__tochka--vykolota'
                }
                cx={t.cx}
                cy={r.osY}
                r={R}
              />
            ))}
          </g>
        ))}
      </svg>
      {g.podpisi.map((p, i) => (
        <span
          key={i}
          className={`z16-ch__podpis z16-ch__podpis--${p.vid}`}
          style={polozhenie(p)}
          dangerouslySetInnerHTML={{ __html: texHtml(p.tex) }}
        />
      ))}
    </figure>
  );
}
