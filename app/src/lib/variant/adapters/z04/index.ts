/**
 * Адаптер задания №4: прототипы банка раздела с закрытыми ответами и
 * разборами (маршрут /variant/dannye/z04.json). Устройство общее с №5 —
 * ./veroyatnost.ts.
 */

import { dataUrl } from '@/lib/dataUrl';
import type { SectionModule } from '../../types';
import { info } from './info';
import { adapter45 } from './veroyatnost';

export const section: SectionModule = {
  load: () =>
    fetch(dataUrl('/variant/dannye/z04.json')).then((r) => {
      if (!r.ok) throw new Error(`нет данных №4: ${r.status}`);
      return r.json() as Promise<unknown>;
    }),
  init: (data) => adapter45(4, info, data),
};
