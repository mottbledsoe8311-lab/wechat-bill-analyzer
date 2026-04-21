/**
 * 交易对方汇总
 * 设计：极简数据叙事 - 清晰的对方关系网络
 * 功能：点击对方名字直接展开全部交易明细，按支出/收入/净额排序
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, type CounterpartSummary as CounterpartSummaryType } from '@/lib/analyzer';
import { Users, Search, ChevronDown, ChevronUp, ArrowDown, ArrowUp } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  data: CounterpartSummaryType[];
  allTransactions?: any[];
  expandedName?: string | null;
}

type SortKey = 'totalIn' | 'totalOut' | 'netFlow';

export default function CounterpartSummary({ data, allTransactions = [], expandedName: initialExpandedName }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('totalOut');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [showDetails, setShowDetails] = useState(false);
  const [expandedName, setExpandedName] = useState<string | null>(initialExpandedName || null);

  // 当initialExpandedName改变时，更新expandedName
  useEffect(() => {
    if (initialExpandedName) {
      setExpandedName(initialExpandedName);
      setShowDetails(true);
    }
  }, [initialExpandedName]);

  // 获取搜索对方的所有交易明细（搜索框）
  const searchedCounterpart = searchTerm.trim()
    ? data.find(d => d.name.toLowerCase() === searchTerm.toLowerCase()) ||
      data.find(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : null;
  const detailedTransactions = searchedCounterpart
    ? allTransactions.filter(tx => tx.counterpart.toLowerCase() === searchedCounterpart.name.toLowerCase())
    : [];

  // 获取点击展开对方的交易明细
  const expandedTransactions = expandedName
    ? allTransactions
        .filter(tx => {
          // 确保 tx.counterpart 存在并进行大小写不敏感的比较
          const txCounterpart = tx.counterpart || '';
          return txCounterpart.toLowerCase() === expandedName.toLowerCase();
        })
        .sort((a: any, b: any) => b.date.getTime() - a.date.getTime())
    : [];

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(key);
      setSortDir('desc');
    }
  };

  const filtered = data
    .filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      let diff = 0;
      switch (sortBy) {
        case 'totalIn':  diff = b.totalIn - a.totalIn; break;
        case 'totalOut': diff = b.totalOut - a.totalOut; break;
        case 'netFlow':  diff = Math.abs(b.netFlow) - Math.abs(a.netFlow); break;
      }
      return sortDir === 'desc' ? diff : -diff;
    });

  // 计算搜索结果的汇总统计
  const searchStats = searchTerm.trim() ? {
    totalCount: filtered.reduce((sum, item) => sum + item.transactionCount, 0),
    totalIn: filtered.reduce((sum, item) => sum + item.totalIn, 0),
    totalOut: filtered.reduce((sum, item) => sum + item.totalOut, 0),
    netFlow: filtered.reduce((sum, item) => sum + item.netFlow, 0),
  } : null;

  const handleRowClick = (name: string) => {
    setExpandedName(prev => prev === name ? null : name);
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortBy !== col) return <ArrowDown className="w-3 h-3 opacity-20 inline ml-0.5" />;
    return sortDir === 'desc'
      ? <ArrowDown className="w-3 h-3 text-indigo inline ml-0.5" />
      : <ArrowUp className="w-3 h-3 text-indigo inline ml-0.5" />;
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.7 }}
      className="py-12 border-t border-border"
    >
      <div className="mb-8">
        <h2 className="text-sm font-semibold tracking-widest uppercase text-indigo mb-2">
          Counterpart Analysis
        </h2>
        <h3 className="text-2xl font-bold text-foreground">交易对方分析</h3>
        <p className="text-muted-foreground mt-1">
          共涉及 {data.length} 个交易对方 · 点击对方名字可展开全部明细
        </p>
      </div>

      {/* 搜索和排序 */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索交易对方..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setShowDetails(false); }}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo"
          />
        </div>
        <div className="flex gap-1 bg-muted rounded-md p-1">
          {([
            { key: 'totalOut' as SortKey, label: '支出' },
            { key: 'totalIn'  as SortKey, label: '收入' },
            { key: 'netFlow'  as SortKey, label: '净额' },
          ]).map(item => (
            <button
              key={item.key}
              onClick={() => handleSort(item.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-0.5 ${
                sortBy === item.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.label}
              <SortIcon col={item.key} />
            </button>
          ))}
        </div>
      </div>

      {/* 搜索统计信息 */}
      {searchStats && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-muted/50 rounded-xl border border-border"
        >
          <p className="text-sm font-semibold text-foreground mb-3">搜索结果统计</p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-background rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">收入</p>
              <p className="text-lg font-bold text-emerald-ok">{formatCurrency(searchStats.totalIn)}</p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">支出</p>
              <p className="text-lg font-bold text-destructive">{formatCurrency(searchStats.totalOut)}</p>
            </div>
            <div className="bg-background rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">净额</p>
              <p className={`text-lg font-bold ${searchStats.netFlow >= 0 ? 'text-emerald-ok' : 'text-destructive'}`}>
                {searchStats.netFlow >= 0 ? '+' : ''}{formatCurrency(searchStats.netFlow)}
              </p>
            </div>
          </div>
          {detailedTransactions.length > 0 && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full py-3.5 rounded-xl font-semibold text-base transition-all border-2 border-emerald-ok text-emerald-ok bg-white hover:bg-emerald-ok/5 active:scale-[0.98]"
            >
              {showDetails ? '▲ 隐藏详细流水' : '▼ 显示详细流水'}
            </button>
          )}
        </motion.div>
      )}

      {/* 详细交易明细（搜索框触发） */}
      <AnimatePresence>
        {showDetails && detailedTransactions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="p-4 bg-muted/30 rounded-xl border border-border">
              <p className="text-sm font-semibold text-foreground mb-4">
                {searchedCounterpart?.name} · 全部交易明细（{detailedTransactions.length}笔）
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '34%' }} />
                    <col style={{ width: '26%' }} />
                    <col style={{ width: '30%' }} />
                    <col style={{ width: '20%' }} />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-1 font-medium text-muted-foreground">日期时间</th>
                      <th className="text-left py-2 pr-1 font-medium text-muted-foreground">类型</th>
                      <th className="text-right py-2 pr-1 font-medium text-muted-foreground">金额</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedTransactions.map((tx: any, i: number) => (
                      <tr key={i} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                        <td className="py-1.5 pr-1 text-muted-foreground tabular-nums whitespace-nowrap overflow-hidden text-ellipsis">{format(tx.date, 'yy-MM-dd HH:mm')}</td>
                        <td className="py-1.5 pr-1 overflow-hidden text-ellipsis whitespace-nowrap">{tx.type}</td>
                        <td className="py-1.5 pr-1 text-right font-medium tabular-nums overflow-hidden text-ellipsis">{formatCurrency(tx.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 主表格 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-3 font-medium text-muted-foreground">交易对方</th>
              <th
                className="text-right py-3 px-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                onClick={() => handleSort('totalIn')}
              >
                收入 <SortIcon col="totalIn" />
              </th>
              <th
                className="text-right py-3 px-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                onClick={() => handleSort('totalOut')}
              >
                支出 <SortIcon col="totalOut" />
              </th>
              <th
                className="text-right py-3 px-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none hidden sm:table-cell"
                onClick={() => handleSort('netFlow')}
              >
                净额 <SortIcon col="netFlow" />
              </th>
              <th className="text-right py-3 px-3 font-medium text-muted-foreground hidden md:table-cell">首次</th>
              <th className="text-right py-3 px-3 font-medium text-muted-foreground hidden md:table-cell">最近</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 50).map((item, i) => (
              <>
                <motion.tr
                  key={item.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.02 * i }}
                  onClick={() => handleRowClick(item.name)}
                  className={`border-b border-border/50 cursor-pointer transition-colors ${
                    expandedName === item.name
                      ? 'bg-indigo/5 hover:bg-indigo/10'
                      : 'hover:bg-muted/30'
                  }`}
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        expandedName === item.name ? 'bg-indigo/20' : 'bg-indigo/10'
                      }`}>
                        <Users className="w-3.5 h-3.5 text-indigo" />
                      </div>
                      <span className={`font-medium ${
                        expandedName === item.name ? 'text-indigo break-words' : 'truncate max-w-[120px] sm:max-w-[200px]'
                      }`}>{item.name}</span>
                      {item.isRegular && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo/10 text-indigo font-medium shrink-0">
                          常客
                        </span>
                      )}
                      {expandedName === item.name
                        ? <ChevronUp className="w-3.5 h-3.5 text-indigo ml-auto shrink-0" />
                        : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40 ml-auto shrink-0" />
                      }
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-emerald-ok">
                    {item.totalIn > 0 ? formatCurrency(item.totalIn) : '-'}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-destructive">
                    {item.totalOut > 0 ? formatCurrency(item.totalOut) : '-'}
                  </td>
                  <td className={`py-3 px-3 text-right tabular-nums font-medium hidden sm:table-cell ${
                    item.netFlow >= 0 ? 'text-emerald-ok' : 'text-destructive'
                  }`}>
                    {item.netFlow >= 0 ? '+' : ''}{formatCurrency(item.netFlow)}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-muted-foreground hidden md:table-cell text-xs">
                    {format(item.firstDate, 'yy-MM-dd')}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-muted-foreground hidden md:table-cell text-xs">
                    {format(item.lastDate, 'yy-MM-dd')}
                  </td>
                </motion.tr>

                {/* 展开的交易明细行 */}
                {expandedName === item.name && expandedTransactions.length > 0 ? (
                  <tr key={`${item.name}-details`}>
                    <td colSpan={6} className="p-0">
                      <AnimatePresence>
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden bg-indigo/3 border-b border-indigo/10"
                        >
                          <div className="px-3 py-2">
                            <p className="text-[11px] font-semibold text-indigo mb-1">
                              {item.name} · 全部 {expandedTransactions.length} 笔交易
                            </p>
                            {(() => {
                              const methodStats: Record<string, number> = {};
                              expandedTransactions.forEach((tx: any) => {
                                // 只统计支出
                                if (tx.direction === '支出' || tx.direction === '支') {
                                  methodStats[tx.method] = (methodStats[tx.method] || 0) + tx.amount;
                                }
                              });
                              return Object.keys(methodStats).length > 0 && (
                                <div className="flex gap-1.5 mb-1.5 flex-wrap">
                                  {Object.entries(methodStats).map(([method, total]) => (
                                    <span key={method} className="text-[10px] bg-indigo/10 text-indigo px-1.5 py-0.5 rounded">
                                      {method}: {formatCurrency(total as number)}
                                    </span>
                                  ))}
                                </div>
                              );
                            })()}
                            <table className="w-full text-[11px]" style={{ tableLayout: 'fixed' }}>
                              <colgroup>
                                <col style={{ width: '30%' }} />
                                <col style={{ width: '20%' }} />
                                <col style={{ width: '20%' }} />
                                <col style={{ width: '30%' }} />
                              </colgroup>
                              <thead>
                                <tr className="text-muted-foreground border-b border-indigo/10">
                                  <th className="text-left py-1 px-0.5 font-medium">日期</th>
                                  <th className="text-left py-1 px-0.5 font-medium">类型</th>
                                  <th className="text-center py-1 px-0.5 font-medium">金额</th>
                                  <th className="text-center py-1 px-0.5 font-medium">收/支</th>
                                </tr>
                              </thead>
                              <tbody>
                                {expandedTransactions.map((tx: any, j: number) => {
                                  const isIncome = tx.direction === '收入' || tx.direction === '收';
                                  return (
                                    <tr key={j} className="border-t border-indigo/8">
                                      <td className="py-0.5 px-0.5 tabular-nums text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">{format(tx.date, 'yy-MM-dd HH:mm')}</td>
                                      <td className="py-0.5 px-0.5 overflow-hidden text-ellipsis whitespace-nowrap">{tx.type}</td>
                                      <td className={`py-0.5 px-0.5 text-center tabular-nums font-semibold overflow-hidden text-ellipsis ${
                                        isIncome ? 'text-emerald-ok' : 'text-destructive'
                                      }`}>
                                        {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                                      </td>
                                      <td className="py-0.5 px-0.5 text-center font-medium">
                                        <span className={isIncome ? 'text-emerald-ok' : 'text-destructive'}>
                                          {isIncome ? '收' : '支'}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    </td>
                  </tr>
                ) : expandedName === item.name ? (
                  <tr key={`${item.name}-empty`}>
                    <td colSpan={6} className="p-0">
                      <div className="px-3 py-4 bg-indigo/3 border-b border-indigo/10 text-center text-sm text-muted-foreground">
                        没有找到 {item.name} 的交易明细
                      </div>
                    </td>
                  </tr>
                ) : null}
              </>
            ))}
          </tbody>
        </table>
        {filtered.length > 50 && (
          <p className="text-xs text-muted-foreground mt-3 text-center">
            仅显示前50条，共 {filtered.length} 个交易对方
          </p>
        )}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>未找到匹配的交易对方</p>
          </div>
        )}
      </div>
    </motion.section>
  );
}
