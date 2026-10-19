import { useId } from 'react';
import { katex } from '@/lib/graph/katex';
import { geom16, type Chertezh16 as Spec } from '@/lib/zadanie16/chertezh';

/** Подпись KaTeX, набранная там, где отрисован чертёж (на сборке). */
function texHtml(tex: string): string {
  return katex.renderToString(tex, { throwOnError: true });
}

const R = 6;

/**
 * Чертёж задания №16: числовая прямая метода интервалов или эскиз
 * параболы. Линии, точки и штриховка — SVG; числа, знаки и имя оси —
 * KaTeX поверх рисунка, по долям ширины и высоты: формула остаётся
 * формулой при любом масштабе. Геометрия — lib/zadanie16/chertezh.ts.
 */
export function Chertezh16({ spec, className }: { spec: Spec; className?: string }) {
  const g = geom16(spec);
  /* Штриховке нужен свой id узора: на странице чертежей много. */
  const uid = useId().replace(/:/g, '');
  const vys = [26, 16] as const;
  const left = (x: number) => `${(x / g.w) * 100}%`;
  const top = (y: number) => `${(y / g.h) * 100}%`;
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
          <pattern
            id={`${uid}-s0`}
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="8" className="z16-ch__hatch" />
          </pattern>
          <pattern
            id={`${uid}-s1`}
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-45)"
          >
            <line x1="0" y1="0" x2="0" y2="8" className="z16-ch__hatch z16-ch__hatch--2" />
          </pattern>
        </defs>
        {g.shtrikh.map((s, i) => (
          <rect
            key={i}
            className={`z16-ch__zona z16-ch__zona--${s.sloy}`}
            x={s.x1}
            y={g.osY - vys[s.sloy]}
            width={Math.max(0, s.x2 - s.x1)}
            height={vys[s.sloy]}
            fill={`url(#${uid}-s${s.sloy})`}
          />
        ))}
        {g.krivaya === undefined ? null : <path className="z16-ch__krivaya" d={g.krivaya} />}
        <line className="z16-ch__os" x1={2} y1={g.osY} x2={g.strelkaX - 2} y2={g.osY} />
        <path
          className="z16-ch__strelka"
          d={`M${g.strelkaX - 12} ${g.osY - 6}L${g.strelkaX} ${g.osY}L${g.strelkaX - 12} ${g.osY + 6}`}
        />
        {g.tochki.map((t) => (
          <circle
            key={t.tex}
            className={t.zakrashena ? 'z16-ch__tochka' : 'z16-ch__tochka z16-ch__tochka--vykolota'}
            cx={t.cx}
            cy={g.osY}
            r={R}
          />
        ))}
      </svg>
      {g.tochki.map((t) => (
        <span
          key={t.tex}
          className="z16-ch__podpis"
          style={{ left: left(t.cx), top: top(g.osY + 12) }}
          dangerouslySetInnerHTML={{ __html: texHtml(t.tex) }}
        />
      ))}
      {g.znaki.map((z, i) => (
        <span
          key={i}
          className={`z16-ch__znak z16-ch__znak--${z.znak === '+' ? 'plus' : 'minus'}`}
          style={{ left: left(z.cx), top: top(z.cy) }}
          dangerouslySetInnerHTML={{ __html: texHtml(z.znak) }}
        />
      ))}
      <span
        className="z16-ch__peremennaya"
        style={{ left: left(g.strelkaX - 6), top: top(g.osY + 12) }}
        dangerouslySetInnerHTML={{ __html: texHtml(g.peremennaya) }}
      />
    </figure>
  );
}
