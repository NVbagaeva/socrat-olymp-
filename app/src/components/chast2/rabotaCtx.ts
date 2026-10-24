import type { Ochered } from '@/lib/chast2/ochered';
import type { RabotyApi } from '@/lib/raboty/api';
import type { StudentWork } from '@/lib/raboty/types';

/** Работа, выданная в кабинете: экран решения сохраняет ответы в неё. */
export interface RabotaCtx {
  id: string;
  sw: StudentWork;
  api: RabotyApi;
  ochered: Ochered;
  /** Перечитать работу (фото ушли, статус сменился). */
  reload: () => void;
}
