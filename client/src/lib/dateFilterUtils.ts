/**
 * 日期范围过滤工具
 * 用于在各个分析模块中进行灵活的时间过滤
 */

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

/**
 * 计算日期范围
 */
export function calculateDateRange(type: '1m' | '3m' | '6m' | 'all', allDates: Date[]): DateRange {
  if (allDates.length === 0) {
    const today = new Date();
    return {
      start: today,
      end: today,
      label: '全部',
    };
  }

  const sortedDates = [...allDates].sort((a, b) => a.getTime() - b.getTime());
  const minDate = sortedDates[0];
  const maxDate = sortedDates[sortedDates.length - 1];

  if (type === 'all') {
    return {
      start: minDate,
      end: maxDate,
      label: '全部',
    };
  }

  const endDate = maxDate;
  let startDate: Date;
  let label: string;

  switch (type) {
    case '1m':
      startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - 1);
      label = '最近1个月';
      break;
    case '3m':
      startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - 3);
      label = '最近3个月';
      break;
    case '6m':
      startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - 6);
      label = '最近6个月';
      break;
  }

  return {
    start: startDate,
    end: endDate,
    label,
  };
}

/**
 * 过滤交易记录
 */
export function filterTransactionsByDateRange<T extends { date: Date }>(
  transactions: T[],
  dateRange: DateRange
): T[] {
  return transactions.filter(tx => {
    const txTime = tx.date.getTime();
    const startTime = dateRange.start.getTime();
    const endTime = dateRange.end.getTime();
    return txTime >= startTime && txTime <= endTime;
  });
}

/**
 * 格式化日期范围显示
 */
export function formatDateRangeDisplay(dateRange: DateRange): string {
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const startStr = formatter.format(dateRange.start);
  const endStr = formatter.format(dateRange.end);
  
  return `${startStr} ~ ${endStr}`;
}
