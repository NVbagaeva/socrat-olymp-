/**
 * Тренажёр в «Стеклянной сцене»: стартовые режимы, выбор тем, экран
 * задачи, итоги, панель прогресса. Компоненты не знают о номере
 * задания: задачи, названия и прогресс приходят пропсами. Первым их
 * подключил №8; дальше — №7, №5 и остальные разделы.
 */
import './trening.css';

export { StartRezhimy, type Rezhim } from './StartRezhimy';
export { VyborTem, type VyborTemLabels, type VyborTemProps } from './VyborTem';
export {
  EkranZadachi,
  type EkranZadachiLabels,
  type EkranZadachiProps,
  type SostoyanieZadachi,
} from './EkranZadachi';
export { ItogiSessii, type ItogZadacha, type ItogiLabels, type Otmetka } from './ItogiSessii';
export { ProgressPanel, type ProgressPanelLabels } from './ProgressPanel';
export type { GruppaVybora, StrokaGruppy, TipVybora } from './types';
