/**
 * Короткие сведения о прототипах для клиентских вкладок (тренажёр,
 * генератор): без решателей и данных банка.
 */

import { TEORIYA_6_DLYA_PROTOTIPA } from '../../content/teoriya6';
import { GROUPS, kodNaSayte, PROTOTYPES } from './prototypes';

export interface ProtoInfo6 {
  id: string;
  kod: string;
  /** Название (с $…$ — набирается Tex). */
  title: string;
  group: string;
  /** Карточка теории для «Повторить теорию»: якорь #k-<id>. */
  kartochka?: string;
}

export function protoInfo6(): ProtoInfo6[] {
  return PROTOTYPES.map((p) => {
    const t = TEORIYA_6_DLYA_PROTOTIPA(p.id);
    return {
      id: p.id,
      kod: kodNaSayte(p.id),
      title: p.title,
      group: p.group,
      ...(t ? { kartochka: t.kartochka } : {}),
    };
  });
}

export function gruppy6(): { id: string; title: string }[] {
  return GROUPS.map((g) => ({ id: g.id, title: g.title }));
}
