/**
 * 规律转账识别展示
 * 设计：精致卡片式 - 风险等级色彩编码，收支合并展示
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, formatDate, type RegularTransferGroup } from '@/lib/analyzer';
import { ChevronDown, Clock, AlertTriangle, Repeat, TrendingDown, TrendingUp, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
  groups: RegularTransferGroup[];
}

interface MergedGroup {
  counterpart: string;
  outGroup: RegularTransferGroup | null;
  inGroup: RegularTransferGroup | null;
  maxRiskLevel: 'low' | 'medium' | 'high';
  maxConfidence: number;
  isHighConfidence: boolean;
}

function mergeGroups(groups: RegularTransferGroup[]): MergedGroup[] {
  const map = new Map<string, MergedGroup>();

  for (const g of groups) {
    const key = g.counterpart;
    if (!map.has(key)) {
      map.set(key, {
        counterpart: g.counterpart,
        outGroup: null,
        inGroup: null,
        maxRiskLevel: g.riskLevel,
        maxConfidence: g.confidence,
        isHighConfidence: g.confidence >= 1.0,
      });
    }
    const entry = map.get(key)!;
    const isOut = g.direction === '支出' || g.direction === '支';
    if (isOut) entry.outGroup = g;
    else entry.inGroup = g;

    const riskOrder = { high: 2, medium: 1, low: 0 };
    if (riskOrder[g.riskLevel] > riskOrder[entry.maxRiskLevel]) entry.maxRiskLevel = g.riskLevel;
    if (g.confidence > entry.maxConfidence) entry.maxConfidence = g.confidence;
    if (g.confidence >= 1.0) entry.isHighConfidence = true;
  }

  const riskOrder = { high: 0, medium: 1, low: 2 };
  return Array.from(map.values()).sort((a, b) => {
    if (a.isHighConfidence !== b.isHighConfidence) return a.isHighConfidence ? -1 : 1;
    if (riskOrder[a.maxRiskLevel] !== riskOrder[b.maxRiskLevel]) return riskOrder[a.maxRiskLevel] - riskOrder[b.maxRiskLevel];
    return b.maxConfidence - a.maxConfidence;
  });
}

const riskConfig = {
  low:    { bg: 'bg-emerald-ok/5',    border: 'border-emerald-ok/20',    text: 'text-emerald-ok',    icon: 'bg-emerald-ok/10',    label: '低风险' },
  medium: { bg: 'bg-amber-warn/5',    border: 'border-amber-warn/20',    text: 'text-amber-warn',    icon: 'bg-amber-warn/10',    label: '中风险' },
  high:   { bg: 'bg-destructive/5',   border: 'border-destructive/20',   text: 'text-destructive',   icon: 'bg-destructive/10',   label: '高风险' },
};

export default function RegularTransfers({ groups }: Props) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const filtered = groups.filter(g => g.riskLevel === 'medium' || g.riskLevel === 'high');
  const merged = mergeGroups(filtered);

  if (merged.length === 0) {
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

  const highConfidenceCount = merged.filter(m => m.isHighConfidence).length;

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
            检测到 <span className="font-semibold text-foreground">{merged.length}</span> 个中/高风险对方
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
        {merged.map((item, index) => {
          const risk = riskConfig[item.maxRiskLevel];
          const isExpanded = expandedIndex === index;
          const outG = item.outGroup;
          const inG = item.inGroup;
          const allTxs = [
            ...(outG?.transactions || []).map(t => ({ ...t, _dir: 'out' as const })),
            ...(inG?.transactions || []).map(t => ({ ...t, _dir: 'in' as const })),
          ].sort((a, b) => b.date.getTime() - a.date.getTime());

          const isHighRisk = item.isHighConfidence;

          return (
            <motion.div
              key={item.counterpart}
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
                    {item.maxRiskLevel === 'high'
                      ? <AlertTriangle className={`w-4.5 h-4.5 ${isHighRisk ? 'text-red-600' : risk.text}`} />
                      : <Clock className={`w-4.5 h-4.5 ${risk.text}`} />
                    }
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-sm">{item.counterpart}</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${risk.text} ${risk.border}`}>
                        {risk.label}
                      </Badge>
                      {outG && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">转出</Badge>}
                      {inG && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">转入</Badge>}
                      {isHighRisk && (
                        <Badge className="text-[10px] px-1.5 py-0 h-4 bg-red-600 text-white hover:bg-red-700">
                          🚨 重点核实
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                      {outG && (
                        <span className="flex items-center gap-1">
                          <Repeat className="w-3 h-3" />
                          {outG.pattern} · {outG.transactions.length}笔支出 · {(outG.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                      {inG && outG && <span>·</span>}
                      {inG && (
                        <span className="flex items-center gap-1">
                          <Repeat className="w-3 h-3" />
                          {inG.pattern} · {inG.transactions.length}笔收入 · {(inG.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <div className="text-right space-y-0.5">
                    {outG && (
                      <div className="flex items-center gap-1 justify-end">
                        <TrendingDown className="w-3 h-3 text-destructive" />
                        <span className="font-bold tabular-nums text-destructive text-xs">{formatCurrency(outG.totalAmount)}</span>
                      </div>
                    )}
                    {inG && (
                      <div className="flex items-center gap-1 justify-end">
                        <TrendingUp className="w-3 h-3 text-emerald-ok" />
                        <span className="font-bold tabular-nums text-emerald-ok text-xs">{formatCurrency(inG.totalAmount)}</span>
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
                    <div className="border-t border-border/40 bg-background/60 p-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                        全部交易明细（{allTxs.length} 笔）
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border/60">
                              <th className="text-left py-2 pr-3 font-medium text-muted-foreground">日期</th>
                              <th className="text-left py-2 pr-3 font-medium text-muted-foreground">类型</th>
                              <th className="text-left py-2 pr-3 font-medium text-muted-foreground">方式</th>
                              <th className="text-right py-2 pr-3 font-medium text-muted-foreground">金额</th>
                              <th className="text-left py-2 font-medium text-muted-foreground">收/支</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allTxs.slice(0, 30).map((tx, i) => (
                              <tr key={i} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                                <td className="py-2 pr-3 tabular-nums text-muted-foreground">{formatDate(tx.date)}</td>
                                <td className="py-2 pr-3">{tx.type}</td>
                                <td className="py-2 pr-3 text-muted-foreground">{tx.method}</td>
                                <td className={`py-2 pr-3 text-right tabular-nums font-semibold ${tx._dir === 'out' ? 'text-destructive' : 'text-emerald-ok'}`}>
                                  {tx._dir === 'out' ? '-' : '+'}{formatCurrency(tx.amount)}
                                </td>
                                <td className={`py-2 text-[10px] font-medium px-1.5 py-0.5 rounded ${tx._dir === 'out' ? 'text-destructive bg-destructive/10' : 'text-emerald-ok bg-emerald-ok/10'}`}>
                                  {tx._dir === 'out' ? '支出' : '收入'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {allTxs.length > 30 && (
                        <p className="text-xs text-muted-foreground mt-3 text-center">
                          仅显示前 30 条，共 {allTxs.length} 条记录
                        </p>
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
