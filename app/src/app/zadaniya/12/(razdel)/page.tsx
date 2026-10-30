import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { katex } from '@/lib/graph/katex';
import { ikonkaRazdela } from '@/components/tasks/razdely/ikonka';
import {
  OZadanii12,
  type PrototypeView,
  type TipFunkciiView,
} from '@/components/tasks/zadanie12/OZadanii12';
import { bankSets, findSection, type Subtopic } from '@/content/sections';
import { subtopicBuilt } from '@/data/functionTypes';
import { href, ZADANIYA } from '@/lib/paths';
import { typeset } from '@/lib/tex';

const section = findSection('12');

export const metadata: Metadata =
  section === undefined
    ? {}
    : {
        title: `${section.title}. ${section.subtitle} — Будет на ЕГЭ`,
        description: section.description,
      };

/* Формулы вёрстываются на сборке: в браузер уходит готовая разметка,
   а не библиотека ради шести постоянных строк. */
function formulaHtml(tex: string): string {
  return katex.renderToString(tex, { throwOnError: false, displayMode: false });
}

function toView(sectionSlug: string, subtopic: Subtopic): TipFunkciiView {
  return {
    slug: subtopic.id,
    name: subtopic.title,
    caption: subtopic.graphName,
    icon: ikonkaRazdela(sectionSlug, subtopic.icon),
    formulaHtml: formulaHtml(subtopic.formula),
    status: subtopic.status,
    /* Ссылка есть у собранной подтемы: открытой или в предпросмотре. */
    href: subtopicBuilt(subtopic) ? href(ZADANIYA, sectionSlug, subtopic.id) : null,
  };
}

/** Вкладка «О задании» живёт на адресе самого раздела, как у №9–11. */
export default function OZadanii12Tab() {
  if (section === undefined) {
    notFound();
  }
  const tipy = section.subtopics.map((item) => toView(section.slug, item));

  /* Прототипы собираются из наборов движка по всем подтемам раздела.
     Числа берутся из состава наборов и нигде не записаны руками. */
  const seen = new Set<string>();
  const prototypes: PrototypeView[] = section.subtopics.flatMap((subtopic) =>
    bankSets(subtopic)
      .filter((set) => set.kind === 'prototype' && !seen.has(set.id) && seen.add(set.id))
      .map((set) => ({
        id: set.id,
        title: set.title,
        subtitle: set.subtitle,
        /* Формулы в названиях наборов ($…$) набираются здесь, на сборке. */
        titleHtml: typeset(set.title),
        subtitleHtml: typeset(set.subtitle),
        count: set.count,
      })),
  );

  return <OZadanii12 tipy={tipy} prototypes={prototypes} />;
}
