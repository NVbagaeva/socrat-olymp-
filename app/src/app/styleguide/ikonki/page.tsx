import type { Metadata } from 'next';
import { IkonkaTemy, TEMY_S_IKONKAMI } from '@/components/generator/IkonkiTem';
import { IkonkaTela, VIDY_TEL } from '@/components/stereo/IkonkaTela';
import { IkonkaBloka1 } from '@/components/tasks/planimetriya/IkonkaBloka1';
import './ikonki.css';

/* Служебная витрина значков в стеклянном круге: тела №3 — эталон,
   рядом блоки №1 и темы генераторов. Все из одной рамки
   (components/ui/IkonkaVKruge). Страница в меню не входит и не
   индексируется. */

export const metadata: Metadata = {
  title: 'Значки разделов — витрина',
  robots: { index: false, follow: false },
};

/** Названия тем генераторов — как в конфигах (lib/…/generator*.ts). */
const TEMY: Record<string, Record<string, string>> = {
  '2': { A: 'Длина вектора', B: 'Скалярное произведение', C: 'Косинус угла' },
  '6': {
    I: 'Диаграмма Эйлера',
    II: 'Условная вероятность',
    III: 'Математическое ожидание',
    IV: 'Оценка вероятности',
    V: 'Дисперсия',
  },
  '7': {
    I: 'Линейные, дробные, степенные',
    II: 'Иррациональные',
    III: 'Показательные',
    IV: 'Логарифмические',
    V: 'Тригонометрические',
  },
  '8': {
    S1: 'Свойства степеней',
    S2: 'Свойства корней',
    S3: 'Сумма и разность логарифмов',
    S4: 'Новое основание логарифма',
    S5: 'Синус и косинус по четверти',
    S6: 'Тангенс и двойной угол',
    S7: 'Табличные значения',
    S8: 'Формулы двойного угла',
    S9: 'Формулы приведения',
    S10: 'Буквенные: дроби и степени',
    S11: 'Буквенные: корни и логарифмы',
  },
  '9': {
    I: 'Физический смысл производной',
    II: 'Касательная',
    III: 'По графику функции',
    IV: 'По графику производной',
    V: 'Первообразная',
  },
  '10': {
    I: 'Подстановка, линейные и дробные',
    II: 'Квадратичные зависимости',
    III: 'Степени и корни',
    IV: 'Показательные и логарифмические',
    V: 'Тригонометрические',
  },
  '11': {
    RZ: 'Разминка',
    PR: 'Проценты',
    SM: 'Смеси и сплавы',
    DP: 'Движение по прямой',
    PT: 'Протяжённые тела',
    VD: 'Движение по воде',
    OK: 'Движение по окружности',
    RB: 'Работа',
    PG: 'Прогрессии',
  },
  '12': {
    linear: 'Линейная',
    quadratic: 'Квадратичная',
    rational: 'Дробно-линейная',
    irrational: 'Иррациональная',
    exponential: 'Показательная',
    logarithmic: 'Логарифмическая',
    trigonometric: 'Тригонометрические',
  },
  '13': {
    A: 'Дифференцированный платёж',
    B: '«Поломанный» дифференцированный',
    C: 'Аннуитет',
    D: 'Вклады',
    T: 'Определи тип',
    P: 'Таблица руками',
  },
};

const BLOKI_1 = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

export default function IkonkiPage() {
  return (
    <main className="sg-ik">
      <h1 className="t-h2">Значки в стеклянном круге</h1>
      <p className="sg-ik__lead">
        Эталон — тела №3. Рамка, стекло и классы линий общие:
        components/ui/IkonkaVKruge.tsx и ikonka-v-kruge.css.
      </p>
      <section>
        <h2 className="t-h4">№3 · тела (эталон)</h2>
        <ul className="sg-ik__setka">
          {VIDY_TEL.map((v) => (
            <li key={v}>
              <IkonkaTela vid={v} />
              <span>{v}</span>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="t-h4">№1 · блоки</h2>
        <ul className="sg-ik__setka">
          {BLOKI_1.map((b) => (
            <li key={b}>
              <IkonkaBloka1 blok={b} />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </section>
      {Object.entries(TEMY_S_IKONKAMI).map(([z, temy]) => (
        <section key={z}>
          <h2 className="t-h4">№{z} · темы генератора</h2>
          <ul className="sg-ik__setka">
            {temy.map((t) => (
              <li key={t}>
                <IkonkaTemy zadanie={z} tema={t} />
                <span>{TEMY[z]?.[t] ?? t}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
