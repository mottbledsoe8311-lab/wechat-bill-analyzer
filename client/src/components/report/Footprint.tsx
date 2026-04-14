/**
 * 足迹 - 近三个月去过哪儿
 * 通过停车费、物业费等交易识别客户去过的写字楼/大厦
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Building2, Car, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/analyzer';

interface Transaction {
  date: Date;
  counterpart: string;
  type: string;
  method: string;
  amount: number;
  direction: string;
  remark?: string;
}

interface FootprintRecord {
  location: string;          // 识别出的地点名称
  originalMerchant: string;  // 原始商户名称
  visitType: 'parking' | 'property' | 'canteen' | 'other'; // 访问类型
  lastVisit: Date;           // 最后一次访问时间
  visitCount: number;        // 访问次数
  transactions: Transaction[]; // 相关交易记录
}

interface Props {
  allTransactions: Transaction[];
}

type TimeFilter = '1month' | '3months';

// 停车场关键词
const PARKING_KEYWORDS = [
  '停车', '泊车', '车场', '停车场', '地下车库', '停车费', '车位费',
  'parking', 'park', '道闸', '收费', '停车收费',
];

// 物业关键词
const PROPERTY_KEYWORDS = [
  '物业', '物管', '管理费', '物业费', '物业公司', '物业管理',
  '服务中心', '商业管理', '园区', '写字楼', '大厦', '广场', '中心',
  '大楼', '楼宇', '楼层', '楼管', '楼宇管理',
];

// 餐厅/食堂关键词（可能在写字楼内）
const CANTEEN_KEYWORDS = [
  '食堂', '餐厅', '饭堂', '员工餐', '企业餐', '团餐',
];

// 过滤掉明显不是写字楼的地点
const EXCLUDE_KEYWORDS = [
  '超市', '商场', '购物', '便利店', '药店', '医院', '学校', '银行',
  '加油站', '高速', '路桥', '收费站', '地铁', '公交', '出租',
  '滴滴', '美团', '饿了么', '外卖', '快递', '顺丰', '菜鸟',
];

// 提取地点名称（去掉停车场/物业等后缀，保留核心地名）
function extractLocationName(merchantName: string): string {
  let name = merchantName.trim();
  
  // 移除常见后缀
  const suffixesToRemove = [
    '停车场', '停车', '泊车', '车场', '地下车库', '停车收费', '停车费',
    '物业管理', '物业服务', '物业公司', '物管', '物业',
    '管理有限公司', '有限公司', '股份有限公司', '管理公司',
    '服务中心', '管理中心',
  ];
  
  for (const suffix of suffixesToRemove) {
    if (name.endsWith(suffix)) {
      name = name.slice(0, -suffix.length).trim();
    }
  }
  
  // 如果名称太短，使用原始名称
  if (name.length < 2) {
    name = merchantName;
  }
  
  return name;
}

// 判断交易类型
function classifyTransaction(tx: Transaction): 'parking' | 'property' | 'canteen' | 'other' | null {
  const text = `${tx.counterpart} ${tx.type}`.toLowerCase();
  
  // 先检查排除关键词
  for (const kw of EXCLUDE_KEYWORDS) {
    if (text.includes(kw.toLowerCase())) return null;
  }
  
  // 只处理支出
  if (tx.direction !== '支出' && tx.direction !== '支') return null;
  
  // 检查停车关键词
  for (const kw of PARKING_KEYWORDS) {
    if (text.includes(kw.toLowerCase())) return 'parking';
  }
  
  // 检查物业关键词
  for (const kw of PROPERTY_KEYWORDS) {
    if (text.includes(kw.toLowerCase())) return 'property';
  }
  
  // 检查食堂关键词
  for (const kw of CANTEEN_KEYWORDS) {
    if (text.includes(kw.toLowerCase())) return 'canteen';
  }
  
  return null;
}

// 访问类型标签
const VISIT_TYPE_CONFIG = {
  parking: { label: '停车', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Car },
  property: { label: '物业', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Building2 },
  canteen: { label: '食堂', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Building2 },
  other: { label: '其他', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: MapPin },
};

export default function Footprint({ allTransactions }: Props) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('3months');

  // 根据时间过滤交易
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now);
    if (timeFilter === '1month') {
      cutoff.setMonth(cutoff.getMonth() - 1);
    } else {
      cutoff.setMonth(cutoff.getMonth() - 3);
    }
    return allTransactions.filter(tx => tx.date >= cutoff && tx.date <= now);
  }, [allTransactions, timeFilter]);

  // 分析足迹
  const footprints = useMemo(() => {
    const locationMap = new Map<string, FootprintRecord>();

    for (const tx of filteredTransactions) {
      const visitType = classifyTransaction(tx);
      if (!visitType) continue;

      const locationName = extractLocationName(tx.counterpart);
      const key = locationName.toLowerCase();

      if (locationMap.has(key)) {
        const record = locationMap.get(key)!;
        record.visitCount += 1;
        record.transactions.push(tx);
        if (tx.date > record.lastVisit) {
          record.lastVisit = tx.date;
        }
      } else {
        locationMap.set(key, {
          location: locationName,
          originalMerchant: tx.counterpart,
          visitType,
          lastVisit: tx.date,
          visitCount: 1,
          transactions: [tx],
        });
      }
    }

    // 转换为数组并按最后访问时间排序
    return Array.from(locationMap.values())
      .sort((a, b) => b.lastVisit.getTime() - a.lastVisit.getTime());
  }, [filteredTransactions]);

  if (footprints.length === 0) {
    return (
      <section className="py-10 border-t border-border">
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest uppercase text-indigo mb-1.5">Footprint</p>
          <h3 className="text-2xl font-bold text-foreground">足迹</h3>
          <p className="text-sm text-muted-foreground mt-1">近三个月去过哪儿</p>
        </div>
        <div className="text-center py-16 text-muted-foreground">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-7 h-7 opacity-30" />
          </div>
          <p className="font-medium">未检测到相关地点信息</p>
          <p className="text-xs mt-1 opacity-60">通过停车费、物业费等交易识别去过的写字楼/大厦</p>
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
      {/* 标题区 */}
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest uppercase text-indigo mb-1.5">Footprint</p>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-2xl font-bold text-foreground">足迹</h3>
            <p className="text-sm text-muted-foreground mt-1">
              近{timeFilter === '1month' ? '一' : '三'}个月去过 
              <span className="font-semibold text-foreground ml-1">{footprints.length}</span> 个地点
            </p>
          </div>
          {/* 时间筛选 */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            {(['1month', '3months'] as TimeFilter[]).map(key => (
              <button
                key={key}
                onClick={() => setTimeFilter(key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  timeFilter === key
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {key === '1month' ? '近一个月' : '近三个月'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 足迹列表 */}
      <div className="space-y-3">
        {footprints.map((fp, index) => {
          const typeConfig = VISIT_TYPE_CONFIG[fp.visitType];
          const TypeIcon = typeConfig.icon;
          
          // 按时间排序展示所有访问记录
          const sortedTxs = [...fp.transactions].sort((a, b) => b.date.getTime() - a.date.getTime());

          return (
            <motion.div
              key={`${fp.location}-${index}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * index }}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              {/* 主行 */}
              <div className="flex items-start gap-3 px-4 py-3.5">
                {/* 图标 */}
                <div className="w-9 h-9 rounded-full bg-indigo/10 flex items-center justify-center shrink-0 mt-0.5">
                  <TypeIcon className="w-4.5 h-4.5 text-indigo" />
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground">{fp.location}</span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border ${typeConfig.color}`}>
                      {typeConfig.label}
                    </Badge>
                    {fp.visitCount > 1 && (
                      <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-full">
                        {fp.visitCount}次
                      </span>
                    )}
                  </div>
                  
                  {/* 原始商户名（如果与识别名称不同） */}
                  {fp.originalMerchant !== fp.location && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {fp.originalMerchant}
                    </p>
                  )}

                  {/* 访问时间列表 */}
                  <div className="mt-2 space-y-1">
                    {sortedTxs.map((tx, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span className="text-foreground/70">{formatDate(tx.date)}</span>
                        <span className="text-destructive font-medium">-¥{tx.amount.toFixed(2)}</span>
                        {tx.method && (
                          <span className="text-muted-foreground/60 truncate">{tx.method}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 右侧：最近访问时间 */}
                <div className="shrink-0 text-right">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(fp.lastVisit)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 说明 */}
      <p className="text-xs text-muted-foreground mt-4 opacity-60">
        * 根据停车费、物业费等交易记录推断，仅供参考
      </p>
    </motion.section>
  );
}
