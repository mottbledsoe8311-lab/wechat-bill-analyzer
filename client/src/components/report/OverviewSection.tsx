/**
 * 概览统计区域
 * 设计：2x2 网格卡片式数据展示，清晰的数据层级
 */

import { motion } from 'framer-motion';
import { formatCurrency, type OverviewStats } from '@/lib/analyzer';

interface Props {
  stats: OverviewStats;
}

// 帮助函数：根据是否有账户名字来构建标题
function buildTitle(accountName?: string): string {
  if (accountName) {
    return `${accountName} 账户概况`;
  }
  return '账户概况';
}

export default function OverviewSection({ stats }: Props) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="py-6"
    >
      {/* 标题和客户名字 */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="text-lg">📄</div>
          <h3 className="text-lg font-bold text-foreground break-words">
            {stats.accountName && (
              <span className="text-indigo break-words">{stats.accountName}</span>
            )}
            {stats.accountName && <span className="mx-2 text-foreground">账户概况</span>}
            {!stats.accountName && <span>账户概况</span>}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground ml-7">{stats.dateRange}</p>
      </div>

      {/* 主要指标 - 分三行显示 */}
      {/* 第一行：总收入、总支出 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        {/* 总收入 - 绿色 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-emerald-ok/10 border border-emerald-ok/20 rounded-lg p-3"
        >
          <p className="text-xs font-medium text-emerald-ok/70 mb-1">总收入</p>
          <p className="text-xl font-bold text-emerald-ok tabular-nums">
            {formatCurrency(stats.totalIncome)}
          </p>
        </motion.div>

        {/* 总支出 - 红色 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-destructive/10 border border-destructive/20 rounded-lg p-3"
        >
          <p className="text-xs font-medium text-destructive/70 mb-1">总支出</p>
          <p className="text-xl font-bold text-destructive tabular-nums">
            {formatCurrency(stats.totalExpense)}
          </p>
        </motion.div>
      </div>

      {/* 第二行：净流水、交易笔数 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        {/* 净流水 - 蓝色 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3"
        >
          <p className="text-xs font-medium text-blue-500/70 mb-1">净流水</p>
          <p className="text-xl font-bold text-blue-500 tabular-nums">
            {stats.netFlow >= 0 ? '+' : ''}{formatCurrency(stats.netFlow)}
          </p>
        </motion.div>

        {/* 交易笔数 - 紫色 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3"
        >
          <p className="text-xs font-medium text-purple-500/70 mb-1">交易笔数</p>
          <p className="text-xl font-bold text-purple-500 tabular-nums">
            {stats.totalTransactions}
          </p>
        </motion.div>
      </div>

      {/* 次要信息 - 双列紧凑 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-2 gap-2"
      >
        <div className="bg-muted/40 rounded-lg p-2.5">
          <p className="text-xs text-muted-foreground mb-1">日均收入</p>
          <p className="font-bold text-foreground text-sm">{formatCurrency(stats.avgDailyIncome)}</p>
        </div>
        <div className="bg-muted/40 rounded-lg p-2.5">
          <p className="text-xs text-muted-foreground mb-1">日均支出</p>
          <p className="font-bold text-foreground text-sm">{formatCurrency(stats.avgDailyExpense)}</p>
        </div>
        <div className="bg-muted/40 rounded-lg p-2.5">
          <p className="text-xs text-muted-foreground mb-1">最大单笔</p>
          <p className="font-bold text-foreground text-sm">{formatCurrency(stats.largestSingleTransaction)}</p>
        </div>
        <div className="bg-muted/40 rounded-lg p-2.5">
          <p className="text-xs text-muted-foreground mb-1">日均笔数</p>
          <p className="font-bold text-foreground text-sm">{stats.transactionDays ? (stats.totalTransactions / stats.transactionDays).toFixed(1) : 0} 笔/天</p>
        </div>
      </motion.div>
    </motion.section>
  );
}
