/**
 * 规律转账识别展示
 * 设计：极简数据叙事 - 风险等级色彩编码
 * 改进：同一对方的收入和支出合并展示，置信度100%标记为重点
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, formatDate, type RegularTransferGroup } from '@/lib/analyzer';
import { ChevronDown, Clock, AlertTriangle, Repeat, TrendingDown, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
  groups: RegularTransferGroup[];
}

// 合并同一对方的收入和支出为一组
interface MergedGroup {
  counterpart: string;
  outGroup: RegularTransferGroup | null;   // 支出方向
  inGroup: RegularTransferGroup | null;    // 收入方向
  maxRiskLevel: 'low' | 'medium' | 'high';
  maxConfidence: number;
  isHighConfidence: boolean; // 置信度100%
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
    if (isOut) {
      entry.outGroup = g;
    } else {
      entry.inGroup = g;
    }
    // 取最高风险等级
    const riskOrder = { high: 2, medium: 1, low: 0 };
    if (riskOrder[g.riskLevel] > riskOrder[entry.maxRiskLevel]) {
      entry.maxRiskLevel = g.riskLevel;
    }
    if (g.confidence > entry.maxConfidence) entry.maxConfidence = g.confidence;
    if (g.confidence >= 1.0) entry.isHighConfidence = true;
  }

  // 排序：重点（100%置信度）优先，再按风险等级
  const riskOrder = { high: 0, medium: 1, low: 2 };
  return Array.from(map.values()).sort((a, b) => {
    if (a.isHighConfidence !== b.isHighConfidence) return a.isHighConfidence ? -1 : 1;
    if (riskOrder[a.maxRiskLevel] !== riskOrder[b.maxRiskLevel]) {
      return riskOrder[a.maxRiskLevel] - riskOrder[b.maxRiskLevel];
    }
    return b.maxConfidence - a.maxConfidence;
  });
}

const riskColors = {
  low: { bg: 'bg-emerald-ok/10', text: 'text-emerald-ok', border: 'border-emerald-ok/20', label: '低风险' },
  medium: { bg: 'bg-amber-warn/10', text: 'text-amber-warn', border: 'border-amber-warn/20', label: '中风险' },
  high: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20', label: '高风险' },
};

export default function RegularTransfers({ groups }: Props) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // 过滤中/高风险
  const filtered = groups.filter(g => g.riskLevel === 'medium' || g.riskLevel === 'high');
  const merged = mergeGroups(filtered);

  if (merged.length === 0) {
    return (
      <section className="py-12 border-t border-border">
        <div className="mb-8">
          <h2 className="text-sm font-semibold tracking-widest uppercase text-indigo mb-2">
            Regular Transfers
          </h2>
          <h3 className="text-2xl font-bold text-foreground">规律转账识别</h3>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          <Repeat className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>未检测到明显的规律转账模式</p>
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
      className="py-12 border-t border-border"
    >
      <div className="mb-8">
        <h2 className="text-sm font-semibold tracking-widest uppercase text-indigo mb-2">
          Regular Transfers
        </h2>
        <h3 className="text-2xl font-bold text-foreground">规律转账识别</h3>
        <p className="text-muted-foreground mt-1">
          检测到 {merged.length} 个中/高风险转账对方
          {highConfidenceCount > 0 && (
            <span className="ml-2 text-red-600 font-semibold">
              · {highConfidenceCount} 个重点核实对象
            </span>
          )}
        </p>
      </div>

      <div className="space-y-3">
        {merged.map((item, index) => {
          const risk = riskColors[item.maxRiskLevel];
          const isExpanded = expandedIndex === index;
          const outG = item.outGroup;
          const inG = item.inGroup;
          // 合并所有交易用于展示
          const allTxs = [
            ...(outG?.transactions || []).map(t => ({ ...t, _dir: 'out' as const })),
            ...(inG?.transactions || []).map(t => ({ ...t, _dir: 'in' as const })),
          ].sort((a, b) => b.date.getTime() - a.date.getTime());

          return (
            <motion.div
              key={item.counterpart}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
              className={`border rounded-lg overflow-hidden ${
                item.isHighConfidence ? 'border-red-500/50 shadow-sm shadow-red-500/10' : risk.border
              }`}
            >
              {/* 摘要行 */}
              <button
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                className={`w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors text-left ${
                  item.isHighConfidence ? 'bg-red-500/5' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    item.isHighConfidence ? 'bg-red-500/15' : risk.bg
                  }`}>
                    {item.maxRiskLevel === 'high' ? (
                      <AlertTriangle className={`w-5 h-5 ${item.isHighConfidence ? 'text-red-600' : risk.text}`} />
                    ) : (
                      <Clock className={`w-5 h-5 ${risk.text}`} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{item.counterpart}</span>
                      <Badge variant="outline" className={`text-xs ${risk.text} ${risk.border}`}>
                        {risk.label}
                      </Badge>
                      {/* 收入/支出方向标签 */}
                      {outG && (
                        <Badge variant="secondary" className="text-xs">
                          转出
                        </Badge>
                      )}
                      {inG && (
                        <Badge variant="secondary" className="text-xs">
                          转入
                        </Badge>
                      )}
                      {item.isHighConfidence && (
                        <Badge className="text-xs bg-red-600 text-white hover:bg-red-700">
                          🚨 重点核实
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                      {outG && (
                        <span className="flex items-center gap-1">
                          <Repeat className="w-3.5 h-3.5" />
                          {outG.pattern} · {outG.transactions.length} 笔支出
                          · 置信度 {(outG.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                      {inG && outG && <span>·</span>}
                      {inG && (
                        <span className="flex items-center gap-1">
                          <Repeat className="w-3.5 h-3.5" />
                          {inG.pattern} · {inG.transactions.length} 笔收入
                          · 置信度 {(inG.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right space-y-1">
                    {outG && (
                      <div className="flex items-center gap-1.5 justify-end">
                        <TrendingDown className="w-3.5 h-3.5 text-destructive" />
                        <p className="font-bold tabular-nums text-destructive text-sm">
                          {formatCurrency(outG.totalAmount)}
                        </p>
                      </div>
                    )}
                    {inG && (
                      <div className="flex items-center gap-1.5 justify-end">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-ok" />
                        <p className="font-bold tabular-nums text-emerald-ok text-sm">
                          {formatCurrency(inG.totalAmount)}
                        </p>
                      </div>
                    )}
                  </div>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`} />
                </div>
              </button>

              {/* 展开详情：收入+支出合并表格 */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border/50 p-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-muted-foreground">
                            <th className="text-left py-2 font-medium">日期</th>
                            <th className="text-left py-2 font-medium">类型</th>
                            <th className="text-left py-2 font-medium">方式</th>
                            <th className="text-right py-2 font-medium">金额</th>
                            <th className="text-left py-2 font-medium">收/支</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allTxs.slice(0, 30).map((tx, i) => (
                            <tr key={i} className="border-t border-border/30">
                              <td className="py-2 tabular-nums">{formatDate(tx.date)}</td>
                              <td className="py-2">{tx.type}</td>
                              <td className="py-2">{tx.method}</td>
                              <td className={`py-2 text-right tabular-nums font-medium ${
                                tx._dir === 'out' ? 'text-destructive' : 'text-emerald-ok'
                              }`}>
                                {tx._dir === 'out' ? '-' : '+'}{formatCurrency(tx.amount)}
                              </td>
                              <td className={`py-2 text-xs font-medium ${
                                tx._dir === 'out' ? 'text-destructive' : 'text-emerald-ok'
                              }`}>
                                {tx._dir === 'out' ? '支出' : '收入'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {allTxs.length > 30 && (
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          仅显示前30条，共 {allTxs.length} 条记录
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
