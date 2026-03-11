/**
 * 客户评分展示组件
 * 设计：极简数据叙事 - 清晰直观的评分呈现
 * 评分维度：收入水平、资金流动性、消费质量、财务稳定性、还款能力
 */

import { motion } from 'framer-motion';
import type { CustomerScore as CustomerScoreType } from '@/lib/analyzer';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface Props {
  score: CustomerScoreType;
}

const GRADE_CONFIG = {
  'A+': { color: '#10b981', bg: 'bg-emerald-ok/10', border: 'border-emerald-ok/30', label: '卓越' },
  'A':  { color: '#22c55e', bg: 'bg-green-500/10', border: 'border-green-500/30', label: '优秀' },
  'B+': { color: '#3b82f6', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: '良好' },
  'B':  { color: '#6366f1', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', label: '普通' },
  'C+': { color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: '一般' },
  'C':  { color: '#f97316', bg: 'bg-orange-500/10', border: 'border-orange-500/30', label: '偏低' },
  'D':  { color: '#ef4444', bg: 'bg-red-500/10', border: 'border-red-500/30', label: '较差' },
} as const;

const DIMENSION_CONFIG = [
  { key: 'incomeLevel', label: '收入水平', max: 25, desc: '基于月均收入水平评估' },
  { key: 'cashFlow', label: '资金流动性', max: 25, desc: '基于月均资金流水评估' },
  { key: 'consumptionQuality', label: '消费质量', max: 20, desc: '基于消费均值和高消费占比评估' },
  { key: 'stability', label: '财务稳定性', max: 20, desc: '基于收入波动和规律转账评估' },
  { key: 'repaymentAbility', label: '还款能力', max: 10, desc: '基于借款风险和还款规律评估' },
] as const;

export default function CustomerScoreCard({ score }: Props) {
  const gradeConfig = GRADE_CONFIG[score.grade];

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="py-12 border-t border-border"
    >
      <div className="mb-8">
        <h2 className="text-sm font-semibold tracking-widest uppercase text-indigo mb-2">
          Customer Score
        </h2>
        <h3 className="text-2xl font-bold text-foreground">客户评分</h3>
        <p className="text-muted-foreground mt-1">
          基于资金流水、收入支出和消费行为的综合评估
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：总分展示 */}
        <div className={`rounded-xl border p-6 flex flex-col items-center justify-center ${gradeConfig.bg} ${gradeConfig.border}`}>
          <div className="relative">
            {/* 圆形进度 */}
            <svg className="w-36 h-36" viewBox="0 0 120 120">
              {/* 背景圆 */}
              <circle
                cx="60" cy="60" r="50"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-border opacity-30"
              />
              {/* 进度圆 */}
              <motion.circle
                cx="60" cy="60" r="50"
                fill="none"
                stroke={gradeConfig.color}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - score.total / 100)}`}
                transform="rotate(-90 60 60)"
                initial={{ strokeDashoffset: `${2 * Math.PI * 50}` }}
                animate={{ strokeDashoffset: `${2 * Math.PI * 50 * (1 - score.total / 100)}` }}
                transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
              />
            </svg>
            {/* 中心文字 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                className="text-4xl font-black tabular-nums"
                style={{ color: gradeConfig.color }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.4 }}
              >
                {score.total}
              </motion.span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
          </div>
          <div className="mt-4 text-center">
            <div
              className="text-2xl font-black tracking-wider"
              style={{ color: gradeConfig.color }}
            >
              {score.grade}
            </div>
            <div className="text-sm text-muted-foreground mt-1">{gradeConfig.label}</div>
          </div>
          <p className="text-sm text-center text-muted-foreground mt-4 leading-relaxed">
            {score.summary}
          </p>
        </div>

        {/* 右侧：维度评分 */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">评分维度</h4>
          {DIMENSION_CONFIG.map((dim, i) => {
            const value = score.dimensions[dim.key];
            const pct = Math.round((value / dim.max) * 100);
            return (
              <motion.div
                key={dim.key}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i + 0.3 }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{dim.label}</span>
                    <span className="text-xs text-muted-foreground">({dim.desc})</span>
                  </div>
                  <span className="text-sm font-bold tabular-nums">
                    {value} / {dim.max}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: pct >= 80 ? '#10b981' : pct >= 60 ? '#3b82f6' : pct >= 40 ? '#f59e0b' : '#ef4444' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.1 * i + 0.5 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 评分说明 */}
      <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border">
        <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-indigo" />
          评分依据
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {score.analysis.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-emerald-ok shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 评分说明 */}
      <div className="mt-4 p-3 bg-amber-warn/5 rounded-lg border border-amber-warn/20">
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <AlertCircle className="w-4 h-4 text-amber-warn shrink-0 mt-0.5" />
          <span>
            本评分基于微信账单流水数据自动计算，仅供参考。评分维度包括：收入水平（25分）、资金流动性（25分）、消费质量（20分）、财务稳定性（20分）、还款能力（10分），满分100分。
          </span>
        </div>
      </div>
    </motion.section>
  );
}
