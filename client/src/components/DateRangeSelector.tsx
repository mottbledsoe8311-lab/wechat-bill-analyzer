import { Button } from '@/components/ui/button';
import type { DateRange } from '@/lib/dateFilterUtils';
import { formatDateRangeDisplay } from '@/lib/dateFilterUtils';

interface DateRangeSelectorProps {
  selectedRange: DateRange;
  onRangeChange: (type: '1m' | '3m' | '6m' | 'all') => void;
}

export default function DateRangeSelector({ selectedRange, onRangeChange }: DateRangeSelectorProps) {
  const options = [
    { value: '1m' as const, label: '最近1个月' },
    { value: '3m' as const, label: '最近3个月' },
    { value: '6m' as const, label: '最近6个月' },
    { value: 'all' as const, label: '全部' },
  ];

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-sm font-medium text-muted-foreground">时间范围：</span>
      <div className="flex flex-wrap gap-2">
        {options.map(option => (
          <Button
            key={option.value}
            variant={selectedRange.label === option.label ? 'default' : 'outline'}
            size="sm"
            onClick={() => onRangeChange(option.value)}
            className="text-xs"
          >
            {option.label}
          </Button>
        ))}
      </div>
      <span className="text-xs text-muted-foreground ml-2">
        {formatDateRangeDisplay(selectedRange)}
      </span>
    </div>
  );
}
