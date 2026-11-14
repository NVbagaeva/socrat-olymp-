/**
 * Короткие сведения о прототипах для клиентских вкладок (тренажёр,
 * генератор, «Для репетиторов»): без решателей и данных банка.
 */

import { YAKOR_TEORII_10 } from '../../content/teoriya10';
import { GROUPS, kodNaSayte, PROTOTYPES } from './prototypes';

/** Прототип для клиентских вкладок (генератор, «Для репетиторов»). */
export interface ProtoInfo10 {
  id: string;
  kod: string;
  title: string;
  group: string;
  /** Якорь теории для «Повторить теорию»: «teoriya-edinicy», «ed-stepeni». */
  teoriya?: string;
  izKursa: boolean;
}

export function protoInfo10(): ProtoInfo10[] {
  return PROTOTYPES.map((p) => {
    const t = YAKOR_TEORII_10(p.id);
    return {
      id: p.id,
      kod: kodNaSayte(p.id),
      title: p.title,
      group: p.group,
      izKursa: p.fipiNos === '',
      ...(t ? { teoriya: t } : {}),
    };
  });
}

export function gruppy10(): { id: string; title: string }[] {
  return GROUPS.map((g) => ({ id: g.id, title: g.title }));
}
