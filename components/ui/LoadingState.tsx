import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';

export const LoadingState: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-6">
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-full border-4 border-accent/20 border-t-accent"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-accent animate-pulse" />
        </div>
      </div>
      <div className="text-center">
        <h3 className="text-xl font-bold text-text-primary mb-2 font-display">{message}</h3>
        <p className="text-sm text-text-secondary animate-pulse">Designing your day...</p>
      </div>
    </div>
  );
};

export const SkeletonCard: React.FC = () => {
  return (
    <div className="glass-card p-6 space-y-4 animate-pulse">
      <div className="h-4 bg-bg-secondary rounded w-1/4" />
      <div className="space-y-2">
        <div className="h-10 bg-bg-secondary rounded" />
        <div className="h-10 bg-bg-secondary rounded w-5/6" />
      </div>
    </div>
  );
};
