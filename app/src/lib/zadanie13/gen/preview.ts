/**
 * Предпросмотр генератора №13: те же задачи, что на листе, с
 * подписью типа, пометкой для учителя, ответом и кратким решением.
 */

import type { GenPreviewTaskV2 } from '@/components/tasks/generator-v2/types';
import { BLOK_13, GENERATOR_13, SHEET_13 } from '@/content/generator13';
import { sobratList13, tablitsaUsloviya13 } from './list';
import type { GenParams13 } from './params';

export function previewList13(p: GenParams13): GenPreviewTaskV2[][] {
  return sobratList13(p).poVariantam.map((zs) =>
    zs.map((z) => ({
      pos: z.pos,
      no: z.no,
      kindLabel: z.vid === 'T' ? BLOK_13.T : BLOK_13[z.vid],
      html: `<p>${z.questionHtml}</p>${tablitsaUsloviya13(z)}`,
      teacherHtml: `${p.uchitel === 'otvety' ? '' : p.uchitel === 'polno' ? z.polnoHtml : z.kratkoHtml}<p class="gv2-a4__otvet">${GENERATOR_13.otvet}: <b>${z.answer}</b></p>`,
      badge:
        z.task.source === 'own' ? SHEET_13.metkaSvoya : z.istochnik === 'bank' ? 'банк' : 'новая',
    })),
  );
}
