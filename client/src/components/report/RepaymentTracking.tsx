/**
 * 还款追踪展示
 * 设计：精致卡片式 - 收支合并展示，风险等级色彩编码
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, formatDate, type RepaymentRecord } from '@/lib/analyzer';
import { ChevronDown, Wallet, CreditCard, TrendingUp, TrendingDown, AlertTriangle, Clock, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
  records: RepaymentRecord[];
}

export default function RepaymentTracking({ records }: Props) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<Set<number>>(new Set());
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [sortBy, setSortBy] = useState<'time' | 'amount'>('time');

  const meaningfulRecords = useMemo(() => {
    let filtered = records.filter(r => r.isRegular && r.repayments.length >= 2);
    
    if (sortBy === 'time') {
      filtered = [...filtered].sort((a, b) => {
        const aLatest = Math.max(...a.repayments.map(t => t.date.getTime()));
        const bLatest = Math.max(...b.repayments.map(t => t.date.getTime()));
        return bLatest - aLatest;
      });
    } else if (sortBy === 'amount') {
      filtered = [...filtered].sort((a, b) => b.totalRepaid - a.totalRepaid);
    }
    
    return filtered;
  }, [records, sortBy]);

  if (meaningfulRecords.length === 0) {
    return (
      <section className="py-10 border-t border-border">
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest uppercase text-indigo mb-1.5">Transfer Tracking</p>
          <h3 className="text-2xl font-bold text-foreground">转账对象追踪</h3>
        </div>
        <div className="text-center py-16 text-muted-foreground">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-7 h-7 opacity-30" />
          </div>
          <p className="font-medium">未检测到明显的还款记录</p>
        </div>
      </section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="py-10 border-t border-border"
    >
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-widest uppercase text-indigo mb-1.5">Transfer Tracking</p>
        <h3 className="text-2xl font-bold text-foreground">转账追踪</h3>
        <p className="text-sm text-muted-foreground mt-1">
          追踪到 <span className="font-semibold text-foreground">{meaningfulRecords.length}</span> 组规律转账记录
        </p>
      </div>

      {/* 排序按钮 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setSortBy('time')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            sortBy === 'time'
              ? 'bg-blue-500 text-white shadow-md hover:shadow-lg hover:brightness-110'
              : 'bg-blue-500/10 text-blue-600 border border-blue-500/30 hover:bg-blue-500/20'
          }`}
        >
          <Clock className="w-4 h-4" />
          按时间排序（由近到远）
        </button>
        <button
          onClick={() => setSortBy('amount')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            sortBy === 'amount'
              ? 'bg-blue-500 text-white shadow-md hover:shadow-lg hover:brightness-110'
              : 'bg-blue-500/10 text-blue-600 border border-blue-500/30 hover:bg-blue-500/20'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          按金额排序（由大到小）
        </button>
      </div>

      <div className="space-y-3">
        {meaningfulRecords.slice(0, showAllRecords ? meaningfulRecords.length : 20).map((record, index) => {
          const isExpanded = expandedIndex === index;

          const allTxs = [
            ...record.repayments.map(t => ({ ...t, _dir: 'out' as const })),
            ...record.incomings.map(t => ({ ...t, _dir: 'in' as const })),
          ].sort((a, b) => b.date.getTime() - a.date.getTime());

          const hasIncoming = record.incomings.length > 0;
          const netFlow = record.totalReceived - record.totalRepaid;

          return (
            <motion.div
              key={`${record.counterpart}-${index}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * index }}
              className="rounded-xl overflow-hidden border border-border"
            >
              <button
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors text-left ${
                  isExpanded ? 'bg-indigo/5' : 'hover:bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    isExpanded ? 'bg-indigo/20' : 'bg-indigo/10'
                  }`}>
                    <CreditCard className="w-4.5 h-4.5 text-indigo" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-sm">{record.counterpart}</span>
                      {record.isRegular && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-amber-warn border-amber-warn/30">
                          规律转账
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-0.5">
                        <TrendingDown className="w-3 h-3 text-destructive" />
                        {record.repayments.length}笔支出
                      </span>
                      {hasIncoming && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-0.5">
                            <TrendingUp className="w-3 h-3 text-emerald-ok" />
                            {record.incomings.length}笔收入
                          </span>
                        </>
                      )}
                      <span>·</span>
                      <span>{record.frequency}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <div className="text-right space-y-0.5">
                    <div className="flex items-center gap-1 justify-end">
                      <TrendingDown className="w-3 h-3 text-destructive" />
                      <span className="font-bold tabular-nums text-destructive text-xs">
                        {formatCurrency(record.totalRepaid)}
                      </span>
                    </div>
                    {hasIncoming && (
                      <div className="flex items-center gap-1 justify-end">
                        <TrendingUp className="w-3 h-3 text-emerald-ok" />
                        <span className="font-bold tabular-nums text-emerald-ok text-xs">
                          {formatCurrency(record.totalReceived)}
                        </span>
                      </div>
                    )}
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
                    <div className="border-t border-border/40 bg-background/60 p-4 space-y-4">
                      {/* 净额汇总 */}
                      {hasIncoming && (
                        <div className={`rounded-lg px-4 py-3 flex items-center justify-between ${
                          netFlow >= 0 ? 'bg-emerald-ok/5 border border-emerald-ok/20' : 'bg-destructive/5 border border-destructive/20'
                        }`}>
                          <span className="text-xs font-medium text-muted-foreground">净流量（收入 - 支出）</span>
                          <span className={`font-bold tabular-nums text-sm ${netFlow >= 0 ? 'text-emerald-ok' : 'text-destructive'}`}>
                            {netFlow >= 0 ? '+' : ''}{formatCurrency(netFlow)}
                          </span>
                        </div>
                      )}

                      {/* 转账来源 */}
                      {record.sources.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">转账来源</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {record.sources.map((source, i) => (
                              <div key={i} className="bg-muted/40 rounded-lg p-3">
                                <p className="text-xs font-medium text-muted-foreground">{source.method}</p>
                                <p className="text-base font-bold tabular-nums mt-0.5">{formatCurrency(source.total)}</p>
                                <p className="text-xs text-muted-foreground/70">{source.count} 笔</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 收支合并明细 */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            全部交易明细（{allTxs.length} 笔）
                          </p>
                          {allTxs.length > 20 && (
                            <button
                              onClick={() => setExpandedDetails(prev => {
                                const next = new Set(prev);
                                if (next.has(index)) next.delete(index);
                                else next.add(index);
                                return next;
                              })}
                              className="text-xs text-indigo hover:text-indigo/80 font-medium"
                            >
                              {expandedDetails.has(index) ? '收起' : `展开全部 (${allTxs.length})`}
                            </button>
                          )}
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-border/60">
                                <th className="text-left py-2 pr-3 font-medium text-muted-foreground">日期</th>
                                <th className="text-left py-2 pr-3 font-medium text-muted-foreground">来源</th>
                                <th className="text-right py-2 pr-3 font-medium text-muted-foreground">金额</th>
                                <th className="text-left py-2 font-medium text-muted-foreground">收/支</th>
                              </tr>
                            </thead>
                            <tbody>
                              {allTxs.slice(0, expandedDetails.has(index) ? allTxs.length : 20).map((tx, i) => (
                                <tr key={i} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                                  <td className="py-2 pr-3 tabular-nums text-muted-foreground">{formatDate(tx.date)}</td>
                                  <td className="py-2 pr-3">{tx.method}</td>
                                  <td className={`py-2 pr-3 text-right tabular-nums font-semibold ${tx._dir === 'out' ? 'text-destructive' : 'text-emerald-ok'}`}>
                                    {tx._dir === 'out' ? '-' : '+'}{formatCurrency(tx.amount)}
                                  </td>
                                  <td className="py-2">
                                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${tx._dir === 'out' ? 'text-destructive bg-destructive/10' : 'text-emerald-ok bg-emerald-ok/10'}`}>
                                      {tx._dir === 'out' ? '支出' : '收入'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
        {meaningfulRecords.length > 20 && !showAllRecords && (
          <div className="text-center pt-2">
            <button
              onClick={() => setShowAllRecords(true)}
              className="text-xs text-indigo hover:text-indigo/80 font-medium"
            >
              查看全部 {meaningfulRecords.length} 个对方
            </button>
          </div>
        )}
      </div>
    </motion.section>
  );
}
