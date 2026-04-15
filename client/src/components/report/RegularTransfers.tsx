/**
 * 规律转账识别展示
 * 设计：精致卡片式 - 风险等级色彩编码，只展示转出，展开时显示相关所有进出流水
 * 新增：内联管理按钮，支持自定义疑似还款账户关键词
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, formatDate, type RegularTransferGroup } from '@/lib/analyzer';
import { ChevronDown, Clock, AlertTriangle, Repeat, TrendingDown, TrendingUp, ShieldAlert, Settings, Plus, X, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface Props {
  groups: RegularTransferGroup[];
  allTransactions?: any[];
}

const riskConfig = {
  low:    { bg: 'bg-emerald-ok/5',    border: 'border-emerald-ok/20',    text: 'text-emerald-ok',    icon: 'bg-emerald-ok/10',    label: '低风险' },
  medium: { bg: 'bg-amber-warn/5',    border: 'border-amber-warn/20',    text: 'text-amber-warn',    icon: 'bg-amber-warn/10',    label: '中风险' },
  high:   { bg: 'bg-destructive/5',   border: 'border-destructive/20',   text: 'text-destructive',   icon: 'bg-destructive/10',   label: '高风险' },
};

// 内联关键词管理面板
function RepaymentKeywordManager({ onClose }: { onClose: () => void }) {
  const [newKeyword, setNewKeyword] = useState('');
  const saveMutation = trpc.repaymentKeywords.save.useMutation({
    onSuccess: () => {
      setNewKeyword('');
      toast.success('关键词已成功添加！');
    },
    onError: (err) => toast.error('添加失败：' + err.message),
  });

  const handleAdd = () => {
    const kw = newKeyword.trim();
    if (!kw) return toast.error('请输入关键词');
    saveMutation.mutate({ keyword: kw });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mt-3 rounded-xl border border-border bg-muted/30 p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-foreground">疑似还款账户关键词管理</p>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        添加关键词后，生成时将自动识别包含该关键词的账户，展示在本模块（不区分收支方向）
      </p>

      {/* 添加新关键词 */}
      <div className="flex gap-2">
        <Input
          value={newKeyword}
          onChange={e => setNewKeyword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="输入账户名关键词，如：张三"
          className="h-8 text-xs flex-1"
        />
        <Button
          size="sm"
          className="h-8 text-xs px-3 shrink-0"
          onClick={handleAdd}
          disabled={saveMutation.isPending}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          添加
        </Button>
      </div>
    </motion.div>
  );
}

export default function RegularTransfers({ groups, allTransactions = [] }: Props) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [expandedAllIndex, setExpandedAllIndex] = useState<number | null>(null);
  const [riskAccountsMap, setRiskAccountsMap] = useState<Record<string, any>>({});
  const [showManager, setShowManager] = useState(false);
  const riskAccountsQuery = trpc.riskAccounts.getAll.useQuery();
  const saveRiskMutation = trpc.riskAccounts.save.useMutation();

  // 加载所有高风险账户（同时建立小写key的映射，避免大小写不匹配）
  useEffect(() => {
    if (riskAccountsQuery.data?.data) {
      const map = riskAccountsQuery.data.data.reduce((acc: Record<string, any>, account: any) => {
        acc[account.accountName] = account;
        acc[account.accountName.toLowerCase().trim()] = account;
        return acc;
      }, {});
      setRiskAccountsMap(map);
    }
  }, [riskAccountsQuery.data]);

  const outGroups = groups.filter(g => {
    const isOut = g.direction === '支出' || g.direction === '支';
    const isAbove51Percent = g.confidence >= 0.51;
    const isMediumHigh = g.riskLevel === 'medium' || g.riskLevel === 'high';
    const isWithin40Days = !g.intervalDays || g.intervalDays <= 40;
    const isSuspectedRepayment = g.isSuspectedRepayment === true;
    const isInRiskAccountsMap = 
      riskAccountsMap[g.counterpart]?.riskLevel === 'high' ||
      riskAccountsMap[g.counterpart?.toLowerCase().trim()]?.riskLevel === 'high';
    
    if (isInRiskAccountsMap) return true;
    if (isSuspectedRepayment) return isOut;
    return isOut && isAbove51Percent && (isMediumHigh && isWithin40Days);
  });

  const riskOrder = { high: 0, medium: 1, low: 2 };
  const sorted = [...outGroups].sort((a, b) => {
    if (a.isSuspectedRepayment !== b.isSuspectedRepayment) {
      return a.isSuspectedRepayment ? -1 : 1;
    }
    if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    return b.confidence - a.confidence;
  });

  const highConfidenceCount = sorted.filter(g => g.confidence >= 1.0).length;

  // 标题区（空状态也显示管理按钮）
  const TitleSection = () => (
    <div className="mb-8">
      <p className="text-xs font-semibold tracking-widest uppercase text-indigo mb-1.5">Regular Transfers</p>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-foreground">规律转账识别</h3>
          <button
            type="button"
            onClick={() => setShowManager(v => !v)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all ${
              showManager
                ? 'bg-indigo/10 text-indigo border-indigo/30'
                : 'bg-muted/60 text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            <Settings className="w-3 h-3" />
            管理
            {showManager ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
        {sorted.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
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
        )}
      </div>

      {/* 内联管理面板 */}
      <AnimatePresence>
        {showManager && <RepaymentKeywordManager onClose={() => setShowManager(false)} />}
      </AnimatePresence>
    </div>
  );

  if (sorted.length === 0) {
    return (
      <section className="py-10 border-t border-border">
        <TitleSection />
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

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="py-10 border-t border-border"
    >
      <TitleSection />

      <div className="space-y-3">
        {sorted.map((g, index) => {
          const risk = riskConfig[g.riskLevel];
          const isExpanded = expandedIndex === index;
          const isHighRisk = g.confidence >= 1.0 && g.riskLevel === 'high';
          
          const isSuspectedRepaymentAccount = riskAccountsMap[g.counterpart]?.riskLevel === 'high' || g.isSuspectedRepayment === true;

          const counterpartName = g.counterpart;
          const relatedTxs = allTransactions?.length > 0
            ? allTransactions
                .filter(tx => tx.counterpart?.trim() === counterpartName)
                .sort((a: any, b: any) => b.date.getTime() - a.date.getTime())
            : g.transactions.map(t => ({ ...t, direction: g.direction }));

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
                          saveRiskMutation.mutate(
                            {
                              accountName: g.counterpart,
                              riskLevel: 'high',
                              regularity: Math.round(g.confidence * 100),
                              description: `规律转账识别 - ${g.pattern}，${g.transactions.length}笔支出`,
                            },
                            {
                              onSuccess: () => {
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
                            {(expandedAllIndex === outGroups.indexOf(g) ? relatedTxs : relatedTxs.slice(0, 10)).map((tx: any, i: number) => (
                              <tr key={i} className="border-b border-border/30 hover:bg-muted/30">
                                <td className="py-1.5 pr-2 text-muted-foreground">{formatDate(tx.date)}</td>
                                <td className="py-1.5 px-2 text-muted-foreground truncate">{tx.method || tx.remark || '-'}</td>
                                <td className={`py-1.5 px-2 font-semibold ${
                                  tx.direction === '收入' || tx.direction === '收'
                                    ? 'text-foreground'
                                    : 'text-destructive'
                                }`}>
                                  {tx.direction === '收入' || tx.direction === '收'
                                    ? '+' + formatCurrency(tx.amount)
                                    : '-' + formatCurrency(tx.amount)}
                                </td>
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
                        <div className="mt-3 flex items-center justify-center gap-2">
                          {expandedAllIndex === outGroups.indexOf(g) ? (
                            <>
                              <p className="text-xs text-muted-foreground">显示全部 {relatedTxs.length} 条</p>
                              <button
                                onClick={() => setExpandedAllIndex(null)}
                                className="text-xs text-blue-600 hover:text-blue-700 underline"
                              >
                                收起
                              </button>
                            </>
                          ) : (
                            <>
                              <p className="text-xs text-muted-foreground">显示前 10 条，共 {relatedTxs.length} 条</p>
                              <button
                                onClick={() => setExpandedAllIndex(outGroups.indexOf(g))}
                                className="text-xs text-blue-600 hover:text-blue-700 underline"
                              >
                                展开全部
                              </button>
                            </>
                          )}
                        </div>
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
