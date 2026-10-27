/**
 * Общие инструменты проверок части 2 вторым способом
 * (prov-chast2-d/e/f.mjs): нули функции перебором, сверка множества
 * ответа с неравенством на сетке, значения серий.
 */

/**
 * Нули φ на [a; b]: смена знака (уточняется делением пополам) и
 * касания — локальные минимумы |φ|, уточнённые золотым сечением.
 */
export function nuli(phi, a, b, shag = 1e-3, tol = 1e-9) {
  const out = [];
  const dobavit = (x) => {
    if (!out.some((y) => Math.abs(y - x) < 1e-6)) out.push(x);
  };
  /* Целое число шагов: последняя точка — ровно b. */
  const nShag = Math.max(1, Math.ceil((b - a) / shag));
  const h = (b - a) / nShag;
  let x0 = a;
  let v0 = phi(x0);
  let vPrev = NaN;
  for (let i = 1; i <= nShag; i += 1) {
    const x = a + i * h;
    const v = phi(x);
    if (Number.isFinite(v0) && Number.isFinite(v)) {
      if (v0 === 0) dobavit(x0);
      else if (v0 * v < 0) {
        let l = x0;
        let r = x;
        for (let i = 0; i < 80; i += 1) {
          const c = (l + r) / 2;
          if (phi(l) * phi(c) <= 0) r = c;
          else l = c;
        }
        dobavit((l + r) / 2);
      } else if (
        Number.isFinite(vPrev) &&
        Math.abs(v0) <= Math.abs(vPrev) &&
        Math.abs(v0) <= Math.abs(v)
      ) {
        /* Минимум |φ| около x0 — уточняем. */
        let l = x0 - h;
        let r = x;
        for (let i = 0; i < 100; i += 1) {
          const m1 = l + (r - l) * 0.382;
          const m2 = l + (r - l) * 0.618;
          if (Math.abs(phi(m1)) < Math.abs(phi(m2))) r = m2;
          else l = m1;
        }
        const xm = (l + r) / 2;
        if (Math.abs(phi(xm)) < tol) dobavit(xm);
      }
    }
    vPrev = v0;
    x0 = x;
    v0 = v;
  }
  return out.sort((p, q) => p - q);
}

/** Множество ответа: [{lo, hi, loZ, hiZ}] числами (null — бесконечность). */
export function chislaMnozh(m, chislo) {
  return m.kuski.map((k) =>
    k.t === 'tochka'
      ? { lo: chislo(k.x), hi: chislo(k.x), loZ: true, hiZ: true }
      : {
          lo: k.lo === '-inf' ? -Infinity : chislo(k.lo),
          hi: k.hi === 'inf' ? Infinity : chislo(k.hi),
          loZ: k.loZakr,
          hiZ: k.hiZakr,
        },
  );
}

export const vMnozh = (ks, x) =>
  ks.some((k) => (k.loZ ? x >= k.lo : x > k.lo) && (k.hiZ ? x <= k.hi : x < k.hi));

/**
 * Сверка: на сетке [a; b] истинность неравенства совпадает с
 * принадлежностью ответу (точки ближе eps к концам пропускаются);
 * концы ответа проверяются отдельно: закрытый — равенство в пределах tol.
 */
export function sverMnozh(ok, where, istina, ks, a, b, shag, eps = 1e-6) {
  const konci = ks.flatMap((k) => [k.lo, k.hi]).filter(Number.isFinite);
  let plokho = 0;
  let pervoe = null;
  for (let x = a; x <= b; x += shag) {
    if (konci.some((c) => Math.abs(c - x) < eps)) continue;
    if (istina(x) !== vMnozh(ks, x)) {
      plokho += 1;
      if (pervoe === null) pervoe = x;
    }
  }
  ok(
    plokho === 0,
    `${where}: множество ответа совпадает с решением на сетке`,
    pervoe === null ? '' : `x=${pervoe}`,
  );
}

/** Серия «… + … n» (буквы k, n, m) — значения при целом параметре. */
export function seriya(razobrat, vychislit, tex, n) {
  const u = razobrat(tex);
  if (u === null) return NaN;
  return vychislit(u, { k: n, n, m: n, pi: Math.PI });
}

/** Тригонометрическое выражение из TeX условия в функцию x. */
export function trigFunkciya(tex) {
  let s = tex
    .replace(/\\left|\\right/g, '')
    .replace(/\\dfrac\{\\pi\}\{(\d+)\}/g, '(Math.PI/$1)')
    .replace(/\\pi/g, 'Math.PI')
    .replace(/\\(sin|cos)\^(\d)x/g, 'Math.$1(x)**$2')
    .replace(/\\(sin|cos)\s*x/g, 'Math.$1(x)')
    .replace(/\\(sin|cos)\(/g, 'Math.$1(')
    .replace(/\s+/g, '');
  s = s.replace(/(\d)Math/g, '$1*Math');
  return new Function('x', `return ${s};`);
}
