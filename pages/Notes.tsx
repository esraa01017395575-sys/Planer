import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useGetNotes, useCreateNote, useUpdateNote, useDeleteNote } from '../lib/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Grid, List, Star, MoreVertical, StickyNote, FolderPlus, Trash2, X, Loader2 } from 'lucide-react';

export const Notes = ({ onStarNote: propsOnStarNote }: { onStarNote?: (note: any) => void }) => {
  const { t, language, addNotification } = useAppContext();
  const { data: notesData, loading: isLoading, refetch } = useGetNotes();
  const { mutate: createNote, isPending: isCreating } = useCreateNote();
  const { mutate: updateNote } = useUpdateNote();
  const { mutate: deleteNote } = useDeleteNote();

  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [activeSection, setActiveSection] = useState('All Notes');
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const onStarNote = propsOnStarNote || ((note: any) => {
    updateNote({ id: note.id, data: { is_starred: !note.is_starred } }, {
      onSuccess: () => refetch()
    });
  });

  const filteredNotes = notesData?.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSection = activeSection === 'All Notes' || note.section === activeSection;
    return matchesSearch && matchesSection;
  }) || [];

  const sections = [
    { id: 'all', name: 'All Notes', count: notesData?.length || 0 },
    { id: 'ideas', name: 'Ideas', count: notesData?.filter(n => n.section === 'Ideas').length || 0 },
    { id: 'work', name: 'Work', count: notesData?.filter(n => n.section === 'Work').length || 0 },
    { id: 'personal', name: 'Personal', count: notesData?.filter(n => n.section === 'Personal').length || 0 },
  ];

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const noteData = {
      title: formData.get('title'),
      content: formData.get('content'),
      section: formData.get('section'),
      color: formData.get('color') || 'bg-blue-500',
      is_starred: false
    };

    createNote({ data: noteData }, {
      onSuccess: () => {
        addNotification("تم حفظ الملاحظة بنجاح", "success");
        setIsAdding(false);
        refetch();
      }
    });
  };

  const handleDeleteNote = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذه الملاحظة؟")) {
      deleteNote({ id }, {
        onSuccess: () => {
          addNotification("تم حذف الملاحظة", "success");
          refetch();
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-120px)] gap-8">
      {/* Sidebar */}
      <aside className="w-full md:w-64 flex flex-col gap-6">
        <div className="space-y-2">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.name)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeSection === section.name ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-text-secondary hover:text-text-primary hover:bg-accent/10'}`}
            >
              <span className="font-bold text-sm">{section.name}</span>
              <span className="text-xs font-bold opacity-60">{section.count}</span>
            </button>
          ))}
        </div>
        <button className="w-full py-3 flex items-center justify-center gap-2 text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-accent/10 rounded-xl transition-all border border-dashed border-border">
          <FolderPlus className="w-4 h-4" />
          {t('new_section')}
        </button>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col gap-8">
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search_notes')}
              className="w-full bg-bg-secondary border border-border rounded-xl py-3 pl-12 pr-4 text-sm text-text-primary focus:outline-none focus:border-accent/50 transition-all"
            />
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2 bg-bg-secondary p-1 rounded-xl border border-border">
              <button 
                onClick={() => setView('grid')}
                className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-text-secondary hover:text-text-primary'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setView('list')}
                className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-text-secondary hover:text-text-primary'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            <button 
              onClick={() => setIsAdding(true)}
              className="px-6 py-3 bg-accent text-white font-bold text-sm rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-accent/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('new_note')}
            </button>
          </div>
        </header>

        <div className={`grid ${view === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6 overflow-y-auto no-scrollbar pb-8`}>
          {filteredNotes.map(note => (
            <motion.div 
              key={note.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-6 space-y-4 hover:border-accent/30 transition-all group flex flex-col relative overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-1 h-full ${note.color}`}></div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-text-primary text-lg group-hover:text-accent transition-colors">{note.title}</h3>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => onStarNote(note)}
                    className={`p-1 transition-colors ${note.is_starred ? 'text-yellow-500' : 'text-text-secondary hover:text-accent'}`}
                  >
                    <Star className={`w-4 h-4 ${note.is_starred ? 'fill-current' : ''}`} />
                  </button>
                  <button 
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1 text-text-secondary hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-text-secondary line-clamp-3 flex-1 leading-relaxed">
                {note.content}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                  {new Date(note.created_at).toLocaleDateString()}
                </span>
                <span className="text-[10px] font-bold text-accent uppercase tracking-widest bg-accent/10 px-2 py-0.5 rounded-md">{note.section}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Add Note Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-lg p-8 relative"
            >
              <button onClick={() => setIsAdding(false)} className="absolute top-4 right-4 p-2 hover:bg-bg-secondary rounded-full transition-colors">
                <X className="w-6 h-6 text-text-secondary" />
              </button>

              <h2 className="text-2xl font-bold text-text-primary mb-6">New Note</h2>

              <form onSubmit={handleCreateNote} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">Title</label>
                  <input 
                    name="title"
                    type="text" 
                    required
                    className="w-full bg-bg-secondary/50 border border-border rounded-xl py-3 px-4 text-text-primary outline-none focus:border-accent transition-all"
                    placeholder="Note title..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">Section</label>
                  <select name="section" className="w-full bg-bg-secondary/50 border border-border rounded-xl py-3 px-4 text-text-primary outline-none focus:border-accent transition-all appearance-none">
                    <option value="Ideas">Ideas</option>
                    <option value="Work">Work</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">Content</label>
                  <textarea 
                    name="content"
                    rows={5}
                    required
                    className="w-full bg-bg-secondary/50 border border-border rounded-xl py-3 px-4 text-text-primary outline-none focus:border-accent transition-all resize-none"
                    placeholder="Write your thoughts..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">Color Tag</label>
                  <div className="flex gap-4">
                    {['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500'].map(color => (
                      <label key={color} className="relative cursor-pointer">
                        <input type="radio" name="color" value={color} className="peer hidden" defaultChecked={color === 'bg-blue-500'} />
                        <div className={`w-8 h-8 rounded-full ${color} border-2 border-transparent peer-checked:border-white shadow-sm transition-all`}></div>
                      </label>
                    ))}
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isCreating}
                  className="w-full bg-accent text-white py-4 rounded-xl font-bold shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Note'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
