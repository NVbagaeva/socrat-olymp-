'use client';

/**
 * Разовая миграция одиннадцати прежних ключей прогресса.
 *
 * Легаси-хранилища не трогаются и не удаляются: читаются один раз
 * и переносятся как «историческая активность» — только для строки
 * на странице статистики, в освоенность навыков не идут. Причина:
 * старое «право» не различает «верно с первой попытки» и «верно со
 * второй, но без подсказки», а новое правило зачёта строже — досчитать
 * его из старых счётчиков значило бы придумывать данные, которых нет
 * (решение по п.1 этапа 1).
 *
 * Запускается один раз на браузер: после первого прогона в хранилище
 * остаётся отметка времени, и повторный вызов ничего не делает —
 * дальнейший прогресс копится уже только через recordAttempt.
 */

import { getProgressData, markMigrated, setLegacyActivity } from './store';

interface KindsShape {
  kinds?: Record<string, { right?: unknown }>;
}

/** Хранилища вида {kinds:{[id]:{right,...}}, mistakes:[...]}:
    задание/тренажёр №3, №8, №12, №4, №5 и «Узнай метод». */
function sumRight(raw: unknown): number {
  if (typeof raw !== 'object' || raw === null) {
    return 0;
  }
  const { kinds } = raw as KindsShape;
  if (typeof kinds !== 'object' || kinds === null) {
    return 0;
  }
  return Object.values(kinds).reduce<number>((sum, tally) => {
    const right = (tally as { right?: unknown } | null)?.right;
    return sum + (typeof right === 'number' && Number.isFinite(right) ? right : 0);
  }, 0);
}

/** Хранилища вида Record<навык, number[]>: опорные задачи №12 и №8. */
function sumSolvedNumbers(raw: unknown): number {
  if (typeof raw !== 'object' || raw === null) {
    return 0;
  }
  return Object.values(raw as Record<string, unknown>).reduce<number>(
    (sum, list) => sum + (Array.isArray(list) ? list.length : 0),
    0,
  );
}

interface LegacySource {
  key: string;
  title: string;
  kind: 'numbers' | 'kinds';
}

const LEGACY_SOURCES: readonly LegacySource[] = [
  { key: 'budetege:prep:v1', title: 'Опорные задачи · №12', kind: 'numbers' },
  { key: 'budetege:trainer:v1', title: 'Тренажёр · №12', kind: 'kinds' },
  { key: 'budetege:vychisleniya-8:v1', title: 'Тренажёр · №8', kind: 'kinds' },
  { key: 'budetege:vychisleniya-8:prep:v1', title: 'Опорные задачи · №8', kind: 'numbers' },
  { key: 'budetege:z3:trainer:v1', title: 'Тренажёр · №3', kind: 'kinds' },
  { key: 'budetege:veroyatnost-4:prep:v1', title: 'Опорные задачи · №4', kind: 'kinds' },
  { key: 'budetege:veroyatnost-5:prep:v1', title: 'Опорные задачи · №5', kind: 'kinds' },
  { key: 'budetege:veroyatnost-4:v2', title: 'Тренажёр · №4', kind: 'kinds' },
  { key: 'budetege:veroyatnost-5:v2', title: 'Тренажёр · №5', kind: 'kinds' },
  { key: 'budetege:veroyatnost-4-uznay:v2', title: 'Узнай метод · №4', kind: 'kinds' },
  { key: 'budetege:veroyatnost-5-uznay:v2', title: 'Узнай метод · №5', kind: 'kinds' },
];

function readLegacy(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Перенести легаси-активность, если миграция ещё не проводилась.
    Безопасно вызывать многократно: второй и следующий разы — no-op. */
export function migrateLegacyProgress(): void {
  if (typeof window === 'undefined') {
    return;
  }
  if (getProgressData().migratedAt !== null) {
    return;
  }

  LEGACY_SOURCES.forEach((source) => {
    const raw = readLegacy(source.key);
    if (raw === null) {
      return;
    }
    const solved = source.kind === 'numbers' ? sumSolvedNumbers(raw) : sumRight(raw);
    if (solved > 0) {
      setLegacyActivity(source.key, { title: source.title, solved });
    }
  });

  markMigrated();
}
