import { Trenazher18Klient } from './Trenazher18Klient';

/**
 * Вкладка «Тренажёр» №18: банк задач (content/zadanie18/trenazher) на
 * общей оболочке сессии. Выбор тренировки, проверка ответа б),
 * самопроверка а), пауза и сохранение — в браузере (Trenazher18Klient).
 */
export function Trenazher18({ vkladka, base }: { vkladka: string; base: string }) {
  return (
    <>
      <h2 className="t-h2 vtab__title">{vkladka}</h2>
      <Trenazher18Klient base={base} />
    </>
  );
}
