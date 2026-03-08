/**
 * 分析进度展示组件
 * 设计：极简数据叙事 - 安静而精确的进度反馈
 */

import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

interface AnalysisProgressProps {
  progress: number;
  message: string;
  stage: 'parsing' | 'analyzing' | 'done';
}

export default function AnalysisProgress({ progress, message, stage }: AnalysisProgressProps) {
  const stageLabels = {
    parsing: 'PDF解析',
    analyzing: '智能分析',
    done: '完成',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto py-16"
    >
      <div className="space-y-8">
        {/* 阶段指示器 */}
        <div className="flex items-center justify-center gap-8">
          {(['parsing', 'analyzing', 'done'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-500
                ${stage === s 
                  ? 'bg-indigo text-white scale-110' 
                  : s === 'done' && stage !== 'done'
                    ? 'bg-muted text-muted-foreground'
                    : stage === 'done' || (stage === 'analyzing' && s === 'parsing')
                      ? 'bg-emerald-ok text-white'
                      : 'bg-muted text-muted-foreground'
                }
              `}>
                {(stage === 'done' || (stage === 'analyzing' && s === 'parsing')) && s !== stage ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-sm font-medium ${stage === s ? 'text-foreground' : 'text-muted-foreground'}`}>
                {stageLabels[s]}
              </span>
              {i < 2 && (
                <div className={`w-12 h-px ${
                  (stage === 'analyzing' && i === 0) || stage === 'done' 
                    ? 'bg-emerald-ok' 
                    : 'bg-border'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* 进度条 */}
        <div className="space-y-3">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{message}</p>
            <span className="text-sm font-medium tabular-nums text-indigo">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* 动画点 */}
        {stage !== 'done' && (
          <div className="flex justify-center gap-1.5">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-indigo/40"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
