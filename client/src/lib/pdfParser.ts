/**
 * PDF解析引擎 - 微信账单PDF解析
 * 
 * 设计哲学：极简数据叙事 - 精准提取，高效解析
 * 
 * 微信账单PDF表格字段：
 * 交易订单号 | 交易时间 | 交易类型 | 收/支/其他 | 交易方式 | 金额(元) | 交易对方 | 商家单号
 */

import * as pdfjsLib from 'pdfjs-dist';

// 设置 worker - pdfjs-dist 4.x 使用 legacy build
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export interface Transaction {
  orderId: string;       // 交易订单号
  date: Date;            // 交易时间
  dateStr: string;       // 原始日期字符串
  type: string;          // 交易类型 (转账/红包/商户消费等)
  direction: string;     // 收/支/其他
  method: string;        // 交易方式 (零钱/银行卡等)
  amount: number;        // 金额
  counterpart: string;   // 交易对方
  merchantId: string;    // 商家单号
}

export interface AccountInfo {
  name: string;
  idNumber: string;
  account: string;
  startDate: string;
  endDate: string;
}

export interface ParseResult {
  accountInfo: AccountInfo;
  transactions: Transaction[];
  totalPages: number;
  parseErrors: string[];
}

// 解析进度回调
type ProgressCallback = (progress: number, message: string) => void;

/**
 * 从PDF文本内容中提取账户信息
 */
function extractAccountInfo(textContent: string): AccountInfo {
  const info: AccountInfo = {
    name: '',
    idNumber: '',
    account: '',
    startDate: '',
    endDate: '',
  };

  // 尝试匹配姓名
  const nameMatch = textContent.match(/姓\s*名[：:]\s*(.+?)(?:\s|$)/);
  if (nameMatch) info.name = nameMatch[1].trim();

  // 尝试匹配证件号
  const idMatch = textContent.match(/证件号[码]?[：:]\s*(.+?)(?:\s|$)/);
  if (idMatch) info.idNumber = idMatch[1].trim();

  // 尝试匹配微信号
  const accountMatch = textContent.match(/(?:微信号|账[户号])[：:]\s*(.+?)(?:\s|$)/);
  if (accountMatch) info.account = accountMatch[1].trim();

  // 尝试匹配日期范围
  const dateRangeMatch = textContent.match(/(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})\s*(?:[-~至到])\s*(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})/);
  if (dateRangeMatch) {
    info.startDate = dateRangeMatch[1];
    info.endDate = dateRangeMatch[2];
  }

  return info;
}

/**
 * 判断是否为表头行
 */
function isHeaderRow(text: string): boolean {
  const headerKeywords = ['交易订单号', '交易时间', '交易类型', '收/支', '金额', '交易对方', '商家单号'];
  let matchCount = 0;
  for (const keyword of headerKeywords) {
    if (text.includes(keyword)) matchCount++;
  }
  return matchCount >= 3;
}

/**
 * 解析日期字符串
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // 清理空格和特殊字符
  const cleaned = dateStr.replace(/\s+/g, ' ').trim();
  
  // 尝试多种日期格式
  const patterns = [
    /(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\s+(\d{1,2}):(\d{2}):(\d{2})/,
    /(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\s+(\d{1,2}):(\d{2})/,
    /(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/,
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      const year = parseInt(match[1]);
      const month = parseInt(match[2]) - 1;
      const day = parseInt(match[3]);
      const hour = match[4] ? parseInt(match[4]) : 0;
      const minute = match[5] ? parseInt(match[5]) : 0;
      const second = match[6] ? parseInt(match[6]) : 0;
      return new Date(year, month, day, hour, minute, second);
    }
  }
  return null;
}

/**
 * 解析金额字符串
 */
function parseAmount(amountStr: string): number {
  if (!amountStr) return 0;
  const cleaned = amountStr.replace(/[¥￥,，\s]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.abs(num);
}

/**
 * 从文本行中提取交易记录
 * 微信账单的每行数据格式较为固定
 */
function parseTransactionFromText(line: string): Transaction | null {
  // 清理多余空格
  const cleaned = line.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  
  // 跳过表头和空行
  if (!cleaned || isHeaderRow(cleaned) || cleaned.length < 20) return null;
  
  // 尝试匹配交易记录模式
  // 格式: 订单号 日期时间 交易类型 收/支 交易方式 金额 交易对方 商家单号
  
  // 模式1: 完整格式，以长数字订单号开头（支持中文、英文、数字、特殊符号）
  const fullPattern = /^(\d{15,32})\s+(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)\s+([\u4e00-\u9fa5a-zA-Z0-9\s\-_()（）]+?)\s+(收入|支出|其他|收|支|不计收支)\s+([\u4e00-\u9fa5a-zA-Z0-9\s\-_()（）]*?)\s+([\d¥￥,.]+)\s+([\u4e00-\u9fa5a-zA-Z0-9\s\-_()（）@.]+?)(?:\s+(.*))?$/;
  
  let match = cleaned.match(fullPattern);
  if (match) {
    const date = parseDate(match[2]);
    if (!date) return null;
    
    return {
      orderId: match[1].trim(),
      date,
      dateStr: match[2].trim(),
      type: match[3].trim(),
      direction: match[4].trim(),
      method: match[5].trim(),
      amount: parseAmount(match[6]),
      counterpart: match[7].trim(),
      merchantId: (match[8] || '').trim(),
    };
  }

  // 模式2: 没有订单号开头，但有日期（支持中文、英文、数字、特殊符号）
  const dateFirstPattern = /^(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)\s+([\u4e00-\u9fa5a-zA-Z0-9\s\-_()（）]+?)\s+(收入|支出|其他|收|支|不计收支)\s+([\u4e00-\u9fa5a-zA-Z0-9\s\-_()（）]*?)\s+([\d¥￥,.]+)\s+([\u4e00-\u9fa5a-zA-Z0-9\s\-_()（）@.]+?)(?:\s+(.*))?$/;
  
  match = cleaned.match(dateFirstPattern);
  if (match) {
    const date = parseDate(match[1]);
    if (!date) return null;
    
    return {
      orderId: '',
      date,
      dateStr: match[1].trim(),
      type: match[2].trim(),
      direction: match[3].trim(),
      method: match[4].trim(),
      amount: parseAmount(match[5]),
      counterpart: match[6].trim(),
      merchantId: (match[7] || '').trim(),
    };
  }

  return null;
}

/**
 * 从PDF表格数据中提取交易记录
 */
function parseTransactionFromRow(row: string[]): Transaction | null {
  if (!row || row.length < 6) return null;
  
  // 清理每个单元格
  const cells = row.map(cell => (cell || '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim());
  
  // 检查是否为表头
  if (cells.some(c => isHeaderRow(c))) return null;
  
  // 尝试根据列数确定格式
  // 8列格式: 订单号 | 日期 | 类型 | 收支 | 方式 | 金额 | 对方 | 商家单号
  if (cells.length >= 8) {
    const date = parseDate(cells[1]);
    if (date) {
      return {
        orderId: cells[0],
        date,
        dateStr: cells[1],
        type: cells[2],
        direction: cells[3],
        method: cells[4],
        amount: parseAmount(cells[5]),
        counterpart: cells[6],
        merchantId: cells[7] || '',
      };
    }
  }
  
  // 7列格式: 日期 | 类型 | 收支 | 方式 | 金额 | 对方 | 商家单号
  if (cells.length >= 7) {
    const date = parseDate(cells[0]);
    if (date) {
      return {
        orderId: '',
        date,
        dateStr: cells[0],
        type: cells[1],
        direction: cells[2],
        method: cells[3],
        amount: parseAmount(cells[4]),
        counterpart: cells[5],
        merchantId: cells[6] || '',
      };
    }
  }
  
  // 6列格式
  if (cells.length >= 6) {
    // 尝试第一列是日期
    let date = parseDate(cells[0]);
    if (date) {
      return {
        orderId: '',
        date,
        dateStr: cells[0],
        type: cells[1],
        direction: cells[2],
        method: cells[3],
        amount: parseAmount(cells[4]),
        counterpart: cells[5],
        merchantId: '',
      };
    }
    // 尝试第二列是日期
    date = parseDate(cells[1]);
    if (date) {
      return {
        orderId: cells[0],
        date,
        dateStr: cells[1],
        type: cells[2],
        direction: cells[3],
        method: cells[4],
        amount: parseAmount(cells[5]),
        counterpart: '',
        merchantId: '',
      };
    }
  }

  return null;
}

/**
 * 主解析函数 - 解析微信账单PDF
 */
export async function parsePDF(
  file: File,
  onProgress?: ProgressCallback
): Promise<ParseResult> {
  const errors: string[] = [];
  const transactions: Transaction[] = [];
  let accountInfo: AccountInfo = {
    name: '',
    idNumber: '',
    account: '',
    startDate: '',
    endDate: '',
  };

  try {
    onProgress?.(5, '正在读取PDF文件...');
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;
    
    onProgress?.(10, `PDF加载完成，共 ${totalPages} 页`);

    // 第一遍：提取所有文本内容
    let allText = '';
    const pageTexts: string[] = [];
    
    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      pageTexts.push(pageText);
      allText += pageText + '\n';
      
      const progress = 10 + (i / totalPages) * 30;
      onProgress?.(progress, `正在提取第 ${i}/${totalPages} 页文本...`);
    }

    // 提取账户信息（通常在第一页）
    accountInfo = extractAccountInfo(allText);
    onProgress?.(45, '正在解析交易记录...');

    // 第二遍：逐页提取交易数据
    for (let i = 1; i <= totalPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // 按Y坐标分组文本项（同一行的文本）
        const items = textContent.items as any[];
        const rows: Map<number, { x: number; str: string }[]> = new Map();
        
        for (const item of items) {
          if (!item.str || item.str.trim() === '') continue;
          // 将Y坐标四舍五入到最近的整数来分组
          const y = Math.round(item.transform[5]);
          if (!rows.has(y)) rows.set(y, []);
          rows.get(y)!.push({ x: item.transform[4], str: item.str });
        }

        // 按Y坐标排序（从上到下，Y值从大到小）
        const sortedRows = Array.from(rows.entries())
          .sort((a, b) => b[0] - a[0]);

        for (const [, cells] of sortedRows) {
          // 按X坐标排序
          cells.sort((a, b) => a.x - b.x);
          
          // 方法1：将整行作为文本解析
          const lineText = cells.map(c => c.str).join(' ');
          let tx = parseTransactionFromText(lineText);
          
          if (tx) {
            transactions.push(tx);
            continue;
          }

          // 方法2：作为表格行解析
          const cellTexts = cells.map(c => c.str.trim()).filter(s => s.length > 0);
          tx = parseTransactionFromRow(cellTexts);
          if (tx) {
            transactions.push(tx);
          }
        }

        const progress = 45 + (i / totalPages) * 45;
        onProgress?.(progress, `正在分析第 ${i}/${totalPages} 页交易...`);
      } catch (pageError: any) {
        errors.push(`第 ${i} 页解析失败: ${pageError.message}`);
        const progress = 45 + (i / totalPages) * 45;
        onProgress?.(progress, `第 ${i} 页解析失败，继续处理下一页...`);
      }
    }

    // 去重（根据订单号和日期）
    const seen = new Set<string>();
    const uniqueTransactions = transactions.filter(tx => {
      const key = tx.orderId 
        ? tx.orderId 
        : `${tx.dateStr}-${tx.amount}-${tx.counterpart}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // 按日期排序（由近到远）
    uniqueTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());

    onProgress?.(95, '解析完成，正在整理数据...');

    // 如果没有从文本中获取到日期范围，从交易记录推断
    if (!accountInfo.startDate && uniqueTransactions.length > 0) {
      const dates = uniqueTransactions.map(t => t.date).sort((a, b) => a.getTime() - b.getTime());
      accountInfo.startDate = formatDateSimple(dates[0]);
      accountInfo.endDate = formatDateSimple(dates[dates.length - 1]);
    }

    onProgress?.(100, `解析完成，共提取 ${uniqueTransactions.length} 条交易记录`);

    return {
      accountInfo,
      transactions: uniqueTransactions,
      totalPages,
      parseErrors: errors,
    };
  } catch (error: any) {
    errors.push(`PDF解析失败: ${error.message}`);
    onProgress?.(100, `解析出错: ${error.message}`);
    return {
      accountInfo,
      transactions,
      totalPages: 0,
      parseErrors: errors,
    };
  }
}

function formatDateSimple(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
