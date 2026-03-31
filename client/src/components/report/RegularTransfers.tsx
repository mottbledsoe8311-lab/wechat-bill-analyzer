/**
 * 规律转账识别展示
 * 设计：精致卡片式 - 风险等级色彩编码，只展示转出，展开时显示相关所有进出流水
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, formatDate, type RegularTransferGroup } from '@/lib/analyzer';
import { ChevronDown, Clock, AlertTriangle, Repeat, TrendingDown, TrendingUp, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';

interface Props {
  groups: RegularTransferGroup[];
  allTransactions?: any[];
}

const riskConfig = {
  low:    { bg: 'bg-emerald-ok/5',    border: 'border-emerald-ok/20',    text: 'text-emerald-ok',    icon: 'bg-emerald-ok/10',    label: '低风险' },
  medium: { bg: 'bg-amber-warn/5',    border: 'border-amber-warn/20',    text: 'text-amber-warn',    icon: 'bg-amber-warn/10',    label: '中风险' },
  high:   { bg: 'bg-destructive/5',   border: 'border-destructive/20',   text: 'text-destructive',   icon: 'bg-destructive/10',   label: '高风险' },
};

export default function RegularTransfers({ groups, allTransactions = [] }: Props) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [riskAccountsMap, setRiskAccountsMap] = useState<Record<string, any>>({});
  const riskAccountsQuery = trpc.riskAccounts.getAll.useQuery();
  const saveRiskMutation = trpc.riskAccounts.save.useMutation();

  // 加载所有高风险账户
  useEffect(() => {
    if (riskAccountsQuery.data?.data) {
      const map = riskAccountsQuery.data.data.reduce((acc: Record<string, any>, account: any) => {
        acc[account.accountName] = account;
        return acc;
      }, {});
      setRiskAccountsMap(map);
    }
  }, [riskAccountsQuery.data]);

  // 只取转出方向的规律转账
  // 1. 数据库中的疑似还款帐号（isInRiskAccountsMap）：直接显示，不需要满足51%规律度条件
  // 2. 其他情况：需要满足51%规律度条件，且（风险等级为中/高，且时间间隔1-40天）或者是疑似还款帐号
  const outGroups = groups.filter(g => {
    const isOut = g.direction === '支出' || g.direction === '支';
    const isAbove51Percent = g.confidence >= 0.51;
    const isMediumHigh = g.riskLevel === 'medium' || g.riskLevel === 'high';
    const isWithin40Days = !g.intervalDays || g.intervalDays <= 40;
    const isSuspectedRepayment = g.isSuspectedRepayment === true;
    const isInRiskAccountsMap = riskAccountsMap[g.counterpart]?.riskLevel === 'high';
    
    // 数据库中的疑似还款帐号不需要满足51%规律度条件
    if (isOut && isInRiskAccountsMap) {
      return true;
    }
    
    // 其他情况需要满足51%规律度条件
    return isOut && isAbove51Percent && (isSuspectedRepayment || (isMediumHigh && isWithin40Days));
  });

  // 按风险等级+置信度排序，疑似还款帐号优先级最高
  const riskOrder = { high: 0, medium: 1, low: 2 };
  const sorted = [...outGroups].sort((a, b) => {
    // 疑似还款帐号优先级最高
    if (a.isSuspectedRepayment !== b.isSuspectedRepayment) {
      return a.isSuspectedRepayment ? -1 : 1;
    }
    if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    return b.confidence - a.confidence;
  });

  if (sorted.length === 0) {
    return (
      <section className="py-10 border-t border-border">
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest uppercase text-indigo mb-1.5">Regular Transfers</p>
          <h3 className="text-2xl font-bold text-foreground">规律转账识别</h3>
        </div>
        <div className="text-center py-16 text-muted-foreground">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Repeat className="w-7 h-7 opacity-30" />
          </div>
          <p className="font-medium">未检测到明显的规律转账模式</p>
          <p className="text-xs mt-1 opacity-60">规律转账需至少3笔以上周期性交易</p>
        </div>
      </section>
    );
  }

  const highConfidenceCount = sorted.filter(g => g.confidence >= 1.0).length;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="py-10 border-t border-border"
    >
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-widest uppercase text-indigo mb-1.5">Regular Transfers</p>
        <h3 className="text-2xl font-bold text-foreground">规律转账识别</h3>
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <p className="text-sm text-muted-foreground">
            检测到 <span className="font-semibold text-foreground">{sorted.length}</span> 个中/高风险规律转出
          </p>
          {highConfidenceCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
              <ShieldAlert className="w-3.5 h-3.5" />
              {highConfidenceCount} 个重点核实对象
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {sorted.map((g, index) => {
          const risk = riskConfig[g.riskLevel];
          const isExpanded = expandedIndex === index;
          // 重点核实条件：规律度100% 且 高风险
          const isHighRisk = g.confidence >= 1.0 && g.riskLevel === 'high';
          
          // 检查是否是疑似还款账号（从数据库或从 isSuspectedRepayment 字段）
          const isSuspectedRepaymentAccount = riskAccountsMap[g.counterpart]?.riskLevel === 'high' || g.isSuspectedRepayment === true;

          // 获取该对方的所有进出流水（不限方向）
          const counterpartName = g.counterpart;
          const relatedTxs = allTransactions?.length > 0
            ? allTransactions
                .filter(tx => tx.counterpart?.trim() === counterpartName)
                .sort((a: any, b: any) => b.date.getTime() - a.date.getTime())
            : g.transactions.map(t => ({ ...t, direction: g.direction }));

          // 统计收入和支出
          const totalIn = relatedTxs
            .filter((tx: any) => tx.direction === '收入' || tx.direction === '收')
            .reduce((sum: number, tx: any) => sum + tx.amount, 0);
          const totalOut = relatedTxs
            .filter((tx: any) => tx.direction === '支出' || tx.direction === '支')
            .reduce((sum: number, tx: any) => sum + tx.amount, 0);

          return (
            <motion.div
              key={`${g.counterpart}-${index}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * index }}
              className={`rounded-xl overflow-hidden border transition-shadow ${
                isHighRisk
                  ? 'border-red-400/40 shadow-sm shadow-red-500/10'
                  : risk.border
              }`}
            >
              <button
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors text-left ${
                  isHighRisk ? 'bg-red-500/5 hover:bg-red-500/10' : `${risk.bg} hover:brightness-95`
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    isHighRisk ? 'bg-red-500/15' : risk.icon
                  }`}>
                    {g.riskLevel === 'high'
                      ? <AlertTriangle className={`w-4.5 h-4.5 ${isHighRisk ? 'text-red-600' : risk.text}`} />
                      : <Clock className={`w-4.5 h-4.5 ${risk.text}`} />
                    }
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-sm">{g.counterpart}</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${risk.text} ${risk.border}`}>
                        {risk.label}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">转出</Badge>
                      {isHighRisk && (
                        <Badge className="text-[10px] px-1.5 py-0 h-4 bg-red-600 text-white hover:bg-red-700">
                          🚨 重点核实
                        </Badge>
                      )}
                      {g.isSuspectedRepayment === true && (
                        <Badge className="text-[10px] px-1.5 py-0 h-4 bg-orange-600 text-white hover:bg-orange-700">
                          疑似还款帐号
                        </Badge>
                      )}
                      {isSuspectedRepaymentAccount && !g.isSuspectedRepayment && (
                        <Badge className="text-[10px] px-1.5 py-0 h-4 bg-amber-600 text-white hover:bg-amber-700">
                          疑似还款帐号
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Repeat className="w-3 h-3" />
                        {g.pattern} · {g.transactions.length}笔支出
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      规律度：<span className="font-semibold text-foreground">{(g.confidence * 100).toFixed(0)}%</span>
                    </div>
                    {isHighRisk && !isSuspectedRepaymentAccount && !g.isSuspectedRepayment && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // 自动保存到高风险账户数据库
                          saveRiskMutation.mutate(
                            {
                              accountName: g.counterpart,
                              riskLevel: 'high',
                              regularity: Math.round(g.confidence * 100),
                              description: `规律转账识别 - ${g.pattern}，${g.transactions.length}笔支出`,
                            },
                            {
                              onSuccess: () => {
                                // 保存成功后，刷新风险账户列表
                                riskAccountsQuery.refetch();
                              },
                            }
                          );
                        }}
                        disabled={saveRiskMutation.isPending}
                        className="text-xs text-blue-600 hover:text-blue-700 mt-1 underline disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saveRiskMutation.isPending ? '保存中...' : '自动标记为疑似还款帐号'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <div className="text-right space-y-0.5">
                    <div className="flex items-center gap-1 justify-end">
                      <TrendingDown className="w-3 h-3 text-destructive" />
                      <span className="font-bold tabular-nums text-destructive text-xs">{formatCurrency(g.totalAmount)}</span>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border/40 bg-background/60 p-4">
                      {/* 收支汇总 */}
                      <div className="flex items-center gap-4 mb-3 text-xs">
                        <span className="text-muted-foreground font-medium">
                          {counterpartName} · 全部 {relatedTxs.length} 笔流水
                        </span>
                        <span className="flex items-center gap-1 text-destructive">
                          <TrendingDown className="w-3 h-3" />
                          转出 {formatCurrency(totalOut)}
                        </span>
                        {totalIn > 0 && (
                          <span className="flex items-center gap-1 text-emerald-ok">
                            <TrendingUp className="w-3 h-3" />
                            转入 {formatCurrency(totalIn)}
                          </span>
                        )}
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border/60">
                              <th className="text-left py-2 pr-2">日期</th>
                              <th className="text-left py-2 px-2">来源</th>
                              <th className="text-left py-2 px-2">金额</th>
                              <th className="text-left py-2 px-2">收/支</th>
                            </tr>
                          </thead>
                          <tbody>
                            {relatedTxs.slice(0, 10).map((tx: any, i: number) => (
                              <tr key={i} className="border-b border-border/30 hover:bg-muted/30">
                                <td className="py-1.5 pr-2 text-muted-foreground">{formatDate(tx.date)}</td>
                                <td className="py-1.5 px-2 text-muted-foreground truncate">{tx.method || tx.remark || '-'}</td>
                                <td className="py-1.5 px-2 font-semibold">{formatCurrency(tx.amount)}</td>
                                <td className="py-1.5 px-2">
                                  <Badge variant="outline" className="text-[10px]">
                                    {tx.direction === '收入' || tx.direction === '收' ? '收入' : '支出'}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {relatedTxs.length > 10 && (
                        <p className="text-xs text-muted-foreground mt-2 text-center">显示前 10 条，共 {relatedTxs.length} 条</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
