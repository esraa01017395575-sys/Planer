import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  useGetNotes, useCreateNote, useUpdateNote, useDeleteNote, 
  useGetNoteSections, useCreateNoteSection,
  useGetTasks, useGetHabits, useGetDailySchedule, useToggleFavorite
} from '../lib/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Grid, List, Pin, MoreVertical, StickyNote, FolderPlus, Trash2, X, Loader2, Folder, AtSign, Star, Edit2, Check, Calendar, Heart, Sparkles } from 'lucide-react';

export const Notes = ({ onPinNote: propsOnPinNote }: { onPinNote?: (note: any) => void }) => {
  const { t, language, addNotification } = useAppContext();
  const { data: notesData, loading: isLoading, refetch } = useGetNotes();
  const { toggleFavorite } = useToggleFavorite();
  const { data: sectionsData, loading: sectionsLoading, refetch: refetchSections } = useGetNoteSections();
  const { mutate: createNote, isPending: isCreating } = useCreateNote();
  const { mutate: updateNote } = useUpdateNote();
  const { mutate: deleteNote } = useDeleteNote();
  const { mutate: createSection, isPending: isCreatingSection } = useCreateNoteSection();

  const { data: tasks } = useGetTasks();
  const { data: habits } = useGetHabits();

  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [activeSection, setActiveSection] = useState('All Notes');
  const [editingNote, setEditingNote] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Mentions state
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionType, setMentionType] = useState<'task' | 'habit' | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPos, setCursorPos] = useState(0);

  const mentionList = useMemo(() => {
    const query = mentionQuery.toLowerCase();
    const taskList = tasks?.filter(t => t.title.toLowerCase().includes(query)).map(t => ({ id: t.id, title: t.title, type: 'task' })) || [];
    const habitList = habits?.filter(h => h.title.toLowerCase().includes(query)).map(h => ({ id: h.id, title: h.title, type: 'habit' })) || [];
    return [...taskList, ...habitList];
  }, [tasks, habits, mentionQuery]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    setCursorPos(pos);

    const lastAtIdx = val.lastIndexOf('@', pos - 1);
    if (lastAtIdx !== -1) {
      const textAfterAt = val.slice(lastAtIdx + 1, pos);
      if (!textAfterAt.includes(' ')) {
        setMentionQuery(textAfterAt);
        setShowMentions(true);
        return;
      }
    }
    setShowMentions(false);
  };

  const insertMention = (item: any) => {
    if (!textareaRef.current) return;
    const val = textareaRef.current.value;
    const lastAtIdx = val.lastIndexOf('@', cursorPos - 1);
    const newVal = val.slice(0, lastAtIdx) + `@${item.title} ` + val.slice(cursorPos);
    
    // In a real app we'd store the ID in metadata, but for now we just insert the text
    textareaRef.current.value = newVal;
    setShowMentions(false);
    textareaRef.current.focus();
  };
  
  const onPinNote = propsOnPinNote || ((note: any) => {
    // Optimistic update
    const prevNotes = [...(notesData || [])];
    const newNotes = prevNotes.map(n => n.id === note.id ? { ...n, is_pinned: !n.is_pinned } : n);
    // Sort logic from SQL should matches here
    newNotes.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return b.is_pinned ? 1 : -1;
      return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
    });
    
    // updateNote({ id: note.id, data: { is_pinned: !note.is_pinned } }, {
    //   onSuccess: () => refetch(true)
    // });
    // Actually the silent refetch is better
    updateNote({ id: note.id, data: { is_pinned: !note.is_pinned } }, {
      onSuccess: () => refetch(true)
    });
  });

  const filteredNotes = notesData?.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (note.content?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchesSection = activeSection === 'All Notes' || note.note_sections?.name === activeSection;
    return matchesSearch && matchesSection;
  }) || [];

  const sections = [
    { id: 'all', name: 'All Notes', count: notesData?.length || 0 },
    ...sectionsData.map(sec => ({
      id: sec.id,
      name: sec.name,
      count: notesData?.filter(n => n.section_id === sec.id).length || 0
    }))
  ];

  const handleCreateSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionName.trim()) return;

    createSection({ name: newSectionName }, {
      onSuccess: () => {
        addNotification(t('section_created'), "success");
        setIsAddingSection(false);
        setNewSectionName('');
        refetchSections();
      }
    });
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const noteData = {
      title: formData.get('title'),
      content: formData.get('content'),
      section_id: formData.get('section_id') || null,
      is_pinned: false
    };

    createNote({ data: noteData }, {
      onSuccess: () => {
        addNotification(t('note_saved'), "success");
        setIsAdding(false);
        refetch();
      }
    });
  };

  const handleDeleteNote = (id: string) => {
    if (confirm(t('confirm_delete_note'))) {
      deleteNote({ id }, {
        onSuccess: () => {
          addNotification(t('note_deleted'), "success");
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
    <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 flex flex-col gap-6">
          <div className="space-y-2">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.name)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeSection === section.name ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-text-secondary hover:text-text-primary hover:bg-accent/10'}`}
              >
                <span className="font-bold text-sm tracking-tight">{section.name === 'All Notes' ? t('all_notes') : section.name}</span>
                <span className="text-xs font-bold opacity-60">{section.count}</span>
              </button>
            ))}
          </div>
          <button 
            onClick={() => setIsAddingSection(true)}
            className="w-full py-3 flex items-center justify-center gap-2 text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-accent/10 rounded-xl transition-all border border-dashed border-border lg:mt-4"
          >
            <Plus className="w-4 h-4" />
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
                className="w-full bg-bg-secondary border border-border rounded-xl py-3 pl-12 pr-4 text-sm text-text-primary focus:outline-none focus:border-accent/50 transition-all font-medium"
              />
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
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
                className="px-6 py-3 bg-accent text-white font-bold text-sm rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-accent/20 flex items-center gap-2 shrink-0"
              >
                <Plus className="w-4 h-4" />
                {t('new_note')}
              </button>
            </div>
          </header>

          <div className={`grid ${view === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6 pb-8`}>
            {filteredNotes.map(note => (
              <motion.div 
                key={note.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 space-y-4 hover:border-accent/30 transition-all group flex flex-col relative overflow-hidden"
              >
                {note.is_pinned && <div className="absolute top-0 right-0 p-2 text-accent"><Pin size={12} className="fill-current" /></div>}
                <div 
                  onClick={() => setEditingNote(note)}
                  className="flex items-start justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${note.note_sections?.name === 'Ideas' ? 'bg-orange-500' : 'bg-accent'}`} />
                    <h3 className="font-bold text-text-primary text-lg group-hover:text-accent transition-colors truncate pr-6">{note.title}</h3>
                  </div>
                </div>
                <p 
                  onClick={() => setEditingNote(note)}
                  className="text-sm text-text-secondary line-clamp-4 flex-1 leading-relaxed opacity-80 cursor-pointer hover:opacity-100"
                >
                  {note.content}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-60">
                      {new Date(note.updated_at || note.created_at).toLocaleDateString()}
                    </span>
                    {note.note_sections && (
                       <span className="text-[8px] font-black tracking-tighter text-accent bg-accent/5 px-1.5 py-0.5 rounded mt-1 uppercase w-fit">
                          {note.note_sections.name}
                       </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         toggleFavorite({
                            type: 'note',
                            item_id: note.id,
                            title: note.title,
                            content: note.content
                         }).then((res) => {
                            if (res.added) addNotification(t('favorite_added'), 'success');
                            else addNotification(t('favorite_removed'), 'info');
                         }).catch(() => {
                            addNotification("Failed to save to favorites", "error");
                         });
                       }}
                       className="p-1.5 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                       title="Add to Favorites"
                    >
                       <Heart className="w-4 h-4" />
                    </button>
                    <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         const prompt = `I want to chat about this note: "${note.title}". Content: ${note.content}`;
                         window.location.href = `/chat?prompt=${encodeURIComponent(prompt)}`;
                       }}
                       className="p-1.5 text-text-secondary hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                       title="Send to AI"
                    >
                       <Sparkles className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onPinNote(note); }}
                      className={`p-1.5 rounded-lg transition-colors ${note.is_pinned ? 'text-accent bg-accent/10' : 'text-text-secondary hover:text-accent hover:bg-accent/10'}`}
                    >
                      <Pin className={`w-4 h-4 ${note.is_pinned ? 'fill-current' : ''}`} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                      className="p-1.5 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {filteredNotes.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-40">
                <StickyNote size={48} className="mb-4" />
                <p className="font-bold">{t('search_notes')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Note Modal */}
        <AnimatePresence>
          {(isAdding || editingNote) && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => { setIsAdding(false); setEditingNote(null); }}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-bg-primary border border-border rounded-[2.5rem] w-full max-w-lg p-8 relative shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <button onClick={() => { setIsAdding(false); setEditingNote(null); }} className="absolute top-6 right-6 p-2 h-10 w-10 flex items-center justify-center bg-bg-secondary rounded-xl hover:scale-110 transition-all">
                  <X className="w-5 h-5 text-text-secondary" />
                </button>

                <h2 className="text-3xl font-display font-bold text-text-primary mb-8">{editingNote ? t('edit_note') : t('new_note')}</h2>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const formData = new FormData(form);
                  const noteData = {
                    title: formData.get('title'),
                    content: formData.get('content'),
                    section_id: formData.get('section_id') || null,
                  };

                  if (editingNote) {
                    updateNote({ id: editingNote.id, data: noteData }, {
                      onSuccess: () => {
                        addNotification(t('note_updated'), "success");
                        setEditingNote(null);
                        refetch();
                      }
                    });
                  } else {
                    createNote({ data: { ...noteData, is_pinned: false } }, {
                      onSuccess: () => {
                        addNotification(t('note_saved'), "success");
                        setIsAdding(false);
                        refetch();
                      }
                    });
                  }
                }} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">Title</label>
                    <input 
                      name="title"
                      type="text" 
                      required
                      autoFocus
                      defaultValue={editingNote?.title}
                      className="w-full bg-bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-text-primary outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all font-bold text-lg"
                      placeholder="Note title..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">Section</label>
                    <select 
                      name="section_id"
                      defaultValue={editingNote?.section_id || ""}
                      className="w-full bg-bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-text-primary outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all font-bold"
                    >
                      <option value="">No Section</option>
                      {sectionsData.map(sec => (
                        <option key={sec.id} value={sec.id}>{sec.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 relative">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1 flex items-center gap-2">
                      Content 
                      <span className="opacity-40 font-normal normal-case">(Use @ to link tasks)</span>
                    </label>
                    <textarea 
                      name="content"
                      ref={textareaRef}
                      onChange={handleTextChange}
                      defaultValue={editingNote?.content}
                      rows={8}
                      className="w-full bg-bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-text-primary outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all resize-none font-medium leading-relaxed"
                      placeholder="Write your thoughts..."
                    />
                    
                    <AnimatePresence>
                      {showMentions && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute bottom-full left-0 w-full bg-bg-card border border-border rounded-2xl shadow-2xl overflow-hidden mb-2 z-50 max-h-48 overflow-y-auto"
                        >
                          <div className="p-2 border-b border-border bg-bg-secondary/50 text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                            Links / Mentions
                          </div>
                          {mentionList.length > 0 ? mentionList.map(item => (
                            <button
                              key={`${item.type}-${item.id}`}
                              type="button"
                              onClick={() => insertMention(item)}
                              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-accent hover:text-white transition-all text-left border-b border-border last:border-b-0"
                            >
                              <div className={`p-1.5 rounded-lg bg-bg-secondary text-text-secondary ${item.type === 'task' ? 'text-blue-500 bg-blue-500/10' : 'text-emerald-500 bg-emerald-500/10'}`}>
                                <AtSign className="w-3 h-3" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold">{item.title}</span>
                                <span className="text-[8px] uppercase font-bold opacity-60 tracking-widest">{item.type}</span>
                              </div>
                            </button>
                          )) : (
                            <div className="p-4 text-center text-xs text-text-secondary italic">No matches found</div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button 
                    type="submit"
                    disabled={isCreating}
                    className="w-full bg-accent text-white py-5 rounded-3xl font-bold shadow-2xl shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : editingNote ? t('update') : t('save_note')}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Add Section Modal */}
        <AnimatePresence>
          {isAddingSection && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddingSection(false)}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-bg-primary border border-border rounded-[2.5rem] w-[320px] h-[320px] p-8 relative shadow-2xl flex flex-col justify-center"
                onClick={e => e.stopPropagation()}
              >
                <button onClick={() => setIsAddingSection(false)} className="absolute top-6 right-6 p-2 h-10 w-10 flex items-center justify-center bg-bg-secondary rounded-xl hover:scale-110 transition-all">
                  <X className="w-5 h-5 text-text-secondary" />
                </button>

                <h2 className="text-2xl font-display font-bold text-text-primary mb-6 text-center">{t('new_section')}</h2>

                <form onSubmit={handleCreateSection} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">Section Name</label>
                    <input 
                      value={newSectionName}
                      onChange={e => setNewSectionName(e.target.value)}
                      type="text" 
                      required
                      autoFocus
                      className="w-full bg-bg-secondary/50 border border-border rounded-2xl py-4 px-6 text-text-primary outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all font-bold"
                      placeholder="e.g. Ideas, Projects..."
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isCreatingSection}
                    className="w-full bg-accent text-white py-4 rounded-2xl font-bold shadow-2xl shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isCreatingSection ? <Loader2 className="w-5 h-5 animate-spin" /> : t('save')}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
};
