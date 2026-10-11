/**
 * Тексты правовых документов для страниц и письма родителю.
 * Читаются с диска при сборке — только в серверном коде.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { LegalDocId } from '@/content/legal/documents';
import { parseLegal, plainText, section, type LegalBlock } from './markdown';
import { fillPlaceholders } from './operator';

const DIR = path.join(process.cwd(), 'src', 'content', 'legal');

/** Исходный текст документа с подстановками [ФИО], [ПОЧТА], [ДАТА]. */
export function legalSource(id: LegalDocId): string {
  return fs.readFileSync(path.join(DIR, `${id}.md`), 'utf8');
}

export function legalBlocks(id: LegalDocId): LegalBlock[] {
  return parseLegal(fillPlaceholders(legalSource(id)));
}

/** Вариант Б согласия — текст письма родителю, уже с данными оператора. */
export function parentConsentText(): string {
  return plainText(section(legalBlocks('soglasie'), 'variant-b'));
}
