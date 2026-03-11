/**
 * 交易对方汇总
 * 设计：极简数据叙事 - 清晰的对方关系网络
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency, type CounterpartSummary as CounterpartSummaryType } from '@/lib/analyzer';
import { Users, Search } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  data: CounterpartSummaryType[];
  allTransactions?: any[];
}

export default function CounterpartSummary({ data, allTransactions = [] }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'count' | 'totalIn' | 'totalOut' | 'netFlow'>('count');
  const [showDetails, setShowDetails] = useState(false);

  // 获取搜索对方的所有交易明细
  const searchedCounterpart = searchTerm.trim() 
    ? data.find(d => d.name.toLowerCase() === searchTerm.toLowerCase()) || 
      data.find(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : null;
  const detailedTransactions = searchedCounterpart 
    ? allTransactions.filter(tx => tx.counterpart.toLowerCase() === searchedCounterpart.name.toLowerCase())
    : [];

  const filtered = data
    .filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case 'count': return b.transactionCount - a.transactionCount;
        case 'totalIn': return b.totalIn - a.totalIn;
        case 'totalOut': return b.totalOut - a.totalOut;
        case 'netFlow': return Math.abs(b.netFlow) - Math.abs(a.netFlow);
        default: return 0;
      }
    });

  // 计算搜索结果的汇总统计
  const searchStats = searchTerm.trim() ? {
    totalCount: filtered.reduce((sum, item) => sum + item.transactionCount, 0),
    totalIn: filtered.reduce((sum, item) => sum + item.totalIn, 0),
    totalOut: filtered.reduce((sum, item) => sum + item.totalOut, 0),
    netFlow: filtered.reduce((sum, item) => sum + item.netFlow, 0),
  } : null;

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
          共涉及 {data.length} 个交易对方
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
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo"
          />
        </div>
        <div className="flex gap-1 bg-muted rounded-md p-1">
          {([
            { key: 'count', label: '笔数' },
            { key: 'totalIn', label: '收入' },
            { key: 'totalOut', label: '支出' },
            { key: 'netFlow', label: '净额' },
          ] as const).map(item => (
            <button
              key={item.key}
              onClick={() => setSortBy(item.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                sortBy === item.key 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 搜索统计信息 */}
      {searchStats && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-muted/50 rounded-lg border border-border"
        >
          <p className="text-sm font-medium text-foreground mb-3">搜索结果统计</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-xs text-muted-foreground">笔数</p>
              <p className="text-lg font-bold text-foreground">{searchStats.totalCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">收入</p>
              <p className="text-lg font-bold text-emerald-ok">{formatCurrency(searchStats.totalIn)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">支出</p>
              <p className="text-lg font-bold text-destructive">{formatCurrency(searchStats.totalOut)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">净额</p>
              <p className={`text-lg font-bold ${searchStats.netFlow >= 0 ? 'text-emerald-ok' : 'text-destructive'}`}>
                {searchStats.netFlow >= 0 ? '+' : ''}{formatCurrency(searchStats.netFlow)}
              </p>
            </div>
          </div>
          {detailedTransactions.length > 0 && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className={`w-full py-3 rounded-lg font-semibold text-base transition-colors ${
                showDetails
                  ? 'bg-emerald-ok/20 text-emerald-ok hover:bg-emerald-ok/30 border border-emerald-ok/30'
                  : 'bg-emerald-ok text-white hover:bg-emerald-ok/90 shadow-sm'
              }`}
            >
              {showDetails ? '▲ 隐藏详细流水' : '▼ 显示详细流水'}
            </button>
          )}
        </motion.div>
      )}

      {/* 详细交易明细（只显示一次） */}
      {showDetails && detailedTransactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-muted/30 rounded-lg border border-border"
        >
          <p className="text-sm font-medium text-foreground mb-4">全部交易明细 ({detailedTransactions.length}笔)</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">日期时间</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">交易类型</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">交易方式</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">金额</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">收/支</th>
                </tr>
              </thead>
              <tbody>
                {detailedTransactions.map((tx, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="py-2 px-3 text-muted-foreground">{format(tx.date, 'MM-dd HH:mm:ss')}</td>
                    <td className="py-2 px-3">{tx.type}</td>
                    <td className="py-2 px-3 text-muted-foreground">{tx.method}</td>
                    <td className="py-2 px-3 text-right font-medium tabular-nums">{formatCurrency(tx.amount)}</td>
                    <td className={`py-2 px-3 font-medium ${tx.direction === '收入' || tx.direction === '收' ? 'text-emerald-ok' : 'text-destructive'}`}>
                      {tx.direction}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* 表格 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">交易对方</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">笔数</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">收入</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">支出</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">净额</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">首次</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">最近</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 50).map((item, i) => (
              <motion.tr
                key={item.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.02 * i }}
                className="border-b border-border/50 hover:bg-muted/20 transition-colors"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo/10 flex items-center justify-center shrink-0">
                      <Users className="w-3.5 h-3.5 text-indigo" />
                    </div>
                    <span className="font-medium truncate max-w-[200px]">{item.name}</span>
                    {item.isRegular && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo/10 text-indigo font-medium">
                        常客
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-right tabular-nums">{item.transactionCount}</td>
                <td className="py-3 px-4 text-right tabular-nums text-emerald-ok">
                  {item.totalIn > 0 ? formatCurrency(item.totalIn) : '-'}
                </td>
                <td className="py-3 px-4 text-right tabular-nums text-destructive">
                  {item.totalOut > 0 ? formatCurrency(item.totalOut) : '-'}
                </td>
                <td className={`py-3 px-4 text-right tabular-nums font-medium ${
                  item.netFlow >= 0 ? 'text-emerald-ok' : 'text-destructive'
                }`}>
                  {item.netFlow >= 0 ? '+' : ''}{formatCurrency(item.netFlow)}
                </td>
                <td className="py-3 px-4 text-right tabular-nums text-muted-foreground hidden md:table-cell">
                  {format(item.firstDate, 'yy-MM-dd HH:mm')}
                </td>
                <td className="py-3 px-4 text-right tabular-nums text-muted-foreground hidden md:table-cell">
                  {format(item.lastDate, 'yy-MM-dd HH:mm')}
                </td>
              </motion.tr>
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
