/**
 * 足迹 - 近三个月去过哪儿
 * 通过停车费、物业费等交易识别客户去过的写字楼/大厦
 * 支持从数据库加载自定义关键词，内联管理按钮
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Building2, Car, Settings, Plus, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

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
  location: string;
  originalMerchant: string;
  visitType: 'parking' | 'property' | 'canteen' | 'other';
  lastVisit: Date;
  visitCount: number;
  transactions: Transaction[];
}

interface Props {
  allTransactions: Transaction[];
}

type TimeFilter = '1month' | '3months';

// 内置停车场关键词
const PARKING_KEYWORDS = [
  '停车', '泊车', '车场', '停车场', '地下车库', '停车费', '车位费',
  'parking', 'park', '道闸', '停车收费',
];

// 内置物业关键词
const PROPERTY_KEYWORDS = [
  '物业', '物管', '管理费', '物业费', '物业公司', '物业管理',
  '服务中心', '商业管理', '园区', '写字楼', '大厦', '广场', '中心',
  '大楼', '楼宇', '楼管', '楼宇管理',
];

// 内置餐厅/食堂关键词
const CANTEEN_KEYWORDS = [
  '食堂', '饭堂', '员工餐', '企业餐', '团餐',
];

// 内置排除关键词
const EXCLUDE_KEYWORDS = [
  '超市', '商场', '购物', '便利店', '药店', '医院', '学校', '银行',
  '加油站', '高速', '路桥', '收费站', '地铁', '公交', '出租',
  '滴滴', '美团', '饿了么', '外卖', '快递', '顺丰', '菜鸟',
];

function extractLocationName(merchantName: string): string {
  let name = merchantName.trim();
  const suffixesToRemove = [
    '停车场', '停车收费', '停车费',
    '物业管理有限公司', '物业服务有限公司', '物业管理', '物业服务', '物业公司', '物管',
    '管理有限公司', '有限公司', '股份有限公司',
    '服务中心', '管理中心',
  ];
  for (const suffix of suffixesToRemove) {
    if (name.endsWith(suffix)) {
      name = name.slice(0, -suffix.length).trim();
      break;
    }
  }
  if (name.length < 2) name = merchantName;
  return name;
}

function classifyTransaction(
  tx: Transaction,
  customKeywords: { parking: string[]; property: string[]; canteen: string[]; exclude: string[] }
): 'parking' | 'property' | 'canteen' | 'other' | null {
  const text = `${tx.counterpart} ${tx.type}`.toLowerCase();
  const allExclude = [...EXCLUDE_KEYWORDS, ...customKeywords.exclude];
  const allParking = [...PARKING_KEYWORDS, ...customKeywords.parking];
  const allProperty = [...PROPERTY_KEYWORDS, ...customKeywords.property];
  const allCanteen = [...CANTEEN_KEYWORDS, ...customKeywords.canteen];

  for (const kw of allExclude) {
    if (kw && text.includes(kw.toLowerCase())) return null;
  }
  if (tx.direction !== '支出' && tx.direction !== '支') return null;
  for (const kw of allParking) {
    if (kw && text.includes(kw.toLowerCase())) return 'parking';
  }
  for (const kw of allProperty) {
    if (kw && text.includes(kw.toLowerCase())) return 'property';
  }
  for (const kw of allCanteen) {
    if (kw && text.includes(kw.toLowerCase())) return 'canteen';
  }
  return null;
}

const VISIT_TYPE_CONFIG = {
  parking: { label: '停车', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Car },
  property: { label: '物业', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Building2 },
  canteen: { label: '食堂', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Building2 },
  other: { label: '其他', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: MapPin },
};

const CATEGORY_LABELS: Record<string, string> = {
  parking: '停车场',
  property: '物业',
  canteen: '食堂',
  exclude: '排除',
};

function TimeFilterBar({ value, onChange }: { value: TimeFilter; onChange: (v: TimeFilter) => void }) {
  return (
    <div className="flex items-center gap-1 bg-muted/60 rounded-lg p-1 shrink-0">
      {(['1month', '3months'] as TimeFilter[]).map(key => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all select-none ${
            value === key
              ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
          }`}
        >
          {key === '1month' ? '近一个月' : '近三个月'}
        </button>
      ))}
    </div>
  );
}

// 内联关键词管理面板
function KeywordManager({ onClose }: { onClose: () => void }) {
  const [newKeyword, setNewKeyword] = useState('');
  const [newCategory, setNewCategory] = useState('parking');
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.footprintKeywords.getAll.useQuery();
  const keywords = data?.data || [];

  const saveMutation = trpc.footprintKeywords.save.useMutation({
    onSuccess: () => {
      utils.footprintKeywords.getAll.invalidate();
      setNewKeyword('');
      toast.success('关键词已保存，生成时将自动识别');
    },
    onError: (err) => toast.error('保存失败：' + err.message),
  });

  const deleteMutation = trpc.footprintKeywords.delete.useMutation({
    onSuccess: () => {
      utils.footprintKeywords.getAll.invalidate();
      toast.success('已删除');
    },
    onError: (err) => toast.error('删除失败：' + err.message),
  });

  const handleAdd = () => {
    const kw = newKeyword.trim();
    if (!kw) return toast.error('请输入关键词');
    saveMutation.mutate({ keyword: kw, category: newCategory });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mt-3 rounded-xl border border-border bg-muted/30 p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-foreground">足迹关键词管理</p>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        上传关键词至数据库，生成时将自动识别包含这些关键词的交易
      </p>

      {/* 添加新关键词 */}
      <div className="flex gap-2 mb-4">
        <Input
          value={newKeyword}
          onChange={e => setNewKeyword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="输入关键词，如：万象城、汇金"
          className="h-8 text-xs flex-1"
        />
        <Select value={newCategory} onValueChange={setNewCategory}>
          <SelectTrigger className="h-8 text-xs w-24 shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="parking">停车场</SelectItem>
            <SelectItem value="property">物业</SelectItem>
            <SelectItem value="canteen">食堂</SelectItem>
            <SelectItem value="exclude">排除</SelectItem>
          </SelectContent>
        </Select>
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

      {/* 已有关键词列表 */}
      {isLoading ? (
        <p className="text-xs text-muted-foreground text-center py-2">加载中...</p>
      ) : keywords.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">暂无自定义关键词</p>
      ) : (
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
          {keywords.map((kw: any) => (
            <div
              key={kw.id}
              className="flex items-center gap-1 bg-background border border-border rounded-full px-2.5 py-1 text-xs"
            >
              <span className="text-muted-foreground">[{CATEGORY_LABELS[kw.category] || kw.category}]</span>
              <span className="text-foreground">{kw.keyword}</span>
              <button
                onClick={() => deleteMutation.mutate({ id: kw.id })}
                className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function Footprint({ allTransactions }: Props) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('3months');
  const [showManager, setShowManager] = useState(false);

  // 从数据库加载自定义关键词
  const fpKeywordsQuery = trpc.footprintKeywords.getAll.useQuery();

  const customKeywords = useMemo(() => {
    const result = { parking: [] as string[], property: [] as string[], canteen: [] as string[], exclude: [] as string[] };
    const keywords = fpKeywordsQuery.data?.data || [];
    for (const kw of keywords) {
      const cat = kw.category as keyof typeof result;
      if (cat in result) result[cat].push(kw.keyword);
    }
    return result;
  }, [fpKeywordsQuery.data]);

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

  const footprints = useMemo(() => {
    const locationMap = new Map<string, FootprintRecord>();
    for (const tx of filteredTransactions) {
      const visitType = classifyTransaction(tx, customKeywords);
      if (!visitType) continue;
      const locationName = extractLocationName(tx.counterpart);
      const key = locationName.toLowerCase();
      if (locationMap.has(key)) {
        const record = locationMap.get(key)!;
        record.visitCount += 1;
        record.transactions.push(tx);
        if (tx.date > record.lastVisit) record.lastVisit = tx.date;
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
    return Array.from(locationMap.values())
      .sort((a, b) => b.lastVisit.getTime() - a.lastVisit.getTime());
  }, [filteredTransactions, customKeywords]);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="py-10 border-t border-border"
    >
      {/* 标题区 */}
      <div className="mb-4">
        <p className="text-xs font-semibold tracking-widest uppercase text-indigo mb-1.5">Footprint</p>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-2xl font-bold text-foreground">足迹</h3>
            <p className="text-sm text-muted-foreground mt-1">
              近{timeFilter === '1month' ? '一' : '三'}个月
              {footprints.length > 0
                ? <>去过 <span className="font-semibold text-foreground">{footprints.length}</span> 个地点</>
                : '未检测到相关地点信息'
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TimeFilterBar value={timeFilter} onChange={setTimeFilter} />
            <button
              type="button"
              onClick={() => setShowManager(v => !v)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                showManager
                  ? 'bg-indigo/10 text-indigo border-indigo/30'
                  : 'bg-muted/60 text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              管理
              {showManager ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* 内联管理面板 */}
        <AnimatePresence>
          {showManager && <KeywordManager onClose={() => setShowManager(false)} />}
        </AnimatePresence>
      </div>

      {/* 空状态 */}
      {footprints.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <MapPin className="w-6 h-6 opacity-30" />
          </div>
          <p className="font-medium text-sm">未检测到相关地点信息</p>
          <p className="text-xs mt-1 opacity-60">通过停车费、物业费等交易记录识别去过的写字楼/大厦</p>
        </div>
      )}

      {/* 足迹列表 */}
      {footprints.length > 0 && (
        <div className="space-y-2">
          {footprints.map((fp, index) => {
            const typeConfig = VISIT_TYPE_CONFIG[fp.visitType];
            const TypeIcon = typeConfig.icon;

            return (
              <motion.div
                key={`${fp.location}-${index}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * index }}
                className="rounded-lg border border-border bg-card px-3 py-2.5 flex items-center gap-3"
              >
                {/* 图标 */}
                <div className="w-8 h-8 rounded-full bg-indigo/10 flex items-center justify-center shrink-0">
                  <TypeIcon className="w-3.5 h-3.5 text-indigo" />
                </div>

                {/* 名称信息 */}
                <div className="flex-1 min-w-0">
                  {/* 识别名称 + 类型标签 + 次数 */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-sm text-foreground break-all leading-tight">{fp.location}</span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border shrink-0 ${typeConfig.color}`}>
                      {typeConfig.label}
                    </Badge>
                    {fp.visitCount > 1 && (
                      <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-full shrink-0">
                        共{fp.visitCount}次
                      </span>
                    )}
                  </div>
                  {/* 原始完整商户名（不截断） */}
                  {fp.originalMerchant !== fp.location && (
                    <p className="text-xs text-muted-foreground mt-0.5 break-all leading-snug">
                      {fp.originalMerchant}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 说明 */}
      <p className="text-xs text-muted-foreground mt-3 opacity-60">
        * 根据停车费、物业费等交易记录推断，仅供参考
      </p>
    </motion.section>
  );
}
