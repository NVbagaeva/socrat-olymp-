-- «Варианты месяца» в журнале ученика — своим источником.
--
-- До сих пор онлайн-решение варианта месяца (/ezhemesyachnye/) писалось
-- в varianty_resheniya как 'povyshennye': оба раздела решаются на одном
-- экране. Учитель не мог отличить вариант месяца от варианта повышенной
-- сложности иначе как по названию. Теперь у него свой источник 'mesyac'.
--
-- Записанные раньше строки не меняются: сайт при показе узнаёт вариант
-- месяца по коду набора (set_code «EV-NN», lib/ezhemesyachnye/kod.ts).

alter table public.varianty_resheniya drop constraint varianty_resheniya_source_check;
alter table public.varianty_resheniya
  add constraint varianty_resheniya_source_check
  check (source in ('sobrat', 'seriya', 'povyshennye', 'mesyac', 'rabota'));
