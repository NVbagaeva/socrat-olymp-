#!/bin/sh
# Секреты набора создаются здесь, на сервере, один раз: пароли ролей
# базы, ключ подписи JWT и ключи anon и service_role. Пишутся в
# .env.generated (права 600) и никуда не печатаются. Повторный запуск
# ничего не меняет: ключи сайта и пароли базы должны жить долго.
#
# Ключ anon — публичный: его увидит браузер (переменная сайта
# NEXT_PUBLIC_SUPABASE_ANON_KEY). Показать его можно отдельно:
#   bin/gen-env.sh --print-anon
set -eu
. "$(dirname "$0")/lib.sh"
target="$LITE_DIR/.env.generated"

if [ "${1:-}" = "--print-anon" ]; then
  load_env
  printf '%s\n' "$ANON_KEY"
  exit 0
fi

if [ -f "$target" ]; then
  log ".env.generated уже есть — секреты не меняются"
  exit 0
fi

umask 077
python3 - "$target" <<'PY'
import base64, hashlib, hmac, json, secrets, sys, time

def b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()

def api_key(role: str, secret: str) -> str:
    # Тот же вид, что у ключей Supabase: HS256, iss=supabase, роль в role.
    now = int(time.time())
    header = b64url(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode())
    payload = b64url(json.dumps(
        {"role": role, "iss": "supabase", "iat": now, "exp": now + 10 * 365 * 24 * 3600},
        separators=(",", ":")).encode())
    signature = hmac.new(secret.encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest()
    return f"{header}.{payload}.{b64url(signature)}"

jwt_secret = secrets.token_hex(32)
values = {
    "POSTGRES_PASSWORD": secrets.token_hex(24),
    "AUTHENTICATOR_PASSWORD": secrets.token_hex(24),
    "AUTH_ADMIN_PASSWORD": secrets.token_hex(24),
    "JWT_SECRET": jwt_secret,
    "ANON_KEY": api_key("anon", jwt_secret),
    "SERVICE_ROLE_KEY": api_key("service_role", jwt_secret),
}
with open(sys.argv[1], "w") as out:
    for key, value in values.items():
        out.write(f"{key}='{value}'\n")
PY
log "Создан .env.generated: POSTGRES_PASSWORD, AUTHENTICATOR_PASSWORD, AUTH_ADMIN_PASSWORD, JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY (значения не печатаются)"
