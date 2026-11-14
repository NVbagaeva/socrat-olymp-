/* scripts/verify_schemes/generator.mjs — генератор листов №18.

   Лист собирается по адресу из банка тренажёра (lib/zadanie18/gen/list18.ts).
   Проверяется на случайных составах: один адрес — один и тот же лист;
   адрес разбирается обратно без потерь; на листе только задачи
   выбранных типов, без повторов, пока вариантов чисел хватает; замена
   меняет задачу только на своей позиции; ответ на листе учителя — тот
   же, что считает тренажёр; описание листа ученика без ответов;
   чертёж несёт оформление в себе (не зависит от skhemy.css). */

import { requireSrc } from '../lib/load-ts.mjs';
import { schetchik, zerno } from './obshchee.mjs';

export function proverit(N = 200) {
  const { typeset } = requireSrc('lib/tex');
  const { bank18, zapisOtveta18 } = requireSrc('lib/zadanie18/trenazher/bank');
  const { TIPY_18 } = requireSrc('content/zadanie18/trenazher');
  const g = requireSrc('lib/zadanie18/gen/list18');
  const sch = schetchik('Генератор №18');
  const bank = bank18(typeset);
  const otvet = new Map(
    TIPY_18.flatMap((t) =>
      t.varianty.map((p, i) => [`${t.id}#${i + 1}`, zapisOtveta18(t.otvet(p))]),
    ),
  );
  const tipy = TIPY_18.map((t) => t.id);
  const rnd = zerno(18018);
  const DOP = { qr: false, vid: null, data: '', uchitel: 'Багаева Н.В.' };
  for (let n = 0; n < N; n += 1) {
    const k = 1 + Math.floor(rnd() * 4);
    const vybor = [...tipy].sort(() => rnd() - 0.5).slice(0, k);
    const p = {
      sostav: vybor.map((id) => ({ id, n: 1 + Math.floor(rnd() * 2) })),
      variants: 1 + Math.floor(rnd() * 3),
      seed: Math.floor(rnd() * 1e6)
        .toString(36)
        .toUpperCase(),
      zameny: {},
      theme: 'color',
      dop: DOP,
    };
    const a = g.sobratList18(p, bank);
    const b = g.sobratList18(p, bank);
    const kl = (l) => l.poVariantam.map((zs) => zs.map((z) => z.klyuch).join(',')).join('|');
    sch.fakt('один адрес — один лист', kl(a) === kl(b));
    const q = g.parseSheetQuery18(new URLSearchParams(g.sheetQuery18(p)));
    sch.fakt(
      'адрес разбирается обратно',
      g.sheetQuery18(q) === g.sheetQuery18(p) && kl(g.sobratList18(q, bank)) === kl(a),
    );
    const vsego = p.sostav.reduce((s, x) => s + x.n, 0);
    sch.fakt(
      'в каждом варианте все позиции состава',
      a.poVariantam.length === p.variants && a.poVariantam.every((zs) => zs.length === vsego),
    );
    sch.fakt(
      'только задачи выбранных типов',
      a.poVariantam.flat().every((z) => vybor.includes(z.klyuch.split('#')[0])),
    );
    /* Чисел хватает: каждому типу нужно не больше наборов, чем у него есть
       (у всех типов сейчас по три). */
    const naborov = new Map(TIPY_18.map((t) => [t.id, t.varianty.length]));
    const hvataet = p.sostav.every((x) => x.n * p.variants <= naborov.get(x.id));
    const kluchi = a.poVariantam.flat().map((z) => z.klyuch);
    if (hvataet)
      sch.fakt(
        'без повторов, пока чисел хватает',
        new Set(kluchi).size === kluchi.length && a.povtor === 0,
      );
    sch.fakt(
      'ответ учителя = ответ тренажёра',
      a.poVariantam.flat().every((z) => z.answer === otvet.get(z.klyuch)),
    );
    /* Чертёж листа несёт оформление в себе: страница печати может
       не подключать skhemy.css, и без него линии не видны. */
    sch.fakt(
      'чертёж листа с встроенным оформлением',
      a.poVariantam
        .flat()
        .every((x) => x.figureSvg.includes('skh-sam') && x.figureSvg.includes('<style>')),
    );
    /* Замена: первая позиция первого варианта. */
    const poz = a.poVariantam[0][0].pos;
    const z = g.sobratList18({ ...p, zameny: { [poz]: 1 } }, bank);
    const drugie = (l) =>
      l.poVariantam
        .flat()
        .filter((x) => x.pos !== poz)
        .map((x) => `${x.pos}=${x.klyuch}`)
        .join(',');
    sch.fakt('замена трогает только свою позицию', drugie(z) === drugie(a));
    const uch = JSON.stringify(g.sheetSpec18(p, a, 'uchenik'));
    sch.fakt(
      'лист ученика без ответов и решений',
      !uch.includes('sheet-task-answer') && !uch.includes('sheet-steps'),
    );
    const uchit = JSON.stringify(g.sheetSpec18(p, a, 'uchitel'));
    sch.fakt(
      'лист учителя с решениями и ответами',
      uchit.includes('sheet-task-answer') && uchit.includes('sheet-steps'),
    );
  }
  return { plokho: sch.itog() };
}

if (import.meta.url === `file://${process.argv[1]}`)
  process.exit(proverit(Number(process.argv[2] ?? 200)).plokho === 0 ? 0 : 1);
