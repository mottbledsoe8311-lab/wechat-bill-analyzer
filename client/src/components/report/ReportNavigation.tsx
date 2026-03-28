/**
 * 报表导航栏
 * 显示报表各个模块的导航链接，支持快速跳转
 * 使用网格布局，自动适配不同屏幕尺寸
 */

import { useRef } from 'react';
import { motion } from 'framer-motion';

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
      className="bg-background/95 backdrop-blur-sm border-b border-border/50 py-3 mb-8"
    >
      <div className="container px-4">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-semibold text-muted-foreground shrink-0">快速导航:</p>
        </div>
        
        {/* 响应式网格布局 */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6" ref={scrollContainerRef}>
          {NAV_ITEMS.map((item, index) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleNavigate(item.id)}
              className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg bg-muted/50 hover:bg-muted text-xs sm:text-sm font-medium text-foreground transition-colors"
            >
              <span className="text-base sm:text-lg">{item.icon}</span>
              <span className="text-center line-clamp-2">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
