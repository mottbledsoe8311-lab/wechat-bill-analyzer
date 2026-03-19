import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Upload, Send, Loader2 } from 'lucide-react';

export default function FeedbackForm() {
  const [text, setText] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      toast.warning('只支持上传图片文件');
    }
    
    setImages(prev => [...prev, ...imageFiles]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!text.trim() && images.length === 0) {
      toast.error('请输入反馈内容或上传图片');
      return;
    }

    setIsSubmitting(true);
    try {
      // 这里可以调用后端API提交反馈
      // 暂时只显示成功提示
      toast.success('感谢您的反馈！我们会尽快查看');
      setText('');
      setImages([]);
    } catch (error) {
      toast.error('提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 文本输入框 */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="请输入您的建议或反馈..."
        className="w-full p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo/50 resize-none"
        rows={4}
      />

      {/* 图片预览 */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={URL.createObjectURL(image)}
                alt={`preview-${index}`}
                className="w-full h-24 object-cover rounded border border-border"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="gap-2"
        >
          <Upload className="w-4 h-4" />
          上传图片
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || (!text.trim() && images.length === 0)}
          className="gap-2 flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              提交中...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              提交反馈
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
