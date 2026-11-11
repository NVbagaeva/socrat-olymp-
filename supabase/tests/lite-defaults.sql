-- Права по умолчанию — как на своём сервере (infra/lite/db/01-schemas.sql):
-- у anon и authenticated ВСЕ права на новые таблицы, последовательности и
-- функции схемы public. Проверка RLS идёт именно на таком фоне: если
-- миграция забыла снять лишнее, тест это увидит.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
