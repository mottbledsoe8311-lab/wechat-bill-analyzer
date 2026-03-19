import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

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
  const createReportMutation = trpc.reports.create.useMutation();

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

      if (result.shareUrl) {
        // 生成完整的分享链接
        const shareUrl = `${window.location.origin}${result.shareUrl}`;
        
        // 检查是否在微信中
        const isWeChat = /micromessenger/i.test(navigator.userAgent);
        
        if (isWeChat) {
          // 在微信中，复制链接到剪贴板
          const summary = `
📊 微信账单智能分析报表

📈 规律转账识别：${reportData.regularTransfers?.length || 0} 个规律模式
💰 还款追踪：${reportData.repaymentTracking?.length || 0} 笔规律还款
🔔 大额入账：${reportData.largeInflows?.length || 0} 笔异常入账
👥 交易对方：${reportData.counterpartSummary?.length || 0} 个主要对方

点击链接查看完整报表：
${shareUrl}

使用大橙子账单分析系统生成，快来试试吧！
          `.trim();

          await navigator.clipboard.writeText(summary);
          toast.success('报表链接已复制到剪贴板，可在微信中分享');
        } else {
          // 在浏览器中，复制链接
          await navigator.clipboard.writeText(shareUrl);
          toast.success('报表链接已复制到剪贴板');
        }

        setShared(true);
        setTimeout(() => setShared(false), 3000);
      }
    } catch (error: any) {
      console.error('Share error:', error);
      toast.error('生成分享链接失败，请重试');
    } finally {
      setIsSharing(false);
    }
  };

  return (
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
  );
}
