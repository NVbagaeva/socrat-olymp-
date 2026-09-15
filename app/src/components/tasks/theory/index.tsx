import type { ReactNode } from 'react';
import { WhatIsFunction } from './WhatIsFunction';
import { WhatKinds } from './WhatKinds';

/**
 * Свёрстанные разделы теории по ключу из конфига.
 *
 * Конфиг хранит ключ, а не разметку: так список разделов остаётся
 * данными, а страница не знает, какой из них уже написан.
 */
export const theoryBodies: Record<string, ReactNode> = {
  'what-is-function': <WhatIsFunction />,
  'kinds-of-functions': <WhatKinds />,
};

export { WhatIsFunction } from './WhatIsFunction';
export { WhatKinds } from './WhatKinds';
export { MappingDiagram, type MappingDiagramProps } from './MappingDiagram';
export { BookIcon } from './BookIcon';
export { Phrases } from './Phrases';
