/**
 * 概览统计区域
 * 设计：大号数字统计展示，精准的数据层级
 */

import { motion } from 'framer-motion';
import { formatCurrency, type OverviewStats } from '@/lib/analyzer';
import { TrendingUp, TrendingDown, ArrowUpDown, Calendar } from 'lucide-react';

interface Props {
  stats: OverviewStats;
}

export default function OverviewSection({ stats }: Props) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="py-12"
    >
      {/* 标题 */}
      <div className="mb-10">
        <h2 className="text-sm font-semibold tracking-widest uppercase text-indigo mb-2">
          Overview
        </h2>
        <h3 className="text-2xl font-bold text-foreground">
          账单概览
        </h3>
        <p className="text-muted-foreground mt-1">{stats.dateRange}</p>
      </div>

      {/* 核心数据 - 大号展示 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-1"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="w-4 h-4 text-emerald-ok" />
            总收入
          </div>
          <p className="text-3xl md:text-4xl font-bold tabular-nums text-emerald-ok tracking-tight">
            {formatCurrency(stats.totalIncome)}
          </p>
          <p className="text-xs text-muted-foreground">
            日均 {formatCurrency(stats.avgDailyIncome)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-1"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingDown className="w-4 h-4 text-destructive" />
            总支出
          </div>
          <p className="text-3xl md:text-4xl font-bold tabular-nums text-destructive tracking-tight">
            {formatCurrency(stats.totalExpense)}
          </p>
          <p className="text-xs text-muted-foreground">
            日均 {formatCurrency(stats.avgDailyExpense)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-1"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowUpDown className="w-4 h-4 text-indigo" />
            净流水
          </div>
          <p className={`text-3xl md:text-4xl font-bold tabular-nums tracking-tight ${
            stats.netFlow >= 0 ? 'text-emerald-ok' : 'text-destructive'
          }`}>
            {stats.netFlow >= 0 ? '+' : ''}{formatCurrency(stats.netFlow)}
          </p>
          <p className="text-xs text-muted-foreground">
            {stats.netFlow >= 0 ? '盈余' : '亏损'}
          </p>
        </motion.div>
      </div>

      {/* 次要数据 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-border"
      >
        <div>
          <p className="text-xs text-muted-foreground mb-1">交易笔数</p>
          <p className="text-xl font-bold tabular-nums">{stats.totalTransactions.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">最大单笔</p>
          <p className="text-xl font-bold tabular-nums">{formatCurrency(stats.largestSingleTransaction)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">最频繁交易方</p>
          <p className="text-xl font-bold truncate">{stats.topCounterpart}</p>
        </div>
        <div className="flex items-start gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground mb-1">时间跨度</p>
            <p className="text-sm font-medium">{stats.dateRange}</p>
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}
