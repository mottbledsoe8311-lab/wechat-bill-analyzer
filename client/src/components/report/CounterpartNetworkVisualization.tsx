/**
 * 对方关系网络可视化
 * 使用 Recharts 展示交易对方之间的关系网络和资金流向
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/analyzer';
import type { CounterpartNetwork } from '@/lib/counterpartNetworkAnalyzer';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Props {
  network: CounterpartNetwork;
}

export default function CounterpartNetworkVisualization({ network }: Props) {
  // 计算网络统计信息
  const stats = useMemo(() => {
    return {
      nodeCount: network.nodes.length,
      linkCount: network.links.length,
      totalValue: network.links.reduce((sum, link) => sum + link.value, 0),
      avgLinkValue: network.links.length > 0 
        ? network.links.reduce((sum, link) => sum + link.value, 0) / network.links.length 
        : 0,
    };
  }, [network]);

  // 按资金流向排序链接，显示前 10 条最大的流向
  const topLinks = useMemo(() => {
    return [...network.links]
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [network.links]);

  // 按交易金额排序节点，显示前 10 个最活跃的对方
  const topNodes = useMemo(() => {
    return [...network.nodes]
      .map(node => ({
        ...node,
        total: node.totalIncome + node.totalExpense,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [network.nodes]);

  if (network.nodes.length === 0) {
    return (
      <section className="py-10 border-t border-border">
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest uppercase text-indigo mb-1.5">Network Analysis</p>
          <h3 className="text-2xl font-bold text-foreground">对方关系网络</h3>
        </div>
        <div className="text-center py-16 text-muted-foreground">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-7 h-7 opacity-30" />
          </div>
          <p className="font-medium">交易对方数据不足，无法生成网络关系图</p>
        </div>
      </section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.6 }}
      className="py-10 border-t border-border"
    >
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest uppercase text-indigo mb-1.5">Network Analysis</p>
        <h3 className="text-2xl font-bold text-foreground">对方关系网络</h3>
        <p className="text-sm text-muted-foreground mt-1">
          展示 <span className="font-semibold text-foreground">{stats.nodeCount}</span> 个交易对方之间的资金流向关系
        </p>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground mb-1">对方数量</p>
          <p className="text-lg font-bold text-foreground">{stats.nodeCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground mb-1">资金流向</p>
          <p className="text-lg font-bold text-foreground">{stats.linkCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground mb-1">总流向金额</p>
          <p className="text-lg font-bold text-indigo">{formatCurrency(stats.totalValue)}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground mb-1">平均流向</p>
          <p className="text-lg font-bold text-indigo">{formatCurrency(stats.avgLinkValue)}</p>
        </div>
      </div>

      {/* 两列布局：最活跃对方 + 最大资金流向 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 最活跃的对方 */}
        <Card className="p-4">
          <h4 className="font-semibold text-sm mb-4 text-foreground">最活跃的交易对方</h4>
          <div className="space-y-3">
            {topNodes.map((node, index) => (
              <div key={node.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                    node.type === 'income' ? 'bg-emerald-ok' : node.type === 'expense' ? 'bg-destructive' : 'bg-indigo'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium truncate">{node.name}</span>
                </div>
                <span className="text-xs font-semibold text-indigo shrink-0">{formatCurrency(node.total)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* 最大的资金流向 */}
        <Card className="p-4">
          <h4 className="font-semibold text-sm mb-4 text-foreground">最大的资金流向</h4>
          <div className="space-y-3">
            {topLinks.map((link, index) => (
              <div key={`${link.source}-${link.target}`} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <span className="text-xs font-bold text-muted-foreground shrink-0">{index + 1}</span>
                  <span className="text-xs font-medium truncate">{link.source}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                  <span className="text-xs font-medium truncate">{link.target}</span>
                </div>
                <span className="text-xs font-semibold text-emerald-ok shrink-0">{formatCurrency(link.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 图例说明 */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-emerald-ok" />
          <span className="text-muted-foreground">收入对方</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-destructive" />
          <span className="text-muted-foreground">支出对方</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-indigo" />
          <span className="text-muted-foreground">收支对方</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        💡 提示：展示了交易对方之间的主要资金流向关系。通过分析对方A的收入和对方B的支出，识别潜在的资金转移链条。
      </p>
    </motion.section>
  );
}
