import { yarlyki } from '@/components/tasks/veroyatnost/navyki';
import { findSection, findSubtopic } from '@/content/sections';
import { subtopicBuilt } from '@/data/functionTypes';
import { taskName } from '@/content/tasks';
import { findTrainerShortcut, trainerShortcutIds } from '@/content/trainerModes';
import { href } from '@/lib/paths';
import { primery12, primeryZadaniya } from '@/lib/primery/primery';
import { bank4Pool, bank5Pool } from '@/lib/veroyatnost/pool';
import { tekstBezTex } from '@/lib/tekstFormul';
import type { VidBloka } from '@/content/opisanieBlokov';
import { OpisanieTrenazhera, type SsylkaBloka } from './OpisanieTrenazhera';
import { O_ZADANII_1 } from '@/content/zadanie1';

/*
 * Блок стоит у тренажёров и генераторов первой части (1–13): у них
 * краткий ответ, который тренажёр проверяет сам. Вкладки-заглушки
 * («Материал готовится») в ссылки не попадают: теория №8 пока пуста.
 */
const S_TEORIEY = new Set([1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 13]);

function ssylkiRazdela(no: number, vid: VidBloka): SsylkaBloka[] {
  const base = `/zadaniya/${no}`;
  const out: SsylkaBloka[] = [];
  if (no === 12) {
    const section = findSection('12');
    for (const sub of section?.subtopics ?? []) {
      if (subtopicBuilt(sub)) out.push({ href: href(base, sub.id), label: sub.title });
    }
    if (vid !== 'trenazher')
      out.push({ href: href(base, 'trenazher'), label: 'Тренажёр по всем типам' });
    if (vid !== 'generator')
      out.push({ href: href(base, 'generator'), label: 'Генератор по всем типам' });
    return out;
  }
  out.push({ href: href(base), label: `О задании ${no}` });
  if (S_TEORIEY.has(no)) out.push({ href: href(base, 'teoriya'), label: `Теория задания ${no}` });
  out.push({ href: href(base, 'opornye-zadachi'), label: 'Опорные задачи с решениями' });
  if (vid !== 'trenazher') out.push({ href: href(base, 'trenazher'), label: 'Тренажёр' });
  if (vid !== 'generator')
    out.push({ href: href(base, 'generator'), label: 'Генератор вариантов' });
  /* Типы №1 «только в тренажёре»: на «О задании» их карточек нет, разбор — отсюда. */
  if (no === 1 && vid === 'trenazher') {
    for (const tip of O_ZADANII_1.tipy.filter((t) => t.tolkoTrenazher === true)) {
      out.push({ href: href(base, 'razbor', tip.id), label: `Разбор: ${tekstBezTex(tip.title)}` });
    }
  }
  out.push({ href: '/variant/', label: 'Собрать вариант из всех заданий' });
  return out;
}

function rezhimy45(no: 4 | 5): SsylkaBloka[] {
  return yarlyki(no === 4 ? bank4Pool() : bank5Pool(), no).map((y) => ({
    href: `/zadaniya/${no}/trenazher/${y.id}/`,
    label: tekstBezTex(y.title),
  }));
}

/** Блок вкладки раздела: тренажёр или генератор задания `no`. */
export function BlokRazdela({ no, vid }: { no: number; vid: 'trenazher' | 'generator' }) {
  const rezhimy = vid === 'trenazher' && (no === 4 || no === 5) ? rezhimy45(no) : undefined;
  return (
    <OpisanieTrenazhera
      no={no}
      vid={vid}
      primery={primeryZadaniya(no, 3)}
      ssylki={ssylkiRazdela(no, vid)}
      {...(rezhimy === undefined ? {} : { rezhimy })}
      href={`/zadaniya/${no}/${vid}/`}
      nazvanie={`${vid === 'trenazher' ? 'Тренажёр' : 'Генератор'} задания ${no} ЕГЭ: ${taskName(String(no))}`}
    />
  );
}

/** Блок тренажёра подраздела №12 (тип функции): режимы, тетрадь, работа над ошибками. */
export function BlokPodrazdela12({ type }: { type: string }) {
  const sub = findSubtopic('12', type);
  if (sub === undefined) return null;
  const base = `/zadaniya/12/${type}`;
  const rezhimy = trainerShortcutIds(type).flatMap((id) => {
    const r = findTrainerShortcut(type, id);
    return r === undefined
      ? []
      : [{ href: href(base, 'trenazher', id), label: tekstBezTex(r.title) }];
  });
  const ssylki: SsylkaBloka[] = [
    { href: href(base), label: `${sub.title}: теория` },
    { href: href(base, 'opornye-zadachi'), label: 'Опорные задачи с решениями' },
    { href: href(base, 'tetrad'), label: 'Интерактивная тетрадь' },
    { href: href(base, 'oshibki'), label: 'Работа над ошибками' },
    { href: href(base, 'dlya-repetitorov'), label: 'Для репетиторов' },
    { href: '/zadaniya/12/', label: 'Все типы функций задания 12' },
  ];
  return (
    <OpisanieTrenazhera
      no={12}
      vid="trenazher"
      primery={primery12(type)}
      ssylki={ssylki}
      rezhimy={rezhimy}
      href={`${base}/trenazher/`}
      nazvanie={`Тренажёр задания 12 ЕГЭ: ${sub.title.toLowerCase()}`}
    />
  );
}

/** Блок «Собрать вариант»: примеры из разных заданий первой части. */
export function BlokVarianta() {
  const primery = [1, 7, 13].flatMap((no) => primeryZadaniya(no, 1));
  return (
    <OpisanieTrenazhera
      no={0}
      vid="variant"
      primery={primery}
      ssylki={[
        { href: '/zadaniya/', label: 'Банк заданий по номерам' },
        { href: '/povyshennye/', label: 'Варианты повышенной сложности' },
        { href: '/ezhemesyachnye/', label: 'Ежемесячные варианты' },
      ]}
      href="/variant/"
    />
  );
}
