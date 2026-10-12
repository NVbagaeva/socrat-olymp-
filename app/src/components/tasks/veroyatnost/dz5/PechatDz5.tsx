'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DZ5_SLOVA } from '@/content/veroyatnost-dz5';
import { katex } from '@/lib/graph/katex';
import { upgrade } from '@/lib/graph/katex-upgrade.js';
import { checkKitSheet, kitFootLabel, printKitSheet } from '@/lib/komplekt';
import { buildDocument } from '@/lib/sheet/sheet.js';
import { list5Spec, type VidLista } from '@/lib/veroyatnost/dz5/list';
import { dataTekst, dzZadachi, listShablonov, parseDzQuery } from '@/lib/veroyatnost/dz5/zapros';
import { parseSheet4Query, podzagolovok } from '@/lib/veroyatnost/sheet4';
import { KOROTKO_5 } from '@/content/veroyatnost';

export interface PechatDz5Props {
  /**
   * dz — лист «Домашней работы» (вид листа в адресе, r=…);
   * shablony — лист генератора: ученику или учителю.
   */
  istochnik: 'dz' | 'shablony';
  /** Только для shablony: лист учителя с ответами и решениями. */
  withAnswers?: boolean;
}

/** Спецификация набора из готового документа шаблона. */
function specJson(html: string): string {
  const open = html.indexOf('<script type="application/json" id="sheet-spec">');
  const start = html.indexOf('>', open) + 1;
  const end = html.indexOf('</script>', start);
  return html.slice(start, end);
}

/** Шапка листа ДЗ по виду листа: ответы и решения подписаны. */
function podpisListaDz(vid: VidLista, date: string): string {
  const vidTekst =
    vid === 'otvety' ? DZ5_SLOVA.list.otvety : vid === 'resheniya' ? DZ5_SLOVA.list.resheniya : '';
  return [vidTekst, dataTekst(date)].filter(Boolean).join(' · ');
}

/**
 * Лист задач-шаблонов №5, собранный в браузере: как PechatVeroyatnosti
 * — куски листа (lib/veroyatnost/dz5/list.ts), раскладка по страницам
 * A4 (paginate.js), формулы KaTeX и сразу печать. Тот же адрес — тот
 * же лист: задачи считает шаблон по seed из адреса.
 */
export function PechatDz5({ istochnik, withAnswers = false }: PechatDz5Props) {
  const query = useSearchParams();
  const [spec, setSpec] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const dz = istochnik === 'dz' ? parseDzQuery(query) : null;
  const gen = istochnik === 'shablony' ? parseSheet4Query(query) : null;
  const theme = dz?.theme ?? gen?.theme ?? 'color';
  const layout = gen?.layout ?? 'single';

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.sheetTheme = theme;
    root.dataset.sheetLayout = layout;
    return () => {
      delete root.dataset.sheetTheme;
      delete root.dataset.sheetLayout;
    };
  }, [theme, layout]);

  useEffect(() => {
    let alive = true;
    window.sheetTypeset = (root) => upgrade(root, katex);
    let html: string;
    let kitWarning: string | null = null;
    if (dz !== null) {
      const built = list5Spec({
        vid: dz.vid,
        theme: dz.theme,
        layout: 'single',
        title: {
          chip: DZ5_SLOVA.list.chip,
          text: DZ5_SLOVA.list.text,
          subtitle: podpisListaDz(dz.vid, dz.date),
        },
        date: dataTekst(dz.date),
        naVarianty: [dzZadachi(dz)],
      });
      html = buildDocument(built, {});
    } else if (gen !== null && gen.skills.length > 0) {
      const built = list5Spec({
        vid: withAnswers ? 'uchitel' : 'uchenik',
        theme: gen.theme,
        layout: gen.layout,
        title: { chip: 'Задание 5', text: KOROTKO_5, subtitle: podzagolovok(gen) },
        date: gen.date === '' ? '' : dataTekst(gen.date),
        naVarianty: listShablonov(gen.skills, gen.count, gen.seed, gen.variants),
      });
      /* Код комплекта в колонтитул, как у остальных листов генератора. */
      const kit = checkKitSheet(query, '5', withAnswers ? 'teacher' : 'student', built);
      kitWarning = kit.warning;
      html = buildDocument({ ...built, kit: kitFootLabel(kit.code) }, {});
    } else {
      return;
    }
    import('@/lib/sheet/paginate.js').then(() => {
      if (alive) {
        setWarning(kitWarning);
        setSpec(specJson(html));
      }
    });
    return () => {
      alive = false;
    };
    /* Параметры приходят из адреса и за жизнь страницы не меняются. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withAnswers, query.toString()]);

  useEffect(() => {
    if (spec === null || done) {
      return;
    }
    window.sheetPagination = undefined;
    /* Шрифты KaTeX грузятся, только когда формула попала в документ,
       а пагинатор меряет высоты сразу после набора: в решениях почти
       каждая строка — формула, и по запасному шрифту лист съезжал на
       подвал. Шрифты подгружаются заранее, затем раскладка. */
    const shrifty = [
      '1em KaTeX_Main',
      'italic 1em KaTeX_Math',
      '1em KaTeX_Size1',
      '1em KaTeX_Size2',
    ];
    Promise.all(shrifty.map((f) => document.fonts.load(f).catch(() => []))).then(() => {
      window.sheetPaginate?.();
    });
    const timer = window.setInterval(() => {
      if (window.sheetPagination !== undefined) {
        window.clearInterval(timer);
        setDone(true);
        if (window.sheetPagination.error === undefined && query.get('preview') !== '1') {
          printKitSheet(warning);
        }
      }
    }, 100);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec, done, warning]);

  return (
    <>
      <div id="sheet-measure" />
      <div id="sheet-pages" />
      {spec === null ? null : (
        <script
          id="sheet-spec"
          type="application/json"
          dangerouslySetInnerHTML={{ __html: spec }}
        />
      )}
    </>
  );
}
