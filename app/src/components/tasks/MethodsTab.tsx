import { EmptyState } from '@/components/ui';
import { OPORNYE } from '@/content/opornye';
import { METODY } from '@/content/metody';
import { prepSkillsFor } from '@/content/prepSkills';
import { QUADRATIC_METODY, type QuadraticMetod } from '@/content/quadraticMetody';
import { METODY_KARTOCHKI } from '@/content/veroyatnost-metody';
import {
  MetodyKartochki,
  type KartochkaMetoda,
} from '@/components/tasks/veroyatnost/MetodyKartochki';
import { prepSkillTotal } from '@/lib/prep';
import { typeset } from '@/lib/tex';

export interface MethodsTabProps {
  /** Подтема: её список методов. */
  type: string;
  /** Адрес подтемы: от него считаются ссылки на опорные задачи. */
  base: string;
}

/** Текст с формулами → готовая разметка. Набор идёт на сборке. */
function Tex({ text, className }: { text: string; className?: string }) {
  return (
    <span
      {...(className === undefined ? {} : { className })}
      /* Разметка своя, из конфига проекта: KaTeX собирает её на сборке
         и сам кладёт внутрь MathML для скринридера. */
      dangerouslySetInnerHTML={{ __html: typeset(text) }}
    />
  );
}

function Abzatsy({ text }: { text: string[] }) {
  return (
    <>
      {text.map((abzats) => (
        <p className="vmetod-modal__text" key={abzats}>
          <Tex text={abzats} />
        </p>
      ))}
    </>
  );
}

/** Шаги алгоритма: нумерует разметка, а не текст. */
function Shagi({ text }: { text: string[] }) {
  return (
    <ol className="vmetod-modal__shagi">
      {text.map((shag) => (
        <li key={shag}>
          <Tex text={shag} />
        </li>
      ))}
    </ol>
  );
}

/**
 * Карточки методов подтемы: те же, что у заданий №4 и №5.
 *
 * Метод отрабатывается одним или несколькими наборами опорных задач —
 * в окне у каждого своя кнопка «Потренироваться» и свой счётчик.
 * Число задач берётся из данных движка, а не из конфига методов.
 */
function kartochki(metody: QuadraticMetod[], type: string, base: string): KartochkaMetoda[] {
  const nazvaniya = new Map(prepSkillsFor(type).map((skill) => [skill.id, skill.title]));
  const odin = (metod: QuadraticMetod) => metod.navyki.length === 1;

  return metody.map((metod) => ({
    id: metod.id,
    nomer: metod.nomer,
    nazvanie: metod.nazvanie,
    opisanie: metod.opisanie,
    formula: <Tex text={`$${metod.formula}$`} />,
    trenirovki: metod.navyki.map((navyk) => ({
      href: `${base}/${OPORNYE.tail}${navyk}/`,
      schet: METODY_KARTOCHKI.modal.vBanke(prepSkillTotal(type, navyk)),
      /* Название набора нужно, только когда кнопок несколько: иначе
         оно повторяло бы заголовок окна. */
      ...(odin(metod) ? {} : { nazvanie: nazvaniya.get(navyk) ?? navyk }),
    })),
    bloki: {
      kakUznat: <Abzatsy text={metod.kakUznat} />,
      algoritm: <Shagi text={metod.algoritm} />,
      primer: <Abzatsy text={metod.primer} />,
      oshibka: <Abzatsy text={metod.oshibka} />,
    },
  }));
}

/**
 * Вкладка «Ключевые методы решения» подтемы задания №12.
 *
 * Появляется у подтемы с признаком methods в конфиге. Заголовок —
 * H2, как у соседних вкладок «Опорные задачи» и «Тренажёр». Сами
 * карточки и окно метода — общий компонент с заданиями №4 и №5;
 * у подтемы без списка методов под заголовком стоит честное пустое
 * состояние.
 */
export function MethodsTab({ type, base }: MethodsTabProps) {
  const metody = type === 'quadratic' ? QUADRATIC_METODY : [];

  return (
    <section className="methods">
      <header className="methods__head">
        <h2 className="t-h2 methods__title">{METODY.title}</h2>
      </header>
      {metody.length === 0 ? (
        <EmptyState title={METODY.gotovitsya.title} description={METODY.gotovitsya.description} />
      ) : (
        <MetodyKartochki items={kartochki(metody, type, base)} />
      )}
    </section>
  );
}
