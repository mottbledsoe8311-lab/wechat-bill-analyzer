/**
 * 报表导航栏
 * 显示报表各个模块的导航链接，支持快速跳转
 */

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: '账户概况', icon: '📊' },
  { id: 'monthly', label: '月度收支', icon: '📈' },
  { id: 'regular', label: '规律转账', icon: '🔄' },
  { id: 'repayment', label: '还款追踪', icon: '💳' },
  { id: 'inflows', label: '大额入账', icon: '💰' },
  { id: 'counterpart', label: '交易对方', icon: '👥' },
];

interface Props {
  onNavigate?: (sectionId: string) => void;
}

export default function ReportNavigation({ onNavigate }: Props) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleNavigate = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    onNavigate?.(sectionId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 py-3 mb-8"
    >
      <div className="container">
        <div className="flex items-center gap-2 overflow-x-auto pb-2" ref={scrollContainerRef}>
          <p className="text-xs font-semibold text-muted-foreground shrink-0">快速导航:</p>
          <div className="flex gap-2 overflow-x-auto">
            {NAV_ITEMS.map((item, index) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleNavigate(item.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted text-sm font-medium text-foreground transition-colors whitespace-nowrap shrink-0"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
