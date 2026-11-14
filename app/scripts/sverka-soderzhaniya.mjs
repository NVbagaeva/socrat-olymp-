/* scripts/sverka-soderzhaniya.mjs — два текста одного файла отличаются
   только записью, а не содержанием.

   Нужна проверке редизайна (check-redesign.mjs): банк и теория раздела
   не должны меняться. Раньше сверка шла по байтам, но номер задания ЕГЭ
   теперь не пишется в тексте руками — его подставляет struktura.js:

     было:   title: 'Шпаргалка по заданию №7',
     стало:  title: `Шпаргалка по заданию №${nomerRazdela('uravneniya')}`,

   Файл изменился, а на экране тот же текст. Здесь оба текста разбираются
   TypeScript'ом и приводятся к одной записи:

     — вызов функции из struktura.js с постоянными аргументами заменяется
       значением, которое она возвращает при действующей структуре
       экзамена (nomerRazdela('uravneniya') → 7, nomerDvumya → '07',
       slovoChasti → 'первая часть');
     — шаблонная строка, в которой после этого не осталось вставок,
       становится обычной строкой; оставшиеся вставки сравниваются как код;
     — строка сравнивается по значению: кавычки и переносы записи не важны;
     — подключение struktura.js, комментарии, отступы, переносы строк и
       запятая после последнего элемента списка не сравниваются.

   Всё остальное сравнивается знак за знаком: другая буква в условии,
   другое число в ответе, другая формула, новая или пропавшая строка
   кода — расхождение. */

import { createRequire } from 'node:module';
import * as struktura from '../src/content/struktura.js';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const IZ_STRUKTURY = /(^|\/)struktura(\.js)?$/;

function vidFayla(file) {
  if (file.endsWith('.tsx')) return ts.ScriptKind.TSX;
  if (/\.(js|mjs)$/.test(file)) return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}

/** Текст файла как ряд знаков в единой записи. */
function znaki(tekst, file) {
  const sf = ts.createSourceFile(file, tekst, ts.ScriptTarget.ES2022, true, vidFayla(file));

  /* Имена, подключённые из struktura.js: имя в файле → имя в структуре. */
  const funkcii = new Map();
  const podklyuchenie = (node) =>
    ts.isImportDeclaration(node) && IZ_STRUKTURY.test(node.moduleSpecifier.text);
  for (const node of sf.statements) {
    if (!podklyuchenie(node)) continue;
    const imena = node.importClause?.namedBindings;
    if (imena && ts.isNamedImports(imena)) {
      for (const el of imena.elements) funkcii.set(el.name.text, (el.propertyName ?? el.name).text);
    }
  }

  /** Постоянное значение выражения — { v } — или undefined. */
  const znachenie = (node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      return { v: node.text };
    }
    if (ts.isNumericLiteral(node)) return { v: Number(node.text) };
    if (ts.isTemplateExpression(node)) {
      let itog = node.head.text;
      for (const span of node.templateSpans) {
        const vstavka = znachenie(span.expression);
        if (vstavka === undefined) return undefined;
        itog += String(vstavka.v) + span.literal.text;
      }
      return { v: itog };
    }
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      funkcii.has(node.expression.text)
    ) {
      const fn = struktura[funkcii.get(node.expression.text)];
      const args = node.arguments.map(znachenie);
      if (typeof fn !== 'function' || args.some((a) => a === undefined)) return undefined;
      let v;
      try {
        v = fn(...args.map((a) => a.v));
      } catch {
        return undefined;
      }
      return typeof v === 'string' || typeof v === 'number' ? { v } : undefined;
    }
    return undefined;
  };

  const out = [];
  const postoyannoe = (v) => out.push(typeof v === 'number' ? `число ${v}` : `строка «${v}»`);
  const visit = (node) => {
    if (podklyuchenie(node)) return;
    if (node.kind >= ts.SyntaxKind.FirstJSDocNode && node.kind <= ts.SyntaxKind.LastJSDocNode) {
      return;
    }
    const v = znachenie(node);
    if (v !== undefined) {
      postoyannoe(v.v);
      return;
    }
    if (ts.isTemplateExpression(node)) {
      /* Вставки с постоянным значением вливаются в соседний текст. */
      out.push('шаблон');
      let kusok = node.head.text;
      for (const span of node.templateSpans) {
        const vstavka = znachenie(span.expression);
        if (vstavka !== undefined) {
          kusok += String(vstavka.v) + span.literal.text;
        } else {
          postoyannoe(kusok);
          out.push('${');
          visit(span.expression);
          out.push('}');
          kusok = span.literal.text;
        }
      }
      postoyannoe(kusok);
      out.push('конец шаблона');
      return;
    }
    const deti = node.getChildren(sf);
    if (deti.length === 0) {
      const t = node.getText(sf);
      if (t !== '') out.push(t);
      return;
    }
    deti.forEach((child, i) => {
      const poslednyayaZapyataya =
        node.kind === ts.SyntaxKind.SyntaxList &&
        i === deti.length - 1 &&
        child.kind === ts.SyntaxKind.CommaToken;
      if (!poslednyayaZapyataya) visit(child);
    });
  };
  visit(sf);
  return out;
}

/**
 * Одно ли содержание у двух текстов файла.
 * @param {string} staryy  текст из ветки-образца
 * @param {string} novyy   текст в рабочей папке
 * @param {string} file    имя файла (по расширению выбирается разбор)
 * @returns {{ ravno: boolean, gde?: string }} gde — первое расхождение
 */
export function toZheSoderzhanie(staryy, novyy, file) {
  const a = znaki(staryy, file);
  const b = znaki(novyy, file);
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  if (i === a.length && i === b.length) return { ravno: true };
  const kusok = (list) =>
    list
      .slice(Math.max(0, i - 4), i + 6)
      .join(' ')
      .replace(/\s+/g, ' ')
      .slice(0, 220);
  return { ravno: false, gde: `было:  …${kusok(a)}…\n      стало: …${kusok(b)}…` };
}
