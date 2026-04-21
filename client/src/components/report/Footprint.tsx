/**
 * 足迹模块
 * 显示用户在最近三个月内的活动位置
 * 通过停车费、物业费、交通工具等交易推断
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, formatDate } from '@/lib/analyzer';
import { MapPin, ChevronDown, ChevronUp, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

interface FootprintRecord {
  location: string;
  date: Date;
  category: 'parking' | 'property' | 'transit';
  amount: number;
  counterpart: string;
  count: number;
}

type TimeRange = '1month' | '3months';

// 内置关键词库
const PARKING_KEYWORDS = ['停车', '车位', '停车场', '停车费', '泊位', 'parking', '车库'];
const PROPERTY_KEYWORDS = ['物业', '物业费', '物业管理', '小区', '社区', 'property', '管理费'];
const TRANSIT_KEYWORDS = ['滴滴', '嘀嘀', '网约车', '地铁', '公交', '出租车', '打车', 'taxi', 'uber', '高铁', '火车', '飞机', '航班', '机票'];

// 分类标签
const CATEGORY_LABELS: Record<'parking' | 'property' | 'transit', string> = {
  parking: '停车',
  property: '物业',
  transit: '交通',
};

// 分类颜色
const CATEGORY_COLORS: Record<'parking' | 'property' | 'transit', string> = {
  parking: 'bg-blue-100 text-blue-700',
  property: 'bg-green-100 text-green-700',
  transit: 'bg-purple-100 text-purple-700',
};

// 关键词过滤器
function KeywordFilter({ onClose }: { onClose: () => void }) {
  const [timeRange, setTimeRange] = useState<TimeRange>('3months');
  const [keywords, setKeywords] = useState<Record<string, boolean>>({});
  
  const { data: customKeywordsResp } = trpc.footprintKeywords.getAll.useQuery();
  const customKeywords = customKeywordsResp?.data || [];
  
  return (
    <div className="p-3 bg-muted/50 rounded-lg border border-border mb-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-foreground">时间范围</p>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
      </div>
      <div className="flex gap-2 mb-3">
        {([
          { key: '1month' as TimeRange, label: '近1月' },
          { key: '3months' as TimeRange, label: '近3月' },
        ]).map(opt => (
          <button
            key={opt.key}
            onClick={() => setTimeRange(opt.key)}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              timeRange === opt.key
                ? 'bg-indigo text-white'
                : 'bg-background text-muted-foreground hover:text-foreground'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      
      {/* 自定义关键词 */}
      {customKeywords && customKeywords.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground mb-1">自定义关键词</p>
          <div className="flex flex-wrap gap-1.5">
            {customKeywords.map((kw: any, i: number) => (
              <button
                key={i}
                onClick={() => setKeywords(prev => ({ ...prev, [kw.keyword]: !prev[kw.keyword] }))}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${
                  keywords[kw.keyword]
                    ? 'bg-indigo text-white'
                    : 'bg-background border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {kw.keyword}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 内联关键词管理面板
function KeywordManager({ onClose }: { onClose: () => void }) {
  const [newKeyword, setNewKeyword] = useState('');
  const [newCategory, setNewCategory] = useState<'parking' | 'property' | 'transit'>('parking');
  const [addedCount, setAddedCount] = useState(0);
  const saveMutation = trpc.footprintKeywords.save.useMutation({
    onSuccess: () => {
      setNewKeyword('');
      setAddedCount(prev => prev + 1);
      toast.success('关键词已成功添加！');
    },
    onError: (err) => toast.error('添加失败：' + err.message),
  });

  const handleAdd = () => {
    const kw = newKeyword.trim();
    if (!kw) return toast.error('请输入关键词');
    
    // 检测是否与内置关键词重复
    const allBuiltinKeywords = [...PARKING_KEYWORDS, ...PROPERTY_KEYWORDS, ...TRANSIT_KEYWORDS];
    const isDuplicate = allBuiltinKeywords.some(k => k.toLowerCase() === kw.toLowerCase());
    if (isDuplicate) {
      return toast.error('该关键词已内置，无需重复添加');
    }
    
    saveMutation.mutate({ keyword: kw, category: newCategory as 'parking' | 'property' | 'transit' });
  };

  const { data: customKeywordsResp } = trpc.footprintKeywords.getAll.useQuery();
  const customKeywords = customKeywordsResp?.data || [];
  const deleteMutation = trpc.footprintKeywords.delete.useMutation({
    onSuccess: () => toast.success('关键词已删除'),
    onError: (err) => toast.error('删除失败：' + err.message),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mt-3 rounded-xl border border-border bg-muted/30 p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-foreground">自定义关键词</p>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">✕ 关闭</button>
      </div>

      {/* 已添加的关键词列表 */}
      {customKeywords && customKeywords.length > 0 && (
        <div className="mb-4 p-3 bg-background rounded-lg">
          <p className="text-xs text-muted-foreground mb-2">已添加 {customKeywords.length} 个关键词</p>
          <div className="flex flex-wrap gap-2">
            {customKeywords.map((kw: any, i: number) => (
              <div key={i} className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs">
                <span>{kw.keyword}</span>
                <span className="text-[10px] text-muted-foreground">({CATEGORY_LABELS[kw.category as 'parking' | 'property' | 'transit']})</span>
                <button
                  onClick={() => deleteMutation.mutate({ keyword: kw.keyword as string })}
                  className="ml-1 hover:text-destructive"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 添加新关键词 */}
      <div className="flex gap-2">
        <Input
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="输入关键词，如：万象城、汇金"
          className="h-8 text-xs flex-1"
        />
        <Select value={newCategory} onValueChange={(value) => setNewCategory(value as 'parking' | 'property' | 'transit')}>
          <SelectTrigger className="h-8 text-xs w-24 shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="parking">停车场</SelectItem>
            <SelectItem value="property">物业</SelectItem>
            <SelectItem value="transit">网约车或地铁</SelectItem>
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
    </motion.div>
  );
}

// 足迹卡片（支持展开）
function FootprintCard({ fp, index }: { fp: FootprintRecord; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border border-border rounded-lg p-3 hover:border-indigo/50 transition-colors"
    >
      <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${CATEGORY_COLORS[fp.category]}`}>
            <MapPin className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{fp.location}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-1.5 py-0.5 rounded ${CATEGORY_COLORS[fp.category]}`}>
                {CATEGORY_LABELS[fp.category]}
              </span>
              <span className="text-xs text-muted-foreground">{formatDate(fp.date)}</span>
            </div>
          </div>
        </div>
        <div className="text-right shrink-0 ml-2">
          <p className="text-sm font-semibold text-foreground">{formatCurrency(fp.amount)}</p>
          <p className="text-xs text-muted-foreground">{fp.count}笔</p>
          {expanded ? <ChevronUp className="w-4 h-4 mt-1" /> : <ChevronDown className="w-4 h-4 mt-1" />}
        </div>
      </div>

      {/* 展开详情 */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground"
          >
            <p>交易对方：{fp.counterpart}</p>
            <p>分类：{CATEGORY_LABELS[fp.category]}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// 主组件
export default function Footprint({ allTransactions }: { allTransactions?: any[] }) {
  const [showManager, setShowManager] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('3months');
  const { data: customKeywordsResp } = trpc.footprintKeywords.getAll.useQuery();
  const customKeywords = customKeywordsResp?.data || [];

  const footprints = useMemo(() => {
    if (!allTransactions) return [];

    const end = new Date();
    const start = new Date();
    if (timeRange === '1month') start.setMonth(start.getMonth() - 1);
    else start.setMonth(start.getMonth() - 3);

    const allKeywords = {
      parking: [...PARKING_KEYWORDS, ...((customKeywords as any[])?.filter((k: any) => k.category === 'parking').map((k: any) => k.keyword) || [])],
      property: [...PROPERTY_KEYWORDS, ...((customKeywords as any[])?.filter((k: any) => k.category === 'property').map((k: any) => k.keyword) || [])],
      transit: [...TRANSIT_KEYWORDS, ...((customKeywords as any[])?.filter((k: any) => k.category === 'transit').map((k: any) => k.keyword) || [])],
    };

    const locationMap = new Map<string, FootprintRecord>();

    allTransactions
      .filter(tx => tx.date >= start && tx.date <= end)
      .forEach((tx: any) => {
        const counterpart = tx.counterpart || '';
        
        for (const [category, keywords] of Object.entries(allKeywords)) {
          const matched = (keywords as string[]).some((kw: string) => counterpart.toLowerCase().includes(kw.toLowerCase()));
          if (matched) {
            const key = `${category}-${counterpart}`;
            const existing = locationMap.get(key);
            if (existing) {
              existing.amount += tx.amount;
              existing.count += 1;
              existing.date = new Date(Math.max(existing.date.getTime(), tx.date.getTime()));
            } else {
              locationMap.set(key, {
                location: counterpart,
                date: tx.date,
                category: category as 'parking' | 'property' | 'transit',
                amount: tx.amount,
                counterpart,
                count: 1,
              });
            }
            break;
          }
        }
      });

    return Array.from(locationMap.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [allTransactions, timeRange, customKeywords]);

  if (!allTransactions || allTransactions.length === 0) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.6 }}
      className="py-12 border-t border-border"
    >
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest uppercase text-indigo mb-1.5">Footprint</p>
        <h3 className="text-2xl font-bold text-foreground">足迹分析</h3>
        <p className="text-sm text-muted-foreground mt-1">
          检测到 <span className="font-semibold text-foreground">{footprints.length}</span> 个活动位置
        </p>
      </div>

      {/* 时间范围和操作按钮 */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex gap-1 bg-muted rounded-md p-1">
          {([
            { key: '1month' as TimeRange, label: '近1月' },
            { key: '3months' as TimeRange, label: '近3月' },
          ]).map(opt => (
            <button
              key={opt.key}
              onClick={() => setTimeRange(opt.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                timeRange === opt.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowManager(!showManager)}
          className="ml-auto px-3 py-1.5 text-xs font-medium bg-indigo text-white rounded hover:bg-indigo/90 transition-colors"
        >
          {showManager ? '关闭' : '自定义关键词'}
        </button>
      </div>

      {/* 关键词管理面板 */}
      <AnimatePresence>
        {showManager && <KeywordManager onClose={() => setShowManager(false)} />}
      </AnimatePresence>

      {/* 足迹列表 */}
      {footprints.length > 0 ? (
        <div className="space-y-3">
          {footprints.map((fp, i) => (
            <FootprintCard key={i} fp={fp} index={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>未检测到足迹记录</p>
        </div>
      )}
    </motion.section>
  );
}
