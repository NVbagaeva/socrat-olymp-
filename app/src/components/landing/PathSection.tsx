import { Badge, Button, RecommendationCard } from '@/components/ui';
import { landing } from '@/content/landing';
import { Checklist } from './Checklist';

const { path } = landing;

export function PathSection() {
  return (
    <section className="band band--soft" id="path">
      <div className="wrap split">
        <RecommendationCard
          title={path.card.title}
          action={<Badge tone="info">{path.card.badge}</Badge>}
          items={path.card.items.map((item) => ({
            id: item.id,
            title: item.title,
            why: item.why,
            primary: item.primary ?? false,
            action: (
              <Button variant={item.primary ? 'primary' : 'secondary'} size="sm">
                {item.action}
              </Button>
            ),
          }))}
        />
        <div>
          <h3>{path.title}</h3>
          <p>{path.lead}</p>
          <Checklist items={path.checklist} />
        </div>
      </div>
    </section>
  );
}
