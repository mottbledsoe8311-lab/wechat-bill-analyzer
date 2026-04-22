import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Loader2, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface ShareButtonProps {
  reportId?: string;
  reportData?: {
    title?: string;
    summary?: string;
    overview?: any;
    monthlyBreakdown?: any[];
    regularTransfers?: any[];
    repaymentTracking?: any[];
    largeInflows?: any[];
    counterpartSummary?: any[];
    allTransactions?: any[];
  };
  customerName?: string;
}

export default function ShareButton({ reportData, customerName }: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [progress, setProgress] = useState(0);
  const createReportMutation = trpc.reports.create.useMutation();
  const recordShareMutation = trpc.stats.recordShare.useMutation();

  const copyToClipboard = async (text: string) => {
    try {
      // 尝试使用现代 Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (err) {
      console.warn('Clipboard API failed:', err);
    }

    // 回退方案：使用传统方法
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch (err) {
      console.error('Fallback copy failed:', err);
      return false;
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    setProgress(0);
    
    // 模拟进度更新
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev < 90) {
          return prev + Math.random() * 30;
        }
        return prev;
      });
    }, 300);
    
    try {
      if (!reportData) {
        toast.error('报表数据不可用');
        setIsSharing(false);
        clearInterval(progressInterval);
        return;
      }

      // 调用 tRPC 创建报表并获取真实 reportId
      const result = await createReportMutation.mutateAsync({
        title: reportData.title || '微信账单分析报表',
        data: {
          overview: reportData.overview,
          monthlyBreakdown: reportData.monthlyBreakdown || [],
          regularTransfers: reportData.regularTransfers || [],
          repaymentTracking: reportData.repaymentTracking || [],
          largeInflows: reportData.largeInflows || [],
          counterpartSummary: reportData.counterpartSummary || [],
        },
        allTransactions: reportData.allTransactions || [],
      });

      if (result.sharePath) {
        // 使用后端返回的真实 sharePath
        const fullUrl = new URL(result.sharePath, window.location.origin).toString();
        setShareUrl(fullUrl);
        
        // 完成进度
        clearInterval(progressInterval);
        setProgress(100);
        
        // 记录分享次数
        recordShareMutation.mutate();
        // 显示分享对话框
        setShowShareDialog(true);
        setShared(true);
        setTimeout(() => setShared(false), 3000);
      }
    } catch (error: any) {
      console.error('Share error:', error);
      const errorMessage = error?.message || '生成分享链接失败，请重试';
      console.error('Share error details:', {
        message: errorMessage,
        code: error?.code,
        data: error?.data,
      });
      toast.error(errorMessage);
      clearInterval(progressInterval);
    } finally {
      setIsSharing(false);
      setProgress(0);
    }
  };

  return (
    <>
      <Button
        onClick={handleShare}
        disabled={isSharing || shared || createReportMutation.isPending}
        className="gap-2"
        size="sm"
      >
        {isSharing || createReportMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            生成中...
          </>
        ) : shared ? (
          <>
            <Check className="w-4 h-4" />
            已生成
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4" />
            分享报表
          </>
        )}
      </Button>

      {/* 进度对话框 */}
      {isSharing && (
        <Dialog open={isSharing}>
          <DialogContent className="max-w-sm" showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>生成分享链接中...</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Progress value={Math.min(progress, 100)} className="w-full" />
              <p className="text-center text-sm text-muted-foreground">
                {Math.min(Math.round(progress), 100)}%
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 分享对话框 */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>分享报表</DialogTitle>
            <DialogDescription>
              复制下面的内容，在微信或其他应用中分享
              <div className="text-xs text-muted-foreground mt-2">
                有效期: 48 小时
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 微信分享内容 */}
            <div>
              <p className="text-sm font-semibold mb-2">微信分享内容（可选）：</p>
              <div className="bg-muted p-3 rounded-lg text-sm whitespace-pre-wrap break-words">
{`📄 （${reportData?.overview?.accountName ? reportData.overview.accountName : customerName ? customerName : '账户'}）账单分析报表

📈 规律转账：${reportData?.regularTransfers?.length || 0}个重点核实对象
💰 转账追踪：${reportData?.repaymentTracking?.length || 0}笔规律还款追踪
🗒 大额入账：${reportData?.largeInflows?.length || 0}笔异常入账
👥 交易对方：${reportData?.counterpartSummary?.length || 0}个主要对方

点击链接查看完整报表：
${shareUrl}

使用大橙子账单分析系统生成，快来试试吧！`}
              </div>
              <Button
                onClick={async () => {
                  const content = `📄 （${reportData?.overview?.accountName ? reportData.overview.accountName : customerName ? customerName : '账户'}）账单分析报表

📈 规律转账：${reportData?.regularTransfers?.length || 0}个重点核实对象
💰 转账追踪：${reportData?.repaymentTracking?.length || 0}笔规律还款追踪
🗒 大额入账：${reportData?.largeInflows?.length || 0}笔异常入账
👥 交易对方：${reportData?.counterpartSummary?.length || 0}个主要对方

点击链接查看完整报表：
${shareUrl}

使用大橙子账单分析系统生成，快来试试吧！`;
                  const copied = await copyToClipboard(content);
                  if (copied) {
                    toast.success('分享内容已复制');
                    setShowShareDialog(false);
                  } else {
                    toast.error('复制失败，请手动复制');
                  }
                }}
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Copy className="w-4 h-4" />
                复制分享内容
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
