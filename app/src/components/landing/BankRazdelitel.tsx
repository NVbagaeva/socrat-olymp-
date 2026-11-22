import type { ReactNode } from 'react';
import { shortTasksOf, tasksOf } from '@/content/tasks';
import { plural } from '@/lib/plural';

/**
 * Заголовок-разделитель «Банк заданий» на главной: отделяет карточки
 * вариантов от сетки заданий — сетка начинается с представления, а не
 * сразу после карточек. Оранжевая стеклянная полоса: заголовок и
 * счётчик слева, переключатель уровня справа (на телефоне — под ними).
 * Числа счётчика — из данных заданий.
 *
 * На полосе — якорь #bank: пункт меню «Банк заданий» и переключатель
 * уровня ведут сюда, к началу списка.
 */
export function BankRazdelitel({ tabs, yakor = 'bank' }: { tabs: ReactNode; yakor?: string }) {
  const profil = shortTasksOf('profile').length;
  const baza = tasksOf('base').length;
  return (
    <div className="bank-razd" id={yakor}>
      <span className="bank-razd__blik" aria-hidden="true" />
      <div className="bank-razd__tekst">
        <h2 className="bank-razd__z">Банк заданий</h2>
        <p className="bank-razd__schet">
          {profil} {plural(profil, 'задание', 'задания', 'заданий')} профиля · {baza} база
        </p>
      </div>
      <div className="bank-razd__tabs">{tabs}</div>
    </div>
  );
}
