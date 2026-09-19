import type { ReactNode } from 'react';
import Image from 'next/image';
import { HandNote } from '@/components/ui';
import { TopicContents } from '@/components/tasks/TopicContents';
import {
  RAZDELY_TEORII_4,
  RAZDEL_GOTOVITSYA,
  TEORIYA_DEKOR_4,
} from '@/content/veroyatnost-teoriya-4';
import { TeoriyaPryamaya4 } from './TeoriyaPryamaya4';

/**
 * Вкладка «Теория» задания №4.
 *
 * Разделы лежат на одной странице подряд, содержание рядом подводит
 * к нужному. Раскладка и стили правой колонки взяты у теории
 * задания №12 без копий: тот же TopicContents, те же .topic-body
 * и .topic-side.
 *
 * Страница серверная: формулы набирает KaTeX на сборке, ничего
 * переключать в браузере не нужно — поэтому содержание здесь
 * ссылки-якори, а не кнопки.
 *
 * Ненаписанные разделы из содержания не убраны: план темы виден
 * целиком, а пометка «готовится» честно говорит, чего пока нет.
 */

/** Якорь раздела на странице. */
function yakor(id: string): string {
  return `teoriya-${id}`;
}

/** Готовые тела разделов. Нет тела — раздел ещё не написан. */
const TELA: Record<string, ReactNode> = {
  '03': <TeoriyaPryamaya4 />,
};

export function Teoriya4() {
  const punkty = RAZDELY_TEORII_4.map((razdel) => ({
    id: razdel.id,
    title: razdel.title,
    ...(TELA[razdel.id] === undefined ? { metka: RAZDEL_GOTOVITSYA.metka } : {}),
  }));
  /* Открытым считается первый написанный раздел: он же первый
     на странице. */
  const pervyy = RAZDELY_TEORII_4.find((razdel) => TELA[razdel.id] !== undefined)?.id ?? '';

  return (
    <div className="topic-body topic-body--theory z4-teoriya">
      <div className="topic-panel">
        {RAZDELY_TEORII_4.filter((razdel) => TELA[razdel.id] !== undefined).map((razdel) => (
          <section key={razdel.id} id={yakor(razdel.id)} className="z4-teoriya__razdel">
            {TELA[razdel.id]}
          </section>
        ))}
      </div>

      <aside className="topic-side">
        <h2 className="topic-side__title">Содержание</h2>
        <TopicContents items={punkty} active={pervyy} href={(id) => `#${yakor(id)}`} />

        <div className="topic-side__decor z4-teoriya__decor" aria-hidden="true">
          <Image
            className="z4-teoriya__kartinka"
            src={TEORIYA_DEKOR_4.src}
            alt={TEORIYA_DEKOR_4.alt}
            width={TEORIYA_DEKOR_4.width}
            height={TEORIYA_DEKOR_4.height}
          />
          <HandNote className="topic-side__note">{TEORIYA_DEKOR_4.note}</HandNote>
        </div>
      </aside>
    </div>
  );
}
