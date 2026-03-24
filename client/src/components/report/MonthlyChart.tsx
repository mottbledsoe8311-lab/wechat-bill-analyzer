/**
 * 月度趋势图表
 * 设计：极简数据叙事 - 清晰的数据可视化
 */

import { motion } from 'framer-motion';
import { formatCurrency, type MonthlyData } from '@/lib/analyzer';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface Props {
  data: MonthlyData[];
}

export default function MonthlyChart({ data }: Props) {
  // 由近到远排序后反转用于图表展示（图表从左到右是时间正序）
  const chartData = [...data].reverse().map(d => {
    const [year, month] = d.month.split('-');
    return {
      ...d,
      month: `${year.slice(2)}/${month}`, // "2024-01" -> "24/01"
      displayMonth: `${year}/${month}`, // 完整日期用于表格显示
    };
  });

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="py-12 border-t border-border"
    >
      <div className="mb-8">
        <h2 className="text-sm font-semibold tracking-widest uppercase text-indigo mb-2">
          Monthly Trend
        </h2>
        <h3 className="text-2xl font-bold text-foreground">
          月度收支趋势
        </h3>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={2} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.004 264.542)" vertical={false} />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 11, fill: 'oklch(0.556 0.012 256.848)' }}
              axisLine={{ stroke: 'oklch(0.92 0.004 264.542)' }}
              tickLine={false}
              height={40}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: 'oklch(0.556 0.012 256.848)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v >= 10000 ? `${(v / 10000).toFixed(0)}万` : v.toLocaleString()}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload) return null;
                return (
                  <div className="bg-white border border-border rounded-lg shadow-lg p-3 text-sm">
                    <p className="font-medium mb-2">20{label}</p>
                    {payload.map((entry: any) => (
                      <p key={entry.dataKey} className="flex justify-between gap-4">
                        <span style={{ color: entry.color }}>
                          {entry.dataKey === 'income' ? '收入' : '支出'}
                        </span>
                        <span className="font-medium tabular-nums">
                          {formatCurrency(entry.value)}
                        </span>
                      </p>
                    ))}
                  </div>
                );
              }}
            />
            <Legend
              formatter={(value) => value === 'income' ? '收入' : '支出'}
              iconType="square"
              iconSize={10}
            />
            <Bar dataKey="income" fill="oklch(0.432 0.117 162.48)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="expense" fill="oklch(0.577 0.245 27.325 / 0.7)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 月度数据表格 */}
      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">月份</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">收入</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">支出</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">净流水</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">笔数</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <motion.tr
                key={row.month}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.03 }}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
              >
                <td className="py-2 px-4 font-medium text-sm">
                  <div>{row.month}</div>
                  <div className="text-xs text-muted-foreground">月</div>
                </td>
                <td className="py-3 px-4 text-right tabular-nums text-emerald-ok">
                  {formatCurrency(row.income)}
                </td>
                <td className="py-3 px-4 text-right tabular-nums text-destructive">
                  {formatCurrency(row.expense)}
                </td>
                <td className={`py-3 px-4 text-right tabular-nums font-medium ${
                  row.netFlow >= 0 ? 'text-emerald-ok' : 'text-destructive'
                }`}>
                  {row.netFlow >= 0 ? '+' : ''}{formatCurrency(row.netFlow)}
                </td>
                <td className="py-3 px-4 text-right tabular-nums text-muted-foreground">
                  {row.transactionCount}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}
