/** Дизайн-система «Будет на ЕГЭ». Единственная точка импорта компонентов. */

export { Button, type ButtonProps, type ButtonSize, type ButtonVariant } from './Button';
export { Input, type InputProps, type FieldState } from './Input';
export { Select, type SelectProps } from './Select';
export { Checkbox, type CheckboxProps } from './Checkbox';
export { Radio, type RadioProps } from './Radio';
export { FieldLabel, type FieldLabelProps } from './FieldLabel';
export { FieldMessage, type FieldMessageProps, type FieldMessageTone } from './FieldMessage';

export { Tabs, type TabItem, type TabsProps } from './Tabs';
export { Badge, type BadgeProps, type BadgeTone } from './Badge';
export { Avatar, type AvatarProps, type AvatarSize, type AvatarTone } from './Avatar';
export { AvatarGroup, type AvatarGroupProps } from './AvatarGroup';
export { Tooltip, type TooltipProps } from './Tooltip';
export { Skeleton, type SkeletonProps } from './Skeleton';

export { Card, type CardProps } from './Card';
export { MetricRow, type MetricRowProps } from './MetricRow';
export { Metric, type MetricDirection, type MetricProps, type MetricSize } from './Metric';
export { TaskCard, type TaskCardProps, type TaskStatusTone } from './TaskCard';
export { HomeworkCard, type HomeworkCardProps } from './HomeworkCard';
export {
  RecommendationCard,
  type Recommendation,
  type RecommendationCardProps,
} from './RecommendationCard';

export { ProgressBar, type ProgressBarProps } from './ProgressBar';
export { ProgressRing, type ProgressRingProps } from './ProgressRing';
export { TopicList, type Topic, type TopicListProps } from './TopicList';
export { Table, type TableColumn, type TableProps, type TableTrend } from './Table';
export { BarChart, type Bar, type BarChartProps } from './BarChart';
export {
  TrajectoryChart,
  type TrajectoryChartProps,
  type TrajectoryGoal,
  type TrajectoryPoint,
} from './TrajectoryChart';
export { Sparkline, type SparklineProps } from './Sparkline';
export { Heatmap, type HeatLevel, type HeatmapProps, type HeatmapRow } from './Heatmap';

export { EmptyState, type StateProps } from './EmptyState';
export { ErrorState } from './ErrorState';
export { SuccessState } from './SuccessState';
export { Toast, type ToastProps } from './Toast';
export { Modal, type ModalProps } from './Modal';
export { Notification, type NotificationProps } from './Notification';
export { AlertIcon, CheckIcon, TrajectoryIcon } from './StateIcons';

export { Sidebar, type NavItem, type SidebarProps } from './Sidebar';
export { Topbar, type TopbarProps } from './Topbar';
export { BottomNavigation, type BottomNavigationProps } from './BottomNavigation';
