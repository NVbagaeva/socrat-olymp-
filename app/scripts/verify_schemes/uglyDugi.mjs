/* scripts/verify_schemes/uglyDugi.mjs — «Углы между хордами и секущими».
   Положения сцены (M внутри и вне круга). Дуги считаются независимо:
   градусная мера дуги XY без двух других точек — через центральный угол.
   Внутри: ∠AMD = (AD + BC)/2; вне: ∠AMD = (AD − BC)/2; вписанные
   ∠ABD = AD/2, ∠CDB = BC/2; внешний угол треугольника BMD. */

import { requireSrc } from '../lib/load-ts.mjs';
import { blizko, proveritEkran, schetchik, ugol, zerno } from './obshchee.mjs';

const ug = (p) => ((Math.atan2(p[1], p[0]) * 180) / Math.PI + 360) % 360;
const norm = (x) => ((x % 360) + 360) % 360;
function duga(x, y, z1, z2) {
  const a = norm(ug(y) - ug(x));
  const vnutri = (z) => norm(ug(z) - ug(x)) < a;
  return !vnutri(z1) && !vnutri(z2) ? a : 360 - a;
}

export function proverit(N = 1000) {
  const { UGLY_DUGI } = requireSrc('lib/zadanie18/skhemy/uglyDugi');
  const { tochkiSekushchih } = requireSrc('lib/zadanie18/skhemy/sekushchie');
  const sch = schetchik('Схема «Углы между хордами и секущими»');
  const rnd = zerno(18008);
  let tesno = 0;
  let vn = 0;
  for (let n = 0; n < N; n += 1) {
    const t = UGLY_DUGI.sluchaynaya(rnd);
    const { M, A, B, C, D, vnutri } = tochkiSekushchih(t);
    if (vnutri) vn += 1;
    const ad = duga(A, D, B, C);
    const bc = duga(B, C, A, D);
    sch.fakt(
      '∠ABD = AD/2, ∠CDB = BC/2',
      blizko(ugol(A, B, D), ad / 2, 1e-6) && blizko(ugol(C, D, B), bc / 2, 1e-6),
    );
    const u = ugol(A, M, D);
    if (vnutri) sch.fakt('хорды: ∠AMD = (AD + BC)/2', blizko(u, (ad + bc) / 2, 1e-6));
    else sch.fakt('секущие: ∠AMD = (AD − BC)/2', blizko(u, (ad - bc) / 2, 1e-6));
    tesno += proveritEkran(
      UGLY_DUGI,
      t,
      rnd,
      sch,
      [[], ['hordy'], ['sekushchie'], ['dok'], ['vpisannyy']][n % 5],
    );
  }
  sch.fakt(
    'сцена: начальное положение допустимо',
    ['M', 'P', 'Q'].every(
      (k) => UGLY_DUGI.ogranichit(k, UGLY_DUGI.nachalo[k], UGLY_DUGI.nachalo) !== null,
    ),
  );
  const plokho = sch.itog();
  console.log(`  M внутри: ${vn} из ${N}; подписи в тесноте: ${tesno}`);
  return { plokho };
}

if (import.meta.url === `file://${process.argv[1]}`)
  process.exit(proverit(Number(process.argv[2] ?? 1000)).plokho === 0 ? 0 : 1);
