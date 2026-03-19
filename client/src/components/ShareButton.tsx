import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonProps {
  title?: string;
  description?: string;
}

export default function ShareButton({ 
  title = '微信账单智能分析报表',
  description = '我用大橙子账单分析系统生成了我的微信账单分析报表，快来试试吧！'
}: ShareButtonProps) {
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
      // 检查是否支持 Web Share API
      if (navigator.share) {
        await navigator.share({
          title,
          text: description,
          url: window.location.href,
        });
        setShared(true);
        toast.success('分享成功！');
        setTimeout(() => setShared(false), 2000);
      } else {
        // 降级方案：复制分享链接到剪贴板
        const shareText = `${title}\n${description}\n${window.location.href}`;
        await navigator.clipboard.writeText(shareText);
        toast.success('分享链接已复制到剪贴板');
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast.error('分享失败，请重试');
      }
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
          分享中...
        </>
      ) : shared ? (
        <>
          <Check className="w-4 h-4" />
          已分享
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          分享给微信好友
        </>
      )}
    </Button>
  );
}
