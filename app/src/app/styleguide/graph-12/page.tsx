'use client';

/* Служебная страница визуального контроля задания №12.

   Логика и разметка живут в @/lib/graph/preview-ui — обычном модуле
   без React: ту же страницу можно смонтировать где угодно. Страница
   даёт ей две вещи, которые приходят из проекта: наборы задач
   статическим импортом и KaTeX обычной зависимостью.
*/

import { useEffect, useRef } from 'react';
import katex from 'katex';

import 'katex/dist/katex.min.css';
import '@/lib/graph/graph.css';
import '@/lib/graph/preview.css';

import { mountPreview } from '@/lib/graph/preview-ui.js';
import { prep, prototypes } from '@/lib/graph/data/index.js';

export default function GraphPreviewPage() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) { return; }
    mountPreview(container.current, { sets: { prep, prototypes }, katex });
  }, []);

  return <div ref={container} />;
}
