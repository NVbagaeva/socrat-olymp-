/* Проверка реквизитов продавца из src/content/legal/prodavets.json.
   Чистая функция без обращения к диску: ей пользуются и сборка
   (next.config.ts — с NEXT_PUBLIC_LEGAL_READY=1 сборка с пустыми
   реквизитами падает), и подвал с офертой. */

/** Что не так с реквизитами: пустой список — всё заполнено. */
export function prodavetsProblems(config) {
  const problems = [];
  const inn = String(config.inn ?? '').trim();
  const pochta = String(config.pochta ?? '').trim();
  const data = String(config.dataOferty ?? '').trim();

  /* ИНН физического лица — 12 цифр. */
  if (!/^\d{12}$/.test(inn)) {
    problems.push(`«inn» — ИНН из 12 цифр (сейчас: «${inn}»)`);
  }
  if (!/^[^\s@[\]]+@[^\s@[\]]+\.[^\s@[\]]+$/.test(pochta)) {
    problems.push(`«pochta» — почта для связи и заявлений (сейчас: «${pochta}»)`);
  }
  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(data)) {
    problems.push(`«dataOferty» — дата редакции оферты ДД.ММ.ГГГГ (сейчас: «${data}»)`);
  }
  return problems;
}
