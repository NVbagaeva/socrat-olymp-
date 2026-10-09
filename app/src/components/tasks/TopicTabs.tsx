'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import type { ReactNode } from 'react';
import { VKLADKI_PODTEMY } from '@/content/vkladki';
import { VkladkaIkonka } from './VkladkaIkonka';
import { EmptyState, Modal, Tabs } from '@/components/ui';
import type { ExamSection, TheoryBlock } from '@/content/sections';
import { markSectionRead } from '@/lib/theoryRead';
import { READ_DWELL_MS } from '@/lib/topicProgress';
import { ReadMark } from './ReadMark';
import { TitleText } from './TitleText';
import { TopicContents } from './TopicContents';
import { scrollToSection, useActiveSection } from './useActiveSection';
import { TutorMenu } from './TutorMenu';
import { useStickyTabs } from './useStickyTabs';
import { TAB_TAP_SCRIPT, takePendingTabTap } from '@/lib/tabTap';
import { hasActiveScope, scopeOfPath } from '@/lib/trainerSession/scope';
import { useActiveTrainerScopes } from '@/lib/trainerSession/store';
import { sessionText } from './session/text';

export interface TopicTabsProps {
  /** Вкладка «О задании» целиком: собрана на сервере. */
  about: ReactNode;
  /** Разделы теории: они же пункты содержания. */
  theory: TheoryBlock[];
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
   * Ключ прочитанных разделов теории: «theory:12:rational». Раздел
   * засчитывается, когда ученик долистал до его конца и раздел пробыл
   * на экране не меньше READ_DWELL_MS; кольцо в шапке считает по этим
   * отметкам. Не задан — ничего не запоминается.
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
  /* Вкладка, на которую нажали и ведёт переход на её адрес; пока он едет — ожидание. */
  const [target, setTarget] = useState<string | null>(null);
  const [navigating, startNavigation] = useTransition();
  /* Вкладки без содержимого в ленту не попадают: «Генератор» — без
     наборов прототипов, «Ключевые методы» — без признака у подтемы. */
  const tabs = TABS.filter(
    (item) =>
      (item.id !== 'generator' || generator !== undefined) &&
      (item.id !== 'methods' || methods !== undefined),
  );
  /* Метка на «Тренажёре»: в нём осталась незавершённая тренировка. */
  const active = useActiveTrainerScopes();
  const trainerActive = trainerHref !== null && hasActiveScope(active, scopeOfPath(trainerHref));
  const marked = tabs.map((item) =>
    item.id === 'trainer' && trainerActive ? { ...item, badge: sessionText.menuDot } : item,
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
      /* Переход в переходе (transition): пока страница-назначение едет по
         сети, вкладка уже подсвечена и на ней крутится ожидание. */
      setTarget(id);
      startNavigation(() => {
        router.push(href);
      });
      return;
    }
    setTab(id);
  }

  /* Нажатие, сделанное до того, как страница ожила, исполняется здесь:
     повторно жать не нужно (lib/tabTap.ts). Один раз при загрузке. */
  useEffect(() => {
    const pending = takePendingTabTap();
    if (pending !== null && tabs.some((item) => item.id === pending)) {
      /* Сразу после отрисовки, а не внутри эффекта: так состояние
         меняется обычным порядком. */
      queueMicrotask(() => choose(pending));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- только при загрузке
  }, []);

  /* Раздел, на котором стоит страница: сначала первый, дальше тот,
     что виден на экране. */
  const [block, setBlock] = useState(theory[0]?.id ?? '');
  const [sheet, setSheet] = useState(false);
  /* Лента вкладок прокручивается вбок: нужен сам узел, чтобы подводить
     к активной вкладке. */
  const strip = useRef<HTMLDivElement>(null);
  /* Лента прилипает к верху экрана (общий хук всех разделов). */
  useStickyTabs(strip);

  const current = theory.find((item) => item.id === block) ?? theory[0];
  const items = theory.map((item) => ({
    id: item.id,
    title: item.title,
    titleHtml: item.titleHtml,
  }));

  /* Переход к разделу. Узла может не быть — тогда просто ничего не
     происходит, без ошибки в консоли. */
  const scrollToBlock = useCallback((id: string) => {
    const node = document.getElementById(blockId(id));
    if (node === null) {
      return;
    }
    scrollToSection(node);
  }, []);

  function pick(id: string) {
    setBlock(id);
    pinBlock();
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

  /* Подсветка в содержании следует за экраном. */
  const theoryIds = useMemo(() => theory.map((item) => item.id), [theory]);
  const pinBlock = useActiveSection(theoryIds, blockId, tab === 'theory', setBlock);

  /* Прочитанные разделы. Раздел засчитывается, когда ученик долистал
     до его конца — нижний край поднялся выше середины экрана — и раздел
     пробыл на экране не меньше READ_DWELL_MS. Время копится, пока раздел
     хоть краем виден и вкладка браузера открыта; пролистанное одним
     рывком (переход по «Содержанию», клавиша End) его не набирает.
     Считаем сами по таймеру и при прокрутке, а не наблюдателем
     видимости: наблюдатель сообщает только о смене состояния.

     Пустые разделы («Материал готовится») в счёт не идут. При открытии
     вкладки не считается ничего: время только начинает копиться. */
  useEffect(() => {
    if (tab !== 'theory' || trackKey === undefined) {
      return undefined;
    }
    const key = trackKey;
    const counted = theory.filter((item) => item.status !== 'empty');
    const last = counted[counted.length - 1];
    const dwell = new Map<string, number>();
    let before = performance.now();
    let waiting = false;

    function scan() {
      waiting = false;
      const now = performance.now();
      /* Шаг таймера — не больше секунды: после спящей вкладки или
         зависшего кадра время не должно прийти разом. */
      const step = document.hidden ? 0 : Math.min(now - before, 1000);
      before = now;
      const line = window.innerHeight / 2;
      const seen = window.scrollY + window.innerHeight;
      const bottom = seen >= document.documentElement.scrollHeight - 4;
      counted.forEach((item) => {
        const node = document.getElementById(blockId(item.id));
        if (node === null) {
          return;
        }
        const rect = node.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          dwell.set(item.id, (dwell.get(item.id) ?? 0) + step);
        }
        /* Последний раздел кончается вместе со страницей, и выше
           середины экрана его нижний край может не подняться. Низ
           страницы засчитывает его отдельно. */
        const ended = rect.bottom <= line || (item === last && bottom);
        if (ended && (dwell.get(item.id) ?? 0) >= READ_DWELL_MS) {
          markSectionRead(key, item.id);
        }
      });
    }

    function onScroll() {
      if (waiting) {
        return;
      }
      waiting = true;
      requestAnimationFrame(scan);
    }

    const timer = window.setInterval(scan, 500);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.clearInterval(timer);
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
          items={marked}
          value={navigating && target !== null ? target : tab}
          {...(navigating && target !== null ? { busyId: target } : {})}
          onValueChange={choose}
          label="Разделы темы"
        />
      </TutorMenu>

      {/* Нажатие на вкладку до загрузки кода не теряется (lib/tabTap.ts).
          Вставка стоит сразу за лентой, а не в начале страницы: скрипт
          в начале блокирует разбор и откладывает показ самой ленты на
          секунду на слабой сети. */}
      <script dangerouslySetInnerHTML={{ __html: TAB_TAP_SCRIPT }} />

      <div className={tab === 'theory' ? 'topic-body topic-body--theory' : 'topic-body'}>
        <div className={navigating ? 'topic-panel is-loading' : 'topic-panel'}>
          {tab === 'about' ? about : null}

          {tab === 'theory' ? (
            <>
              {/* Кнопка появляется только здесь: на других вкладках
                  содержание ни к чему. Ниже 1024px она заменяет
                  правую колонку, выше — скрыта разметкой. */}
              <div className="topic-open">
                <button
                  type="button"
                  className="btn btn--secondary btn--sm topic-open__btn"
                  onClick={() => setSheet(true)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M4 7h16M4 12h16M4 17h10" />
                  </svg>
                  Содержание
                </button>
                {current !== undefined ? (
                  <span className="topic-open__now">
                    <TitleText title={current.title} html={current.titleHtml} />
                  </span>
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
                        <TitleText title={item.title} html={item.titleHtml} />
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
                  {/* Отметить всю теорию разом — тому, кто прочитал её
                      раньше или читал не подряд. */}
                  {trackKey === undefined ? null : (
                    <ReadMark
                      storeKey={trackKey}
                      ids={theory.filter((item) => item.status !== 'empty').map((item) => item.id)}
                      done="Теория прочитана"
                    />
                  )}
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
