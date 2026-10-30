/* scripts/verify_schemes/pryamyeUgly.mjs — «Общая сторона и прямые углы».
   Независимые случайные конфигурации: B и M с ∠B = ∠M = 90° (через
   проекцию на окружность с диаметром AC и проверку угла). Факты: B, M на
   окружности с центром в середине AC; OB = AC/2; вписанные углы.
   Сцена: случайные положения, перенос B и M при движении A. */

import { requireSrc } from '../lib/load-ts.mjs';
import { blizko, dist, mid, orient, proveritEkran, schetchik, ugol, zerno } from './obshchee.mjs';

export function proverit(N = 1000) {
  const { PRYAMYE_UGLY } = requireSrc('lib/zadanie18/skhemy/pryamyeUgly');
  const sch = schetchik('Схема «Общая сторона и прямые углы»');
  const rnd = zerno(18006);
  for (let n = 0; n < N; n += 1) {
    const A = [rnd() * 8 - 2, rnd() * 6 - 2];
    const C = [A[0] + 1 + rnd() * 6, A[1] + rnd() * 6 - 3];
    /* B — вершина прямого угла: точка на перпендикуляре, построенном
       через основание высоты на AC (h² = p·q). */
    const ac = dist(A, C);
    const make = (sgn) => {
      const p = (0.1 + rnd() * 0.8) * ac;
      const h = Math.sqrt(p * (ac - p));
      const u = [(C[0] - A[0]) / ac, (C[1] - A[1]) / ac];
      return [A[0] + u[0] * p - u[1] * h * sgn, A[1] + u[1] * p + u[0] * h * sgn];
    };
    const B = make(1);
    const M = make(rnd() < 0.5 ? 1 : -1);
    const O = mid(A, C);
    sch.fakt(
      'построение проверки: ∠ABC = ∠AMC = 90°',
      blizko(ugol(A, B, C), 90, 1e-6) && blizko(ugol(A, M, C), 90, 1e-6),
    );
    sch.fakt(
      'B, M на окружности с центром O, R = AC/2',
      blizko(dist(O, B), ac / 2) && blizko(dist(O, M), ac / 2),
    );
    const odna = Math.sign(orient(A, C, B)) === Math.sign(orient(A, C, M));
    if (dist(B, M) > 1e-3) {
      if (odna) sch.fakt('одна сторона: ∠BAM = ∠BCM', blizko(ugol(B, A, M), ugol(B, C, M), 1e-6));
      else sch.fakt('разные стороны: ∠BAC = ∠BMC', blizko(ugol(B, A, C), ugol(B, M, C), 1e-6));
    }
  }
  let tesno = 0;
  for (let i = 0; i < 400; i += 1) {
    const t = PRYAMYE_UGLY.sluchaynaya(rnd);
    sch.fakt(
      'сцена: ∠B = ∠M = 90°',
      blizko(ugol(t.A, t.B, t.C), 90, 1e-6) && blizko(ugol(t.A, t.M, t.C), 90, 1e-6),
    );
    sch.fakt(
      'сцена: положение допустимо',
      ['A', 'C', 'B', 'M'].every((k) => PRYAMYE_UGLY.ogranichit(k, t[k], t) !== null),
    );
    const q = PRYAMYE_UGLY.ogranichit('A', [t.A[0] + rnd() - 0.5, t.A[1] + rnd() - 0.5], t);
    if (q !== null) {
      const s = PRYAMYE_UGLY.prisposobit({ ...t, A: q }, t, 'A');
      if (s !== null)
        sch.fakt(
          'сцена: тянем A — углы остаются прямыми',
          blizko(ugol(s.A, s.B, s.C), 90, 1e-6) && blizko(ugol(s.A, s.M, s.C), 90, 1e-6),
        );
    }
    tesno += proveritEkran(
      PRYAMYE_UGLY,
      t,
      rnd,
      sch,
      [[], ['okr'], ['mediana'], ['gmt'], ['vpisannye']][i % 5],
    );
  }
  const plokho = sch.itog();
  console.log(`  подписи в тесноте: ${tesno} на 400 экранах`);
  return { plokho };
}

if (import.meta.url === `file://${process.argv[1]}`)
  process.exit(proverit(Number(process.argv[2] ?? 1000)).plokho === 0 ? 0 : 1);
