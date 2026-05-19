import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Search, Star, Trash2, Plus, MessageSquare, Loader2, X, Save } from 'lucide-react';
import { useLocation } from 'wouter';

import { useGetFavorites, useToggleFavorite, useUpdateFavorite, useDeleteFavorite } from '../lib/hooks';

export const Favorites = () => {
  const { t, language, addNotification } = useAppContext();
  const { data: favoritesData, loading: isLoading, refetch } = useGetFavorites();
  const { toggleFavorite } = useToggleFavorite();
  const { mutate: updateFavorite } = useUpdateFavorite();
  const { mutate: deleteFavorite } = useDeleteFavorite();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useLocation();

  // Handle "Write Memory" popup
  const searchParams = new URLSearchParams(window.location.search);
  const memoryFor = searchParams.get('memory_for');
  const sourceId = searchParams.get('source_id');
  
  const [memoryText, setMemoryText] = useState('');
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);

  useEffect(() => {
    if (memoryFor && sourceId) {
      setIsMemoryModalOpen(true);
    }
  }, [memoryFor, sourceId]);

  const handleSaveMemory = async () => {
    const favorite = favoritesData.find(f => f.source_id === sourceId || f.title === memoryFor);
    if (favorite) {
      await updateFavorite(favorite.id, { content: memoryText });
      addNotification("Memory saved!", "success");
      setIsMemoryModalOpen(false);
      setMemoryText('');
      setLocation('/favorites', { replace: true });
      refetch();
    }
  };

  const filteredFavorites = (favoritesData || []).filter(f => 
    f.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (f.content || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRemove = async (id: string) => {
    if (confirm(t('confirm_delete_note'))) {
      await deleteFavorite(id);
      addNotification(t('favorite_removed'), 'info');
      refetch();
    }
  };

  const handleAskAI = (title: string) => {
    setLocation(`/chat?prompt=${encodeURIComponent(`I want to revisit this favorite item: ${title}`)}`);
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold text-text-primary">{t('favorites')}</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 flex-1">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input 
              type="text" 
              placeholder={t('search_favorites')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-secondary border border-border rounded-xl py-3 pl-12 pr-4 text-sm text-text-primary focus:outline-none focus:border-accent/50 transition-all font-medium"
            />
          </div>
          <button className="px-6 py-3 bg-bg-secondary text-text-primary border border-border font-bold text-sm rounded-xl hover:bg-accent hover:text-white hover:border-accent transition-all flex items-center gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            {t('add_manually')}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFavorites.map((fav) => (
          <motion.div
            key={fav.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 space-y-4 hover:border-accent/30 transition-all group relative overflow-hidden flex flex-col"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Heart className="w-4 h-4 text-accent fill-current" />
                </div>
                <h3 className="font-bold text-text-primary text-lg group-hover:text-accent transition-colors">
                  {fav.title}
                </h3>
              </div>
              <span className="text-[8px] font-black tracking-widest text-accent bg-accent/10 px-2 py-0.5 rounded uppercase">
                {fav.source_type || 'manual'}
              </span>
            </div>

            <p className="text-sm text-text-secondary leading-relaxed opacity-80 flex-1 whitespace-pre-wrap">
              {fav.content}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-60">
                {new Date(fav.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleAskAI(fav.title)}
                  className="px-3 py-1.5 bg-bg-secondary text-text-secondary hover:text-accent hover:bg-accent/10 rounded-lg transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border border-border/50"
                >
                  <Star className="w-3 h-3" />
                  {t('send_to_ai')}
                </button>
                <button 
                  onClick={() => handleRemove(fav.id)}
                  className="p-1.5 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-border/50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isMemoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMemoryModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-bg-primary rounded-3xl shadow-2xl p-8 space-y-6 border border-border"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-xl">
                    <Star className="w-6 h-6 text-amber-500 fill-current" />
                  </div>
                  <h2 className="text-2xl font-bold text-text-primary">Write your Memory</h2>
                </div>
                <button onClick={() => setIsMemoryModalOpen(false)} className="p-2 hover:bg-bg-secondary rounded-xl transition-colors">
                  <X className="w-6 h-6 text-text-secondary" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-text-secondary">
                  How was your experience with <span className="text-accent font-bold">"{memoryFor}"</span>?
                </p>
                <textarea
                  autoFocus
                  placeholder="Tell me about this achievement or memory..."
                  value={memoryText}
                  onChange={(e) => setMemoryText(e.target.value)}
                  className="w-full h-40 bg-bg-secondary border border-border rounded-2xl p-4 text-text-primary focus:outline-none focus:border-accent transition-all resize-none shadow-inner"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setIsMemoryModalOpen(false)}
                  className="flex-1 px-6 py-4 rounded-2xl font-bold text-text-secondary bg-bg-secondary hover:bg-bg-secondary/80 transition-all border border-border"
                >
                  Skip for now
                </button>
                <button
                  onClick={handleSaveMemory}
                  disabled={!memoryText.trim()}
                  className="flex-[2] bg-accent text-white py-4 rounded-2xl font-bold shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  Save Memory
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
