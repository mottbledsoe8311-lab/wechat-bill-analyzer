/**
 * 概览统计区域
 * 设计：精致卡片式数据展示，清晰的数据层级
 */

import { motion } from 'framer-motion';
import { formatCurrency, type OverviewStats } from '@/lib/analyzer';
import { TrendingUp, TrendingDown, ArrowUpDown, Hash, Maximize2, Users, Calendar } from 'lucide-react';

interface Props {
  stats: OverviewStats;
}

export default function OverviewSection({ stats }: Props) {
  const netPositive = stats.netFlow >= 0;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="py-10"
    >
      {/* 标题 */}
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-widest uppercase text-indigo mb-1.5">Overview</p>
        <h3 className="text-2xl font-bold text-foreground">账单概览</h3>
        <p className="text-sm text-muted-foreground mt-1">{stats.dateRange}</p>
      </div>

      {/* 核心数据卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-emerald-ok/5 border border-emerald-ok/20 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-emerald-ok/80 uppercase tracking-wider">总收入</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-ok/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-ok" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold tabular-nums text-emerald-ok tracking-tight leading-none">
            {formatCurrency(stats.totalIncome)}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            日均 <span className="font-medium text-foreground">{formatCurrency(stats.avgDailyIncome)}</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-destructive/5 border border-destructive/20 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-destructive/80 uppercase tracking-wider">总支出</span>
            <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-destructive" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold tabular-nums text-destructive tracking-tight leading-none">
            {formatCurrency(stats.totalExpense)}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            日均 <span className="font-medium text-foreground">{formatCurrency(stats.avgDailyExpense)}</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`${netPositive ? 'bg-indigo/5 border-indigo/20' : 'bg-destructive/5 border-destructive/20'} border rounded-xl p-5`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-medium uppercase tracking-wider ${netPositive ? 'text-indigo/80' : 'text-destructive/80'}`}>净流水</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${netPositive ? 'bg-indigo/10' : 'bg-destructive/10'}`}>
              <ArrowUpDown className={`w-4 h-4 ${netPositive ? 'text-indigo' : 'text-destructive'}`} />
            </div>
          </div>
          <p className={`text-2xl sm:text-3xl font-bold tabular-nums tracking-tight leading-none ${
            netPositive ? 'text-indigo' : 'text-destructive'
          }`}>
            {netPositive ? '+' : ''}{formatCurrency(stats.netFlow)}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            <span className={`font-medium ${netPositive ? 'text-indigo' : 'text-destructive'}`}>
              {netPositive ? '资金盈余' : '资金亏损'}
            </span>
          </p>
        </motion.div>
      </div>

      {/* 次要数据 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          {
            icon: Hash,
            label: '交易笔数',
            value: stats.totalTransactions.toLocaleString(),
            unit: '笔',
          },
          {
            icon: Maximize2,
            label: '最大单笔',
            value: formatCurrency(stats.largestSingleTransaction),
            unit: '',
          },
          {
            icon: Users,
            label: '最频繁交易方',
            value: stats.topCounterpart,
            unit: '',
            truncate: true,
          },
          {
            icon: Calendar,
            label: '时间跨度',
            value: stats.dateRange,
            unit: '',
            small: true,
          },
        ].map((item, i) => (
          <div key={i} className="bg-muted/40 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <item.icon className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
            <p className={`font-bold text-foreground ${item.small ? 'text-xs leading-relaxed' : 'text-base'} ${item.truncate ? 'truncate' : ''}`}>
              {item.value}{item.unit && <span className="text-xs font-normal text-muted-foreground ml-0.5">{item.unit}</span>}
            </p>
          </div>
        ))}
      </motion.div>
    </motion.section>
  );
}
