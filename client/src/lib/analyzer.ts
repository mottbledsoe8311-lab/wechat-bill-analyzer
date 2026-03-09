/**
 * 微信账单智能分析引擎
 * 
 * 设计哲学：极简数据叙事 - 数据驱动的故事线
 * 
 * 分析维度：
 * 1. 规律转账识别 - 检测固定周期的转账行为
 * 2. 还款追踪 - 跟踪每笔还款的来源
 * 3. 大额入账监控 - 监控大额收入
 * 4. 借款排查 - 识别借款模式
 */

import type { Transaction } from './pdfParser';
import { differenceInDays, format } from 'date-fns';

// ============ 类型定义 ============

export interface AnalysisResult {
  overview: OverviewStats;
  regularTransfers: RegularTransferGroup[];
  repaymentTracking: RepaymentRecord[];
  largeInflows: LargeInflow[];
  loanDetection: LoanPattern[];
  monthlyBreakdown: MonthlyData[];
  counterpartSummary: CounterpartSummary[];
}

export interface OverviewStats {
  totalTransactions: number;
  totalIncome: number;
  totalExpense: number;
  netFlow: number;
  dateRange: string;
  avgDailyExpense: number;
  avgDailyIncome: number;
  topCounterpart: string;
  largestSingleTransaction: number;
}

export interface RegularTransferGroup {
  counterpart: string;
  direction: string;
  pattern: string;           // 如 "每7天", "每15天", "每月"
  intervalDays: number;
  avgAmount: number;
  totalAmount: number;
  transactions: Transaction[];
  confidence: number;        // 置信度 0-1
  riskLevel: 'low' | 'medium' | 'high';
}

export interface RepaymentRecord {
  counterpart: string;
  totalRepaid: number;
  repayments: Transaction[];
  sources: { method: string; count: number; total: number }[];
  frequency: string;
  isRegular: boolean;
}

export interface LargeInflow {
  transaction: Transaction;
  percentile: number;        // 在所有收入中的百分位
  isUnusual: boolean;        // 是否异常
  relatedOutflows: Transaction[];  // 相关的支出
}

export interface LoanPattern {
  counterpart: string;
  borrowedAmount: number;
  repaidAmount: number;
  remainingAmount: number;
  borrowTransactions: Transaction[];
  repayTransactions: Transaction[];
  repaymentSchedule: string;
  isRegularRepayment: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  netFlow: number;
  transactionCount: number;
}

export interface CounterpartSummary {
  name: string;
  totalIn: number;
  totalOut: number;
  netFlow: number;
  transactionCount: number;
  firstDate: Date;
  lastDate: Date;
  isRegular: boolean;
}

type AnalysisProgressCallback = (progress: number, message: string) => void;

// ============ 主分析函数 ============

export async function analyzeTransactions(
  transactions: Transaction[],
  onProgress?: AnalysisProgressCallback
): Promise<AnalysisResult> {
  onProgress?.(0, '开始分析交易数据...');

  // 1. 概览统计
  onProgress?.(10, '计算概览统计...');
  const overview = calculateOverview(transactions);

  // 2. 按交易对方分组
  onProgress?.(20, '分析交易对方...');
  const counterpartSummary = buildCounterpartSummary(transactions);

  // 3. 月度数据
  onProgress?.(30, '生成月度报表...');
  const monthlyBreakdown = buildMonthlyBreakdown(transactions);

  // 4. 规律转账识别
  onProgress?.(40, '识别规律转账模式...');
  const regularTransfers = detectRegularTransfers(transactions);

  // 5. 还款追踪
  onProgress?.(60, '追踪还款记录...');
  const repaymentTracking = trackRepayments(transactions);

  // 6. 大额入账监控
  onProgress?.(75, '监控大额入账...');
  const largeInflows = detectLargeInflows(transactions);

  // 7. 借款排查
  onProgress?.(85, '排查借款模式...');
  const loanDetection = detectLoanPatterns(transactions);

  onProgress?.(100, '分析完成');

  return {
    overview,
    regularTransfers,
    repaymentTracking,
    largeInflows,
    loanDetection,
    monthlyBreakdown,
    counterpartSummary,
  };
}

// ============ 概览统计 ============

function calculateOverview(transactions: Transaction[]): OverviewStats {
  const incomes = transactions.filter(t => 
    t.direction === '收入' || t.direction === '收'
  );
  const expenses = transactions.filter(t => 
    t.direction === '支出' || t.direction === '支'
  );

  const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);

  const dates = transactions.map(t => t.date).sort((a, b) => a.getTime() - b.getTime());
  const daySpan = dates.length >= 2 
    ? Math.max(differenceInDays(dates[dates.length - 1], dates[0]), 1) 
    : 1;

  // 找最频繁的交易对方
  const counterpartCount: Record<string, number> = {};
  transactions.forEach(t => {
    if (t.counterpart && t.counterpart !== '/' && t.counterpart !== '-') {
      counterpartCount[t.counterpart] = (counterpartCount[t.counterpart] || 0) + 1;
    }
  });
  const topCounterpart = Object.entries(counterpartCount)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || '无';

  const dateRange = dates.length >= 2
    ? `${format(dates[0], 'yyyy-MM-dd')} 至 ${format(dates[dates.length - 1], 'yyyy-MM-dd')}`
    : '未知';

  return {
    totalTransactions: transactions.length,
    totalIncome,
    totalExpense,
    netFlow: totalIncome - totalExpense,
    dateRange,
    avgDailyExpense: totalExpense / daySpan,
    avgDailyIncome: totalIncome / daySpan,
    topCounterpart,
    largestSingleTransaction: Math.max(...transactions.map(t => t.amount), 0),
  };
}

// ============ 交易对方汇总 ============

function buildCounterpartSummary(transactions: Transaction[]): CounterpartSummary[] {
  const map: Record<string, {
    totalIn: number; totalOut: number; count: number;
    dates: Date[];
  }> = {};

  for (const tx of transactions) {
    const name = tx.counterpart?.trim();
    if (!name || name === '/' || name === '-' || name === '') continue;

    if (!map[name]) {
      map[name] = { totalIn: 0, totalOut: 0, count: 0, dates: [] };
    }

    const entry = map[name];
    entry.count++;
    entry.dates.push(tx.date);

    if (tx.direction === '收入' || tx.direction === '收') {
      entry.totalIn += tx.amount;
    } else if (tx.direction === '支出' || tx.direction === '支') {
      entry.totalOut += tx.amount;
    }
  }

  return Object.entries(map)
    .map(([name, data]) => {
      const sortedDates = data.dates.sort((a, b) => a.getTime() - b.getTime());
      return {
        name,
        totalIn: data.totalIn,
        totalOut: data.totalOut,
        netFlow: data.totalIn - data.totalOut,
        transactionCount: data.count,
        firstDate: sortedDates[0],
        lastDate: sortedDates[sortedDates.length - 1],
        isRegular: data.count >= 3,
      };
    })
    .sort((a, b) => b.transactionCount - a.transactionCount);
}

// ============ 月度数据 ============

function buildMonthlyBreakdown(transactions: Transaction[]): MonthlyData[] {
  const map: Record<string, { income: number; expense: number; count: number }> = {};

  for (const tx of transactions) {
    const month = format(tx.date, 'yyyy-MM');
    if (!map[month]) {
      map[month] = { income: 0, expense: 0, count: 0 };
    }
    map[month].count++;
    if (tx.direction === '收入' || tx.direction === '收') {
      map[month].income += tx.amount;
    } else if (tx.direction === '支出' || tx.direction === '支') {
      map[month].expense += tx.amount;
    }
  }

  return Object.entries(map)
    .map(([month, data]) => ({
      month,
      income: data.income,
      expense: data.expense,
      netFlow: data.income - data.expense,
      transactionCount: data.count,
    }))
    .sort((a, b) => b.month.localeCompare(a.month)); // 由近到远
}

// ============ 规律转账识别 ============

function detectRegularTransfers(transactions: Transaction[]): RegularTransferGroup[] {
  const results: RegularTransferGroup[] = [];
  
  // 按交易对方+方向分组
  const groups: Record<string, Transaction[]> = {};
  for (const tx of transactions) {
    let name = tx.counterpart?.trim();
    if (!name || name === '/' || name === '-') continue;
    // 支持英文和特殊符号
    name = name.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s\-_()（）]/g, '').trim();
    if (!name) continue;
    
    // 只关注转账类型
    const isTransfer = tx.type?.includes('转账') || 
                       tx.type?.includes('红包') ||
                       tx.type?.includes('转入') ||
                       tx.type?.includes('转出') ||
                       tx.type?.includes('付款');
    
    // 也包含所有收支记录
    const key = `${name}|${tx.direction}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  }

  for (const [key, txs] of Object.entries(groups)) {
    if (txs.length < 3) continue; // 至少3笔才分析规律

    const [counterpart, direction] = key.split('|');
    
    // 按日期排序
    const sorted = [...txs].sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // 计算相邻交易的间隔天数
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const days = differenceInDays(sorted[i].date, sorted[i - 1].date);
      if (days > 0) intervals.push(days);
    }

    if (intervals.length < 2) continue;

    // 检测规律性
    const regularPattern = detectPattern(intervals);
    if (regularPattern) {
      // 检测金额规律性 - 金额必须有规律（至少50%的金额相同或相近）
      const amounts = sorted.map(t => t.amount);
      const amountRegularity = detectAmountRegularity(amounts);
      if (!amountRegularity) continue; // 如果金额没有规律，跳过
      
      const totalAmount = sorted.reduce((sum, t) => sum + t.amount, 0);
      const avgAmount = totalAmount / sorted.length;
      
      // 判断风险等级
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (regularPattern.confidence > 0.7 && avgAmount > 1000) riskLevel = 'medium';
      if (regularPattern.confidence > 0.8 && avgAmount > 5000) riskLevel = 'high';
      if (direction === '支出' || direction === '支') {
        if (regularPattern.confidence > 0.6 && avgAmount > 3000) riskLevel = 'high';
      }

      results.push({
        counterpart,
        direction,
        pattern: regularPattern.description,
        intervalDays: regularPattern.interval,
        avgAmount,
        totalAmount,
        transactions: sorted,
        confidence: regularPattern.confidence,
        riskLevel,
      });
    }
  }

  // 按风险等级排序（高风险优先），再按置信度排序
  const riskOrder = { high: 0, medium: 1, low: 2 };
  return results.sort((a, b) => {
    if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
      return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    }
    return b.confidence - a.confidence;
  });
}

interface PatternResult {
  interval: number;
  description: string;
  confidence: number;
}

/**
 * 检测金额规律性 - 检查是否有至少50%的金额相同或相近（±5%）
 */
function detectAmountRegularity(amounts: number[]): boolean {
  if (amounts.length < 3) return false;
  
  // 统计金额出现频率
  const amountMap: Record<string, number> = {};
  for (const amount of amounts) {
    const rounded = Math.round(amount / 10) * 10; // 四舍五入到最近的10元
    const key = rounded.toString();
    amountMap[key] = (amountMap[key] || 0) + 1;
  }
  
  // 检查是否有金额出现频率达到50%
  const maxFrequency = Math.max(...Object.values(amountMap));
  return maxFrequency / amounts.length >= 0.5;
}

function detectPattern(intervals: number[]): PatternResult | null {
  if (intervals.length < 2) return null;

  const avg = intervals.reduce((s, v) => s + v, 0) / intervals.length;
  
  // 检查常见周期
  const commonPeriods = [
    { days: 1, name: '每天' },
    { days: 7, name: '每7天' },
    { days: 10, name: '每10天' },
    { days: 14, name: '每14天' },
    { days: 15, name: '每15天' },
    { days: 30, name: '每月' },
    { days: 31, name: '每月' },
  ];

  let bestMatch: PatternResult | null = null;
  let bestConfidence = 0;

  for (const period of commonPeriods) {
    // 计算每个间隔与目标周期的偏差
    const deviations = intervals.map(i => Math.abs(i - period.days) / period.days);
    const avgDeviation = deviations.reduce((s, v) => s + v, 0) / deviations.length;
    
    // 允许20%的偏差
    const matchCount = deviations.filter(d => d <= 0.25).length;
    const confidence = matchCount / intervals.length;

    if (confidence > bestConfidence && confidence >= 0.5) {
      bestConfidence = confidence;
      bestMatch = {
        interval: period.days,
        description: period.name,
        confidence,
      };
    }
  }

  // 如果没有匹配常见周期，检查是否有自定义规律
  if (!bestMatch && intervals.length >= 3) {
    const median = [...intervals].sort((a, b) => a - b)[Math.floor(intervals.length / 2)];
    const deviations = intervals.map(i => Math.abs(i - median) / median);
    const matchCount = deviations.filter(d => d <= 0.3).length;
    const confidence = matchCount / intervals.length;

    if (confidence >= 0.5 && median >= 2) {
      bestMatch = {
        interval: median,
        description: `每${median}天`,
        confidence,
      };
    }
  }

  return bestMatch;
}

// ============ 还款追踪 ============

// 常见商户名称列表 - 用于过滤非个人转账
const MERCHANT_KEYWORDS = [
  '滴滴', '美团', '京东', '淘宝', '拼多多', '支付宝', '饿了么',
  '超市', '便利店', '商城', '商店', '药店', '医院', '银行',
  '电信', '移动', '联通', '水电', '燃气', '物业', '保险',
  '出行', '打车', '公交', '地铁', '加油', '停车',
  '餐饮', '酒店', '旅游', '航空', '铁路', '12306',
  '腾讯', '网易', '百度', '阿里', '字节', '华为', '小米',
  '公司工资', '投资收益', '理财', '基金', '股票',
];

function isMerchant(name: string): boolean {
  if (!name) return false;
  const lower = name.toLowerCase();
  return MERCHANT_KEYWORDS.some(kw => lower.includes(kw));
}

function trackRepayments(transactions: Transaction[]): RepaymentRecord[] {
  const results: RepaymentRecord[] = [];
  
  // 找出所有支出给同一个人的记录（可能是还款）
  // 过滤掉商户，只保留个人转账
  const outflowsByPerson: Record<string, Transaction[]> = {};
  
  for (const tx of transactions) {
    const name = tx.counterpart?.trim();
    if (!name || name === '/' || name === '-') continue;
    if (tx.direction !== '支出' && tx.direction !== '支') continue;
    
    // 过滤商户 - 还款追踪只关注个人之间的转账
    if (isMerchant(name)) continue;
    
    // 还款通常通过转账
    if (!outflowsByPerson[name]) outflowsByPerson[name] = [];
    outflowsByPerson[name].push(tx);
  }

  for (const [counterpart, txs] of Object.entries(outflowsByPerson)) {
    if (txs.length < 2) continue; // 至少2笔才追踪

    const sorted = [...txs].sort((a, b) => b.date.getTime() - a.date.getTime());
    const totalRepaid = sorted.reduce((sum, t) => sum + t.amount, 0);

    // 分析还款来源（交易方式）
    const sourceMap: Record<string, { count: number; total: number }> = {};
    for (const tx of sorted) {
      const method = tx.method || '未知';
      if (!sourceMap[method]) sourceMap[method] = { count: 0, total: 0 };
      sourceMap[method].count++;
      sourceMap[method].total += tx.amount;
    }

    const sources = Object.entries(sourceMap)
      .map(([method, data]) => ({ method, ...data }))
      .sort((a, b) => b.total - a.total);

    // 检查是否有规律
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const days = Math.abs(differenceInDays(sorted[i].date, sorted[i - 1].date));
      if (days > 0) intervals.push(days);
    }

    const isRegular = intervals.length >= 2 && detectPattern(intervals) !== null;
    const pattern = detectPattern(intervals);
    const frequency = pattern ? pattern.description : 
      intervals.length > 0 ? `平均每${Math.round(intervals.reduce((s, v) => s + v, 0) / intervals.length)}天` : '单次';

    results.push({
      counterpart,
      totalRepaid,
      repayments: sorted,
      sources,
      frequency,
      isRegular,
    });
  }

  return results.sort((a, b) => b.totalRepaid - a.totalRepaid);
}

// ============ 大额入账监控 ============

function detectLargeInflows(transactions: Transaction[]): LargeInflow[] {
  const incomes = transactions.filter(t => 
    t.direction === '收入' || t.direction === '收'
  );

  if (incomes.length === 0) return [];

  // 计算收入的统计值
  const amounts = incomes.map(t => t.amount).sort((a, b) => a - b);
  const median = amounts[Math.floor(amounts.length / 2)];
  const mean = amounts.reduce((s, v) => s + v, 0) / amounts.length;
  const stdDev = Math.sqrt(
    amounts.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / amounts.length
  );

  // 大额阈值：取中位数的3倍或均值+2倍标准差中的较小值，但至少5000元
  const threshold = Math.max(
    Math.min(median * 3, mean + 2 * stdDev),
    5000
  );

  const results: LargeInflow[] = [];

  for (const tx of incomes) {
    if (tx.amount >= threshold) {
      // 计算百分位
      const rank = amounts.filter(a => a <= tx.amount).length;
      const percentile = (rank / amounts.length) * 100;

      // 查找相关的支出（入账后7天内的大额支出）
      const relatedOutflows = transactions.filter(t => {
        if (t.direction !== '支出' && t.direction !== '支') return false;
        const daysDiff = differenceInDays(t.date, tx.date);
        return daysDiff >= 0 && daysDiff <= 7 && t.amount >= tx.amount * 0.3;
      });

      // 判断是否异常
      const isUnusual = tx.amount > mean + 3 * stdDev;

      results.push({
        transaction: tx,
        percentile,
        isUnusual,
        relatedOutflows,
      });
    }
  }

  return results.sort((a, b) => b.transaction.amount - a.transaction.amount);
}

// ============ 借款排查 ============

function detectLoanPatterns(transactions: Transaction[]): LoanPattern[] {
  const results: LoanPattern[] = [];
  
  // 按交易对方分组
  const byPerson: Record<string, { inflows: Transaction[]; outflows: Transaction[] }> = {};
  
  for (const tx of transactions) {
    const name = tx.counterpart?.trim();
    if (!name || name === '/' || name === '-' || name === '') continue;
    
    if (!byPerson[name]) byPerson[name] = { inflows: [], outflows: [] };
    
    if (tx.direction === '收入' || tx.direction === '收') {
      byPerson[name].inflows.push(tx);
    } else if (tx.direction === '支出' || tx.direction === '支') {
      byPerson[name].outflows.push(tx);
    }
  }

  for (const [counterpart, data] of Object.entries(byPerson)) {
    // 借款模式：从某人收到大额款项，然后定期向其支出（还款）
    // 或者：向某人支出大额款项（借出），然后定期从其收到款项（收回）
    
    // 模式1：借入 - 收到大额，然后多次小额还出
    if (data.inflows.length >= 1 && data.outflows.length >= 2) {
      const totalBorrowed = data.inflows.reduce((s, t) => s + t.amount, 0);
      const totalRepaid = data.outflows.reduce((s, t) => s + t.amount, 0);
      
      // 检查是否是借款模式：收入较少笔但金额大，支出较多笔但金额小
      const avgInflowAmount = totalBorrowed / data.inflows.length;
      const avgOutflowAmount = totalRepaid / data.outflows.length;
      
      if (avgInflowAmount > avgOutflowAmount * 1.5 && data.outflows.length >= 2) {
        // 检查还款规律性
        const sortedOutflows = [...data.outflows].sort((a, b) => a.date.getTime() - b.date.getTime());
        const intervals: number[] = [];
        for (let i = 1; i < sortedOutflows.length; i++) {
          const days = differenceInDays(sortedOutflows[i].date, sortedOutflows[i - 1].date);
          if (days > 0) intervals.push(days);
        }

        const pattern = intervals.length >= 2 ? detectPattern(intervals) : null;
        const isRegular = pattern !== null;

        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        if (totalBorrowed > 10000) riskLevel = 'medium';
        if (totalBorrowed > 50000 || (isRegular && totalBorrowed > 20000)) riskLevel = 'high';

        results.push({
          counterpart,
          borrowedAmount: totalBorrowed,
          repaidAmount: totalRepaid,
          remainingAmount: totalBorrowed - totalRepaid,
          borrowTransactions: data.inflows.sort((a, b) => b.date.getTime() - a.date.getTime()),
          repayTransactions: sortedOutflows.reverse(),
          repaymentSchedule: pattern ? pattern.description : '不规律',
          isRegularRepayment: isRegular,
          riskLevel,
        });
      }
    }

    // 模式2：借出 - 支出大额，然后多次小额收回
    if (data.outflows.length >= 1 && data.inflows.length >= 2) {
      const totalLent = data.outflows.reduce((s, t) => s + t.amount, 0);
      const totalRecovered = data.inflows.reduce((s, t) => s + t.amount, 0);
      
      const avgOutflowAmount = totalLent / data.outflows.length;
      const avgInflowAmount = totalRecovered / data.inflows.length;
      
      if (avgOutflowAmount > avgInflowAmount * 1.5 && data.inflows.length >= 2) {
        const sortedInflows = [...data.inflows].sort((a, b) => a.date.getTime() - b.date.getTime());
        const intervals: number[] = [];
        for (let i = 1; i < sortedInflows.length; i++) {
          const days = differenceInDays(sortedInflows[i].date, sortedInflows[i - 1].date);
          if (days > 0) intervals.push(days);
        }

        const pattern = intervals.length >= 2 ? detectPattern(intervals) : null;
        const isRegular = pattern !== null;

        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        if (totalLent > 10000) riskLevel = 'medium';
        if (totalLent > 50000 || (isRegular && totalLent > 20000)) riskLevel = 'high';

        // 避免重复添加
        const exists = results.some(r => r.counterpart === counterpart);
        if (!exists) {
          results.push({
            counterpart,
            borrowedAmount: totalLent,
            repaidAmount: totalRecovered,
            remainingAmount: totalLent - totalRecovered,
            borrowTransactions: data.outflows.sort((a, b) => b.date.getTime() - a.date.getTime()),
            repayTransactions: sortedInflows.reverse(),
            repaymentSchedule: pattern ? pattern.description : '不规律',
            isRegularRepayment: isRegular,
            riskLevel,
          });
        }
      }
    }
  }

  return results.sort((a, b) => {
    // 先按风险等级排序
    const riskOrder = { high: 0, medium: 1, low: 2 };
    if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
      return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    }
    return b.borrowedAmount - a.borrowedAmount;
  });
}

// ============ 工具函数 ============

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date): string {
  // 处理UTC时区转换 - 将UTC时间转换为本地时间显示
  // 由于parseDate使用UTC创建日期，这里需要调整显示
  const localDate = new Date(date.getTime());
  return format(localDate, 'yyyy-MM-dd HH:mm');
}

export function formatDateShort(date: Date): string {
  return format(date, 'MM-dd');
}
