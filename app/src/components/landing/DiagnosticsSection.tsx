import { Badge, Button, Card, TopicList } from '@/components/ui';
import { landing } from '@/content/landing';
import { Checklist } from './Checklist';

const { diagnostics } = landing;

export function DiagnosticsSection() {
  return (
    <section className="band">
      <div className="wrap split">
        <div>
          <h3>{diagnostics.title}</h3>
          <p>{diagnostics.lead}</p>
          <Checklist items={diagnostics.checklist} />
          <div className="split__actions">
            <a className="btn btn--primary" href={diagnostics.action.href}>
              {diagnostics.action.label}
            </a>
          </div>
        </div>

        <Card title={diagnostics.card.title} action={<Badge>{diagnostics.card.badge}</Badge>}>
          <p className="t-caption muted">{diagnostics.card.levelLabel}</p>
          <p className="t-data-xl diag__score">
            {diagnostics.card.score}{' '}
            <span className="diag__unit muted">{diagnostics.card.scoreUnit}</span>
          </p>
          <p className="t-label muted diag__weak-label">{diagnostics.card.weakLabel}</p>
          <TopicList items={diagnostics.card.weak} className="topic-list--roomy" />
          <div className="diag__action">
            <Button fullWidth>{diagnostics.card.action}</Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
