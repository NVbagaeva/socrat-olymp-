'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { VKLADKI_PODTEMY } from '@/content/vkladki';
import { VkladkaIkonka } from './VkladkaIkonka';
import { EmptyState, Modal, Tabs } from '@/components/ui';
import type { ExamSection, TheoryBlock } from '@/content/sections';
import { markSectionRead } from '@/lib/theoryRead';
import { TopicContents } from './TopicContents';
import { TutorMenu } from './TutorMenu';

export interface TopicTabsProps {
  /** Вкладка «О задании» целиком: собрана на сервере. */
  about: ReactNode;
  /** Разделы теории: они же пункты содержания. */
  theory: TheoryBlock[];
  /**
   * Заголовки разделов готовыми узлами по идентификатору раздела:
   * в них могут стоять переменные, набранные KaTeX на сервере.
   * Раздела нет в наборе — печатается строка из конфига, как было.
   */
  titles?: Record<string, ReactNode>;
  /**
   * Вкладка «Ключевые методы решения»: собрана на сервере. Не задана —
   * вкладки нет: у линейной подтемы её не было и нет.
   */
  methods?: ReactNode;
  /** Экран подготовительных задач: собран на сервере. */
  prep: ReactNode;
  /** Экран тренажёра: собран на сервере. */
  trainer: ReactNode;
  /**
   * Экран генератора: собран на сервере. Не задан — вкладки нет:
   * у семейства без наборов прототипов генерировать нечего.
   */
  generator?: ReactNode;
  /**
   * Адрес вкладки тренажёра: у неё свои адреса, как у подготовки.
   * null — страницы нет, вкладка переключается на месте.
   */
  trainerHref: string | null;
  /** Материалы для репетиторов: подпись кнопки и карточки меню. */
  tutors: ExamSection['tutors'];
  /** Что показать в меню, когда карточек у подтемы нет. */
  tutorsEmpty: { title: string; description: string };
  /** Декор под содержанием: на узком экране не показывается. */
  contentsDecor: ReactNode;
  /** Свёрстанные разделы теории по ключу body из конфига. */
  bodies: Record<string, ReactNode>;
  /**
   * Ключ подтемы в хранилище прочитанных разделов. Задан — раздел
   * засчитывается прочитанным, когда ученик долистал до его конца,
   * и кольцо в шапке считает по этим отметкам. Не задан — ничего не
   * запоминается: так было и остаётся у линейной подтемы.
   */
  trackKey?: string;
  /**
   * Что открыто при заходе. По умолчанию «О задании». Значение
   * 'tutors' — это не вкладка: страница открывается на «О задании»
   * с раскрытым меню материалов.
   */
  initial?: string;
  /**
   * Адрес списка навыков: вкладка подготовительных задач ведёт туда.
   * null — у подтемы такой страницы нет, и вкладка переключается на
   * месте, как «О задании» и «Теория».
   */
  prepHref: string | null;
}

/** Идентификатор блока теории в разметке: по нему работают якоря. */
function blockId(id: string): string {
  return `theory-${id}`;
}

/** Плавность прокрутки: при «уменьшить движение» переходы мгновенные. */
function motion(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

/* Ширина растушёвки по краям ленты вкладок. То же число стоит в
   topic.css у background-size: под растушёвкой вкладка читалась бы
   наполовину выцветшей, поэтому подводим её с этим отступом. */
const TABS_FADE = 32;

/* Список вкладок лежит в конфиге, как у остальных разделов. Хвост
   адреса здесь не используется: у «О задании», «Теории» и «Генератора»
   своих адресов нет, вкладка переключает содержимое на месте. */
const TABS = VKLADKI_PODTEMY.map((tab) => ({
  id: tab.id,
  label: tab.label,
  ...(tab.icon === undefined ? {} : { icon: <VkladkaIkonka name={tab.icon} /> }),
}));

/**
 * Вкладки страницы темы и содержание к ним.
 *
 * «Для репетиторов» стоит шестым в той же ленте, но это не вкладка:
 * там не раздел, а два файла для скачивания, и кнопка раскрывает
 * меню под собой. Поэтому она лежит рядом с набором вкладок, а не
 * внутри него — иначе обход стрелками обещал бы переключение
 * содержимого, которого не происходит.
 *
 * Содержание темы на широком экране — правая колонка, ниже 1024px —
 * кнопка и шторка. Список в обоих случаях один и тот же.
 */
export function TopicTabs({
  about,
  theory,
  titles,
  methods,
  prep,
  trainer,
  generator,
  trainerHref,
  tutors,
  tutorsEmpty,
  contentsDecor,
  bodies,
  trackKey,
  initial = 'about',
  prepHref,
}: TopicTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  /* Заход по адресу /dlya-repetitorov/ открывает ту же страницу темы
     с раскрытым меню: вкладка при этом обычная, первая. */
  const opensMenu = initial === 'tutors';
  const [tab, setTab] = useState(opensMenu ? 'about' : initial);
  const [menu, setMenu] = useState(opensMenu);
  /* Вкладки без содержимого в ленту не попадают: «Генератор» — без
     наборов прототипов, «Ключевые методы» — без признака у подтемы. */
  const tabs = TABS.filter(
    (item) =>
      (item.id !== 'generator' || generator !== undefined) &&
      (item.id !== 'methods' || methods !== undefined),
  );

  /* У подготовительных задач и тренажёра свои адреса. Поэтому такая
     вкладка не переключает состояние, а ведёт туда: иначе изнутри
     по ней было не вернуться — вкладка там уже выбрана, менять
     нечего. Адреса нет (закрытая подтема) — вкладка переключается
     на месте и показывает пустое состояние. */
  function choose(id: string) {
    /* Переход на любую вкладку закрывает меню материалов. */
    setMenu(false);
    const href = id === 'prep' ? prepHref : id === 'trainer' ? trainerHref : null;
    if (href !== null && pathname !== href) {
      router.push(href);
      return;
    }
    setTab(id);
  }

  /* Раздел, на котором стоит страница: сначала первый, дальше тот,
     что виден на экране. */
  const [block, setBlock] = useState(theory[0]?.id ?? '');
  const [sheet, setSheet] = useState(false);
  /* Лента вкладок прокручивается вбок: нужен сам узел, чтобы подводить
     к активной вкладке. */
  const strip = useRef<HTMLDivElement>(null);

  const current = theory.find((item) => item.id === block) ?? theory[0];
  /* Заголовок раздела печатается в трёх местах: в самом разделе,
     в содержании и в полоске над текстом. Узел один на все три. */
  const titleOf = (item: TheoryBlock): ReactNode => titles?.[item.id] ?? item.title;
  const items = theory.map((item) => ({ id: item.id, title: titleOf(item) }));

  /* Переход к разделу. Узла может не быть — тогда просто ничего не
     происходит, без ошибки в консоли. */
  const scrollToBlock = useCallback((id: string) => {
    const node = document.getElementById(blockId(id));
    if (node === null) {
      return;
    }
    node.scrollIntoView({ behavior: motion(), block: 'start' });
  }, []);

  function pick(id: string) {
    setBlock(id);
    setSheet(false);
    /* Шторка закрывается той же отрисовкой: прокрутка идёт следующим
       кадром, когда блокировка прокрутки уже снята. */
    requestAnimationFrame(() => scrollToBlock(id));
  }

  /* Активная вкладка не должна оставаться за кромкой ленты. Сдвиг
     считается по самой ленте, а не через scrollIntoView: тот утянул бы
     за собой и страницу по вертикали. */
  const firstRun = useRef(true);
  useEffect(() => {
    const node = strip.current;
    const wasFirst = firstRun.current;
    firstRun.current = false;
    /* Заход по адресу материалов подвёл ленту к своей кнопке: на узком
       экране она и активная вкладка разом не помещаются, и подводить
       ленту обратно значило бы прятать раскрытое меню. */
    if (node === null || (wasFirst && opensMenu)) {
      return;
    }
    const item = node.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    if (item === null) {
      return;
    }

    const box = node.getBoundingClientRect();
    const rect = item.getBoundingClientRect();
    let shift = 0;
    if (rect.left < box.left + TABS_FADE) {
      shift = rect.left - box.left - TABS_FADE;
    } else if (rect.right > box.right - TABS_FADE) {
      shift = rect.right - box.right + TABS_FADE;
    }
    if (shift !== 0) {
      node.scrollBy({ left: shift, behavior: motion() });
    }
  }, [tab, opensMenu]);

  /* Подсветка в содержании следует за экраном. Наблюдатель видимости
     дешевле обработчика прокрутки: браузер считает пересечения сам. */
  useEffect(() => {
    if (tab !== 'theory' || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    const nodes = theory
      .map((item) => document.getElementById(blockId(item.id)))
      .filter((node): node is HTMLElement => node !== null);
    if (nodes.length === 0) {
      return undefined;
    }

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visible.add(entry.target.id);
          } else {
            visible.delete(entry.target.id);
          }
        });
        /* Активным считается верхний из видимых: так подсветка не
           прыгает, когда в полосе видно два раздела сразу. */
        const top = theory.find((item) => visible.has(blockId(item.id)));
        if (top !== undefined) {
          setBlock(top.id);
        }
      },
      /* Полоса наблюдения — верхняя треть экрана: раздел становится
         активным, когда его заголовок доходит до неё. */
      { rootMargin: '-72px 0px -66% 0px' },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [tab, theory]);

  /* Прочитанные разделы. Раздел засчитывается, когда ученик долистал
     до его конца: нижний край поднялся выше середины экрана. Считаем
     сами при прокрутке, а не наблюдателем видимости: наблюдатель
     сообщает только о смене состояния, и разделы, пролистанные
     одним махом, он пропускает. Семь измерений на кадр прокрутки
     дешевле, чем неверный счёт.

     При открытии вкладки не считается ничего: пока ученик не тронул
     страницу, прочитанных разделов у него нет. */
  useEffect(() => {
    if (tab !== 'theory' || trackKey === undefined) {
      return undefined;
    }
    const key = trackKey;
    const last = theory[theory.length - 1];
    let waiting = false;

    function scan() {
      waiting = false;
      const line = window.innerHeight / 2;
      theory.forEach((item) => {
        const node = document.getElementById(blockId(item.id));
        if (node !== null && node.getBoundingClientRect().bottom <= line) {
          markSectionRead(key, item.id);
        }
      });
      /* Последний раздел кончается вместе со страницей, и выше
         середины экрана его нижний край может не подняться. Низ
         страницы засчитывает его отдельно. */
      const seen = window.scrollY + window.innerHeight;
      if (last !== undefined && seen >= document.documentElement.scrollHeight - 4) {
        markSectionRead(key, last.id);
      }
    }

    function onScroll() {
      if (waiting) {
        return;
      }
      waiting = true;
      requestAnimationFrame(scan);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [tab, theory, trackKey]);

  return (
    <>
      {/* Лента вкладок: ниже 1024px она прокручивается вбок, тени по
          краям показывают, что прокручивать есть куда. Ленту держит
          меню материалов: оно висит под кнопкой и не должно попасть
          под подрезку прокрутки. */}
      <TutorMenu
        items={tutors.items}
        label={tutors.title}
        empty={tutorsEmpty}
        open={menu}
        onOpenChange={setMenu}
        stripRef={strip}
      >
        <Tabs
          className="tabs--lenta"
          items={tabs}
          value={tab}
          onValueChange={choose}
          label="Разделы темы"
        />
      </TutorMenu>

      <div className={tab === 'theory' ? 'topic-body topic-body--theory' : 'topic-body'}>
        <div className="topic-panel">
          {tab === 'about' ? about : null}

          {tab === 'theory' ? (
            <>
              {/* Кнопка появляется только здесь: на других вкладках
                  содержание ни к чему. Ниже 1024px она заменяет
                  правую колонку, выше — скрыта разметкой. */}
              <div className="topic-open">
                <button
                  type="button"
                  className="btn btn--secondary topic-open__btn"
                  onClick={() => setSheet(true)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M4 7h16M4 12h16M4 17h10" />
                  </svg>
                  Содержание
                </button>
                {current !== undefined ? (
                  <span className="topic-open__now">{titleOf(current)}</span>
                ) : null}
              </div>

              {theory.length === 0 ? (
                <EmptyState
                  title="Материал готовится"
                  description="Разделы теории этого типа функции ещё не собраны."
                />
              ) : (
                <div className="theory">
                  {theory.map((item) => (
                    <article className="theory-block" id={blockId(item.id)} key={item.id}>
                      <h3 className="t-h3 theory-block__title">
                        {/* Кружок — часть содержимого раздела, со списком
                            содержания его нумерация не связана. */}
                        {item.badge !== undefined ? (
                          <span className="theory-block__no" aria-hidden="true">
                            {item.badge}
                          </span>
                        ) : null}
                        {titleOf(item)}
                      </h3>
                      {item.body !== undefined && bodies[item.body] !== undefined ? (
                        bodies[item.body]
                      ) : item.content === null ? (
                        /* Ненаписанных разделов подряд тринадцать: каждому
                           по большому пустому экрану — это стена из
                           одинаковых картинок. Здесь довольно строки. */
                        <p className="theory-block__soon">Материал готовится</p>
                      ) : (
                        <p className="theory-block__text">{item.content}</p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </>
          ) : null}

          {tab === 'methods' ? methods : null}

          {tab === 'prep' ? prep : null}

          {tab === 'trainer' ? trainer : null}

          {tab === 'generator' ? generator : null}
        </div>

        {/* Правая колонка: только на вкладке теории и только от 1024px —
            ниже её прячет разметка, а список открывает шторка. */}
        {tab === 'theory' ? (
          <aside className="topic-side" aria-label="Содержание темы">
            <h3 className="topic-side__title">Содержание</h3>
            <TopicContents items={items} active={block} onSelect={pick} />
            {contentsDecor}
          </aside>
        ) : null}
      </div>

      {/* Шторка: то же окно, что и на выборе типа функции. Своего
          компонента для неё в проекте нет и не заводится. */}
      <Modal
        open={sheet}
        onClose={() => setSheet(false)}
        className="contents-sheet"
        closeLabel="Закрыть содержание"
        title="Содержание"
        description="Выберите раздел темы"
      >
        <TopicContents items={items} active={block} onSelect={pick} />
      </Modal>
    </>
  );
}
