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
  const telegram = String(config.telegram ?? '').trim();
  const chasov = String(config.srokOtkrytiyaChasov ?? '').trim();

  /* ИНН физического лица — 12 цифр. */
  if (!/^\d{12}$/.test(inn)) {
    problems.push(`«inn» — ИНН из 12 цифр (сейчас: «${inn}»)`);
  }
  if (!/^[^\s@[\]]+@[^\s@[\]]+\.[^\s@[\]]+$/.test(pochta)) {
    problems.push(`«pochta» — почта для связи и заявлений (сейчас: «${pochta}»)`);
  }
  /* Имя в Telegram без @: латиница, цифры, «_», от 5 знаков. */
  if (!/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(telegram)) {
    problems.push(`«telegram» — личный Telegram без @ (сейчас: «${telegram}»)`);
  }
  /* Ручная оплата: за сколько часов после «Я оплатил(а)» открывается
     доступ. Это обещание в оферте (п. 6.3) — только число от 1 до 72. */
  if (!/^\d{1,2}$/.test(chasov) || Number(chasov) < 1 || Number(chasov) > 72) {
    problems.push(
      `«srokOtkrytiyaChasov» — за сколько часов открывается доступ после оплаты, число 1–72 (сейчас: «${chasov}»)`,
    );
  }
  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(data)) {
    problems.push(`«dataOferty» — дата редакции оферты ДД.ММ.ГГГГ (сейчас: «${data}»)`);
  }
  return problems;
}
