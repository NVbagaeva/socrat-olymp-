import type { Rezhim, Zadanie } from '@/content/veroyatnost';
import { isRecord } from '@/lib/trainerSession/restore';
import type { Pool, PoolModel, UznayPool } from '@/lib/veroyatnost/pool';
import { klyuchZadachi } from '@/lib/veroyatnost/secret';
import type { RoundItem } from '@/lib/veroyatnost/useRound';
import { navykKind, zadachaId } from './metody';

/** Иллюстрация задачи: путь и подпись, если файл есть. */
type Illyustratsiya = { path: string; alt: string };

/**
 * Задача подхода №4 и №5 в том виде, в каком она лежит в сессии.
 *
 * Хранится сама задача, а не ссылка на банк («прототип + номер
 * варианта»): банк собирается вместе с сайтом и может измениться между
 * заходами, а запечатанный ответ, ключ и закрытый разбор должны
 * остаться теми, с которыми ученик начал. Правильных ответов открытым
 * текстом тут нет — только то, что и так едет в браузер.
 */
export interface SessiyaZadacha {
  /** «прототип:номер варианта» — как в списке ошибок. */
  id: string;
  /** Откуда задача: строка шапки (отработка) или ключ источника («Узнай метод»). */
  istochnik: string;
  uslovie: string;
  illustration?: Illyustratsiya;
  /** Отработка: ключ, отпечаток ответа и закрытый разбор. */
  klyuch: string;
  seal: string;
  steps: string;
  /** Отработка: навык задачи (блок банка). У «Узнай метод» пусто. */
  metod: string;
  model?: PoolModel;
  /** «Узнай метод»: отпечаток метода и закрытый список признаков. */
  metodSeal: string;
  hints: string;
}

/** Задачи тренировки и её настройки: единый payload обоих заданий. */
export interface SessiyaPayload {
  zadanie: Zadanie;
  rezhim: Rezhim;
  /** Метод отработки (запасное название вида задачи на итогах). */
  metod: string;
  /** Подсказки: название метода в шапке и «Показать решение» до ответа. */
  podskazki: boolean;
  tasks: SessiyaZadacha[];
}

/** Подход банка → задачи сессии. Задач, которых в банке нет, не бывает: пропускаются. */
export function zadachiPodhoda(
  round: readonly RoundItem[],
  rezhim: Rezhim,
  pool: Pool,
  uznay: UznayPool,
): SessiyaZadacha[] {
  const out: SessiyaZadacha[] = [];
  for (const item of round) {
    const id = zadachaId(item.kind, item.n);
    if (rezhim === 'uznay') {
      const kind = uznay.kinds.find((k) => k.id === item.kind);
      const v = kind?.variants.find((x) => x.n === item.n);
      if (kind === undefined || v === undefined) {
        continue;
      }
      out.push({
        id,
        istochnik: kind.istochnik,
        uslovie: v.uslovie,
        ...(v.illustration === undefined ? {} : { illustration: v.illustration }),
        klyuch: '',
        seal: '',
        steps: '',
        metod: '',
        metodSeal: v.metodSeal,
        hints: v.hints,
      });
      continue;
    }
    const kind = pool.kinds.find((k) => k.id === item.kind);
    const v = kind?.variants.find((x) => x.n === item.n);
    if (kind === undefined || v === undefined) {
      continue;
    }
    out.push({
      id,
      istochnik: kind.istochnik,
      uslovie: v.uslovie,
      klyuch: klyuchZadachi(kind.id, v.n),
      seal: v.seal,
      steps: v.steps,
      metod: navykKind(kind),
      ...(v.model === undefined ? {} : { model: v.model }),
      metodSeal: '',
      hints: '',
    });
  }
  return out;
}

function isIllyustratsiya(value: unknown): value is Illyustratsiya {
  return isRecord(value) && typeof value['path'] === 'string' && typeof value['alt'] === 'string';
}

function isModel(value: unknown): value is PoolModel {
  return (
    isRecord(value) &&
    typeof value['method'] === 'string' &&
    (value['illustration'] === undefined || isIllyustratsiya(value['illustration']))
  );
}

function isZadacha(value: unknown): value is SessiyaZadacha {
  return (
    isRecord(value) &&
    typeof value['id'] === 'string' &&
    typeof value['istochnik'] === 'string' &&
    typeof value['uslovie'] === 'string' &&
    typeof value['klyuch'] === 'string' &&
    typeof value['seal'] === 'string' &&
    typeof value['steps'] === 'string' &&
    typeof value['metod'] === 'string' &&
    typeof value['metodSeal'] === 'string' &&
    typeof value['hints'] === 'string' &&
    (value['illustration'] === undefined || isIllyustratsiya(value['illustration'])) &&
    (value['model'] === undefined || isModel(value['model']))
  );
}

const REZHIMY_SESSII: readonly Rezhim[] = ['practice', 'mixed', 'mistakes', 'uznay'];

/** Проверка формата при чтении из хранилища: чужое и повреждённое отсекается. */
export function isSessiyaPayload(value: unknown): value is SessiyaPayload {
  if (!isRecord(value)) {
    return false;
  }
  const { zadanie, rezhim, tasks } = value;
  if (
    (zadanie !== 4 && zadanie !== 5) ||
    typeof rezhim !== 'string' ||
    !(REZHIMY_SESSII as readonly string[]).includes(rezhim) ||
    typeof value['metod'] !== 'string' ||
    typeof value['podskazki'] !== 'boolean' ||
    !Array.isArray(tasks) ||
    tasks.length === 0 ||
    !tasks.every(isZadacha)
  ) {
    return false;
  }
  /* «Узнай метод» держится на отпечатке метода, остальные режимы — на ответе. */
  const uznay = rezhim === 'uznay';
  return (tasks as SessiyaZadacha[]).every((t) => (uznay ? t.metodSeal !== '' : t.seal !== ''));
}

