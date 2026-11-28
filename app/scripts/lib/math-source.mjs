/* scripts/lib/math-source.mjs — тексты интерфейса и данных в исходниках.

   Достаёт из .ts/.tsx/.js/.mjs строки, шаблонные строки и текст JSX
   (компилятором TypeScript, без регулярок по коду), а из .json —
   строковые значения. Каждому куску — файл и строка: автопроверка
   показывает, где править.

   Не берутся куски, которые заведомо не текст для ученика: пути
   импорта, классы, ключи и адреса, а также строки, которые сами
   являются записью TeX (передаются в KaTeX, лежат в полях tex,
   formula, latex и т. п.). */

import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

/* Поля и атрибуты, в которых лежит не текст: TeX, адреса, классы. */
const NOT_TEXT_KEYS = new Set([
  'id', 'key', 'href', 'src', 'className', 'class', 'type', 'kind', 'icon', 'slug', 'setId',
  'tex', 'formula', 'latex', 'katex', 'texHtml', 'labelX', 'labelY', 'origin', 'color', 'style',
  'answerRule', 'rule', 'family', 'form', 'level', 'answerType', 'axisLabels', 'shape', 'mode',
  'path', 'file', 'pattern', 'role', 'tag', 'name', 'value', 'variant', 'size', 'width', 'height',
  'alt', 'aria-label', 'ariaLabel', 'title_tex', 'data-tex', 'scene', 'answer', 'seal',
  'levelReason', 'note', 'aria', 'describe', 'setX', 'setY', 'ideya',
  /* prototip — служебное описание шаблона «Вариантов повышенной сложности»
     (lib/povyshennye/shablony.ts): для отчётов разработчика, на сайт не выводится. */
  'prototip',
  /* pravka, sostavleno — служебные пометки об источнике задачи (teoriya19/tipy.ts),
     на сайт не выводится. polePodskazka — placeholder поля ввода: там только
     обычный текст, KaTeX не набрать. piPodskazka — подсказка о записи ответа
     под полем (FormatHint, components/tasks/otvet): тоже только текст. */
  'pravka', 'sostavleno', 'polePodskazka', 'piPodskazka',
  /* Подписи внутри SVG живых сцен №9 (content/zhivye10.ts → MYACH10, RASPAD10):
     текст <text> в SVG, KaTeX туда не набрать — как labelX и axisLabels. */
  'podpisH', 'podpisPromezhutok', 'podpisCel', 'podpisOtvet',
]);

/* Ключ с обычным текстом: подписи внутри SVG (svgЧтото — KaTeX туда не
   набрать) и тексты для экранного диктора (ariaЧтото — aria-label,
   aria-valuetext) в текстах живых сцен (content/zhivye*.ts). */
function neTekst(key) {
  return NOT_TEXT_KEYS.has(key) || /^(svg|aria)[A-Z]/.test(key);
}

/* Словари, значения которых — подписи для экранного диктора (aria-label):
   там только обычный текст. Ключи у них — имена точек. */
const ARIA_MAPS = new Set(['imenaRuchek']);

/** Строка — значение в словаре ARIA_MAPS ({ imenaRuchek: { C1: '…' } }). */
function inAriaMap(node) {
  const prop = node.parent;
  if (!prop || !ts.isPropertyAssignment(prop)) { return false; }
  const obj = prop.parent;
  const outer = obj && obj.parent;
  return Boolean(outer && ts.isPropertyAssignment(outer) &&
    ARIA_MAPS.has(outer.name.getText().replace(/['"]/g, '')));
}

/* Вызовы, аргумент которых — TeX или служебная строка. */
/* scena — рисунок №19 (lib/zadanie19/risunok.ts): строка в нём — alt для
   экранного диктора, только обычный текст. */
const TEX_CALLS = /^(?:scena|prismModel|shape\w*|cube\w*|katex\.renderToString|renderToString|formula|math|tex|texNum|texFactor|m|keyMath|field|katexHtml|formulaHtml|require|import|t\.?|querySelector(?:All)?|getElementById|addEventListener|setAttribute|getAttribute|classList\.\w+|console\.\w+|Error|RegExp|Intl\.\w+|new\s+\w+)$/;

function keyOf(node) {
  let parent = node.parent;
  if (!parent) { return null; }
  /* Подпись-функция «podpisH: (H) => `H = ${H} м`» (и с тернарным выбором):
     ключ — у свойства, которому присвоена стрелочная функция. */
  let up = node;
  while (parent && (ts.isConditionalExpression(parent) || ts.isParenthesizedExpression(parent))) {
    up = parent;
    parent = parent.parent;
  }
  if (parent && ts.isArrowFunction(parent) && parent.body === up && parent.parent &&
      ts.isPropertyAssignment(parent.parent)) {
    return parent.parent.name.getText().replace(/['"]/g, '');
  }
  parent = node.parent;
  if (ts.isPropertyAssignment(parent) && parent.initializer === node) {
    return parent.name.getText().replace(/['"]/g, '');
  }
  if (ts.isJsxAttribute(parent)) { return parent.name.getText(); }
  if (ts.isJsxExpression(parent) && parent.parent && ts.isJsxAttribute(parent.parent)) {
    return parent.parent.name.getText();
  }
  return null;
}

function calleeOf(node) {
  let current = node.parent;
  /* Конкатенация «'…' + x + '…'» внутри вызова — смотрим на сам вызов. */
  while (current && (ts.isBinaryExpression(current) || ts.isParenthesizedExpression(current) ||
         ts.isTemplateSpan(current) || ts.isTemplateExpression(current) ||
         ts.isConditionalExpression(current) || ts.isArrayLiteralExpression(current))) {
    current = current.parent;
  }
  if (current && (ts.isCallExpression(current) || ts.isNewExpression(current))) {
    return current.expression.getText();
  }
  return null;
}

function isModuleSpecifier(node) {
  const parent = node.parent;
  return parent && (ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent) ||
    ts.isExternalModuleReference(parent) || ts.isLiteralTypeNode(parent));
}

/* Подстановка ${…} в шаблоне — невидимый знак: что в ней окажется,
   неизвестно, и выдумывать на её месте число («7 · 7») нельзя —
   разделитель «Метод ${n} · ${title}» показался бы умножением. */
const HOLE = '\u2060';

/* \u041f\u043e\u0434\u0441\u0442\u0430\u043d\u043e\u0432\u043a\u0430-\u043a\u043e\u043d\u0441\u0442\u0430\u043d\u0442\u0430 ${'$'} \u2014 \u044d\u0442\u043e \u043f\u0440\u043e\u0441\u0442\u043e \u0437\u043d\u0430\u043a: \u0442\u0430\u043a \u0432 \u0448\u0430\u0431\u043b\u043e\u043d\u0435 \u043f\u0438\u0448\u0443\u0442
   \u0434\u043e\u043b\u043b\u0430\u0440 \u043f\u0435\u0440\u0435\u0434 \u043e\u0442\u043a\u0440\u044b\u0432\u0430\u044e\u0449\u0435\u0439 \u0441\u043a\u043e\u0431\u043a\u043e\u0439. \u0415\u0451 \u0442\u0435\u043a\u0441\u0442 \u0438\u0434\u0451\u0442 \u0432 \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0443 \u043a\u0430\u043a \u0435\u0441\u0442\u044c,
   \u0438\u043d\u0430\u0447\u0435 \u0444\u043e\u0440\u043c\u0443\u043b\u0430 $\u2026$ \u0440\u0430\u0437\u0440\u044b\u0432\u0430\u0435\u0442\u0441\u044f \u0438 x^2 \u0432 \u043d\u0435\u0439 \u0432\u0438\u0434\u0438\u0442\u0441\u044f \u0432\u043d\u0435 KaTeX. */
function podstanovka(span) {
  const e = span.expression;
  return ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e) ? e.text : HOLE;
}

/** Куски текста файла кода: [{ text, line }]. */
export function codeTexts(file) {
  const source = fs.readFileSync(file, 'utf8');
  const kind = /\.tsx$/.test(file) ? ts.ScriptKind.TSX
    : /\.ts$/.test(file) ? ts.ScriptKind.TS
    : ts.ScriptKind.JSX;
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, kind);
  const out = [];

  /* Заголовок вкладки браузера (generateMetadata, export const
     metadata) KaTeX не набрать: там только обычный текст. */
  function inMetadata(node) {
    for (let cur = node.parent; cur; cur = cur.parent) {
      if (ts.isFunctionDeclaration(cur) && cur.name && cur.name.text === 'generateMetadata') { return true; }
      if (ts.isVariableDeclaration(cur) && cur.name.getText(sf) === 'metadata') { return true; }
    }
    return false;
  }

  function push(node, text) {
    if (!/[А-Яа-яЁё]/.test(text)) { return; }   /* только русский текст */
    /* Строка сама — запись TeX (\\sin, \\text{…}): её набирает KaTeX. */
    if (/\\[a-zA-Z]{2,}/.test(text) && !/\$/.test(text)) { return; }
    if (inMetadata(node)) { return; }
    const key = keyOf(node);
    if (key !== null && neTekst(key)) { return; }
    if (inAriaMap(node)) { return; }
    const callee = calleeOf(node);
    if (callee !== null && TEX_CALLS.test(callee)) { return; }
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
    out.push({ text, line: line + 1 });
  }

  const isPlus = (n) => ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.PlusToken;

  /* Склейка «'… $x = ' + tex(s) + '$ …'» проверяется целиком: по
     кускам пары долларов разрываются. Не строки — число-заглушка. */
  function flatten(n) {
    if (isPlus(n)) { return flatten(n.left) + flatten(n.right); }
    if (ts.isParenthesizedExpression(n)) { return flatten(n.expression); }
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) { return n.text; }
    if (ts.isTemplateExpression(n)) {
      return n.head.text + n.templateSpans.map((span) => podstanovka(span) + span.literal.text).join('');
    }
    return HOLE;
  }

  function visit(node) {
    if (isPlus(node) && !isPlus(node.parent) && !ts.isParenthesizedExpression(node.parent)) {
      const text = flatten(node);
      if (/[А-Яа-яЁё]/.test(text)) { push(node, text); }
      return;
    }
    if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
        !isModuleSpecifier(node)) {
      push(node, node.text);
    } else if (ts.isTemplateExpression(node)) {
      /* Подстановки ${…} заменяются числом-заглушкой: «${a} · ${b}»
         всё равно читается как формула. */
      const text = node.head.text + node.templateSpans.map((span) => podstanovka(span) + span.literal.text).join('');
      push(node, text);
      return;
    } else if (ts.isJsxText(node)) {
      const text = node.getText(sf).replace(/\s+/g, ' ').trim();
      if (text) { push(node, text); }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  return out;
}

/** Строковые значения JSON: [{ text, line, key }]. */
export function jsonTexts(file) {
  const source = fs.readFileSync(file, 'utf8');
  const out = [];
  const lines = source.split('\n');
  lines.forEach((line, index) => {
    const re = /"([\w-]+)"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
    let m = re.exec(line);
    while (m !== null) {
      const key = m[1];
      let text;
      try { text = JSON.parse('"' + m[2] + '"'); } catch { text = m[2]; }
      if (!neTekst(key) && /[А-Яа-яЁё]/.test(text)) {
        out.push({ text, line: index + 1, key });
      }
      m = re.exec(line);
    }
  });
  return out;
}

/** Все файлы с текстами под корнем, кроме служебных. */
export function sourceFiles(root, skip) {
  const files = [];
  (function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const rel = path.relative(root, full).replace(/\\/g, '/');
      if (skip.some((re) => re.test(rel))) { continue; }
      if (fs.statSync(full).isDirectory()) { walk(full); continue; }
      if (/\.(tsx?|jsx?|mjs|json)$/.test(name) && !/\.d\.ts$/.test(name)) { files.push(full); }
    }
  })(root);
  return files.sort();
}
