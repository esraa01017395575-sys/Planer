import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { motion } from 'framer-motion';
import { Heart, Search, Star, Trash2, Plus, MessageSquare } from 'lucide-react';

export const Favorites = ({ favorites: propsFavorites, onAskAI: propsOnAskAI, onRemove: propsOnRemove }: { favorites?: any[], onAskAI?: (content: string) => void, onRemove?: (id: string) => void }) => {
  const { t, language } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<any[]>(propsFavorites || []);
  const onAskAI = propsOnAskAI || ((content: string) => console.log('Ask AI:', content));
  const onRemove = propsOnRemove || ((id: string) => console.log('Remove favorite:', id));

  const filteredFavorites = favorites.filter(f => 
    f.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold text-text-primary">{t('favorites')}</h1>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input 
              type="text" 
              placeholder={t('search_favorites')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-secondary border border-border rounded-xl py-3 pl-12 pr-4 text-sm text-text-primary focus:outline-none focus:border-accent/50 transition-all"
            />
          </div>
          <button className="px-6 py-3 bg-accent text-white font-bold text-sm rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-accent/20 flex items-center gap-2">
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
            className="glass-card p-6 space-y-4 hover:border-accent/30 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Heart className="w-12 h-12 text-accent fill-current" />
            </div>

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Heart className="w-4 h-4 text-accent fill-current" />
                </div>
                <h3 className="font-bold text-text-primary text-lg group-hover:text-accent transition-colors">{fav.title}</h3>
              </div>
              <span className="text-[10px] font-bold text-accent uppercase tracking-widest bg-accent/10 px-2 py-0.5 rounded-md">
                [{fav.source_type || 'manual'}]
              </span>
            </div>

            <p className="text-sm text-text-secondary line-clamp-4 leading-relaxed">
              {fav.content}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                {new Date(fav.created_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' })}
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onAskAI(`I want to revisit this memory: ${fav.title}`)}
                  className="p-2 text-text-secondary hover:text-accent transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest"
                >
                  <MessageSquare className="w-4 h-4" />
                  {t('send_to_ai')}
                </button>
                <button 
                  onClick={() => onRemove(fav.id)}
                  className="p-2 text-text-secondary hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
