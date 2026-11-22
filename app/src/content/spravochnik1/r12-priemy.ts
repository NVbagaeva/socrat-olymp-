import type { Razdel1 } from './tipy';
import { PRIEM_OTNOSHENIE, PRIEM_RAVNYE_PLOSHCHADI, PRIEM_RAVNYE_UGLY } from './novye-temy';

/* ── 12. Приёмы ───────────────────────────────────────────────── */

export const R12_PRIEMY: Razdel1 = {
  no: 12,
  id: 'priemy',
  title: 'Приёмы',
  lead: 'Не факты, а способы рассуждать: как обозначить неизвестное, чтобы условие превратилось в равенство. Подсказки к задачам заканчиваются плашкой «Приём» — она ведёт сюда.',
  temy: [PRIEM_RAVNYE_UGLY, PRIEM_RAVNYE_PLOSHCHADI, PRIEM_OTNOSHENIE],
};
