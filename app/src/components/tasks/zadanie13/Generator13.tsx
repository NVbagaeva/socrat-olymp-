'use client';

import { GENERATOR_13, PRESETY_13, SHEET_13, VIDY_13 } from '@/content/generator13';
import { qrSvg } from '@/lib/qr';
import {
  BASE_13,
  GEN_PARAMS_13,
  listHref13,
  onlaynHref13,
  type GenParams13,
} from '@/lib/zadanie13/gen/params';
import { GeneratorV2 } from '../generator-v2/GeneratorV2';
import type { GeneratorConfigV2 } from '../generator-v2/types';

/**
 * Конфиг генератора №13 для общего экрана generator-v2: строки
 * «Что», пресеты, сегменты «Как», поля «Дополнительно», предпросмотр
 * и адреса листов. Движок задач грузится по требованию — экран
 * настроек его не везёт.
 */
const CONFIG_13: GeneratorConfigV2<GenParams13> = {
  scope: '13',
  slot: `${BASE_13}/generator/`,
  section: `№13 · ${SHEET_13.text}`,
  kinds: VIDY_13,
  presets: PRESETY_13.map((p) => ({
    id: p.id,
    label: p.label,
    note: p.note,
    apply: (s) => ({
      ...s,
      sostav: { ...p.sostav },
      uroven: p.uroven,
      pomoshch: p.pomoshch,
      vid: p.vid,
      variants: p.variants,
      zachet: p.zachet === true,
      title: p.title,
    }),
  })),
  segments: [
    { key: 'uroven', label: GENERATOR_13.uroven, options: GENERATOR_13.urovni },
    {
      key: 'istochnik',
      label: GENERATOR_13.otkuda,
      note: GENERATOR_13.otkudaNote,
      options: GENERATOR_13.istochniki,
    },
    {
      key: 'pomoshch',
      label: GENERATOR_13.pomoshch,
      note: GENERATOR_13.pomoshchNote,
      options: GENERATOR_13.pomoshchi,
    },
    { key: 'vid', label: GENERATOR_13.vid, note: GENERATOR_13.vidNote, options: GENERATOR_13.vidy },
  ],
  dop: [
    { kind: 'text', key: 'title', label: GENERATOR_13.zagolovok, maxLength: 80 },
    { kind: 'text', key: 'date', label: GENERATOR_13.data, maxLength: 20 },
    { kind: 'text', key: 'teacher', label: GENERATOR_13.uchitel, maxLength: 60 },
    { kind: 'number', key: 'variants', label: GENERATOR_13.variantov, options: [1, 2, 3, 4] },
    {
      kind: 'segment',
      key: 'uchitel',
      label: GENERATOR_13.listUchitelya,
      options: GENERATOR_13.uchitelVidy,
    },
    { kind: 'segment', key: 'theme', label: GENERATOR_13.pechat, options: GENERATOR_13.temy },
  ],
  initial: GEN_PARAMS_13,
  texts: GENERATOR_13,
  async preview(s) {
    const { previewList13 } = await import('@/lib/zadanie13/gen/preview');
    return previewList13(s);
  },
  hrefs: (s) => ({
    student: listHref13(s, 'uchenik'),
    teacher: listHref13(s, 'uchitel'),
    online: onlaynHref13(s),
  }),
  qr: (url) => qrSvg(url, GENERATOR_13.qr),
};

export function Generator13() {
  return <GeneratorV2 config={CONFIG_13} />;
}
