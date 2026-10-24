import { typeset, typesetKrupno } from '@/lib/tex';

export interface TexProps {
  /** Текст, в котором формулы помечены знаками доллара: «Найдите $k$». */
  text: string;
  className?: string;
  /** \dfrac в строке — крупной дробью (условия и решения части 2). */
  krupno?: boolean;
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
export function Tex({ text, className, krupno = false }: TexProps) {
  return (
    <span
      {...(className === undefined ? {} : { className })}
      dangerouslySetInnerHTML={{ __html: krupno ? typesetKrupno(text) : typeset(text) }}
    />
  );
}
