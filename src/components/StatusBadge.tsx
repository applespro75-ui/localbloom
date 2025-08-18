import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: 'open' | 'mild' | 'busy' | 'closed';
  className?: string;
}

const statusConfig = {
  open: {
    label: 'Open',
    className: 'bg-status-open text-white border-status-open'
  },
  mild: {
    label: 'Mild',
    className: 'bg-status-mild text-white border-status-mild'
  },
  busy: {
    label: 'Busy',
    className: 'bg-status-busy text-white border-status-busy'
  },
  closed: {
    label: 'Closed',
    className: 'bg-status-closed text-white border-status-closed'
  }
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge className={`${config.className} ${className || ''} whitespace-nowrap text-xs px-2 py-1`}>
      {config.label}
    </Badge>
  );
}