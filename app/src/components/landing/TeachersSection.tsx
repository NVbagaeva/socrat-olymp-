import { Badge, Card, Table, type TableColumn } from '@/components/ui';
import { landing, type StudentRow } from '@/content/landing';

const { teachers } = landing;

const COLUMNS: TableColumn<StudentRow>[] = [
  { key: 'name', header: teachers.card.columns.name, render: (row) => row.name },
  { key: 'score', header: teachers.card.columns.score, align: 'right', render: (row) => row.score },
  {
    key: 'trend',
    header: teachers.card.columns.trend,
    align: 'right',
    trend: (row) => (row.trend > 0 ? 'up' : row.trend < 0 ? 'down' : 'flat'),
    render: (row) =>
      row.trend > 0 ? `+${row.trend}` : row.trend < 0 ? `−${Math.abs(row.trend)}` : '0',
  },
  {
    key: 'status',
    header: teachers.card.columns.status,
    render: (row) => <Badge tone={row.statusTone}>{row.status}</Badge>,
  },
];

export function TeachersSection() {
  return (
    <section className="band band--soft" id="teachers">
      <div className="wrap split">
        <div>
          <h3>{teachers.title}</h3>
          <p>{teachers.lead}</p>
          <div className="split__actions">
            <a className="btn btn--primary" href={teachers.primaryAction.href}>
              {teachers.primaryAction.label}
            </a>
            <a className="btn btn--secondary" href={teachers.secondaryAction.href}>
              {teachers.secondaryAction.label}
            </a>
          </div>
        </div>

        <Card title={teachers.card.title} action={<Badge>{teachers.card.badge}</Badge>}>
          <Table
            columns={COLUMNS}
            rows={[...teachers.card.rows]}
            getRowKey={(row) => row.id}
            caption={teachers.card.title}
          />
          <p className="t-caption dim teachers__note">{teachers.card.note}</p>
        </Card>
      </div>
    </section>
  );
}
