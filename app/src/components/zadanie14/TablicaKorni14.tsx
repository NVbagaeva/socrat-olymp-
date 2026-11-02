'use client';

import { useState } from 'react';
import { Tex } from '@/components/ui/Tex';
import { krugHtml } from '@/lib/zadanie14/krugHtml';
import { u } from '@/lib/zadanie14/ugol';

const UGLY = ['0', '\\dfrac{\\pi}{6}', '\\dfrac{\\pi}{4}', '\\dfrac{\\pi}{3}', '\\dfrac{\\pi}{2}'];
const KORNI = ['\\dfrac{\\sqrt{0}}{2}', '\\dfrac{\\sqrt{1}}{2}', '\\dfrac{\\sqrt{2}}{2}', '\\dfrac{\\sqrt{3}}{2}', '\\dfrac{\\sqrt{4}}{2}'];
const ZNACH = ['0', '\\dfrac{1}{2}', '\\dfrac{\\sqrt{2}}{2}', '\\dfrac{\\sqrt{3}}{2}', '1'];

const SHAGI = [
  'Пишем углы $0,\\ \\dfrac{\\pi}{6},\\ \\dfrac{\\pi}{4},\\ \\dfrac{\\pi}{3},\\ \\dfrac{\\pi}{2}$ по возрастанию.',
  'Строка синуса: под корнем числа $0,\\ 1,\\ 2,\\ 3,\\ 4$ по порядку, в знаменателе всегда $2$.',
  'Упрощаем: $\\sqrt{0}=0$, $\\sqrt{1}=1$, $\\sqrt{4}=2$. Получаем $0,\\ \\dfrac{1}{2},\\ \\dfrac{\\sqrt{2}}{2},\\ \\dfrac{\\sqrt{3}}{2},\\ 1$.',
  'Строка косинуса — те же числа в обратном порядке: косинус убывает, пока синус растёт.',
  'Сверяем с окружностью: у точки $\\dfrac{\\pi}{6}$ ордината $\\dfrac{1}{2}$ (это синус), абсцисса $\\dfrac{\\sqrt{3}}{2}$ (это косинус). Таблица и окружность говорят одно и то же.',
];

/**
 * Лайфхак: таблица синусов и косинусов первой четверти через
 * $\frac{\sqrt0}{2},\dots,\frac{\sqrt4}{2}$ — по шагам и со сверкой по
 * окружности.
 */
export function TablicaKorni14() {
  const [shag, setShag] = useState(0);
  const sin = shag >= 2 ? ZNACH : KORNI;
  const krug =
    shag === SHAGI.length - 1
      ? krugHtml({ tochki: [{ ugol: u(1, 6), akcent: true, luch: true, proekcii: true }] })
      : null;
  return (
    <div className="z14-inter">
      <div className="z14-tablica-wrap">
        <table className="z14-tablica">
          <tbody>
            <tr>
              <th scope="row">
                <Tex text="$x$" />
              </th>
              {UGLY.map((t) => (
                <td key={t}>
                  <Tex text={`$${t}$`} />
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">
                <Tex text="$\\sin x$" />
              </th>
              {sin.map((t, i) => (
                <td key={i}>{shag >= 1 ? <Tex text={`$${t}$`} /> : null}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">
                <Tex text="$\\cos x$" />
              </th>
              {[...ZNACH].reverse().map((t, i) => (
                <td key={i}>{shag >= 3 ? <Tex text={`$${t}$`} /> : null}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="z14-inter__text" aria-live="polite">
        <Tex text={SHAGI[shag] as string} />
      </p>
      {krug === null ? null : <div className="z14-inter__krug" dangerouslySetInnerHTML={{ __html: krug }} />}
      <div className="z14-inter__nav">
        <button type="button" className="btn btn--secondary btn--sm" disabled={shag === 0} onClick={() => setShag(shag - 1)}>
          Назад
        </button>
        <span className="z14-inter__schet">
          Шаг {shag + 1} из {SHAGI.length}
        </span>
        <button
          type="button"
          className="btn btn--primary btn--sm"
          disabled={shag === SHAGI.length - 1}
          onClick={() => setShag(shag + 1)}
        >
          Дальше
        </button>
      </div>
    </div>
  );
}
