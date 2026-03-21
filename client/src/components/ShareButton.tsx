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
        return;
      }

      // 调用 tRPC 创建报表
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
        // 使用后端返回的相对路径，根据当前 origin 拼接完整 URL
        const fullUrl = new URL(result.sharePath, window.location.origin).toString();
        setShareUrl(fullUrl);
        
        // 检查是否在微信中
        const isWeChat = /micromessenger/i.test(navigator.userAgent);
        
        if (isWeChat) {
          // 在微信中，显示分享对话框
          const summary = `
📊 微信账单智能分析报表

📈 规律转账识别：${reportData.regularTransfers?.length || 0} 个规律模式
💰 还款追踪：${reportData.repaymentTracking?.length || 0} 笔规律还款
🔔 大额入账：${reportData.largeInflows?.length || 0} 笔异常入账
👥 交易对方：${reportData.counterpartSummary?.length || 0} 个主要对方

点击链接查看完整报表：
${fullUrl}

使用大橙子账单分析系统生成，快来试试吧！
          `.trim();

          const copied = await copyToClipboard(summary);
          if (copied) {
            toast.success('报表链接已复制到剪贴板，可在微信中分享');
            setShared(true);
            setTimeout(() => setShared(false), 3000);
          } else {
            // 如果复制失败，显示对话框让用户手动复制
            setShowShareDialog(true);
          }
        } else {
          // 在浏览器中，尝试复制链接
          const copied = await copyToClipboard(fullUrl);
          if (copied) {
            toast.success('报表链接已复制到剪贴板');
            setShared(true);
            setTimeout(() => setShared(false), 3000);
          } else {
            // 如果复制失败，显示对话框让用户手动复制
            setShowShareDialog(true);
          }
        }
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
    } finally {
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
            已复制
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4" />
            分享报表
          </>
        )}
      </Button>

      {/* 分享对话框 - 当自动复制失败时显示 */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>分享报表</DialogTitle>
            <DialogDescription>
              复制下面的链接，在微信或其他应用中分享
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 分享链接 */}
            <div className="bg-muted p-3 rounded-lg break-all text-sm">
              {shareUrl}
            </div>

            {/* 复制按钮 */}
            <Button
              onClick={async () => {
                const copied = await copyToClipboard(shareUrl);
                if (copied) {
                  toast.success('链接已复制');
                  setShowShareDialog(false);
                } else {
                  toast.error('复制失败，请手动复制');
                }
              }}
              className="w-full gap-2"
            >
              <Copy className="w-4 h-4" />
              复制链接
            </Button>

            {/* 微信分享内容 */}
            <div className="border-t pt-4">
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
                variant="outline"
                className="w-full gap-2 mt-2"
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
