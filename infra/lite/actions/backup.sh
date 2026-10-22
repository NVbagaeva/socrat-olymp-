#!/bin/bash
# «Копия сейчас»: та же копия, что ночью (bin/backup.sh на сервере).
. "$(dirname "$0")/lib.sh"
ssh_setup
on_server "$REMOTE_DIR/bin/backup.sh" | tee "$WORK/backup.log"
summary <<MD
### Копия базы

\`\`\`
$(cat "$WORK/backup.log")
\`\`\`
MD
