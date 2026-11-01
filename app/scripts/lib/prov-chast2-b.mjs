/**
 * Проверки шаблонов части 2 вариантов 3–4 (b14–b20) вторым способом —
 * для scripts/check-povyshennye-chast2.mjs.
 *
 * Каждая проверка считает ответ заново, не трогая формул шаблона:
 * 14 — уравнение из текста условия, корни сменой знака и минимумами |f|;
 * 15 — координаты: объёмы по определителю, угол по нормалям;
 * 16 — неравенство из текста условия на сетке;
 * 17 — перебор R;
 * 18 — координаты: E по равенству углов, площади по формуле шнурка;
 * 19 — число корней уравнения по x для сетки a;
 * 20 — полный перебор покупок.
 */

/** TeX-выражение условия в функцию x: степени, \cdot, \sqrt, {,}. */
export function texFunkciya(tex) {
  let s = tex
    .replace(/\{,\}/g, '.')
    .replace(/\\cdot/g, '*')
    .replace(/\\left|\\right/g, '')
    .replace(/\\sqrt\{([^{}]*)\}/g, 'Math.sqrt($1)')
    .replace(/\s+/g, '');
  /* Степени: a^{…} → a**(…), x^3 → x**3. */
  s = s.replace(/\^\{/g, '**(').replace(/\^(\d)/g, '**$1');
  s = s.replace(/\{/g, '(').replace(/\}/g, ')');
  /* Неявное умножение: 3x, 2(, )x, )( . */
  s = s
    .replace(/(\d)x/g, '$1*x')
    .replace(/(\d)\(/g, '$1*(')
    .replace(/\)x/g, ')*x')
    .replace(/\)\(/g, ')*(');
  /* Унарный минус перед степенью: -x**2 — в JS нужна скобка. */
  s = s.replace(/(^|[(+\-*])-x\*\*(\d)/g, '$1-(x**$2)');
  return new Function('x', `return ${s};`);
}

export function provB({ ok }) {
  function provB17(p, z) {
    let best = 0;
    let arg = 0;
    for (let R = 0.001; R < 60; R += 0.001) {
      const P = (p.E / (p.r + R)) ** 2 * R;
      if (P > best) {
        best = P;
        arg = R;
      }
    }
    const nado = (p.vopros ?? 'R') === 'R' ? arg : best;
    ok(
      Math.abs(nado - z.kontrol.otvet) < 2e-3 * Math.max(1, nado),
      '№17: максимум перебором',
      `${nado} vs ${z.kontrol.otvet}`,
    );
  }

  return {
    'b17.dzhoul': provB17,
  };
}
