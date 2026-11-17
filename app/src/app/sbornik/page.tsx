import type { Metadata } from 'next';
import Link from 'next/link';
import { clsx } from 'clsx';
import { AppShell } from '@/components/layout/AppShell';
import { RisunokRazdela, StsenaShapka, tabletkiRazdela } from '@/components/tasks/stsena';
import { SchyotTipa } from '@/components/sbornik/Progress';
import { PoiskSbornika, type PunktPoiska } from '@/components/sbornik/Poisk';
import { GLAVY, SBORNIK_LEAD, SBORNIK_TITLE, TIPY, UROVNI } from '@/content/sbornik';
import { glavaSlug, href, SBORNIK, tipSlug } from '@/lib/paths';
import { formulaHtml, nomerZadachi, zadachiGlavy } from '@/lib/sbornik/bank';
import { plain } from '@/lib/tex';
import 'katex/dist/katex.min.css';
import '@/components/sbornik/sbornik.css';

export const metadata: Metadata = {
  title: SBORNIK_TITLE,
  description: SBORNIK_LEAD,
};

/** Индекс поиска: главы, типы, задачи открытых глав. */
function indexPoiska(): PunktPoiska[] {
  const out: PunktPoiska[] = [];
  for (const g of GLAVY.filter((item) => item.gotova)) {
    const base = href(SBORNIK, glavaSlug(g.nomer));
    out.push({
      zagolovok: String(g.nomer),
      poyasnenie: `Глава ${g.nomer}. ${g.nazvanie}`,
      href: base,
      klyuch: `${g.nazvanie} ${g.kratko}`.toLowerCase(),
    });
    for (const t of TIPY[g.nomer] ?? []) {
      out.push({
        zagolovok: t.id,
        poyasnenie: t.nazvanie,
        href: href(SBORNIK, glavaSlug(g.nomer), tipSlug(t.id)),
        klyuch: `${t.nazvanie} ${plain(t.opisanie)}`.toLowerCase(),
      });
    }
    for (const z of zadachiGlavy(g.nomer)) {
      const t = (TIPY[g.nomer] ?? []).find((item) => item.id === z.tip);
      out.push({
        zagolovok: nomerZadachi(z.id),
        poyasnenie: `${t?.nazvanie ?? ''}, ${UROVNI[z.uroven - 1]!.zvezdy}`,
        href: `${href(SBORNIK, glavaSlug(g.nomer), tipSlug(z.tip))}#z-${z.id.replace(/\./g, '-')}`,
        klyuch: '',
      });
    }
  }
  return out;
}

/**
 * Витрина сборника: главы карточками, прогресс по главам, поиск по
 * номеру и теме. Открытые главы — ссылки, остальные — «готовится».
 */
export default function SbornikPage() {
  const vsegoZadach = GLAVY.reduce((s, g) => s + g.zadach, 0);
  return (
    <AppShell active="sbornik">
      <main className="app-main">
        <StsenaShapka
          crumbs={[{ label: 'Главная', href: '/' }, { label: 'Сборник для вузов' }]}
          title={SBORNIK_TITLE}
          lead={SBORNIK_LEAD}
          tabletki={tabletkiRazdela({
            fakty: [
              { znachenie: String(GLAVY.length), podpis: 'глав' },
              { znachenie: `${Math.floor(vsegoZadach / 100) * 100}+`, podpis: 'задач' },
              { znachenie: '★–★★★', podpis: 'уровни' },
            ],
          })}
          media={<RisunokRazdela label={SBORNIK_TITLE} />}
        />
        <div className="section-panel sb-vitrina">
          <PoiskSbornika punkty={indexPoiska()} />
          <h2 className="sb-vitrina__zag">Главы</h2>
          <ol className="sb-glavy">
            {GLAVY.map((g) => {
              const telo = (
                <>
                  <span className="sb-glava__znak" dangerouslySetInnerHTML={{ __html: formulaHtml(g.znak) }} />
                  <span className="sb-glava__telo">
                    <span className="sb-glava__nomer">Глава {g.nomer}</span>
                    <span className="sb-glava__nazvanie">{g.nazvanie}</span>
                    <span className="sb-glava__kratko">{g.kratko}</span>
                    {g.gotova ? (
                      <SchyotTipa glava={g.nomer} iz={zadachiGlavy(g.nomer).length} />
                    ) : (
                      <span className="sb-glava__skoro">Готовится · {g.zadach} задач</span>
                    )}
                  </span>
                </>
              );
              return (
                <li key={g.nomer}>
                  {g.gotova ? (
                    <Link className="sb-glava stk-glass" href={href(SBORNIK, glavaSlug(g.nomer))}>
                      {telo}
                    </Link>
                  ) : (
                    <div className={clsx('sb-glava stk-glass', 'sb-glava--skoro')} aria-disabled="true">
                      {telo}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
          <div className="sb-vvodnaya">
            <h2 className="sb-vitrina__zag">Как устроен сборник</h2>
            <ul>
              <li>
                В каждой главе — <b>теория</b> с разобранными примерами, <b>задачи по типам</b>,
                <b> тренажёр</b> и <b>генератор листов</b> для репетитора.
              </li>
              <li>
                Три уровня: ★ — обязательный минимум, ★★ — уверенное владение программой, ★★★ —
                для сильных вузов.
              </li>
              <li>
                Ответ проверяется сразу: число, выражение, ответ по случаям. Подсказка — вопрос к
                следующему шагу, решение — по шагам, с областью допустимых значений.
              </li>
              <li>Ошиблись — «Где я ошибся?» покажет шаги по одному, а задача попадёт в «Работу над ошибками».</li>
            </ul>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
