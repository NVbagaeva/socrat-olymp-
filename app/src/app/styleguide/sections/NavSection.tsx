'use client';

import { Avatar, AvatarGroup, Badge, Card, Tabs, Tooltip } from '@/components/ui';
import { SectionHeader } from '../SectionHeader';

const TABS = [
  { id: 'overview', label: 'Обзор' },
  { id: 'topics', label: 'Темы' },
  { id: 'grades', label: 'Успеваемость' },
  { id: 'trend', label: 'Динамика' },
];

export function NavSection() {
  return (
    <section id="nav">
      <SectionHeader
        title="Табы, бейджи, аватары"
        index="06"
        description="Бейдж всегда содержит текст: цвет не может быть единственным носителем смысла."
      />
      <Card className="block">
        <Tabs items={TABS} label="Разделы ученика" className="mb-7" />

        <div className="row mb-6">
          <Badge tone="success">Отлично</Badge>
          <Badge tone="info">Хорошо</Badge>
          <Badge tone="warning">Требует внимания</Badge>
          <Badge tone="error">Риск</Badge>
          <Badge>Средний уровень</Badge>
        </div>

        <div className="row">
          <Avatar initials="АС" name="Алексей С." />
          <Avatar initials="ПК" name="Пётр К." size="sm" />
          <Avatar initials="МЛ" name="Мария Л." size="xs" />
          <AvatarGroup overflow={6} label="Ученики группы">
            <Avatar initials="АБ" name="Анна Б." size="sm" />
            <Avatar initials="ПК" name="Пётр К." size="sm" />
            <Avatar initials="МЛ" name="Мария Л." size="sm" />
          </AvatarGroup>
          <Tooltip content="Средний результат по 5 последним работам" className="ml-4">
            Средний результат
          </Tooltip>
        </div>
      </Card>
    </section>
  );
}
