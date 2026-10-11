/* scripts/lib/spravochnik-1-md.mjs — файл для вычитки справочника №1.

   Собирает docs/spravochnik-1/soderzhanie.md из тех же данных, что
   веб-страница и PDF (app/src/content/spravochnik1). Формулы остаются
   в $…$ и $$…$$ — GitHub набирает их сам. Условия разборов из банка
   берутся у прототипа, поэтому в файле ровно то, что увидит ученик. */

import { requireSrc } from './load-ts.mjs';

const S = requireSrc('content/spravochnik1/index.ts');
const { zadachaPrimera } = requireSrc('lib/planimetriya/spravochnik-selftest.ts');

const B = S.BLOKI_SPRAVOCHNIKA;

function utverzhdeniya(zag, spisok) {
  if (spisok === undefined || spisok.length === 0) return [];
  const out = [`**${zag}**`, ''];
  for (const u of spisok) {
    out.push(`- ${u.tekst}`);
    if (u.formula !== undefined) out.push('', `  $$${u.formula}$$`, '');
  }
  out.push('');
  return out;
}

function tema(t) {
  const out = [`### ${t.title}`, ''];
  out.push(
    `Якорь: \`#k-${t.id}\`${t.shirokaya === true ? ' · на всю ширину' : ''}` +
      (t.zamenyaet !== undefined && t.zamenyaet.some((z) => z !== t.id)
        ? ` · заменяет прежние: ${t.zamenyaet
            .filter((z) => z !== t.id)
            .map((z) => `\`${z}\``)
            .join(', ')}`
        : ''),
    '',
  );
  if (t.chertezh !== undefined) {
    out.push(`> **Чертёж.** ${t.chertezh.chto}`, '>', `> **Выделить:** ${t.chertezh.vydelit}.`, '');
  }
  out.push(...utverzhdeniya(B.opredeleniya, t.opredeleniya));
  if (t.teoremy !== undefined && t.teoremy.length > 0) {
    out.push(`**${B.teoremy}**`, '');
    for (const th of t.teoremy) {
      out.push(
        `- ${th.nazvanie === undefined ? '' : `*${th.nazvanie}.* `}${th.slovami}`,
        '',
        `  $$${th.formula}$$`,
        '',
      );
      if (th.dop !== undefined)
        out.push(
          `  ${th.dop.podpis[0].toUpperCase()}${th.dop.podpis.slice(1)}:`,
          '',
          `  $$${th.dop.formula}$$`,
          '',
        );
    }
  }
  out.push(...utverzhdeniya(B.svoystva, t.svoystva));
  out.push(...utverzhdeniya(B.priznaki, t.priznaki));
  if (t.tablica !== undefined) {
    out.push(`| ${t.tablica.head.join(' | ')} |`, `|${t.tablica.head.map(() => '---').join('|')}|`);
    for (const r of t.tablica.rows) out.push(`| ${r.join(' | ')} |`);
    out.push('');
  }
  if (t.primenenie !== undefined) {
    out.push(`**${B.primenenie}**`, '', ...t.primenenie.map((x, i) => `${i + 1}. ${x}`), '');
  }
  if (t.vazhno !== undefined) {
    out.push(`**${B.vazhno}**`, '', ...t.vazhno.map((x) => `- ${x}`), '');
  }
  for (const [i, p] of (t.primery ?? []).entries()) {
    const z = zadachaPrimera(p);
    out.push(`**${B.primery} ${i + 1}. ${p.title}** _(${z.metka})_`, '', `> ${z.uslovie}`, '');
    if (p.chertezh !== undefined) out.push(`*Чертёж:* ${p.chertezh}`, '');
    for (const s of p.shagi) {
      out.push(`- *${s.etap}.*${s.tekst === undefined ? '' : ` ${s.tekst}`}`);
      for (const f of s.tex ?? []) out.push('', `  $$${f}$$`);
      out.push('');
    }
    out.push(`**Ответ:** $${p.otvet}$`, '');
  }
  out.push(
    `**${B.prototipy}:** ${t.prototipy.length === 0 ? '—' : t.prototipy.map((n) => `№${n}`).join(', ')}`,
    '',
  );
  return out;
}

/** Текст файла вычитки. */
export function soderzhanieMd() {
  const out = [
    `# ${S.SPRAVOCHNIK_1.title}`,
    '',
    `_${S.SPRAVOCHNIK_1.lead}._`,
    '',
    '> Файл собран из данных справочника (`app/src/content/spravochnik1`) командой',
    '> `pnpm build:spravochnik-1`. Править тексты — в данных, не здесь: проверка',
    '> `pnpm test:spravochnik-1` сверяет файл с данными.',
    '',
    `## ${S.KAK_POLZOVATSYA_1.title}`,
    '',
    ...S.KAK_POLZOVATSYA_1.legenda.map((l) => `- **${B[l.blok]}** — ${l.tekst}.`),
    '',
    `**${S.KAK_POLZOVATSYA_1.oboznacheniya.title}.** ${S.KAK_POLZOVATSYA_1.oboznacheniya.tekst}`,
    '',
    '## Содержание',
    '',
  ];
  for (const r of S.RAZDELY_SPRAVOCHNIKA_1) {
    out.push(`${r.no}. [${r.title}](#${r.no}-${r.id}) — ${r.temy.map((t) => t.title).join(' · ')}`);
  }
  out.push('');
  for (const r of S.RAZDELY_SPRAVOCHNIKA_1) {
    out.push(`<a id="${r.no}-${r.id}"></a>`, '', `## ${r.no}. ${r.title}`, '', r.lead, '');
    for (const t of r.temy) out.push(...tema(t));
  }
  return `${out
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd()}\n`;
}
