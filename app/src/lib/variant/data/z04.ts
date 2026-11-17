/**
 * Данные заданий №4 и №5 для «Собрать вариант» (серверная часть,
 * маршруты /variant/dannye/z04.json и z05.json). Закрыто так же, как
 * банк тренажёра (lib/veroyatnost/pool.ts, `bank4Pool`): ответа нет —
 * только его отпечаток с ключом задачи (`sealAnswer`, `klyuchZadachi`),
 * разбор зашифрован этим отпечатком (`sealText`). Состав разбора — как
 * у `zakrytyRazbor` в pool.ts: фраза метода, шаги разбора с ответом
 * жирным в последней формуле (`vydelitOtvet`), ответ строкой; вёрстки
 * выкладок KaTeX и параметров рисунка здесь нет — генератору они не
 * нужны, а с ними данные весили бы мегабайты.
 */

import { BANK_4, BANK_5, otvetUchenika } from '@/lib/veroyatnost/index';
import { vydelitOtvet } from '@/lib/veroyatnost/pool';
import { klyuchZadachi, sealAnswer, sealText } from '@/lib/veroyatnost/secret';
import { dec, type Prototype, type Variant } from '@/lib/veroyatnost/types';
import type { Dannye45, Razbor45, Variant45 } from '../adapters/z04/veroyatnost';

function variant45(prototype: Prototype, variant: Variant): Variant45 {
  const p = variant.params;
  const otvet = otvetUchenika(prototype, p);
  const seal = sealAnswer(otvet, klyuchZadachi(prototype.id, variant.n));
  const shagi = prototype.shagi(p);
  const posledniy = shagi.reduce((k, s, i) => (s.formula === undefined ? k : i), -1);
  const razbor: Razbor45 = {
    metod: prototype.metodika?.fraza(p) ?? '',
    shagi: shagi.map((s, i) =>
      s.formula === undefined
        ? { etap: s.etap, text: s.text }
        : {
            etap: s.etap,
            text: s.text,
            tex: i === posledniy ? vydelitOtvet(s.formula) : s.formula,
          },
    ),
    /* Как в pool.ts: у прототипа с методикой ответ пишет модель (dec). */
    otvet: prototype.metodika === undefined ? String(otvet).replace('.', ',') : dec(otvet),
  };
  return {
    n: variant.n,
    uslovie: prototype.uslovie(p),
    seal,
    razbor: sealText(JSON.stringify(razbor), seal),
  };
}

export function dannyeVeroyatnosti(zadanie: 4 | 5): Dannye45 {
  const bank = zadanie === 4 ? BANK_4 : BANK_5;
  return {
    kinds: bank.map((prototype) => ({
      id: prototype.id,
      title: prototype.nazvanie,
      blok: prototype.blok,
      variants: prototype.varianty.map((v) => variant45(prototype, v)),
    })),
  };
}

export function dannye(): Dannye45 {
  return dannyeVeroyatnosti(4);
}
