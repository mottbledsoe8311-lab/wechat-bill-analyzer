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
      className="py-10"
    >
      {/* 标题和客户名字 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="text-2xl">📄</div>
              <h3 className="text-2xl font-bold text-foreground">
                {stats.accountName && (
                  <span className="text-indigo">{stats.accountName}</span>
                )}
                {stats.accountName && <span className="mx-2 text-foreground">账户概况</span>}
                {!stats.accountName && <span>账户概况</span>}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">{stats.dateRange}</p>
          </div>
        </div>
      </div>

      {/* 2x2 网格卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* 总收入 - 绿色 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-emerald-ok/10 border border-emerald-ok/20 rounded-2xl p-6"
        >
          <p className="text-sm font-medium text-emerald-ok/70 mb-3">总收入</p>
          <p className="text-4xl font-bold text-emerald-ok tabular-nums">
            {formatCurrency(stats.totalIncome)}
          </p>
        </motion.div>

        {/* 总支出 - 红色 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6"
        >
          <p className="text-sm font-medium text-destructive/70 mb-3">总支出</p>
          <p className="text-4xl font-bold text-destructive tabular-nums">
            {formatCurrency(stats.totalExpense)}
          </p>
        </motion.div>

        {/* 净流水 - 蓝色 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6"
        >
          <p className="text-sm font-medium text-blue-500/70 mb-3">净流水</p>
          <p className="text-4xl font-bold text-blue-500 tabular-nums">
            {stats.netFlow >= 0 ? '+' : ''}{formatCurrency(stats.netFlow)}
          </p>
        </motion.div>

        {/* 交易笔数 - 紫色 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-6"
        >
          <p className="text-sm font-medium text-purple-500/70 mb-3">交易笔数</p>
          <p className="text-4xl font-bold text-purple-500 tabular-nums">
            {stats.totalTransactions}
          </p>
        </motion.div>
      </div>

      {/* 次要信息 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
      >
        <div className="bg-muted/40 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-2">日均收入</p>
          <p className="font-bold text-foreground text-sm">{formatCurrency(stats.avgDailyIncome)}</p>
        </div>
        <div className="bg-muted/40 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-2">日均支出</p>
          <p className="font-bold text-foreground text-sm">{formatCurrency(stats.avgDailyExpense)}</p>
        </div>
        <div className="bg-muted/40 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-2">最大单笔</p>
          <p className="font-bold text-foreground text-sm">{formatCurrency(stats.largestSingleTransaction)}</p>
        </div>
      </motion.div>
    </motion.section>
  );
}
