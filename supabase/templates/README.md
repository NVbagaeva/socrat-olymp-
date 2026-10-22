# Шаблоны писем

Письма отправляет служба входа Supabase. Тексты задаются в панели
проекта: **Authentication → Emails → Templates**. Файлы здесь — то, что
туда вставляется, чтобы тексты лежали в репозитории и правились
pull request'ом.

| Файл | Шаблон в панели | Тема письма |
|---|---|---|
| `confirm-signup.html` | Confirm sign up | Подтвердите почту — Будет на ЕГЭ |
| `reset-password.html` | Reset password | Сброс пароля — Будет на ЕГЭ |
| `change-email.html` | Change email address | Подтвердите новую почту — Будет на ЕГЭ |

Остальные шаблоны (Magic link, Invite user, Reauthentication) сайт не
использует: вход по ссылке и приглашения выключены.

`{{ .ConfirmationURL }}` подставляет сервис. Ссылка ведёт на страницу
сайта из списка Redirect URLs (`/voyti/podtverzhdenie/` или
`/voyti/novyy-parol/`), токены приходят в якоре адреса и на сервер
хостинга не уходят.

Письма общие для ученика и репетитора, поэтому на «вы».
Для локального запуска (`supabase start`) те же файлы подключены в
`supabase/config.toml`.
