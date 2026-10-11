/**
 * Данные оператора для правовых документов — из одного файла
 * src/content/legal/operator.json. В текстах документов стоят
 * [ФИО], [ПОЧТА] и [ДАТА]; подставляются они только здесь.
 */

import raw from '@/content/legal/operator.json';
import { legalConfigProblems } from './operatorProblems.mjs';

export const operator = {
  fio: raw.fio.trim(),
  pochta: raw.pochta.trim(),
  /** Дата редакции, как её написал оператор: ДД.ММ.ГГГГ. */
  data: raw.data.trim(),
};

/** Все три поля заполнены. Нет — страницы показывают плашку черновика. */
export const operatorFilled = legalConfigProblems(operator).length === 0;

/**
 * Версия документов — дата редакции в виде ГГГГ-ММ-ДД. Пишется в таблицу
 * согласий; сменилась дата в operator.json — при следующем входе
 * пользователь снова отмечает галочки. Пока дата не заполнена — «chernovik».
 */
export const documentsVersion: string = (() => {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(operator.data);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : 'chernovik';
})();

/** Подставить данные оператора в текст документа или письма. */
export function fillPlaceholders(text: string): string {
  return text
    .replaceAll('[ФИО]', operator.fio)
    .replaceAll('[ПОЧТА]', operator.pochta)
    .replaceAll('[ДАТА]', operator.data);
}
