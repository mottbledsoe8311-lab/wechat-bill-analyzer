/**
 * 对方关系网络分析
 * 构建交易对方之间的关系网络，计算资金流向
 */

import type { Transaction } from './pdfParser';

export interface CounterpartNode {
  id: string;
  name: string;
  totalIncome: number;
  totalExpense: number;
  transactionCount: number;
  type: 'income' | 'expense' | 'both';
}

export interface CounterpartLink {
  source: string;
  target: string;
  value: number; // 资金流向金额
  direction: 'in' | 'out'; // 相对于 source 的方向
  transactionCount: number;
}

export interface CounterpartNetwork {
  nodes: CounterpartNode[];
  links: CounterpartLink[];
}

/**
 * 分析交易数据构建对方关系网络
 * @param transactions 交易列表
 * @returns 对方关系网络数据
 */
export function analyzeCounterpartNetwork(transactions: Transaction[]): CounterpartNetwork {
  const nodeMap = new Map<string, CounterpartNode>();
  const linkMap = new Map<string, CounterpartLink>();

  // 第一步：构建节点
  for (const tx of transactions) {
    const counterpart = tx.counterpart || '未知';
    
    if (!nodeMap.has(counterpart)) {
      nodeMap.set(counterpart, {
        id: counterpart,
        name: counterpart,
        totalIncome: 0,
        totalExpense: 0,
        transactionCount: 0,
        type: 'both',
      });
    }

    const node = nodeMap.get(counterpart)!;
    node.transactionCount++;

    if (tx.direction === '收入' || tx.direction === '收') {
      node.totalIncome += tx.amount;
      node.type = node.totalExpense > 0 ? 'both' : 'income';
    } else {
      node.totalExpense += tx.amount;
      node.type = node.totalIncome > 0 ? 'both' : 'expense';
    }
  }

  // 第二步：构建链接（对方之间的资金流向）
  // 这里我们分析的是：对方A 通过我 向 对方B 转账的情况
  // 例如：从 A 收入 -> 支出给 B，形成一条 A -> B 的链接
  
  // 按时间排序交易
  const sortedTransactions = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());

  // 构建收入和支出的时间序列
  const incomeTransactions = sortedTransactions.filter(t => t.direction === '收入' || t.direction === '收');
  const expenseTransactions = sortedTransactions.filter(t => t.direction === '支出' || t.direction === '支');

  // 对于每笔支出，查找最近的收入来源
  for (const expense of expenseTransactions) {
    // 找到时间最接近的收入（在支出之前）
    const recentIncome = incomeTransactions
      .filter(income => income.date <= expense.date)
      .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

    if (recentIncome && recentIncome.counterpart !== expense.counterpart) {
      const linkKey = `${recentIncome.counterpart}->${expense.counterpart}`;
      
      if (!linkMap.has(linkKey)) {
        linkMap.set(linkKey, {
          source: recentIncome.counterpart || '未知',
          target: expense.counterpart || '未知',
          value: 0,
          direction: 'out',
          transactionCount: 0,
        });
      }

      const link = linkMap.get(linkKey)!;
      link.value += expense.amount;
      link.transactionCount++;
    }
  }

  // 第三步：过滤掉太小的链接（只保留金额较大的关系）
  const minLinkValue = Array.from(linkMap.values())
    .map(l => l.value)
    .sort((a, b) => b - a)[Math.floor(linkMap.size * 0.3)] || 0; // 保留前 70% 的链接

  const filteredLinks = Array.from(linkMap.values()).filter(
    link => link.value >= minLinkValue || link.transactionCount >= 3
  );

  // 只保留有链接的节点
  const linkedCounterparts = new Set<string>();
  for (const link of filteredLinks) {
    linkedCounterparts.add(link.source);
    linkedCounterparts.add(link.target);
  }

  // 添加所有节点（即使没有链接，也要显示）
  const nodes = Array.from(nodeMap.values());

  return {
    nodes,
    links: filteredLinks,
  };
}

/**
 * 获取对方关系网络的统计信息
 */
export function getNetworkStats(network: CounterpartNetwork) {
  return {
    nodeCount: network.nodes.length,
    linkCount: network.links.length,
    totalValue: network.links.reduce((sum, link) => sum + link.value, 0),
    avgLinkValue: network.links.length > 0 
      ? network.links.reduce((sum, link) => sum + link.value, 0) / network.links.length 
      : 0,
  };
}
