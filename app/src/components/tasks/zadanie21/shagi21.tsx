import type { Reshenie21 } from '@/lib/zadanie21/trening/zagruzka';
import type { Shag } from '../steklo';
import type { VoprosPodskazki } from '../trening';
import { otvetTekstom, shagiIzEtapov, voprosyIzRazbora } from '../trening/bank/shagi';

/**
 * Разбор движка (этапы «Шаг 1. Производная» и строки с $…$) шагами
 * «Стеклянной сцены» — общий перевод разбора. Этап «Ответ» на карте
 * задания идёт своей строкой, в шаги не попадает.
 */
export function shagi21(s: Pick<Reshenie21, 'etapy'>): Shag[] {
  return shagiIzEtapov(s.etapy.filter((e) => e.title !== 'Ответ'));
}

export function voprosy21(s: Pick<Reshenie21, 'hints'>): VoprosPodskazki[] {
  return voprosyIzRazbora(s.hints);
}

export { otvetTekstom };
