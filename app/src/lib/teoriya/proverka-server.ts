/**
 * Экземпляры «Проверь себя» для страницы теории: набор формул KaTeX на
 * сервере, ответ — только отпечатком (proverka-seal.ts).
 *
 * На задачу — первый экземпляр с числами теории и ещё девять для
 * «Ещё такое же». Числа собирает генератор (proverka-edinic.ts) с
 * постоянным seed, поэтому страница от сборки к сборке одна и та же.
 */

import { typeset } from '../tex';
import { rngOf } from '../vychisleniya/rng';
import { NABORY_PROVERKI, type NaborProverki, type ZadachaProverki } from './proverka-edinic';
import { sealVarianta, zakryt, type EkzemplyarKlient, type ZadachaKlient } from './proverka-seal';

export const EKZEMPLYAROV = 10;

/** Экземпляр задачи для браузера: вёрстка, отпечаток, закрытые тексты. */
function ekzemplyar(klyuch: string, z: ZadachaProverki): EkzemplyarKlient {
  const verny = z.varianty.findIndex((v) => v.verno);
  const seal = sealVarianta(klyuch, `v${verny}`);
  const razbor = z.razbor.map((s) => `<p class="prv-itog__p">${typeset(s, true)}</p>`).join('');
  return {
    klyuch,
    uslovie: typeset(z.uslovie, true),
    seal,
    razbor: zakryt(razbor, { seal }),
    varianty: z.varianty.map((v, i) => ({
      id: `v${i}`,
      html: typeset(v.tekst, true),
      otklik: zakryt(
        v.verno ? razbor : `<p class="prv-itog__p">${typeset(v.podskazka ?? '', true)}</p>`,
        { seal },
        `v${i}`,
      ),
    })),
  };
}

/**
 * До EKZEMPLYAROV экземпляров на задачу, все с разными условиями: у
 * шаблона с небольшим набором чисел (степени) их меньше — повторять
 * числа в «Ещё такое же» нельзя.
 */
export function zadachiProverki(nabor: NaborProverki): ZadachaKlient[] {
  return NABORY_PROVERKI[nabor].map((sh) => {
    const byli = new Set<string>();
    const ekzemplyary: EkzemplyarKlient[] = [];
    for (let n = 0, t = 0; ekzemplyary.length < EKZEMPLYAROV && t < 400; t += 1) {
      const z = sh.sozdat(rngOf(`${sh.id}|${t}`), n);
      if (byli.has(z.uslovie)) continue;
      byli.add(z.uslovie);
      ekzemplyary.push(ekzemplyar(`${sh.id}#${n}`, z));
      n += 1;
    }
    return { id: sh.id, ekzemplyary };
  });
}
