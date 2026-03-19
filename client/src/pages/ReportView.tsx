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

import OverviewSection from '@/components/report/OverviewSection';
import MonthlyChart from '@/components/report/MonthlyChart';
import RegularTransfers from '@/components/report/RegularTransfers';
import RepaymentTracking from '@/components/report/RepaymentTracking';
import LargeInflows from '@/components/report/LargeInflows';
import CounterpartSummary from '@/components/report/CounterpartSummary';
import ShareButton from '@/components/ShareButton';

interface ReportData {
  overview?: any;
  monthlyBreakdown?: any[];
  regularTransfers?: any[];
  repaymentTracking?: any[];
  largeInflows?: any[];
  counterpartSummary?: any[];
  allTransactions?: any[];
}

export default function ReportView() {
  const [match, params] = useRoute('/report/:reportId');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [reportTitle, setReportTitle] = useState('');

  useEffect(() => {
    if (!match || !params?.reportId) {
      setError('无效的报表ID');
      setLoading(false);
      return;
    }

    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/reports/${params.reportId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('报表不存在或已过期');
          } else {
            setError('获取报表失败，请重试');
          }
          return;
        }

        const data = await response.json();
        setReportTitle(data.title || '微信账单分析报表');
        setReportData(JSON.parse(data.data));
      } catch (err) {
        console.error('Failed to fetch report:', err);
        setError('加载报表失败，请检查网络连接');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [match, params?.reportId]);

  if (loading) {
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
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h2 className="text-lg font-semibold mb-2">加载失败</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => window.location.href = '/'}>
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">报表数据为空</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 导航栏 */}
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container flex items-center justify-between h-14">
          <h2 className="text-lg font-bold">{reportTitle}</h2>
          <div className="flex gap-2">
            <ShareButton reportData={{
              title: reportTitle,
              summary: '账单分析完成',
              regularTransfers: reportData.regularTransfers || [],
              repaymentTracking: reportData.repaymentTracking || [],
              largeInflows: reportData.largeInflows || [],
              counterpartSummary: reportData.counterpartSummary || [],
            }} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/'}
              className="gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              新建分析
            </Button>
          </div>
        </div>
      </nav>

      {/* 报表内容 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="container py-8">
          {reportData.overview && <OverviewSection stats={reportData.overview} />}
          <MonthlyChart data={reportData.monthlyBreakdown || []} />
          <RegularTransfers 
            groups={reportData.regularTransfers || []} 
            allTransactions={reportData.allTransactions || []} 
          />
          <RepaymentTracking records={reportData.repaymentTracking || []} />
          <LargeInflows inflows={reportData.largeInflows || []} />
          <CounterpartSummary 
            data={reportData.counterpartSummary || []} 
            allTransactions={reportData.allTransactions || []} 
          />
        </div>
      </motion.div>
    </div>
  );
}
