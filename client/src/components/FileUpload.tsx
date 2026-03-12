/**
 * 文件上传组件
 * 设计：极简数据叙事 - 大面积留白，精准的交互反馈
 * 改进：开始分析按钮始终显示，未上传文件时显示禁用状态
 */

import { useCallback, useState } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  isAnalyzing: boolean;
  onStartAnalysis: () => void;
}

export default function FileUpload({ onFilesSelected, isAnalyzing, onStartAnalysis }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFiles = useCallback((fileList: FileList | File[]) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(fileList).forEach(file => {
      const fileName = file.name.toLowerCase();
      const isPDF = file.type === 'application/pdf' || fileName.endsWith('.pdf');
      const isWPS = fileName.endsWith('.wps') || fileName.endsWith('.wpt');
      
      if (!isPDF && !isWPS) {
        errors.push(`${file.name} 不是PDF或WPS文件`);
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        errors.push(`${file.name} 超过100MB限制`);
        return;
      }
      validFiles.push(file);
    });

    if (errors.length > 0) {
      setError(errors.join('；'));
    } else {
      setError(null);
    }

    return validFiles;
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const validFiles = validateFiles(e.dataTransfer.files);
    if (validFiles.length > 0) {
      const newFiles = [...files, ...validFiles];
      setFiles(newFiles);
      onFilesSelected(newFiles);
    }
  }, [files, onFilesSelected, validateFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const validFiles = validateFiles(e.target.files);
      if (validFiles.length > 0) {
        const newFiles = [...files, ...validFiles];
        setFiles(newFiles);
        onFilesSelected(newFiles);
      }
    }
    e.target.value = '';
  }, [files, onFilesSelected, validateFiles]);

  const removeFile = useCallback((index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesSelected(newFiles);
    setError(null);
  }, [files, onFilesSelected]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full">
      {/* 拖拽上传区域 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300
            ${isDragging 
              ? 'border-indigo bg-indigo/5 scale-[1.02]' 
              : 'border-border hover:border-indigo/40 hover:bg-muted/30'
            }
            ${isAnalyzing ? 'pointer-events-none opacity-60' : ''}
          `}
        >
          <input
            type="file"
            accept=".pdf,application/pdf,.wps,.wpt"
            multiple
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isAnalyzing}
          />
          
          <div className="flex flex-col items-center gap-4">
            <div className={`
              w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-300
              ${isDragging ? 'bg-indigo/10' : 'bg-muted'}
            `}>
              <Upload className={`w-7 h-7 ${isDragging ? 'text-indigo' : 'text-muted-foreground'}`} />
            </div>
            
            <div>
              <p className="text-lg font-medium text-foreground">
                拖拽微信账单PDF到此处
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                或点击选择文件 · 支持多文件上传 · 支持PDF和WPS格式
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 错误提示 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 flex items-start gap-2 text-sm text-amber-warn bg-amber-warn/5 border border-amber-warn/20 rounded-md px-4 py-3"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 已选文件列表 */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 space-y-2"
          >
            {files.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between bg-muted/40 rounded-md px-4 py-3 group"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-indigo" />
                  <div>
                    <p className="text-sm font-medium text-foreground truncate max-w-[300px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                {!isAnalyzing && (
                  <button
                    onClick={() => removeFile(index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-background rounded"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 开始分析按钮 - 始终显示，未上传文件时禁用 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-6 pt-6 border-t border-border space-y-3"
      >
        <Button
          onClick={onStartAnalysis}
          disabled={isAnalyzing || files.length === 0}
          className="w-full h-14 text-base font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-all active:scale-95 shadow-lg hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
              正在分析中...
            </span>
          ) : files.length > 0 ? (
            `开始分析 ${files.length} 个文件`
          ) : (
            '请先上传微信账单PDF'
          )}
        </Button>
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          数据仅在您的浏览器中处理，不会上传至任何服务器
        </p>
      </motion.div>
    </div>
  );
}
