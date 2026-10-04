import { typeset } from '@/lib/tex';

export interface TexProps {
  /** Текст, в котором формулы помечены знаками доллара: «Найдите $k$». */
  text: string;
  className?: string;
}

/**
 * Текст с формулами между долларами → готовая разметка KaTeX.
 *
 * Один компонент на весь сайт: заголовки и подписи карточек, списки,
 * подсказки — всё, где в тексте встречается математика. Набор идёт
 * на сервере (или там, где компонент отрисован), в браузер уходит
 * вёрстка. Строчные дроби набираются \tfrac, формула не рвётся
 * переносом (lib/graph/katex.js, styles/base.css).
 *
 * В общий индекс components/ui не входит намеренно: он тянет KaTeX,
 * а индекс берут и лёгкие клиентские экраны. Импорт — по пути.
 */
export function Tex({ text, className }: TexProps) {
  return (
    <span
      {...(className === undefined ? {} : { className })}
      dangerouslySetInnerHTML={{ __html: typeset(text) }}
    />
  );
}
