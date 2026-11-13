import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Kartochki } from '@/components/kartochki/Kartochki';
import { ProverkaTeorii } from '@/components/kartochki/ProverkaTeorii';
import { TabScrollOnMount } from '@/components/tasks/TabScroll';
import type { GruppaVybora } from '@/components/tasks/trening';
import { Tex } from '@/components/ui/Tex';
import { vkladkaBazy } from '@/content/baza/razdely';
import { taskBase, tasksOf, type ExamTask } from '@/content/tasks';
import { bankRazdela } from '@/lib/baza/bank';
import { razdelBazy } from '@/lib/baza/razdely';
import { sealText, zapechatat } from '@/lib/baza/secret';
import type { BlokOpornyh, RazdelBazy, VkladkaBazy } from '@/lib/baza/types';
import { podgotovit } from '@/lib/kartochki/podgotovka';
import { texPlain, typeset } from '@/lib/tex';
import type { KatalogBanka } from '@/lib/trening/bank';
import { FormatZadaniya, OZadaniiBaza } from './OZadaniiBaza';
import { OPORNYE_BAZY, OpornyeBazyBlok, OpornyeBazySpisok } from './OpornyeBazy';
import { Pusto } from './Pusto';
import { TeoriyaBazy } from './TeoriyaBazy';
import { TrenazherBazy } from './TrenazherBazy';

/**
 * Страницы вкладок задания базы. Маршрут один на все 21 задание
 * (/baza/zadaniya/[task]/…), поэтому страница вкладки — три строки:
 * параметры сборки, заголовок окна и содержимое берутся отсюда.
 * Содержимое — из данных раздела (lib/baza/razdely.ts); нет данных —
 * «Материал готовится».
 */

export type BazaParams = Promise<{ task: string }>;

/* Статический экспорт: собираются страницы только заявленных заданий. */
export function bazaStaticParams() {
  return tasksOf('base').map((task) => ({ task: task.slug }));
}

export function bazaTask(slug: string): ExamTask {
  const task = tasksOf('base').find((t) => t.slug === slug);
  if (task === undefined) notFound();
  return task;
}

/** «Теория · №5. Теория вероятностей (база) — Будет на ЕГЭ». */
export async function bazaMetadata(params: BazaParams, tab: VkladkaBazy): Promise<Metadata> {
  const task = bazaTask((await params).task);
  return {
    title: `${vkladkaBazy(tab).label} · №${Number(task.no)}. ${task.name} (база) — Будет на ЕГЭ`,
  };
}

/* ── Опорные задачи ─────────────────────────────────────────── */

/** Адрес блока опорных задач. */
function blokHref(task: ExamTask, slug: string): string {
  return `${taskBase(task)}/${vkladkaBazy('opornye').tail}${slug}/`;
}

/** Все блоки опорных задач базы: параметры маршрута …/opornye-zadachi/[blok]/. */
export function bazaBlokParams() {
  return tasksOf('base').flatMap((task) =>
    (razdelBazy(task.slug)?.opornye ?? []).flatMap((navyk) =>
      navyk.bloki.map((blok) => ({ task: task.slug, blok: blok.slug })),
    ),
  );
}

function blokPoSlugu(razdel: RazdelBazy | undefined, slug: string): BlokOpornyh | undefined {
  return (razdel?.opornye ?? []).flatMap((n) => n.bloki).find((b) => b.slug === slug);
}

export async function OpornyyBlokPage({
  params,
}: {
  params: Promise<{ task: string; blok: string }>;
}) {
  const { task: slug, blok: blokSlug } = await params;
  const task = bazaTask(slug);
  const blok = blokPoSlugu(razdelBazy(slug), blokSlug);
  if (blok === undefined) notFound();
  return (
    <section className="prep z6-opornye" aria-labelledby="baza-opornye-blok-title">
      <Link
        className="z6-opornye__nazad"
        href={`${taskBase(task)}/${vkladkaBazy('opornye').tail}`}
        scroll={false}
      >
        {OPORNYE_BAZY.kListu}
      </Link>
      <h2 className="stk-h3" id="baza-opornye-blok-title">
        {blok.nazvanie}
      </h2>
      <TabScrollOnMount />
      <OpornyeBazyBlok
        slug={slug}
        blok={blok.slug}
        zapomni={
          <>
            <b>{OPORNYE_BAZY.zapomni}</b> <Tex text={blok.zapomni} />
          </>
        }
        zadachi={blok.zadachi.map((z) => ({
          id: z.id,
          uslovie: z.uslovie,
          podskazka: z.podskazka,
          /* Разбор (в нём есть ответ) закрыт ключом задачи. */
          razbor: sealText(JSON.stringify(z.razbor), z.id),
          seal: zapechatat({ tip: 'chislo', otvet: z.otvet }),
        }))}
      />
    </section>
  );
}

/* ── Вкладки ────────────────────────────────────────────────── */

function Opornye({ task, razdel }: { task: ExamTask; razdel: RazdelBazy }) {
  const navyki = (razdel.opornye ?? []).map((navyk) => ({
    id: navyk.id,
    nazvanie: navyk.nazvanie,
    lead: navyk.lead,
    ton: navyk.ton,
    bloki: navyk.bloki.map((blok) => ({
      slug: blok.slug,
      href: blokHref(task, blok.slug),
      nazvanie: blok.nazvanie,
      znakHtml: typeset(`$${blok.znak}$`),
      zadachi: blok.zadachi.map((z) => z.id),
    })),
  }));
  return (
    <section className="prep z6-opornye" aria-labelledby="baza-opornye-title">
      <header className="kz-razdel__head">
        <h2 className="stk-h3" id="baza-opornye-title">
          {OPORNYE_BAZY.title}
        </h2>
        <p className="stk-lead">{OPORNYE_BAZY.lead}</p>
      </header>
      <TabScrollOnMount />
      <OpornyeBazySpisok slug={task.slug} navyki={navyki} />
    </section>
  );
}

function Trenazher({ task, razdel }: { task: ExamTask; razdel: RazdelBazy }) {
  const prototipy = razdel.prototipy ?? [];
  const bank = bankRazdela(task.slug, prototipy);
  /* Все задачи строит генератор: в каталоге они идут как «не из банка». */
  const katalog: KatalogBanka = Object.fromEntries(
    prototipy.map((p) => [
      p.id,
      { f: [], a: bank.filter((z) => z.prototypeId === p.id).map((z) => z.id) },
    ]),
  );
  const gruppy: GruppaVybora[] = (razdel.gruppy ?? []).map((g) => ({
    id: g.id,
    nazvanie: g.nazvanie,
    znakHtml: typeset(`$${g.znak}$`),
    ton: g.ton,
    tipy: prototipy
      .filter((p) => p.gruppa === g.id)
      .map((p) => ({ id: p.id, nazvanieHtml: `<span>${typeset(p.title)}</span>` })),
  }));
  return (
    <section className="trainer z6-trening trn-host" aria-labelledby="baza-trening-title">
      <h2 className="sr-only" id="baza-trening-title">
        {vkladkaBazy('trenazher').label}
      </h2>
      <TabScrollOnMount />
      <TrenazherBazy
        slug={task.slug}
        base={`${taskBase(task)}/${vkladkaBazy('trenazher').tail}`}
        gruppy={gruppy}
        nazvaniyaTekst={Object.fromEntries(prototipy.map((p) => [p.id, texPlain(p.title)]))}
        katalog={katalog}
      />
    </section>
  );
}

/** Содержимое вкладки: наполнение раздела или «Материал готовится». */
export async function VkladkaBazyPage({ params, tab }: { params: BazaParams; tab: VkladkaBazy }) {
  const task = bazaTask((await params).task);
  const razdel = razdelBazy(task.slug);
  const base = taskBase(task);
  const pusto = <Pusto vkladka={vkladkaBazy(tab).label} />;
  switch (tab) {
    case 'o-zadanii':
      return (
        <>
          {razdel?.oZadanii === undefined ? null : (
            <OZadaniiBaza task={task} oZadanii={razdel.oZadanii} />
          )}
          <FormatZadaniya task={task} />
          {razdel?.oZadanii === undefined ? pusto : null}
        </>
      );
    case 'teoriya':
      if (razdel?.teoriya === undefined) return pusto;
      return (
        <>
          {razdel.kartochki === undefined ? null : (
            <ProverkaTeorii
              task={`baza:${task.slug}`}
              nomer={Number(task.no)}
              href={`${base}/${vkladkaBazy('kartochki').tail}`}
              ids={razdel.kartochki.kartochki.map((k) => k.id)}
            />
          )}
          <TeoriyaBazy
            slug={task.slug}
            vkladka={vkladkaBazy('teoriya').label}
            razdely={razdel.teoriya}
          />
        </>
      );
    case 'kartochki':
      return razdel?.kartochki === undefined ? (
        pusto
      ) : (
        <Kartochki koloda={podgotovit(razdel.kartochki, base)} />
      );
    case 'opornye':
      return razdel?.opornye === undefined ? pusto : <Opornye task={task} razdel={razdel} />;
    case 'trenazher':
      return razdel?.prototipy === undefined ? pusto : <Trenazher task={task} razdel={razdel} />;
    case 'generator':
      return pusto;
  }
}
