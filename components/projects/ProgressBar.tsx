import React from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';

interface ProgressBarProps {
  progress: number;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  size = 'md', 
  showText = true 
}) => {
  const { language } = useAppContext();
  const isAr = language === 'ar';
  const roundedProgress = Math.min(100, Math.max(0, Math.round(progress)));
  
  const heightClass = {
    sm: 'h-1.5',
    md: 'h-3',
    lg: 'h-5'
  }[size];

  return (
    <div className="w-full">
      {showText && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-mono text-text-secondary">
          <span>{isAr ? "التقدم" : "Progress"}</span>
          <span className="font-bold text-accent">{roundedProgress}%</span>
        </div>
      )}
      <div className={`w-full bg-bg-secondary rounded-full overflow-hidden ${heightClass} border border-border/10 p-0.5`}>
        <motion.div 
          className="h-full rounded-full bg-gradient-to-r from-accent to-indigo-500 shadow-lg shadow-accent/25"
          initial={{ width: 0 }}
          animate={{ width: `${roundedProgress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};
