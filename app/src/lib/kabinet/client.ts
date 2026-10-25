'use client';

/**
 * Реализация кабинета для экранов. Пока сервера нет — пробная, в
 * браузере. С сервером здесь меняется одна строка.
 */

import type { KabinetApi } from './api';
import { createLocalApi } from './localApi';

let api: KabinetApi | null = null;

export function kabinetApi(): KabinetApi {
  api ??= createLocalApi();
  return api;
}
