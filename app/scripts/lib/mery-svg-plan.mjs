/* scripts/lib/mery-svg-plan.mjs — мерки читаемости чертежа движка
   планиметрии (lib/planimetriya/render: готовый SVG, класс pl).

   Тот же смысл, что у mery-chertezha.mjs для движка схем: радиусы
   окружностей (доля размера чертежа и отношение), наименьший угол между
   отрезками с общим концом, наименьшее расстояние между точками (концы
   отрезков и отмеченные точки) — в мм при ширине чертежа shirinaMm. */

const chisla = (s) => s.split(/[ ,]+/).filter(Boolean).map(Number);
const d2 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

export function meryPlanSvg(svg, shirinaMm) {
  const vb = /viewBox="([^"]+)"/.exec(svg);
  const [, , W] = vb ? chisla(vb[1]) : [0, 0, 300];
  const mm = shirinaMm / W;
  const okr = [
    ...svg.matchAll(
      /<circle class="pl-el pl-okruzhnost" cx="([\d.-]+)" cy="([\d.-]+)" r="([\d.]+)"/g,
    ),
  ].map((m) => ({ c: [+m[1], +m[2]], r: +m[3] }));
  const otr = [
    ...svg.matchAll(
      /<path class="pl-el pl-otrezok[^"]*" d="M([\d.-]+) ([\d.-]+)L([\d.-]+) ([\d.-]+)"/g,
    ),
  ].map((m) => [
    [+m[1], +m[2]],
    [+m[3], +m[4]],
  ]);
  const tochki = [
    ...svg.matchAll(/<circle class="pl-el pl-tochka" cx="([\d.-]+)" cy="([\d.-]+)"/g),
  ].map((m) => [+m[1], +m[2]]);
  const xs = [...okr.flatMap((o) => [o.c[0] - o.r, o.c[0] + o.r]), ...otr.flat().map((p) => p[0])];
  const ys = [...okr.flatMap((o) => [o.c[1] - o.r, o.c[1] + o.r]), ...otr.flat().map((p) => p[1])];
  const razmer = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 1);
  const rs = okr.map((o) => o.r);
  const minR = rs.length ? Math.min(...rs) / razmer : null;
  const otnR = rs.length ? Math.max(...rs) / Math.min(...rs) : 1;
  let minUgol = null;
  for (let i = 0; i < otr.length; i += 1)
    for (let j = i + 1; j < otr.length; j += 1)
      for (const p of otr[i])
        for (const q of otr[j]) {
          if (d2(p, q) > 0.75) continue;
          const a = otr[i][0] === p ? otr[i][1] : otr[i][0];
          const b = otr[j][0] === q ? otr[j][1] : otr[j][0];
          const u = [a[0] - p[0], a[1] - p[1]];
          const w = [b[0] - p[0], b[1] - p[1]];
          const c = (u[0] * w[0] + u[1] * w[1]) / (Math.hypot(...u) * Math.hypot(...w));
          const g = (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI;
          if (g > 1 && (minUgol === null || g < minUgol)) minUgol = g;
        }
  const vse = [...otr.flat(), ...tochki];
  const raznye = vse.filter((p, i) => vse.findIndex((q) => d2(p, q) < 0.75) === i);
  let minTochki = null;
  for (let i = 0; i < raznye.length; i += 1)
    for (let j = i + 1; j < raznye.length; j += 1) {
      const d = d2(raznye[i], raznye[j]) * mm;
      if (minTochki === null || d < minTochki) minTochki = d;
    }
  return { minR, otnR, minUgol, minTochki };
}
