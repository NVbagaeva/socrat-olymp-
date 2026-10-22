/**
 * Данные печатного листа №3 — собираются на сборке, по разделу.
 *
 * Лист собирается в браузере по адресу (раздел, число задач, seed),
 * поэтому странице печати нужен весь раздел. Ответы и разборы закрыты
 * отпечатком, как в тренажёре (secret.ts): открывает их только лист
 * учителя. Чертежи — сценарии: статичный SVG рисуется из того же
 * сценария, что и интерактивный чертёж.
 */

import { szhat } from '../chertezh3';
import { ru } from './format';
import { chertezhVarianta, estScenariy } from './chertezhi';
import type { Razdel } from './index';
import { klyuchZadachi, sealAnswer, sealText } from './secret';

export interface ZadachaPechati {
  /** «P03-41#3». */
  klyuch: string;
  prototip: string;
  nazvanie: string;
  /** Условие: текст с формулами $…$. */
  uslovie: string;
  seal: string;
  /** Закрытые: сценарий (JSON), шаги (строки через \n), ответ. */
  scena: string;
  shagi: string;
  otvet: string;
}

export function dannyePechati(razdel: Razdel): ZadachaPechati[] {
  return razdel.prototipy.filter(estScenariy).flatMap((p) =>
    p.varianty.map((v) => {
      const ch = chertezhVarianta(p, v);
      if (ch === null || ch.oshibki.length > 0) {
        throw new Error(`Чертёж ${p.id}#${v.n} не годен`);
      }
      const otvet = p.otvet(v.params);
      const seal = sealAnswer(otvet, klyuchZadachi(p.id, v.n));
      return {
        klyuch: `${p.id}#${v.n}`,
        prototip: p.id,
        nazvanie: p.nazvanie,
        uslovie: p.uslovie(v.params),
        seal,
        scena: sealText(JSON.stringify(szhat(ch.scenariy)), seal),
        shagi: sealText(
          p
            .shagi(v.params)
            .map((s) => s.text.replace(/\n/g, ' '))
            .join('\n'),
          seal,
        ),
        otvet: sealText(ru(otvet), seal),
      };
    }),
  );
}
