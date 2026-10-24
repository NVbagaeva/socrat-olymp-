'use client';

/** Работы-варианты для экранов. С сервером здесь меняется одна строка. */

import type { RabotyApi } from './api';
import { createLocalRaboty } from './localApi';

let api: RabotyApi | null = null;

export function rabotyApi(): RabotyApi {
  api ??= createLocalRaboty();
  return api;
}
