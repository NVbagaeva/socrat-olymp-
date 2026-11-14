'use client';

/**
 * Перенос незаконченной тренировки прежнего тренажёра №9 в общий
 * (запись budetege:trainer:9:session). Прежняя запись жила в
 * sessionStorage до закрытия вкладки; ученик, у которого вкладка
 * открыта во время обновления сайта, продолжит с той же задачи.
 * Прежняя запись не удаляется: рядом ставится метка с её
 * идентификатором, чтобы перенос не повторился после завершения.
 */

import { encodeSession, readSession, TAB_ID, writeRaw } from '@/lib/trainerSession/store';
import { PREZHNYAYA_SESSIYA9_KEY, prezhnyayaSessiya9 } from './session';

const METKA = `${PREZHNYAYA_SESSIYA9_KEY}:perenesena`;

export function perenestiSessiyu9(scope: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.sessionStorage.getItem(PREZHNYAYA_SESSIYA9_KEY);
    const perenos = prezhnyayaSessiya9(raw);
    if (perenos === null || window.sessionStorage.getItem(METKA) === perenos.id) return;
    window.sessionStorage.setItem(METKA, perenos.id);
    if (readSession(scope).status !== 'none') return;
    const now = Date.now();
    writeRaw(
      scope,
      encodeSession(
        {
          scope,
          id: perenos.id,
          createdAt: now,
          updatedAt: now,
          rev: 1,
          writer: TAB_ID,
          paused: perenos.paused,
          activeMs: perenos.activeMs,
          total: perenos.payload.tasks.length,
        },
        JSON.stringify(perenos.ui),
        JSON.stringify(perenos.payload),
      ),
    );
  } catch {
    /* Хранилище недоступно (приватный режим): переносить некуда. */
  }
}
