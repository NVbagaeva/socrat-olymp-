/**
 * Рисунок теории «мгновенная скорость»: точка движется по прямой.
 *
 * Не график, а луч движения: начало O, положение M в момент t и M₁ в
 * момент t + Δt; под лучом — размерные линии s(t) и s(t + Δt), над ним —
 * приращение Δs между M и M₁. Тема, шрифты и проверка подписей — те же,
 * что у движка графиков (render.ts): подписи не наезжают друг на друга и
 * на точки, это проверяет otchet.problems.
 */

import { THEME, esc, px, svgText, textWidth } from '@/lib/graph/renderer.js';

export interface OpciiLucha {
  /** Где точка M, в единицах луча (от O). */
  s: number;
  /** Приращение пути Δs, в тех же единицах (больше нуля). */
  ds: number;
  alt?: string;
}

export interface OtchetLucha {
  width: number;
  height: number;
  problems: string[];
}

const EDINICA = 40;
const LEVO = 34;
const DLINA = 12;
const LINIYA_Y = 62;
const RAZMER = { size: 15, weight: 600 } as const;

interface Ramka {
  id: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

function peresekayutsya(a: Ramka, b: Ramka): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

export function renderLuchDvizheniya(o: OpciiLucha, otchet?: OtchetLucha): string {
  const width = LEVO * 2 + DLINA * EDINICA;
  const height = 150;
  const x = (u: number) => LEVO + u * EDINICA;
  const xO = x(0);
  const xM = x(o.s);
  const xM1 = x(o.s + o.ds);
  const y0 = LINIYA_Y;
  const ink = THEME.colors.axis;
  const curve = THEME.colors.lineA;
  const aux = THEME.colors.accent;
  const ramki: Ramka[] = [];
  const parts: string[] = [];
  const podpis = (
    id: string,
    text: string,
    cx: number,
    cy: number,
    fill: string,
    opts: { size?: number; italic?: boolean } = {},
  ) => {
    const size = opts.size ?? RAZMER.size;
    const w = textWidth(text, size);
    ramki.push({
      id,
      left: cx - w / 2,
      right: cx + w / 2,
      top: cy - size * 0.8,
      bottom: cy + size * 0.2,
    });
    parts.push(
      svgText(text, cx, cy, 'middle', {
        size,
        weight: RAZMER.weight,
        fill,
        style: opts.italic === true ? 'italic' : undefined,
      }),
    );
  };
  /* Размерная линия со стрелками на концах и засечками. */
  const razmer = (x1: number, x2: number, y: number, color: string) => {
    const a = 6;
    parts.push(
      `<path d="M${px(x1)} ${px(y - 7)}V${px(y + 7)}M${px(x2)} ${px(y - 7)}V${px(y + 7)}M${px(x1)} ${px(y)}H${px(x2)}" fill="none" stroke="${color}" stroke-width="1.6"/>`,
    );
    if (x2 - x1 > 3 * a) {
      parts.push(
        `<path d="M${px(x1)} ${px(y)}l${a} ${-a / 2}v${a}ZM${px(x2)} ${px(y)}l${-a} ${-a / 2}v${a}Z" fill="${color}"/>`,
      );
    }
  };

  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${px(width)} ${px(height)}" width="${px(width)}" height="${px(height)}" class="pr pr-luch" role="img" aria-label="${esc(o.alt ?? 'Луч движения: точки O, M и M₁, отрезки s(t), s(t + Δt) и Δs')}" style="max-width:100%;height:auto">`,
    `<rect x="0" y="0" width="${px(width)}" height="${px(height)}" fill="${THEME.colors.bg}"/>`,
  );
  /* Луч движения со стрелкой. */
  const konec = width - 12;
  parts.push(
    `<path d="M${px(xO - 16)} ${px(y0)}H${px(konec - 10)}" stroke="${ink}" stroke-width="${THEME.width.axis}" fill="none"/>`,
    `<path d="M${px(konec)} ${px(y0)}l-12 -5v10Z" fill="${ink}"/>`,
  );
  /* Путь от M до M₁ — жирно, цветом кривой. */
  parts.push(
    `<path d="M${px(xM)} ${px(y0)}H${px(xM1)}" stroke="${curve}" stroke-width="5" stroke-linecap="round" fill="none"/>`,
  );
  /* Точки. */
  for (const [cx, fill] of [
    [xO, ink],
    [xM, curve],
    [xM1, curve],
  ] as const) {
    parts.push(
      `<circle cx="${px(cx)}" cy="${px(y0)}" r="5" fill="${fill}" stroke="${THEME.colors.halo}" stroke-width="1.8"/>`,
    );
    ramki.push({ id: 'точка', left: cx - 5, right: cx + 5, top: y0 - 5, bottom: y0 + 5 });
  }
  podpis('O', 'O', xO, y0 - 14, ink, { size: 17, italic: true });
  /* M и M₁ подписаны над точками; если точки близко, M₁ сдвигается вправо. */
  const blizko = xM1 - xM < 34;
  podpis('M', 'M', xM - (blizko ? 8 : 0), y0 - 14, curve, { size: 17, italic: true });
  podpis('M₁', 'M₁', xM1 + (blizko ? 14 : 0), y0 - 14, curve, { size: 17, italic: true });
  /* Δs — над лучом, выше подписей точек. */
  const yDs = y0 - 38;
  razmer(xM, xM1, yDs, aux);
  podpis('Δs', 'Δs', (xM + xM1) / 2, yDs - 8, aux, { italic: true });
  /* s(t) и s(t + Δt) — под лучом. */
  const yS = y0 + 30;
  const yS1 = y0 + 64;
  razmer(xO, xM, yS, ink);
  razmer(xO, xM1, yS1, ink);
  parts.push(
    `<path d="M${px(xM)} ${px(y0 + 6)}V${px(yS)}M${px(xM1)} ${px(y0 + 6)}V${px(yS1)}" stroke="${ink}" stroke-width="1.2" stroke-dasharray="4 4" fill="none"/>`,
  );
  podpis('s(t)', 's(t)', (xO + xM) / 2, yS - 6, ink, { italic: true });
  podpis('s(t + Δt)', 's(t + Δt)', (xO + xM1) / 2, yS1 - 6, ink, { italic: true });
  parts.push('</svg>');

  if (otchet !== undefined) {
    otchet.width = width;
    otchet.height = height;
    otchet.problems = [];
    const podpisi = ramki.filter((r) => r.id !== 'точка');
    for (let i = 0; i < podpisi.length; i += 1) {
      for (let j = i + 1; j < podpisi.length; j += 1) {
        if (peresekayutsya(podpisi[i] as Ramka, podpisi[j] as Ramka)) {
          otchet.problems.push(`подписи «${podpisi[i]?.id}» и «${podpisi[j]?.id}» пересекаются`);
        }
      }
      for (const t of ramki.filter((r) => r.id === 'точка')) {
        if (peresekayutsya(podpisi[i] as Ramka, t)) {
          otchet.problems.push(`подпись «${podpisi[i]?.id}» лежит на точке`);
        }
      }
      const p = podpisi[i] as Ramka;
      if (p.left < 0 || p.right > width || p.top < 0 || p.bottom > height) {
        otchet.problems.push(`подпись «${p.id}» за краем рисунка`);
      }
    }
  }
  return parts.join('');
}
