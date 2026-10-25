import { typeset, typesetZagolovok } from '@/lib/tex';

export interface TexProps {
  /** Текст, в котором формулы помечены знаками доллара: «Найдите $k$». */
  text: string;
  className?: string;
  /** Заголовок рамки: строчные дроби, «$X$, а не $Y$» — одним выражением (zagolovokTex). */
  zagolovok?: boolean;
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
export function Tex({ text, className, zagolovok }: TexProps) {
  return (
    <span
      {...(className === undefined ? {} : { className })}
      dangerouslySetInnerHTML={{ __html: zagolovok ? typesetZagolovok(text) : typeset(text) }}
    />
  );
}
