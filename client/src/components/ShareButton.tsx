import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonProps {
  reportData?: {
    title: string;
    summary: string;
    regularTransfers: any[];
    repaymentTracking: any[];
    largeInflows: any[];
    counterpartSummary: any[];
  };
}

export default function ShareButton({ reportData }: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [shared, setShared] = useState(false);

  const handleShare = async () => {
    // 检查是否在微信中
    const isWeChat = /micromessenger/i.test(navigator.userAgent);
    
    if (!isWeChat) {
      toast.error('请在微信中打开此链接进行分享');
      return;
    }

    setIsSharing(true);
    try {
      if (!reportData) {
        toast.error('报表数据不可用');
        return;
      }

      // 生成报表摘要
      const summary = `
📊 微信账单智能分析报表

📈 规律转账识别：${reportData.regularTransfers?.length || 0} 个规律模式
💰 还款追踪：${reportData.repaymentTracking?.length || 0} 笔规律还款
🔔 大额入账：${reportData.largeInflows?.length || 0} 笔异常入账
👥 交易对方：${reportData.counterpartSummary?.length || 0} 个主要对方

使用大橙子账单分析系统生成，快来试试吧！
${window.location.href}
      `.trim();

      // 复制到剪贴板
      await navigator.clipboard.writeText(summary);
      toast.success('报表已复制到剪贴板，可在微信中粘贴分享');
      setShared(true);
      setTimeout(() => setShared(false), 3000);
    } catch (error: any) {
      console.error('Share error:', error);
      toast.error('分享失败，请重试');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Button
      onClick={handleShare}
      disabled={isSharing || shared}
      className="gap-2"
      size="sm"
    >
      {isSharing ? (
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
