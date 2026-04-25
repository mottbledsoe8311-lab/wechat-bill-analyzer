import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRoute } from 'wouter';

import FileUpload from '@/components/FileUpload';
import AnalysisProgress from '@/components/AnalysisProgress';
import OverviewSection from '@/components/report/OverviewSection';
import MonthlyChart from '@/components/report/MonthlyChart';
import RegularTransfers from '@/components/report/RegularTransfers';
import RepaymentTracking from '@/components/report/RepaymentTracking';
import LargeInflows from '@/components/report/LargeInflows';
import CounterpartSummary from '@/components/report/CounterpartSummary';

import { parsePDF, type ParseResult } from '@/lib/pdfParser';
import { analyzeTransactions, type AnalysisResult } from '@/lib/analyzer';
import { trpc } from '@/lib/trpc';

type AppState = 'upload' | 'analyzing' | 'report' | 'loading';

const HERO_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663413101752/gJ9cYUELDfjcatYy8Yce6Q/hero-bg-fqhFpYZYJrJZisccv6Q5DA.webp';
const UPLOAD_ILLUSTRATION = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663413101752/gJ9cYUELDfjcatYy8Yce6Q/upload-illustration-Fapr2KvCmYJqQf65NjXJvu.webp';

export default function ReportView() {
  const [, params] = useRoute('/report/:reportId');
  const reportId = params?.reportId as string | undefined;
  
  const [state, setState] = useState<AppState>(reportId ? 'loading' : 'upload');
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [progressStage, setProgressStage] = useState<'parsing' | 'analyzing' | 'done'>('parsing');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [expandedCounterpart, setExpandedCounterpart] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  
  // 加载分享的报表数据
  const { data: reportData, isLoading: isLoadingReport, error: reportError } = trpc.reports.get.useQuery(
    { reportId: reportId || '' },
    { enabled: !!reportId }
  );
  
  // 当报表数据加载完成时，设置分析结果
  useEffect(() => {
    if (reportData && reportId) {
      try {
        const data = typeof reportData.data === 'string' ? JSON.parse(reportData.data) : reportData.data;
        
        // 修复日期对象反序列化
        if (data.overview) {
          if (data.overview.largestIncomeDate && typeof data.overview.largestIncomeDate === 'string') {
            data.overview.largestIncomeDate = new Date(data.overview.largestIncomeDate);
          }
          if (data.overview.largestExpenseDate && typeof data.overview.largestExpenseDate === 'string') {
            data.overview.largestExpenseDate = new Date(data.overview.largestExpenseDate);
          }
        }
        
        // 修复monthlyBreakdown中的日期
        if (data.monthlyBreakdown && Array.isArray(data.monthlyBreakdown)) {
          data.monthlyBreakdown = data.monthlyBreakdown.map((item: any) => ({
            ...item,
            date: typeof item.date === 'string' ? new Date(item.date) : item.date
          }));
        }
        
        // 修复allTransactions中的日期
        if (data.allTransactions && Array.isArray(data.allTransactions)) {
          data.allTransactions = data.allTransactions.map((tx: any) => ({
            ...tx,
            date: typeof tx.date === 'string' ? new Date(tx.date) : tx.date
          }));
        }
        
        // 修复repaymentTracking中的日期
        if (data.repaymentTracking && Array.isArray(data.repaymentTracking)) {
          data.repaymentTracking = data.repaymentTracking.map((record: any) => ({
            ...record,
            repayments: Array.isArray(record.repayments) ? record.repayments.map((r: any) => ({
              ...r,
              date: typeof r.date === 'string' ? new Date(r.date) : r.date
            })) : []
          }));
        }
        
        // 修复largeInflows中的日期
        if (data.largeInflows && Array.isArray(data.largeInflows)) {
          data.largeInflows = data.largeInflows.map((item: any) => ({
            ...item,
            transaction: {
              ...item.transaction,
              date: typeof item.transaction?.date === 'string' ? new Date(item.transaction.date) : item.transaction?.date
            },
            relatedOutflows: Array.isArray(item.relatedOutflows) ? item.relatedOutflows.map((tx: any) => ({
              ...tx,
              date: typeof tx.date === 'string' ? new Date(tx.date) : tx.date
            })) : []
          }));
        }
        
        // 修复regularTransfers中的日期（如果有）
        if (data.regularTransfers && Array.isArray(data.regularTransfers)) {
          data.regularTransfers = data.regularTransfers.map((item: any) => ({
            ...item,
            lastDate: typeof item.lastDate === 'string' ? new Date(item.lastDate) : item.lastDate
          }));
        }
        
        setAnalysisResult(data);
        setAllTransactions(data.allTransactions || []);
        setState('report');
      } catch (error) {
        console.error('Failed to parse report data:', error);
        toast.error('报表数据解析失败');
        setState('upload');
      }
    }
  }, [reportData, reportId]);
  
  // 处理报表加载错误
  useEffect(() => {
    if (reportError && reportId) {
      console.error('Failed to load report:', reportError);
      toast.error('报表加载失败，请检查分享链接是否有效');
      setState('upload');
    }
  }, [reportError, reportId]);

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    setFiles(selectedFiles);
  }, []);

  const handleStartAnalysis = useCallback(async () => {
    if (files.length === 0) {
      toast.error('请先上传PDF文件');
      return;
    }

    setState('analyzing');
    setProgress(0);
    setProgressStage('parsing');

    try {
      let allTransactions: ParseResult['transactions'] = [];
      let accountInfo: ParseResult['accountInfo'] | null = null;
      let totalPages = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileProgress = (i / files.length) * 50;
        
        try {
          setProgressMessage(`正在解析第 ${i + 1}/${files.length} 个文件: ${file.name}`);
          
          const result = await parsePDF(file, (p, msg) => {
            const overallProgress = fileProgress + (p / 100) * (50 / files.length);
            setProgress(Math.min(overallProgress, 99));
            setProgressMessage(msg);
          });

          if (result.transactions.length === 0 && result.parseErrors.length === 0) {
            toast.warning(`${file.name} 未能提取到任何交易记录`);
          }

          allTransactions = [...allTransactions, ...result.transactions];
          totalPages += result.totalPages;
          
          if (!accountInfo && result.accountInfo.name) {
            accountInfo = result.accountInfo;
          }

          if (result.parseErrors.length > 0) {
            result.parseErrors.forEach(err => toast.warning(err));
          }
        } catch (fileError: any) {
          toast.error(`文件 ${file.name} 解析失败: ${fileError.message}`);
          console.error(`Error parsing file ${file.name}:`, fileError);
        }
      }

      const seen = new Set<string>();
      allTransactions = allTransactions.filter(tx => {
        const key = tx.orderId 
          ? tx.orderId 
          : `${tx.dateStr}-${tx.amount}-${tx.counterpart}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      allTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());

      const finalParseResult: ParseResult = {
        accountInfo: accountInfo || { name: '', idNumber: '', account: '', startDate: '', endDate: '' },
        transactions: allTransactions,
        totalPages,
        parseErrors: [],
      };
      setParseResult(finalParseResult);

      if (allTransactions.length === 0) {
        toast.error('未能从PDF中提取到交易记录，请确认文件是微信账单PDF');
        setState('upload');
        return;
      }

      toast.success(`成功提取 ${allTransactions.length} 条交易记录`);

      setProgressStage('analyzing');
      setProgress(50);

      const analysis = await analyzeTransactions(allTransactions, (p, msg) => {
        setProgress(50 + p * 0.5);
        setProgressMessage(msg);
      });

      setAnalysisResult(analysis);
      setAllTransactions(allTransactions);
      
      setProgressStage('done');
      setProgress(100);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      setState('report');
      
      setTimeout(() => {
        reportRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);

    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(`分析失败: ${error.message}`);
      setState('upload');
    }
  }, [files]);

  const handleReset = useCallback(() => {
    if (reportId) {
      // 分享链接页面，重置回主页
      window.location.href = '/';
    } else {
      // 本地分析页面，重置状态
      setState('upload');
      setFiles([]);
      setAnalysisResult(null);
      setParseResult(null);
      setAllTransactions([]);
      setProgress(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [reportId]);

  const handleViewLargeInflowDetails = useCallback((counterpart: string) => {
    setExpandedCounterpart(counterpart);
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const elementId = `counterpart-${encodeURIComponent(counterpart)}`;
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <img 
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663269350406/SXgJ57d4GB9RBvAf3PYHaj/57da3f797bc6e8316f697d6b38c89a14_c3c1d23e.webp" 
              alt="WeChat" 
              className="w-8 h-8 rounded-lg"
            />
            <span className="font-bold text-lg tracking-tight" style={{ color: '#ff8800' }}>大橙子账单分析系统</span>
          </div>
          {state === 'report' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {reportId ? '返回主页' : '重新分析'}
            </Button>
          )}
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {state === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="container py-20 flex items-center justify-center min-h-screen"
          >
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-indigo" />
              <p className="text-muted-foreground">正在加载报表...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {state === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="container py-16"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-2xl font-bold mb-2">上传账单文件</h2>
                <p className="text-muted-foreground mb-8">
                  支持微信导出的PDF格式账单，可同时上传多个文件
                </p>
                <FileUpload
                  onFilesSelected={handleFilesSelected}
                  isAnalyzing={false}
                  onStartAnalysis={handleStartAnalysis}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {state === 'analyzing' && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="container py-20"
          >
            <AnalysisProgress progress={progress} message={progressMessage} stage={progressStage} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {state === 'report' && analysisResult && (
          <motion.div
            key="report"
            ref={reportRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="container py-12 space-y-12"
          >
            {analysisResult.overview && (
              <OverviewSection stats={analysisResult.overview} />
            )}

            {analysisResult.monthlyBreakdown && analysisResult.monthlyBreakdown.length > 0 && (
              <MonthlyChart data={analysisResult.monthlyBreakdown} />
            )}

            {analysisResult.regularTransfers && analysisResult.regularTransfers.length > 0 && (
              <RegularTransfers groups={analysisResult.regularTransfers} allTransactions={allTransactions} />
            )}

            {analysisResult.repaymentTracking && analysisResult.repaymentTracking.length > 0 && (
              <RepaymentTracking records={analysisResult.repaymentTracking} />
            )}

            {analysisResult.largeInflows && analysisResult.largeInflows.length > 0 && (
              <LargeInflows inflows={analysisResult.largeInflows} allTransactions={allTransactions} onViewDetails={handleViewLargeInflowDetails} />
            )}

            {analysisResult.counterpartSummary && analysisResult.counterpartSummary.length > 0 && (
              <CounterpartSummary data={analysisResult.counterpartSummary} allTransactions={allTransactions} expandedName={expandedCounterpart} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
