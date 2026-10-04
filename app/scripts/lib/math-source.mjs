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
]);

/* Вызовы, аргумент которых — TeX или служебная строка. */
const TEX_CALLS = /^(?:prismModel|shape\w*|cube\w*|katex\.renderToString|renderToString|formula|math|tex|texNum|texFactor|m|keyMath|field|katexHtml|formulaHtml|require|import|t\.?|querySelector(?:All)?|getElementById|addEventListener|setAttribute|getAttribute|classList\.\w+|console\.\w+|Error|RegExp|Intl\.\w+|new\s+\w+)$/;

function keyOf(node) {
  const parent = node.parent;
  if (!parent) { return null; }
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
    if (key !== null && NOT_TEXT_KEYS.has(key)) { return; }
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
      return n.head.text + n.templateSpans.map((span) => HOLE + span.literal.text).join('');
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
      const text = node.head.text + node.templateSpans.map((span) => HOLE + span.literal.text).join('');
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
      if (!NOT_TEXT_KEYS.has(key) && /[А-Яа-яЁё]/.test(text)) {
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
