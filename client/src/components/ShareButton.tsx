import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Loader2, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

interface ShareButtonProps {
  reportRef?: React.RefObject<HTMLDivElement>;
  title?: string;
  description?: string;
}

export default function ShareButton({ 
  reportRef,
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
      // 如果提供了报表 ref，尝试生成报表截图
      if (reportRef?.current) {
        try {
          // 生成报表截图
          const canvas = await html2canvas(reportRef.current, {
            scale: 1,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
          });
          
          // 将 canvas 转换为 blob
          canvas.toBlob(async (blob) => {
            if (!blob) {
              throw new Error('Failed to generate image');
            }

            // 创建图片 URL
            const imageUrl = URL.createObjectURL(blob);
            
            // 在微信中分享
            // 由于微信的限制，我们主要通过复制到剪贴板的方式分享
            const shareText = `${title}\n${description}\n\n${window.location.href}`;
            await navigator.clipboard.writeText(shareText);
            
            toast.success('报表已复制到剪贴板，可在微信中粘贴分享');
            setShared(true);
            setTimeout(() => setShared(false), 3000);
            
            // 清理 blob URL
            URL.revokeObjectURL(imageUrl);
          });
        } catch (error) {
          console.error('Failed to generate report image:', error);
          // 降级方案：仅复制分享链接
          const shareText = `${title}\n${description}\n${window.location.href}`;
          await navigator.clipboard.writeText(shareText);
          toast.success('报表链接已复制到剪贴板');
          setShared(true);
          setTimeout(() => setShared(false), 3000);
        }
      } else {
        // 没有报表 ref，仅分享链接
        const shareText = `${title}\n${description}\n${window.location.href}`;
        await navigator.clipboard.writeText(shareText);
        toast.success('分享内容已复制到剪贴板');
        setShared(true);
        setTimeout(() => setShared(false), 3000);
      }
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
