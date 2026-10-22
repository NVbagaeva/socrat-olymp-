# infra/lite — сервер api.budetege.ru

Облегчённый набор Supabase (PostgreSQL, GoTrue, PostgREST, Caddy) и всё,
чтобы поднимать и обслуживать его кнопками GitHub Actions.

- Как пользоваться, что вписать в Secrets и что делать при сбое —
  [docs/SERVER.md](../../docs/SERVER.md).
- Почему такой набор и такой сервер — [docs/hosting-lite.md](../../docs/hosting-lite.md).

Секретов здесь нет и быть не должно: они создаются на сервере
(`bin/gen-env.sh`) или приходят из GitHub Secrets. Проверка —
`pnpm test:infra-secrets` в `app/`.
