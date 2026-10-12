/**
 * Короткие сведения о прототипах для клиентских вкладок (тренажёр,
 * генератор): без решателей и данных банка.
 */

import { TEORIYA_7_DLYA_PROTOTIPA } from '../../content/teoriya7';
import { GROUPS, kodNaSayte, PROTOTYPES } from './prototypes';

export interface ProtoInfo7 {
  id: string;
  kod: string;
  /** Название (с $…$ — набирается Tex). */
  title: string;
  group: string;
  /** Карточка теории для «Повторить теорию»: якорь #k-<id>. */
  kartochka?: string;
  /** В источниках нет задач ФИПИ этого вида. */
  bezFipi: boolean;
}

export function protoInfo7(): ProtoInfo7[] {
  return PROTOTYPES.map((p) => {
    const t = TEORIYA_7_DLYA_PROTOTIPA(p.id);
    return {
      id: p.id,
      kod: kodNaSayte(p.id),
      title: p.title,
      group: p.group,
      bezFipi: p.fipiNos === '',
      ...(t ? { kartochka: t.kartochka } : {}),
    };
  });
}

export function gruppy7(): { id: string; title: string }[] {
  return GROUPS.map((g) => ({ id: g.id, title: g.title }));
}
