/* Проверка данных оператора из src/content/legal/operator.json.
   Чистая функция без обращения к диску: ей пользуются и сборка
   (next.config.ts через scripts/lib/legal-config.mjs), и страницы —
   они показывают плашку «черновик», пока данные не заполнены. */

/** Что не так с данными оператора: пустой список — всё заполнено. */
export function legalConfigProblems(config) {
  const problems = [];
  const fio = String(config.fio ?? '').trim();
  const pochta = String(config.pochta ?? '').trim();
  const data = String(config.data ?? '').trim();

  if (fio === '' || fio.includes('[') || fio.split(/\s+/).length < 2) {
    problems.push(`«fio» — фамилия, имя и отчество полностью (сейчас: «${fio}»)`);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pochta)) {
    problems.push(
      `«pochta» — почта для обращений, например privacy@budetege.ru (сейчас: «${pochta}»)`,
    );
  }
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(data);
  const valid =
    m &&
    (() => {
      const d = new Date(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1])));
      return d.getUTCDate() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1;
    })();
  if (!valid) {
    problems.push(
      `«data» — дата редакции в виде ДД.ММ.ГГГГ, например 15.10.2026 (сейчас: «${data}»)`,
    );
  }
  return problems;
}
