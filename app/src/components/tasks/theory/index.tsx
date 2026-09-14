import type { ReactNode } from 'react';
import { WhatIsFunction } from './WhatIsFunction';

/**
 * Свёрстанные разделы теории по ключу из конфига.
 *
 * Конфиг хранит ключ, а не разметку: так список разделов остаётся
 * данными, а страница не знает, какой из них уже написан.
 */
export const theoryBodies: Record<string, ReactNode> = {
  'what-is-function': <WhatIsFunction />,
};

export { WhatIsFunction } from './WhatIsFunction';
export { MappingDiagram, type MappingDiagramProps } from './MappingDiagram';
export { BookIcon } from './BookIcon';
export { Phrases } from './Phrases';
