/* scripts/lib/indeksy-check.mjs — нижние индексы и ось на рисунках.

   Общие проверки для test:variant-risunki, test:grafiki-podpisi и
   test:stereo-risunki:
   — в подписях нет «буквы с цифрами» строкой (x1, A1, x10): индекс —
     только tspan class="indeks" (lib/risunki/shrifty.js, indeksSvg);
     подстрочные символы Юникода (x₁) тоже не годятся — в шрифтах KaTeX
     их нет;
   — ось x графиков (pr-axes, graph-axis) — сплошная, без
     stroke-dasharray. */

/** Подписи рисунка, где индекс набран строкой. */
export function indeksyStrokoy(svg) {
  const out = [];
  for (const m of svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)) {
    const bezIndeksov = m[1]
      .replace(/<tspan class="indeks"[^>]*>[^<]*<\/tspan>/g, '◦')
      .replace(/<[^>]+>/g, '');
    if (/[A-Za-zα-ω][0-9]/.test(bezIndeksov) || /[₀-₉]/.test(bezIndeksov)) {
      out.push(bezIndeksov.trim());
    }
  }
  return out;
}

/** Ось графика штрихом — ошибка. */
export function osShtrihom(svg) {
  return [...svg.matchAll(/<path class="(?:pr-axes|graph-axis)[" ][^>]*>/g)].some((m) =>
    /stroke-dasharray/.test(m[0]),
  );
}
