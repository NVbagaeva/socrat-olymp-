-- Замена Supabase Vault для supabase/trial/auth_trial.sql.
--
-- Хук регистрации читает список разрешённых адресов из
-- vault.decrypted_secrets. Расширения supabase_vault в чистом
-- PostgreSQL нет, поэтому здесь та же витрина поверх обычной таблицы:
-- SQL пробного кабинета применяется без единой правки.
--
-- Шифрования, как в Vault, нет. На своём сервере это мало что меняет:
-- ключ Vault лежал бы на том же диске, а порт базы наружу закрыт.
-- Читать таблицу может только владелец (postgres) и функции, которые
-- работают от его имени, — хук регистрации.
create schema vault;
revoke all on schema vault from public;

create table vault.secrets (
  name text primary key,
  secret text not null,
  updated_at timestamptz not null default now()
);

create view vault.decrypted_secrets as
  select name, secret as decrypted_secret from vault.secrets;
