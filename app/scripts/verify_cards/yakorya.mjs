/* Якоря вкладки «Теория» по номерам: туда ведёт «Повторить теорию».
   Собираются из тех же данных, из которых строится вкладка, — якорь
   в карточке не может разойтись со страницей. Новый номер добавляет
   сюда свою функцию; без неё якоря его колоды не проверяются. */

import { requireSrc } from '../lib/load-ts.mjs';

const PO_NOMERAM = {
  /* Справочник №1: карточка темы — #k-<id>, прежние якоря — zamenyaet. */
  1: () => {
    const { RAZDELY_SPRAVOCHNIKA_1 } = requireSrc('content/spravochnik1/index');
    const out = new Set();
    for (const r of RAZDELY_SPRAVOCHNIKA_1) {
      for (const t of r.temy) {
        out.add(`k-${t.id}`);
        (t.zamenyaet ?? []).forEach((id) => out.add(`k-${id}`));
      }
    }
    return out;
  },
  /* Теория №2: раздел — #teoriya-<id>, карточка — #t2-<раздел>-<карточка>. */
  2: () => {
    const { RAZDELY_TEORII } = requireSrc('content/theoryVektory');
    const { yakorKartochki2 } = requireSrc('components/tasks/vektory/Teoriya2');
    const out = new Set();
    for (const r of RAZDELY_TEORII) {
      out.add(`teoriya-${r.id}`);
      r.section.cards.forEach((c) => out.add(yakorKartochki2(r.id, c.id)));
    }
    return out;
  },
  /* Теория №3: глава — #teoriya-<id>, раздел главы — #<id раздела> («g3-kub»). */
  3: () => {
    const { GLAVY_3 } = requireSrc('content/stereo/glavy');
    const { GLAVY_DANNYE_3 } = requireSrc('lib/stereo/glavy/index');
    const { RAZDELY_GLAVY_2 } = requireSrc('components/stereo/glavy/Glava2Treugolnik');
    const out = new Set();
    GLAVY_3.forEach((g) => out.add(`teoriya-${g.id}`));
    Object.values(GLAVY_DANNYE_3).forEach((dannye) =>
      dannye().razdely.forEach((r) => out.add(r.id)),
    );
    RAZDELY_GLAVY_2.forEach((r) => out.add(r.id));
    return out;
  },
  /* Теория №4 и №5 (одна теория вероятностей на два номера): написанный
     раздел — #teoriya-<id>, блок раздела — #t4-… / #t5-…
     (lib/veroyatnost/teoriya-yakorya.ts). Раздел «Материал готовится»
     якорем не считается: повторять там нечего. */
  4: () => teoriyaVeroyatnosti(4),
  5: () => teoriyaVeroyatnosti(5),
  /* Теория №6 и №7: раздел — #teoriya-<id>, карточка теории — #k-<id>,
     рамка или таблица с полем `yakor` — #t6-… / #t7-…
     (lib/zadanie6|7/teoriya-yakorya.ts). */
  6: () => {
    const { RAZDELY_TEORII_6, kartochkiBloka6 } = requireSrc('content/teoriya6');
    const { YAKOR_6, BLOKI_6 } = requireSrc('lib/zadanie6/teoriya-yakorya');
    return teoriyaRazdelami(RAZDELY_TEORII_6, kartochkiBloka6, YAKOR_6, BLOKI_6);
  },
  7: () => {
    const { RAZDELY_TEORII_7, kartochkiBloka7 } = requireSrc('content/teoriya7');
    const { YAKOR_7, BLOKI_7 } = requireSrc('lib/zadanie7/teoriya-yakorya');
    return teoriyaRazdelami(RAZDELY_TEORII_7, kartochkiBloka7, YAKOR_7, BLOKI_7);
  },
  /* Теория №9: раздел — #teoriya-<id>, подраздел — его id («z9-3-2»),
     рамка, таблица или плашка с полем `yakor` — #t9-…
     (lib/proizvodnaya/teoriya-yakorya.ts). У «Понятия производной»
     подразделы и имена рамок — в его текстах (PONYATIE_9). */
  9: () => {
    const { RAZDELY_TEORII_9 } = requireSrc('content/theoryProizvodnaya');
    const { PONYATIE_9 } = requireSrc('content/theoryPonyatie9');
    const { YAKOR_9, BLOKI_9 } = requireSrc('lib/proizvodnaya/teoriya-yakorya');
    const out = new Set();
    const postavleny = new Set();
    const postavit = (imya) => {
      if (postavleny.has(imya)) throw new Error(`якорь «${imya}» стоит на двух блоках`);
      postavleny.add(imya);
      out.add(YAKOR_9.blok(imya));
    };
    const obhod = (bloki) => {
      for (const b of bloki) {
        if (b.yakor !== undefined) postavit(b.yakor);
        if (b.type === 'sub') {
          out.add(b.id);
          obhod(b.blocks);
        }
      }
    };
    for (const r of RAZDELY_TEORII_9) {
      out.add(YAKOR_9.razdel(r.id));
      obhod(r.blocks);
    }
    Object.values(PONYATIE_9.razdely).forEach((r) => out.add(r.id));
    Object.values(PONYATIE_9.yakorya).forEach(postavit);
    const lishnie = BLOKI_9.filter((id) => !postavleny.has(id));
    if (lishnie.length > 0) throw new Error(`имена без блока: ${lishnie.join(', ')}`);
    return out;
  },
  /* Теория №10: раздел — #teoriya-<id>, рамка, таблица или ловушка с
     полем `yakor` — #t10-… (lib/zadanie10/teoriya-yakorya.ts), карточка
     «Физика в двух словах» — #fizika-<прототип>, часть общей теории
     единиц, которую раздел показывает, — #ed-<часть>. */
  10: () => {
    const { RAZDELY_TEORII_10 } = requireSrc('content/teoriya10');
    const { YAKOR_10, BLOKI_10 } = requireSrc('lib/zadanie10/teoriya-yakorya');
    const { PROTOTYPES } = requireSrc('lib/zadanie10/prototypes');
    const { YAKOR_EDINIC } = requireSrc('content/teoriya-edinicy');
    const out = new Set();
    const postavleny = new Set();
    for (const r of RAZDELY_TEORII_10) {
      out.add(YAKOR_10.razdel(r.id));
      for (const b of r.bloki) {
        if (b.yakor !== undefined) {
          if (postavleny.has(b.yakor)) throw new Error(`якорь «${b.yakor}» стоит на двух блоках`);
          postavleny.add(b.yakor);
          out.add(YAKOR_10.blok(b.yakor));
        }
        if (b.vid === 'edinicy') b.chasti.forEach((c) => out.add(YAKOR_EDINIC(c)));
        if (b.vid === 'fizika') PROTOTYPES.forEach((p) => out.add(YAKOR_10.fizika(p.id)));
      }
    }
    const lishnie = BLOKI_10.filter((id) => !postavleny.has(id));
    if (lishnie.length > 0) throw new Error(`имена без блока: ${lishnie.join(', ')}`);
    return out;
  },
  /* Теория №11: раздел — #teoriya-<id>, подпункт содержания — тот же
     id, что у блока раздела (podpunkty: «smesi-formula», «ed-sostavnye»),
     «Главное» — #<раздел>-glavnoe, карточка с полем `yakor` — #t11-…,
     полный лайфхак — #layfhak-<id>, ловушка — #lovushka-<id>
     (lib/zadanie11/teoriya-yakorya.ts). */
  11: () => {
    const { RAZDELY_TEORII_11 } = requireSrc('content/teoriya11');
    const { podpunkty } = requireSrc('components/tasks/zadanie11/Teoriya11');
    const { YAKOR_11, BLOKI_11 } = requireSrc('lib/zadanie11/teoriya-yakorya');
    const out = new Set();
    const postavleny = new Set();
    for (const r of RAZDELY_TEORII_11) {
      out.add(YAKOR_11.razdel(r.id));
      podpunkty(r).forEach((p) => out.add(p.id));
      if (r.idei.length > 0) out.add(YAKOR_11.chast(r.id, 'glavnoe'));
      for (const k of r.kartochki ?? []) {
        if (k.yakor === undefined) continue;
        if (postavleny.has(k.yakor)) throw new Error(`якорь «${k.yakor}» стоит на двух карточках`);
        postavleny.add(k.yakor);
        out.add(YAKOR_11.kartochka(k.yakor));
      }
      if (r.id === 'layfhaki') r.layfhaki.forEach((id) => out.add(YAKOR_11.layfhak(id)));
      if (r.id === 'lovushki') r.lovushki.forEach((id) => out.add(YAKOR_11.lovushka(id)));
    }
    const lishnie = BLOKI_11.filter((id) => !postavleny.has(id));
    if (lishnie.length > 0) throw new Error(`имена без карточки: ${lishnie.join(', ')}`);
    return out;
  },
  /* №18: «теория» карточки — страница ключевой схемы /skhemy/<id>/;
     source — id собранной схемы (страницы строятся только для них). */
  18: () => {
    const { SOBRANNYE } = requireSrc('content/zadanie18/spisok');
    return new Set(SOBRANNYE.map((s) => s.id));
  },
};

function teoriyaVeroyatnosti(task) {
  const { RAZDELY_4, RAZDELY_5 } = requireSrc('content/veroyatnost-teoriya');
  const { telaRazdelov4, telaRazdelov5 } = requireSrc('components/tasks/veroyatnost/teoriya/index');
  const Y = requireSrc('lib/veroyatnost/teoriya-yakorya');
  const [razdely, tela, bloki] =
    task === 4
      ? [RAZDELY_4, telaRazdelov4, Y.yakoryaBlokov4()]
      : [RAZDELY_5, telaRazdelov5, Y.yakoryaBlokov5()];
  const out = new Set(bloki);
  razdely.filter((r) => r.id in tela).forEach((r) => out.add(`teoriya-${r.id}`));
  return out;
}

/* Теория из разделов с блоками (№6, №7). Имя рамки в BLOKI, которое
   ни один блок не ставит, — ошибка: якорь объявлен, а на странице его нет. */
function teoriyaRazdelami(razdely, kartochkiBloka, Y, BLOKI) {
  const out = new Set();
  const postavleny = new Set();
  for (const r of razdely) {
    out.add(Y.razdel(r.id));
    for (const b of r.bloki) {
      kartochkiBloka(b).forEach((k) => out.add(Y.kartochka(k.id)));
      if (b.yakor !== undefined) {
        if (postavleny.has(b.yakor)) throw new Error(`якорь «${b.yakor}» стоит на двух блоках`);
        postavleny.add(b.yakor);
        out.add(Y.blok(b.yakor));
      }
    }
  }
  const lishnie = BLOKI.filter((id) => !postavleny.has(id));
  if (lishnie.length > 0) throw new Error(`имена без блока: ${lishnie.join(', ')}`);
  return out;
}

/** Множество якорей теории номера; undefined — номер не описан. */
export function yakorya(task) {
  return PO_NOMERAM[task]?.();
}
