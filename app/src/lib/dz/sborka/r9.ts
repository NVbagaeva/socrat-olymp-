/**
 * №9 в ДЗ — раздел-генератор (lib/dz/sborka/generator.ts): задачи по
 * прототипу и зерну, рисунок — график движком раздела (у ученика без
 * построений, в разборе — с ними), подсказка-лесенка вопросов; опорные —
 * микро-задачи блоков, аналог с новым зерном.
 */

import type { Figura } from '@/lib/proizvodnaya/types';
import { sozdatGenerator } from './generator';

const gen9 = sozdatGenerator<Figura>({
  moduli: async () => {
    const [g, r, b, pg, pb] = await Promise.all([
      import('@/lib/proizvodnaya/generate'),
      import('@/lib/proizvodnaya/render'),
      import('@/lib/proizvodnaya/bank'),
      import('@/lib/proizvodnaya/prep/generate'),
      import('@/lib/proizvodnaya/prep/blocks'),
    ]);
    return {
      generate: (proto, seed) => g.generate(proto, seed),
      risunok: (fig, rezhim) =>
        r.renderFigura(fig, { rezhim: rezhim === 'uchitel' ? 'teacher' : 'student' }),
      bank: (proto) => b.BANK.find((e) => e.prototype === proto)?.variants.map((v) => v.seed) ?? [],
      opornaya: (id, seed) => {
        const t = pg.generatePrepById(id, seed);
        const vybor = t.knopki !== undefined && t.knopki.length > 0;
        return {
          uslovie: t.uslovie,
          risunok: t.risunok,
          /* Выбор: номер варианта с единицы (кнопки ученика — те же номера). */
          otvet: vybor ? String(t.otvet + 1) : t.otvet,
          razbor: t.razbor,
          podskazka: t.podskazka.map((q) => ({
            vopros: q.vopros,
            knopki: q.knopki,
            ...(q.itog === undefined ? {} : { itog: q.itog }),
          })),
          ...(vybor
            ? { varianty: (t.knopki ?? []).map((label, i) => ({ number: String(i + 1), label })) }
            : {}),
        };
      },
      mikro: (id) => {
        const m = pb.prepMicroById(id);
        return m === undefined
          ? undefined
          : { nazvanie: m.nazvanie, vybor: m.answerType === 'choice' };
      },
    };
  },
  istochnik: (proto, seed, izBanka) => (izBanka ? `банк ${proto} ${seed}` : 'новая'),
});

export const trenazher9 = gen9.trenazher;
export const zadacha9 = gen9.zadacha;
export const analogZadachi9 = gen9.analogZadachi;
export const opornye9 = gen9.opornyeAsync;
export const gen9Moduli = gen9.moduli;
export const opornaya9 = gen9.opornaya;
