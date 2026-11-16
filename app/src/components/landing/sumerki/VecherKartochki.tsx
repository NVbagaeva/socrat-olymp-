import { landing } from '@/content/landing';
import './vecher.css';

const { how } = landing;

/*
 * Мини-фрагменты листов — нарисованы вёрсткой, а не картинками: чёткие
 * на любом экране и почти ничего не весят. Это схемы того, что выдаёт
 * генератор (лист ученика, личные варианты, лист ответов, печать), а не
 * снимки. Декор: скрыты от скринридеров; числа набраны обычным текстом,
 * поэтому поддерево помечено no-math-check (scripts/check-math-markup.mjs).
 * Уравнения решаются честно: 3x + 7 = 22 → 5, 5x − 4 = 31 → 7.
 */

function Samostoyatelnye() {
  return (
    <div className="vk-ill vk-ill--dva" aria-hidden="true">
      <div className="vk-list">
        <p className="vk-list__shapka">Вариант 1</p>
        <p className="vk-list__zadacha">
          <span>1</span>3x + 7 = 22
        </p>
        <p className="vk-list__otvet">Ответ: ____</p>
      </div>
      <div className="vk-list vk-list--sdvig">
        <p className="vk-list__shapka">Вариант 2</p>
        <p className="vk-list__zadacha">
          <span>1</span>5x − 4 = 31
        </p>
        <p className="vk-list__otvet">Ответ: ____</p>
      </div>
    </div>
  );
}

function Domashnie() {
  return (
    <div className="vk-ill vk-ill--stopka" aria-hidden="true">
      {['Аня · вариант 3', 'Миша · вариант 7', 'Лена · вариант 12'].map((podpis, i) => (
        <div key={podpis} className={`vk-list vk-list--stopka vk-list--${i}`}>
          <p className="vk-list__shapka">{podpis}</p>
          <p className="vk-list__stroka" />
          <p className="vk-list__stroka vk-list__stroka--korotkaya" />
        </div>
      ))}
    </div>
  );
}

function Proverka() {
  const stroki = [
    ['1', '5', '7', '4'],
    ['2', '0,25', '0,4', '0,75'],
    ['3', '12', '18', '9'],
  ];
  return (
    <div className="vk-ill" aria-hidden="true">
      <div className="vk-list vk-list--tablica">
        <p className="vk-list__shapka">Лист ответов</p>
        <table>
          <thead>
            <tr>
              <th>№</th>
              <th>В1</th>
              <th>В2</th>
              <th>В3</th>
            </tr>
          </thead>
          <tbody>
            {stroki.map((r) => (
              <tr key={r[0]}>
                {r.map((c, i) => (i === 0 ? <th key={i}>{c}</th> : <td key={i}>{c}</td>))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Materialy() {
  return (
    <div className="vk-ill" aria-hidden="true">
      <div className="vk-list vk-list--pechat">
        <p className="vk-list__logo">
          <i />
          Будет на ЕГЭ
        </p>
        <p className="vk-list__stroka" />
        <p className="vk-list__stroka" />
        <p className="vk-list__stroka vk-list__stroka--korotkaya" />
        <span className="vk-list__pdf">PDF</span>
      </div>
    </div>
  );
}

const ILL = [Samostoyatelnye, Domashnie, Proverka, Materialy];

/**
 * Блок «Мы взяли на себя то, что обычно забирает ваш вечер» для главной
 * с синей сценой: те же тексты (content/landing.ts), но карточки —
 * крупное стекло, у каждой фрагмент листа. Боевая главная пока со
 * старым блоком (HowSection.tsx).
 */
export function VecherKartochki() {
  return (
    <section className="band band--soft vk" id="how">
      <div className="wrap">
        <div className="band__head">
          <h2>{how.title}</h2>
        </div>
        <ol className="vk__spisok no-math-check">
          {how.steps.map((step, i) => {
            const Ill = ILL[i] ?? Materialy;
            return (
              <li className="vk-karta" key={step.no}>
                <Ill />
                <div className="vk-karta__tekst">
                  <b className="vk-karta__no">{step.no}</b>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
