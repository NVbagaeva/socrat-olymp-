import type { ReactNode } from 'react';
import { QUADRATIC_SECTIONS } from '@/content/theoryQuadratic';
import { WhatIsFunction } from './WhatIsFunction';
import { GraphNotFunction } from './GraphNotFunction';
import { WhatKinds } from './WhatKinds';
import { QuadraticSection } from './quadratic/QuadraticSection';

/**
 * Свёрстанные разделы теории по ключу из конфига.
 *
 * Конфиг хранит ключ, а не разметку: так список разделов остаётся
 * данными, а страница не знает, какой из них уже написан.
 */
export const theoryBodies: Record<string, ReactNode> = {
  'what-is-function': <WhatIsFunction />,
  'kinds-of-functions': <WhatKinds />,
  'graph-not-function': <GraphNotFunction />,
  /* Разделы квадратичной подтемы: одна разметка, семь наборов данных. */
  ...Object.fromEntries(
    QUADRATIC_SECTIONS.map((section) => [
      section.id,
      <QuadraticSection section={section} key={section.id} />,
    ]),
  ),
};

export { WhatIsFunction } from './WhatIsFunction';
export { WhatKinds } from './WhatKinds';
export { GraphNotFunction } from './GraphNotFunction';
export { CheckIcon, CrossIcon, PinIcon, WarnIcon } from './VerdictIcons';
export { MappingDiagram, type MappingDiagramProps } from './MappingDiagram';
export { BookIcon } from './BookIcon';
export { Phrases } from './Phrases';
