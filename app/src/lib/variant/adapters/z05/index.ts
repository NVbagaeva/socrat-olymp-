/**
 * Адаптер задания №5: прототипы банка раздела с закрытыми ответами и
 * разборами (маршрут /variant/dannye/z05.json). Устройство общее с №4 —
 * ../z04/veroyatnost.ts.
 */

import { dataUrl } from '@/lib/dataUrl';
import type { SectionModule } from '../../types';
import { adapter45 } from '../z04/veroyatnost';
import { info } from './info';

export const section: SectionModule = {
  load: () =>
    fetch(dataUrl('/variant/dannye/z05.json')).then((r) => {
      if (!r.ok) throw new Error(`нет данных №5: ${r.status}`);
      return r.json() as Promise<unknown>;
    }),
  init: (data) => adapter45(5, info, data),
};
