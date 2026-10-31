/* scripts/verify_schemes/sekushchie.mjs — схема «Две секущие».

   N случайных допустимых положений (M вне круга и внутри): A, B, C, D
   на окружности; вне — A, B на луче MA и MA > MB, C, D на луче MD и
   MD > MC; внутри — M между A и B и между C и D. Дальше:
   ∠MCB = ∠MAD, ∠MBC = ∠MDA; △BMC ∼ △DMA (стороны пропорциональны);
   MA·MB = MC·MD; вне — ABCD вписанный выпуклый, ∠BAD + ∠BCD = 180°;
   внутри — ∠BMC = ∠DMA (вертикальные), ∠DCB = ∠BAD. Плюс экран.

   Запуск: node scripts/verify_schemes/sekushchie.mjs [N] */

import { requireSrc } from '../lib/load-ts.mjs';
import { blizko, dist, orient, proveritEkran, schetchik, ugol, zerno } from './obshchee.mjs';

export function proverit(N = 1000) {
  const { SEKUSHCHIE, tochkiSekushchih } = requireSrc('lib/zadanie18/skhemy/sekushchie');
  const sch = schetchik('Схема «Две секущие»');
  const rnd = zerno(18004);
  const R = 3;
  let tesno = 0;
  let vnutri = 0;
  let n = 0;
  while (n < N) {
    const t = SEKUSHCHIE.sluchaynaya(rnd);
    n += 1;
    const { M, A, B, C, D, vnutri: vn } = tochkiSekushchih(t);
    if (vn) vnutri += 1;
    const tag = `M=${M.map((x) => x.toFixed(3))} P=${t.P.map((x) => x.toFixed(3))} Q=${t.Q.map((x) => x.toFixed(3))}`;
    const O = [0, 0];
    sch.fakt(
      'построение: A, B, C, D на окружности',
      [A, B, C, D].every((p) => blizko(dist(O, p), R)),
      tag,
    );
    sch.fakt(
      'построение: M, B, A и M, C, D на прямых',
      Math.abs(orient(M, A, B)) < 1e-6 && Math.abs(orient(M, D, C)) < 1e-6,
      tag,
    );
    const ma = dist(M, A);
    const mb = dist(M, B);
    const mc = dist(M, C);
    const md = dist(M, D);
    if (vn) {
      sch.fakt(
        'внутри: M между A и B, между C и D',
        blizko(ma + mb, dist(A, B)) && blizko(mc + md, dist(C, D)),
        tag,
      );
      sch.fakt(
        'внутри: ∠BMC = ∠DMA (вертикальные)',
        blizko(ugol(B, M, C), ugol(D, M, A), 1e-6),
        tag,
      );
      sch.fakt(
        'внутри: ∠DCB = ∠BAD (одна дуга BD)',
        blizko(ugol(D, C, B), ugol(B, A, D), 1e-6),
        tag,
      );
    } else {
      sch.fakt(
        'вне: B между M и A, C между M и D',
        blizko(mb + dist(B, A), ma) && blizko(mc + dist(C, D), md),
        tag,
      );
      sch.fakt('вне: ∠BAD + ∠BCD = 180°', blizko(ugol(B, A, D) + ugol(B, C, D), 180, 1e-6), tag);
    }
    sch.fakt('∠MCB = ∠MAD', blizko(ugol(M, C, B), ugol(M, A, D), 1e-6), tag);
    sch.fakt('∠MBC = ∠MDA', blizko(ugol(M, B, C), ugol(M, D, A), 1e-6), tag);
    sch.fakt(
      '△BMC ∼ △DMA: MB/MD = MC/MA = BC/DA',
      blizko(mb / md, mc / ma) && blizko(mc / ma, dist(B, C) / dist(D, A)),
      tag,
    );
    sch.fakt('MA·MB = MC·MD', blizko(ma * mb, mc * md), tag);
    /* Степень точки: |MO² − R²|. */
    sch.fakt('MA·MB = |MO² − R²|', blizko(ma * mb, Math.abs(dist(M, O) ** 2 - R * R)), tag);
    const lit = [[], ['podobie'], ['proizv'], ['hordy'], ['vpisannyy']][n % 5];
    tesno += proveritEkran(SEKUSHCHIE, t, rnd, sch, lit);
    sch.fakt(
      'случайное положение допустимо',
      ['M', 'P', 'Q'].every((k) => SEKUSHCHIE.ogranichit(k, t[k], t) !== null),
    );
  }
  sch.fakt(
    'начальное положение допустимо',
    ['M', 'P', 'Q'].every(
      (k) => SEKUSHCHIE.ogranichit(k, SEKUSHCHIE.nachalo[k], SEKUSHCHIE.nachalo) !== null,
    ),
  );
  const plokho = sch.itog();
  console.log(`  M внутри круга: ${vnutri} из ${N}; подписи в тесноте: ${tesno} на ${N} экранах`);
  return { plokho, tesno, ekranov: N };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(proverit(Number(process.argv[2] ?? 1000)).plokho === 0 ? 0 : 1);
}
