/**
 * 报表查看页面
 * 根据报表ID显示对应的报表内容
 */

import { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import superjson from 'superjson';

import OverviewSection from '@/components/report/OverviewSection';
import MonthlyChart from '@/components/report/MonthlyChart';
import RegularTransfers from '@/components/report/RegularTransfers';
import RepaymentTracking from '@/components/report/RepaymentTracking';
import LargeInflows from '@/components/report/LargeInflows';
import Footprint from '@/components/report/Footprint';
import CounterpartSummary from '@/components/report/CounterpartSummary';
import ShareButton from '@/components/ShareButton';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';

interface ReportData {
  title?: string;
  summary?: string;
  overview?: any;
  monthlyBreakdown?: any[];
  regularTransfers?: any[];
  repaymentTracking?: any[];
  largeInflows?: any[];
  largeExpenses?: any[];
  counterpartSummary?: any[];
  allTransactions?: any[];
  [key: string]: any;
}

/**
 * 递归转换所有日期字符串为 Date 对象
 */
function convertDatesToObjects(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    if (isoDateRegex.test(obj)) {
      return new Date(obj);
    }
    return obj;
  }
  
  if (obj instanceof Date) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertDatesToObjects);
  }
  
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key in obj) {
      converted[key] = convertDatesToObjects(obj[key]);
    }
    return converted;
  }
  
  return obj;
}

export default function ReportView() {
  const [match, params] = useRoute('/report/:reportId');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [reportTitle, setReportTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const reportId = params?.reportId;

  // 使用 tRPC useQuery hook 加载报表数据
  const { data: reportResult, isLoading: isQueryLoading, isError, error: queryError } = trpc.reports.get.useQuery(
    { reportId: reportId || '' },
    {
      enabled: !!reportId && match !== false,
      retry: 1,
    }
  );

  // 处理报表数据
  useEffect(() => {
    if (!match || !reportId) {
      setError('无效的报表ID');
      setLoading(false);
      return;
    }

    setLoading(isQueryLoading);

    if (isError) {
      console.error('[ReportView] Query error:', queryError);
      setError('报表加载失败，请检查网络连接');
      return;
    }

    if (!reportResult) {
      if (!isQueryLoading) {
        setError('报表不存在或已过期');
      }
      return;
    }

    try {
      if (!reportResult.success) {
        setError('报表不存在或已过期');
        return;
      }

      setReportTitle(reportResult.title || '微信账单分析报表');
      
      // 解析数据
      let parsedData = reportResult.data;
      if (typeof parsedData === 'string') {
        try {
          parsedData = JSON.parse(parsedData);
        } catch (e) {
          console.error('[ReportView] Failed to parse data:', e);
          setError('报表数据格式错误');
          return;
        }
      }

      if (!parsedData || typeof parsedData !== 'object') {
        console.error('[ReportView] Invalid data:', parsedData);
        setError('报表数据格式错误');
        return;
      }

      // 转换日期
      const convertedData = convertDatesToObjects(parsedData);
      setReportData(convertedData);
      setError(null);
    } catch (err) {
      console.error('[ReportView] Error processing report:', err);
      setError('加载报表失败，请检查网络连接');
    }
  }, [match, reportId, reportResult, isQueryLoading, isError, queryError]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-indigo" />
          <p className="text-muted-foreground">正在加载报表...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h2 className="text-2xl font-bold mb-2">加载失败</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            重新加载
          </Button>
        </motion.div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">报表数据加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 导航栏 */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container flex items-center justify-between h-14">
          <h1 className="font-bold text-lg">{reportTitle}</h1>
          <div className="flex items-center gap-2">
            <ShareButton reportId={reportId || ''} reportData={reportData} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
            >
              返回
            </Button>
          </div>
        </div>
      </nav>

      {/* 报表内容 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container py-8 space-y-8"
      >
        {reportData.overview && (
          <OverviewSection data={reportData.overview} />
        )}

        {reportData.monthlyBreakdown && reportData.monthlyBreakdown.length > 0 && (
          <MonthlyChart data={reportData.monthlyBreakdown} />
        )}

        {reportData.regularTransfers && reportData.regularTransfers.length > 0 && (
          <RegularTransfers transactions={reportData.allTransactions || []} />
        )}

        {reportData.repaymentTracking && reportData.repaymentTracking.length > 0 && (
          <RepaymentTracking data={reportData.repaymentTracking} />
        )}

        {reportData.largeInflows && reportData.largeInflows.length > 0 && (
          <LargeInflows data={reportData.largeInflows} />
        )}

        {reportData.counterpartSummary && reportData.counterpartSummary.length > 0 && (
          <CounterpartSummary data={reportData.counterpartSummary} allTransactions={reportData.allTransactions || []} />
        )}

        {reportData.footprint && (
          <Footprint data={reportData.footprint} />
        )}
      </motion.div>
    </div>
  );
}
