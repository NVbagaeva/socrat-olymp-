'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { Modal } from '@/components/ui';
import { TopicContents } from '@/components/tasks/TopicContents';
import { SODERZHANIE, type TeoriyaRazdel } from '@/content/veroyatnost-teoriya';

export interface TeoriyaShellProps {
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
export function TeoriyaShell({ razdely, tela }: TeoriyaShellProps) {
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

  const spisok = <TopicContents items={[...razdely]} active={aktivnyy} onSelect={vybrat} />;
  const otkryto = razdely.find((razdel) => razdel.id === aktivnyy);

  return (
    <>
      <div className="topic-body topic-body--theory vteor">
        <div className="vteor__main">
          {/* Кнопка содержания — только на узком экране, вместо колонки. */}
          <div className="topic-open">
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
            {otkryto === undefined ? null : (
              <span className="topic-open__now">{otkryto.title}</span>
            )}
          </div>

          {razdely.map((razdel) => (
            <article className="vteor-razdel" id={razdelId(razdel.id)} key={razdel.id}>
              {tela[razdel.id] ?? (
                /* Ненаписанных разделов подряд четыре: каждому по
                   большому пустому экрану — это стена из одинаковых
                   картинок. Здесь довольно заголовка и строки. */
                <>
                  <h2 className="vteor-razdel__title">{razdel.title}</h2>
                  <p className="vteor-razdel__soon">{SODERZHANIE.gotovitsya}</p>
                </>
              )}
            </article>
          ))}
        </div>

        <aside className="topic-side" aria-label={SODERZHANIE.title}>
          <h2 className="topic-side__title">{SODERZHANIE.title}</h2>
          <p className="vteor-side__lead">{SODERZHANIE.lead}</p>
          {spisok}
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
