'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import { EmptyState, HandNote, Modal } from '@/components/ui';
import { TopicContents } from '@/components/tasks/TopicContents';
import { SODERZHANIE, TEORIYA_DEKOR, type TeoriyaRazdel } from '@/content/veroyatnost-teoriya';

export interface TeoriyaShellProps {
  /** Название вкладки — заголовок панели (H2). */
  vkladka: string;
  razdely: readonly TeoriyaRazdel[];
  /** Готовые тела разделов по идентификатору. Нет тела — «Материал готовится». */
  tela: Record<string, ReactNode>;
}

/** Якорь раздела на странице. */
function razdelId(id: string): string {
  return `teoriya-${id}`;
}

/** Плавность прокрутки: при «уменьшить движение» переход мгновенный. */
function motion(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

/**
 * Вкладка «Теория»: разделы подряд и содержание рядом.
 *
 * Разделы лежат на одной странице, а содержание подводит к нужному:
 * так же устроена теория задания №12, и список, его стили и шторка
 * взяты оттуда без копий (TopicContents, .topic-side, .topic-body).
 *
 * От 1024 содержание стоит правой колонкой и липнет при прокрутке,
 * ниже — прячется, а его открывает кнопка. Раздел без тела не
 * пропадает из содержания: он есть в плане темы, просто ещё не
 * написан, и говорит об этом строкой.
 */
export function TeoriyaShell({ vkladka, razdely, tela }: TeoriyaShellProps) {
  const pervyy = razdely[0]?.id ?? '';
  const [aktivnyy, setAktivnyy] = useState(pervyy);
  const [shtorka, setShtorka] = useState(false);

  const scrollTo = useCallback((id: string) => {
    const node = document.getElementById(razdelId(id));
    if (node === null) {
      return;
    }
    node.scrollIntoView({ behavior: motion(), block: 'start' });
  }, []);

  function vybrat(id: string): void {
    setAktivnyy(id);
    setShtorka(false);
    /* Шторка закрывается той же отрисовкой: прокрутка идёт следующим
       кадром, когда блокировка прокрутки уже снята. */
    requestAnimationFrame(() => scrollTo(id));
  }

  /* Полоска содержания липнет под липкой лентой вкладок, колонка
     содержания на широком экране — тоже, а заголовок раздела при
     переходе по содержанию должен встать под обе полосы. Высоты у них
     не постоянные: на узком экране подпись вкладки переносится на две
     строки, и лента растёт; на широком полоски нет вовсе. Числом из
     токена их брать нельзя — лента однажды уже переросла такое число,
     и верх полоски уходил под неё. Поэтому обе высоты измеряются и
     живут свойствами на панели вкладки — общем предке полоски,
     разделов и колонки: --tabs-bar-height у ленты, --contents-bar-height
     у полоски (ноль, пока она спрятана). */
  const polosa = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const uzel = polosa.current;
    const panel = uzel?.parentElement ?? null;
    const lenta = document.querySelector('.topic-tabs-row');
    if (uzel === null || panel === null || lenta === null) {
      return undefined;
    }
    const vysota = (element: Element) => `${Math.round(element.getBoundingClientRect().height)}px`;
    const obnovit = () => {
      panel.style.setProperty('--tabs-bar-height', vysota(lenta));
      panel.style.setProperty('--contents-bar-height', vysota(uzel));
    };
    obnovit();
    const nablyudatel = new ResizeObserver(obnovit);
    nablyudatel.observe(lenta);
    nablyudatel.observe(uzel);
    return () => {
      nablyudatel.disconnect();
      panel.style.removeProperty('--tabs-bar-height');
      panel.style.removeProperty('--contents-bar-height');
    };
  }, []);

  const spisok = <TopicContents items={[...razdely]} active={aktivnyy} onSelect={vybrat} />;
  const otkryto = razdely.find((razdel) => razdel.id === aktivnyy);

  return (
    <>
      {/* Название вкладки — H2 панели: заголовок задания (H1) один на
          все вкладки и живёт в шапке раздела. Разделы теории — на
          уровень ниже. */}
      <h2 className="t-h2 vtab__title">{vkladka}</h2>

      {/* Кнопка содержания — только на узком экране, вместо колонки.
          Стоит над сеткой, а не первой ячейкой в ней: в сетке её
          липкость не работала бы — ячейка ростом с саму кнопку, и
          ездить внутри неё некуда. Здесь же кнопка липнет вдоль всей
          панели вкладки. */}
      <div className="topic-open vteor-open" ref={polosa}>
        <button
          type="button"
          className="topic-open__btn btn btn--secondary btn--sm"
          onClick={() => setShtorka(true)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M4 7h16M4 12h16M4 17h10" />
          </svg>
          {SODERZHANIE.title}
        </button>
        {otkryto === undefined ? null : <span className="topic-open__now">{otkryto.title}</span>}
      </div>

      <div className="topic-body topic-body--theory vteor">
        <div className="vteor__main">
          {/* Заголовок с номером рисует оболочка, а не сам раздел:
              номер — это место в содержании, и при переносе раздела
              в соседнее задание он должен пересчитаться сам.
              Ненаписанный раздел не пропадает — он есть в плане темы
              и говорит о себе строкой. */}
          {razdely.map((razdel, i) => (
            <article className="vteor-razdel" id={razdelId(razdel.id)} key={razdel.id}>
              <h3 className="vteor-razdel__title">
                <span className="vteor-razdel__no" aria-hidden="true">
                  {i + 1}
                </span>
                {razdel.title}
              </h3>
              {tela[razdel.id] ?? (
                <EmptyState
                  title={SODERZHANIE.gotovitsya}
                  description={SODERZHANIE.gotovitsyaText}
                />
              )}
            </article>
          ))}
        </div>

        <aside className="topic-side" aria-label={SODERZHANIE.title}>
          <h3 className="topic-side__title">{SODERZHANIE.title}</h3>
          <p className="vteor-side__lead">{SODERZHANIE.lead}</p>
          {spisok}

          {/* Картинка с подписью под содержанием — из макета: колонка
              не обрывается списком. На узком экране колонки нет, и
              декор не показывается вовсе. */}
          <div className="vteor-side__decor" aria-hidden="true">
            <Image
              className="vteor-side__kartinka"
              src={TEORIYA_DEKOR.src}
              alt={TEORIYA_DEKOR.alt}
              width={TEORIYA_DEKOR.width}
              height={TEORIYA_DEKOR.height}
            />
            <HandNote className="topic-side__note">{TEORIYA_DEKOR.note}</HandNote>
          </div>
        </aside>
      </div>

      {/* Шторка: то же окно, что у содержания задания №12. */}
      <Modal
        open={shtorka}
        onClose={() => setShtorka(false)}
        className="contents-sheet"
        closeLabel="Закрыть содержание"
        title={SODERZHANIE.title}
        description={SODERZHANIE.lead}
      >
        {spisok}
      </Modal>
    </>
  );
}
