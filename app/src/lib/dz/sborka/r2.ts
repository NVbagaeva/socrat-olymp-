/**
 * №2 в ДЗ — раздел-генератор (lib/dz/sborka/generator.ts): задачи по
 * прототипу и зерну, рисунок — координатная плоскость (у ученика без
 * катетов, в разборе — с ними); опорные — микро-задачи блоков, аналог
 * с новым зерном.
 */

import type { Risunok } from '@/lib/vektory/types';
import { sozdatGenerator } from './generator';

const gen2 = sozdatGenerator<Risunok>({
  moduli: async () => {
    const [g, r, b, pg, pb] = await Promise.all([
      import('@/lib/vektory/generate'),
      import('@/lib/vektory/render'),
      import('@/lib/vektory/bank'),
      import('@/lib/vektory/prep/generate'),
      import('@/lib/vektory/prep/bloki'),
    ]);
    return {
      generate: (proto, seed) => g.generate(proto, seed),
      risunok: (ris, rezhim) =>
        r.renderVectorPlane(rezhim === 'uchitel' ? { ...ris, hints: true } : ris),
      bank: (proto) => b.BANK.find((e) => e.prototype === proto)?.variants.map((v) => v.seed) ?? [],
      opornaya: (id, seed) => {
        const t = pg.generateMikro(id, seed);
        return {
          uslovie: t.uslovie,
          risunok: t.risunok,
          otvet: t.otvet,
          razbor: t.razbor,
          ...(t.vybory === undefined ? {} : { varianty: t.vybory }),
        };
      },
      mikro: (id) => {
        const m = pb.mikroById(id);
        return m === undefined
          ? undefined
          : { nazvanie: m.nazvanie, formula: m.formula, vybor: m.answerType === 'choice' };
      },
    };
  },
  istochnik: (proto, seed, izBanka) => (izBanka ? `банк ${proto} ${seed}` : 'новая'),
});

export const trenazher2 = gen2.trenazher;
export const zadacha2 = gen2.zadacha;
export const analogZadachi2 = gen2.analogZadachi;
export const opornye2 = gen2.opornyeAsync;
export const gen2Moduli = gen2.moduli;
export const opornaya2 = gen2.opornaya;
