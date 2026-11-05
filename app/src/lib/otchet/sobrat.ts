/**
 * Результат для учителя из итогов тренировки: общий экран итогов
 * знает задачи и отметки, раздел добавляет тему, источник и ответ
 * (DescribedTask.otchet) и режим (SummaryOptions.otchet).
 */

import { tasks } from '../../content/tasks';
import { taskNoOfScope } from '../kabinet/scope';
import type { Otchet, OtchetDopolnenie, OtchetItog, OtchetZadacha } from './types';

/** Что раздел говорит о задаче сверх экрана итогов. */
export interface OtchetOZadache {
  /** Тема для итога по темам. Нет — тип задачи. */
  tema?: string;
  /** «ФИПИ № 37», «аналог». */
  istochnik?: string;
  /** Введённый ответ — берётся только у неверно решённых. */
  otvet?: string;
  /** Идентификатор типа для ссылки «Открыть эти задачи». */
  tipId?: string;
}

/** Задача на экране итогов — то, что нужно отсюда. */
export interface ZadachaItogov {
  kind: string;
  mark: OtchetItog;
  badge?: string | undefined;
  otchet?: OtchetOZadache | undefined;
}

/** Название раздела по номеру задания: 1 → «Планиметрия». */
export function nazvanieRazdela(nomer: number | null): string {
  if (nomer === null) return 'Тренировка';
  return tasks.find((t) => Number(t.no) === nomer)?.name ?? `Задание ${nomer}`;
}

/** Есть ли что отправлять: хотя бы одна задача не пропущена. */
export function estReshennye(items: readonly { mark: OtchetItog }[]): boolean {
  return items.some((it) => it.mark !== 'skipped');
}

const MAX_OTVET = 40;

export function sobratOtchet(args: {
  imya: string;
  scope: string;
  items: readonly ZadachaItogov[];
  sekund: number;
  vremya: number;
  dopolnenie?: OtchetDopolnenie | undefined;
}): Otchet {
  const nomer = taskNoOfScope(args.scope);
  const zadachi: OtchetZadacha[] = args.items.map((it) => {
    const o = it.otchet ?? {};
    const istochnik = o.istochnik ?? it.badge;
    const otvet = it.mark === 'wrong' ? (o.otvet ?? '').trim().slice(0, MAX_OTVET) : '';
    return {
      tip: it.kind,
      tema: o.tema ?? it.kind,
      itog: it.mark,
      ...(istochnik === undefined || istochnik === '' ? {} : { istochnik }),
      ...(otvet === '' ? {} : { otvet }),
      ...(o.tipId === undefined ? {} : { tipId: o.tipId }),
    };
  });
  const d = args.dopolnenie ?? {};
  return {
    imya: args.imya.trim().replace(/\s+/g, ' '),
    nomer,
    razdel: nazvanieRazdela(nomer),
    vremya: args.vremya,
    sekund: args.sekund,
    ...(d.rezhim === undefined ? {} : { rezhim: d.rezhim }),
    ...(d.put === undefined ? {} : { put: d.put }),
    zadachi,
  };
}
