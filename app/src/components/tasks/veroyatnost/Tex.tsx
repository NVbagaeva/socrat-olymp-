import { typeset } from '@/lib/tex';

export interface TexProps {
  /** Текст, в котором формулы помечены знаками доллара. */
  text: string;
  className?: string;
}

/**
 * Текст с формулами между долларами → готовая разметка.
 *
 * Набор идёт здесь, на сервере: в браузер уезжает вёрстка KaTeX, а
 * не сама библиотека. Компонент один на все экраны вероятности —
 * второй такой же строки в проекте быть не должно.
 */
export function Tex({ text, className }: TexProps) {
  return (
    <span
      {...(className === undefined ? {} : { className })}
      dangerouslySetInnerHTML={{ __html: typeset(text) }}
    />
  );
}
