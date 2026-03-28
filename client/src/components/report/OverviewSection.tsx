/**
 * 概览统计区域
 * 设计：马卡龙色系卡片式数据展示，清晰的数据层级
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
      <div className="mb-6">
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

      {/* 第一行：总收入、总支出 - 马卡龙绿和马卡龙粉 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {/* 总收入 - 马卡龙绿 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-[#A8E6CF]/20 to-[#A8E6CF]/10 border border-[#A8E6CF]/30 rounded-xl p-4 hover:shadow-md transition-shadow"
        >
          <p className="text-xs font-semibold text-[#56AB91] mb-2 uppercase tracking-wide">总收入</p>
          <p className="text-2xl font-bold text-[#2D6A4F] tabular-nums">
            {formatCurrency(stats.totalIncome)}
          </p>
        </motion.div>

        {/* 总支出 - 马卡龙粉 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-[#FFB3D9]/20 to-[#FFB3D9]/10 border border-[#FFB3D9]/30 rounded-xl p-4 hover:shadow-md transition-shadow"
        >
          <p className="text-xs font-semibold text-[#E85D8A] mb-2 uppercase tracking-wide">总支出</p>
          <p className="text-2xl font-bold text-[#C2185B] tabular-nums">
            {formatCurrency(stats.totalExpense)}
          </p>
        </motion.div>
      </div>

      {/* 第二行：净流水、交易笔数 - 马卡龙蓝和马卡龙紫 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {/* 净流水 - 马卡龙蓝 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-[#B4E7FF]/20 to-[#B4E7FF]/10 border border-[#B4E7FF]/30 rounded-xl p-4 hover:shadow-md transition-shadow"
        >
          <p className="text-xs font-semibold text-[#0288D1] mb-2 uppercase tracking-wide">净流水</p>
          <p className="text-2xl font-bold text-[#01579B] tabular-nums">
            {stats.netFlow >= 0 ? '+' : ''}{formatCurrency(stats.netFlow)}
          </p>
        </motion.div>

        {/* 交易笔数 - 马卡龙紫 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-gradient-to-br from-[#D7BEE8]/20 to-[#D7BEE8]/10 border border-[#D7BEE8]/30 rounded-xl p-4 hover:shadow-md transition-shadow"
        >
          <p className="text-xs font-semibold text-[#7B1FA2] mb-2 uppercase tracking-wide">交易笔数</p>
          <p className="text-2xl font-bold text-[#4A148C] tabular-nums">
            {stats.totalTransactions}
          </p>
        </motion.div>
      </div>

      {/* 第三行：日均收入、日均支出 - 马卡龙黄和马卡龙薄荷 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {/* 日均收入 - 马卡龙黄 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-[#FFE5B4]/20 to-[#FFE5B4]/10 border border-[#FFE5B4]/30 rounded-xl p-4 hover:shadow-md transition-shadow"
        >
          <p className="text-xs font-semibold text-[#F57F17] mb-2 uppercase tracking-wide">日均收入</p>
          <p className="text-2xl font-bold text-[#E65100] tabular-nums">
            {formatCurrency(stats.avgDailyIncome)}
          </p>
        </motion.div>

        {/* 日均支出 - 马卡龙薄荷 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-gradient-to-br from-[#C8E6C9]/20 to-[#C8E6C9]/10 border border-[#C8E6C9]/30 rounded-xl p-4 hover:shadow-md transition-shadow"
        >
          <p className="text-xs font-semibold text-[#388E3C] mb-2 uppercase tracking-wide">日均支出</p>
          <p className="text-2xl font-bold text-[#1B5E20] tabular-nums">
            {formatCurrency(stats.avgDailyExpense)}
          </p>
        </motion.div>
      </div>

      {/* 第四行：最大单笔收入、最大单笔支出 - 马卡龙珊瑚和马卡龙天蓝 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 最大单笔收入 - 马卡龙珊瑚 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-[#FFAB91]/20 to-[#FFAB91]/10 border border-[#FFAB91]/30 rounded-xl p-4 hover:shadow-md transition-shadow"
        >
          <p className="text-xs font-semibold text-[#D84315] mb-2 uppercase tracking-wide">最大单笔收入</p>
          <p className="text-2xl font-bold text-[#BF360C] tabular-nums">
            {formatCurrency(stats.largestSingleTransaction)}
          </p>
        </motion.div>

        {/* 最大单笔支出 - 马卡龙天蓝 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-gradient-to-br from-[#81D4FA]/20 to-[#81D4FA]/10 border border-[#81D4FA]/30 rounded-xl p-4 hover:shadow-md transition-shadow"
        >
          <p className="text-xs font-semibold text-[#0277BD] mb-2 uppercase tracking-wide">最大单笔支出</p>
          <p className="text-2xl font-bold text-[#01579B] tabular-nums">
            {formatCurrency(stats.largestSingleTransaction)}
          </p>
        </motion.div>
      </div>
    </motion.section>
  );
}
