/** Имя ученика для репетитора: псевдоним, который дал репетитор, или имя из профиля. */
export function memberNameOf(member: { name: string; alias: string | null }): string {
  return member.alias ?? member.name;
}
