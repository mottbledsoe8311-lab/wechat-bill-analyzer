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

interface ShareButtonProps {
  reportData?: {
    title: string;
    summary?: string;
    overview?: any;
    monthlyBreakdown?: any[];
    regularTransfers?: any[];
    repaymentTracking?: any[];
    largeInflows?: any[];
    counterpartSummary?: any[];
    allTransactions?: any[];
  };
}

export default function ShareButton({ reportData }: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const createReportMutation = trpc.reports.create.useMutation();

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
    try {
      if (!reportData) {
        toast.error('报表数据不可用');
        setIsSharing(false);
        return;
      }

      // 优化：立即生成临时 URL 并显示对话框（不等待数据库）
      // 使用时间戳和随机数生成唯一的临时 reportId
      const tempReportId = 'temp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      const tempUrl = new URL(`/report/${tempReportId}`, window.location.origin).toString();
      setShareUrl(tempUrl);
      
      // 立即显示分享对话框，让用户可以立即分享
      setShowShareDialog(true);
      setIsSharing(false);
      setShared(true);
      setTimeout(() => setShared(false), 3000);
      
      // 后台异步保存数据库（不阻塞 UI）
      // 使用 fire-and-forget 模式
      createReportMutation.mutateAsync({
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
      }).catch(err => {
        console.error('后台保存报表失败:', err);
        // 静默失败，不打扰用户，因为用户已经获得了分享链接
        toast.error('报表保存失败，分享链接可能无法访问');
      });
    } catch (error: any) {
      console.error('Share error:', error);
      const errorMessage = error?.message || '生成分享链接失败，请重试';
      console.error('Share error details:', {
        message: errorMessage,
        code: error?.code,
        data: error?.data,
      });
      toast.error(errorMessage);
      setIsSharing(false);
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

      {/* 分享对话框 */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>分享报表</DialogTitle>
            <DialogDescription>
              复制下面的内容，在微信或其他应用中分享
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 微信分享内容 */}
            <div>
              <p className="text-sm font-semibold mb-2">微信分享内容（可选）：</p>
              <div className="bg-muted p-3 rounded-lg text-sm whitespace-pre-wrap break-words">
{`📊 微信账单智能分析报表

📈 规律转账识别：${reportData?.regularTransfers?.length || 0} 个规律模式
💰 还款追踪：${reportData?.repaymentTracking?.length || 0} 笔规律还款
🔔 大额入账：${reportData?.largeInflows?.length || 0} 笔异常入账
👥 交易对方：${reportData?.counterpartSummary?.length || 0} 个主要对方

点击链接查看完整报表：
${shareUrl}

使用大橙子账单分析系统生成，快来试试吧！`}
              </div>
              <Button
                onClick={async () => {
                  const content = `📊 微信账单智能分析报表

📈 规律转账识别：${reportData?.regularTransfers?.length || 0} 个规律模式
💰 还款追踪：${reportData?.repaymentTracking?.length || 0} 笔规律还款
🔔 大额入账：${reportData?.largeInflows?.length || 0} 笔异常入账
👥 交易对方：${reportData?.counterpartSummary?.length || 0} 个主要对方

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
