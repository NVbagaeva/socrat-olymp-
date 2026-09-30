import type { Phrase } from '@/content/theoryLinear';

/**
 * Разметка строк конфига теории в куски текста.
 *
 * $…$ — формула в записи TeX, её набирает KaTeX; **…** — выделение
 * автора. Так тексты карточек пишутся одной строкой, а не списком
 * кусков, и в конфиге читаются как текст. Куски отдаются компоненту
 * Phrases — тому же, что у линейной подтемы.
 *
 * Лежит рядом с Phrases, а не в папке квадратичной подтемы: этой же
 * разметкой набираются заголовки разделов и карточек.
 */
export function phrases(text: string): Phrase[] {
  const parts: Phrase[] = [];
  const pattern = /\$([^$]+)\$|\*\*([^*]+)\*\*/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) {
      parts.push({ text: text.slice(last, index) });
    }
    if (match[1] !== undefined) {
      parts.push({ text: match[1], math: true });
    } else {
      parts.push({ text: match[2] ?? '', strong: true });
    }
    last = index + match[0].length;
  }
  if (last < text.length) {
    parts.push({ text: text.slice(last) });
  }
  return parts;
}
