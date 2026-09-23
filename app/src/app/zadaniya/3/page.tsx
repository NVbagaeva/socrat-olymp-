import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { ShapkaRazdela } from '@/components/tasks/ShapkaRazdela';
import { Solid } from '@/components/solid/Solid';
import { SubtopicCard } from '@/components/tasks/SubtopicCard';
import { HandNote } from '@/components/ui';
import { stereometria } from '@/content/stereometria';
import { tasksPage } from '@/content/tasks';
import { RAZDELY } from '@/lib/zadanie3';
import { THUMBS } from '@/lib/solid/drawings';
import { type Model } from '@/lib/solid';
import '@/lib/solid/solid.css';
import '../zadaniya.css';
import '../[task]/section.css';
import './stereometria.css';

export const metadata: Metadata = {
  title: `${stereometria.title}. ${stereometria.subtitle} — Будет на ЕГЭ`,
  description: stereometria.lead,
};

/* Миниатюра раздела: чертёж движка, тот же, что в банке чертежей.
   Ключ собирается из римского номера, поэтому новый раздел не
   требует ни строчки здесь. */
function thumb(nomer: string): Model {
  const model = THUMBS[`thumb-${nomer}`];
  if (model === undefined) {
    throw new Error(`Нет миниатюры раздела ${nomer}`);
  }
  return model;
}

/** «1 прототип», «3 прототипа», «21 прототип». */
function protoWord(count: number): string {
  const tens = count % 100;
  const ones = count % 10;
  if (tens >= 11 && tens <= 14) {
    return 'прототипов';
  }
  if (ones === 1) {
    return 'прототип';
  }
  return ones >= 2 && ones <= 4 ? 'прототипа' : 'прототипов';
}

export default function Stereometria3Page() {
  /* Число прототипов и вариантов считается по банку. Руками эти
     числа не записаны нигде: раздел вырастет — вырастут и они. */
  const total = RAZDELY.reduce((sum, razdel) => sum + razdel.prototipy.length, 0);

  return (
    <AppShell active="tasks">
      <main className="app-main">
        <ShapkaRazdela
          crumbs={[
            { label: 'Главная', href: '/' },
            { label: 'Банк заданий', href: tasksPage.href },
            { label: `№${Number(stereometria.no)}` },
          ]}
          title={stereometria.title}
          badge={stereometria.badge}
          lead={stereometria.lead}
          media={
            <>
              <Solid model={thumb('VIII')} />
              <HandNote className="section-head__note">{stereometria.note}</HandNote>
            </>
          }
        />

        <h2 className="t-h2 solid3-title">Разделы задачника</h2>
        <p className="solid3-lead">
          Всего {total} {protoWord(total)} в восьми разделах.
        </p>

        <ul className="subtopics-grid subtopics-grid--figures">
          {RAZDELY.map((razdel) => (
            <li key={razdel.slug}>
              <SubtopicCard
                name={razdel.nazvanie}
                href={`${tasksPage.href}/${stereometria.slug}/${razdel.slug}`}
                media={<Solid model={thumb(razdel.nomer)} />}
                meta={
                  <>
                    <span className="subtopic__no">Раздел {razdel.nomer}</span>
                    <span className="subtopic__count">
                      {razdel.prototipy.length} {protoWord(razdel.prototipy.length)}
                    </span>
                  </>
                }
              />
            </li>
          ))}
        </ul>

        {/* Домашняя работа живёт отдельной страницей и остаётся
            рабочей: в новом разделе отчёта учителю пока нет, и
            терять его нельзя. Ссылка, а не перенаправление. */}
        <a className="solid3-hw" href={stereometria.homework.href}>
          <span className="solid3-hw__text">
            <span className="solid3-hw__title">{stereometria.homework.title}</span>
            <span className="solid3-hw__lead">{stereometria.homework.lead}</span>
          </span>
          <span className="solid3-hw__go" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M5 12h13M12 6l6 6-6 6" />
            </svg>
          </span>
        </a>
      </main>
    </AppShell>
  );
}
