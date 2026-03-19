/**
 * 首页 - 微信账单智能分析系统
 * 
 * 设计哲学：极简数据叙事 (Minimal Data Narrative)
 * - 瑞士国际主义设计 + 数据新闻叙事
 * - 留白即力量，叙事驱动，克制的色彩
 * - DM Sans + Noto Sans SC 字体组合
 * - 深靛蓝(#312e81)主色调，琥珀色警告，深翠绿正常
 */

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { RotateCcw, Shield, Zap, Eye, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

import FileUpload from '@/components/FileUpload';
import AnalysisProgress from '@/components/AnalysisProgress';
import FeedbackForm from '@/components/FeedbackForm';
import ShareButton from '@/components/ShareButton';
import OverviewSection from '@/components/report/OverviewSection';
import MonthlyChart from '@/components/report/MonthlyChart';
import RegularTransfers from '@/components/report/RegularTransfers';
import RepaymentTracking from '@/components/report/RepaymentTracking';
import LargeInflows from '@/components/report/LargeInflows';
import CounterpartSummary from '@/components/report/CounterpartSummary';

import { parsePDF, type ParseResult } from '@/lib/pdfParser';
import { analyzeTransactions, type AnalysisResult } from '@/lib/analyzer';

type AppState = 'upload' | 'analyzing' | 'report';

const HERO_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663413101752/gJ9cYUELDfjcatYy8Yce6Q/hero-bg-fqhFpYZYJrJZisccv6Q5DA.webp';
const UPLOAD_ILLUSTRATION = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663413101752/gJ9cYUELDfjcatYy8Yce6Q/upload-illustration-Fapr2KvCmYJqQf65NjXJvu.webp';
const WECHAT_MINI_QR = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663269350406/SXgJ57d4GB9RBvAf3PYHaj/Screenshot_20260316_121241_com_android_chrome_CustomTabActivity_edit_205135733414453_582afb3c.jpg';
const SPONSOR_QR = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663269350406/SXgJ57d4GB9RBvAf3PYHaj/mm_facetoface_collect_qrcode_1773241754726_edit_1188154995462534_feeb1fad.png';

export default function Home() {
  const [state, setState] = useState<AppState>('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [progressStage, setProgressStage] = useState<'parsing' | 'analyzing' | 'done'>('parsing');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const reportRef = useRef<HTMLDivElement>(null);
  const reportContentRef = useRef<HTMLDivElement>(null);

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
      // 阶段1：解析PDF
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
            setProgress(Math.min(overallProgress, 99)); // 防止进度条卡在某个位置
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

      // 去重
      const seen = new Set<string>();
      allTransactions = allTransactions.filter(tx => {
        const key = tx.orderId 
          ? tx.orderId 
          : `${tx.dateStr}-${tx.amount}-${tx.counterpart}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // 按日期排序（由近到远）
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

      // 阶段2：智能分析
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
      
      // 短暂延迟后切换到报表
      await new Promise(resolve => setTimeout(resolve, 800));
      setState('report');
      
      // 滚动到报表区域
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
    setState('upload');
    setFiles([]);
    setAnalysisResult(null);
    setParseResult(null);
    setAllTransactions([]);
    setProgress(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* 导航栏 */}
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
              重新分析
            </Button>
          )}
        </div>
      </nav>

      {/* 上传页面 */}
      <AnimatePresence mode="wait">
        {state === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {/* Hero区域 */}
            <section className="relative overflow-hidden">
              <div 
                className="absolute inset-0 opacity-[0.08]"
                style={{
                  backgroundImage: `url(${HERO_BG})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              <div className="container relative py-20 md:py-28">
                <div className="max-w-3xl">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                  >
                    <p className="text-sm font-semibold tracking-widest uppercase text-indigo mb-4">
                      Orange Bill Analyzer
                    </p>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1] tracking-tight">
                      微信流水账单
                      <br />
                      <span className="text-indigo">智能分析系统</span>
                    </h1>
                    <p className="text-lg text-muted-foreground mt-6 max-w-xl leading-relaxed">
                      上传微信账单PDF，自动识别规律转账、追踪转账来源、
                      监控大额入账、排查转账行为，生成专业分析报表。
                    </p>
                  </motion.div>

                  {/* 特性标签 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex flex-wrap gap-4 mt-8"
                  >
                    {[
                      { icon: Shield, text: '数据不上传服务器' },
                      { icon: Zap, text: '浏览器本地分析' },
                      { icon: Eye, text: '无需登录注册' },
                      { icon: Eye, text: '每日更新升级' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                        <item.icon className="w-3.5 h-3.5 text-indigo" />
                        {item.text}
                      </div>
                    ))}
                  </motion.div>
                </div>

                {/* 滚动提示 */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2"
                >
                  <motion.div
                    animate={{ y: [0, 6, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <ChevronDown className="w-5 h-5 text-muted-foreground/50" />
                  </motion.div>
                </motion.div>
              </div>
            </section>

            {/* 上传区域 */}
            <section className="container py-16">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-2xl font-bold mb-2">上传账单文件</h2>
                  <p className="text-muted-foreground mb-8">
                    支持微信导出的PDF格式账单，可同时上传多个文件，支持12个月数据分析
                  </p>
                  <FileUpload
                    onFilesSelected={handleFilesSelected}
                    isAnalyzing={false}
                    onStartAnalysis={handleStartAnalysis}
                  />
                </div>
                <div className="hidden lg:flex justify-center">
                  <motion.img
                    src={UPLOAD_ILLUSTRATION}
                    alt="文档分析"
                    className="w-80 h-80 object-contain opacity-80"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 0.8, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  />
                </div>
              </div>
            </section>

            {/* 功能说明 */}
            <section className="container py-16 border-t border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  {
                    title: '如何使用',
                    desc: '安卓用户，直接点击上传页面后，选择WPS应用，从应用中选择对应的PDF文件\n\n苹果用户，需要先在WPS应用中，另存PDF文件到本机任意文件，然后打开网站点击上传',
                    color: 'bg-indigo/10 text-indigo',
                  },
                  {
                    title: '其它版本',
                    desc: '微信小程序已上架，扫码使用（目前为测试版，正在优化中）\n\n功能特性：\n• 支持离线分析\n• 实时数据更新\n• 一键分享报表\n• 数据云端备份',
                    color: 'bg-emerald-ok/10 text-emerald-ok',
                    image: WECHAT_MINI_QR,
                  },
                  {
                    title: '功能更新与建议',
                    desc: '在这里开发一个文本输入框，可以上传文字和图片，完成后有提交按钮，提交后在APP中通知我',
                    color: 'bg-amber-warn/10 text-amber-warn',
                  },
                  {
                    title: '支持开发者（感谢赞助）',
                    desc: '',
                    color: 'bg-destructive/10 text-destructive',
                    image: SPONSOR_QR,
                  },
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i + 0.5 }}
                    className="space-y-3"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${feature.color}`}>
                      <span className="text-lg font-bold">{i + 1}</span>
                    </div>
                    <h3 className="font-semibold text-lg">{feature.title}</h3>
                    {i === 2 ? (
                      <FeedbackForm />
                    ) : feature.image ? (
                      <div className="flex justify-center">
                        <img src={feature.image} alt={feature.title} className="w-32 h-32 object-contain rounded" />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{feature.desc}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </section>



            {/* 底部 */}
            <footer className="container py-8 border-t border-border">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
                <p>所有数据仅在您的浏览器中处理，不会上传至任何服务器</p>
              </div>
            </footer>
          </motion.div>
        )}

        {/* 分析进度 */}
        {state === 'analyzing' && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AnalysisProgress 
              progress={progress} 
              message={progressMessage}
              stage={progressStage}
            />
          </motion.div>
        )}

        {/* 报表页面 */}
        {state === 'report' && analysisResult && parseResult && (
          <motion.div
            key="report"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            ref={reportRef}
          >
            <div className="min-h-screen bg-background">
              {/* 报表导航栏 */}
              <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
                <div className="container flex items-center justify-between h-14">
                  <h2 className="text-lg font-bold">账单分析报表</h2>
                  <div className="flex gap-2">
                    <ShareButton reportRef={reportContentRef} />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                      className="gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      重新分析
                    </Button>
                  </div>
                </div>
              </nav>
              {/* 报表内容 */}
              <div className="container" ref={reportContentRef}>
                {analysisResult && <OverviewSection stats={analysisResult.overview} />}
                <MonthlyChart data={analysisResult?.monthlyBreakdown || []} />
                <RegularTransfers groups={analysisResult?.regularTransfers || []} allTransactions={allTransactions} />
                <RepaymentTracking records={analysisResult?.repaymentTracking || []} />
                <LargeInflows inflows={analysisResult?.largeInflows || []} />
                <CounterpartSummary data={analysisResult?.counterpartSummary || []} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
