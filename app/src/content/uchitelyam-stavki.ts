/**
 * Ставки и сроки услуги «Материалы под ключ». Утверждены 24.09.2026:
 * docs/SERVICE TEACHERS LANDING.md, §3.1, §3.4, §4.1.
 *
 * Файл намеренно без зависимостей (только import type): его читает
 * scripts/check-usluga.mjs и сверяет цены пакетов с формулой.
 */

import type { Sroki, Stavki } from '@/lib/usluga/raschet';

export const stavki: Stavki = {
  nabor: 200,
  otvet: 70,
  reshenie: 200,
  variantOtvety: 60,
  variantResheniya: 100,
  rukopisDolya: 0.3,
  slozhnyyChertezh: 300,
  minZadach: 10,
  srochno48: 0.5,
  srochno24: 1,
};

export const sroki: Sroki = {
  korotkiy: 5,
  dlinnyy: 7,
  zaDesyatok: 2,
  zaVariantSverh: 1,
  zaRukopis: 1,
};
