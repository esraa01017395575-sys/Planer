import React, { useState } from 'react';
import { Sparkles, BrainCircuit, CheckSquare, ListTodo, AlertTriangle, Play, HelpCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Project, ProjectMilestone } from '../../types/projects';
import { useAppContext } from '../../context/AppContext';

interface AIAssistantProps {
  project?: Project;
  activeProjects?: Project[];
  onApplyMilestones?: (milestones: ProjectMilestone[], estimatedHours: number, technologies: string[]) => void;
  onRefreshProject?: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  project,
  activeProjects = [],
  onApplyMilestones,
  onRefreshProject
}) => {
  const { language } = useAppContext();
  const isAr = language === 'ar';

  const [analysis, setAnalysis] = useState<any>(null);
  const [dailyPlan, setDailyPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [availableHours, setAvailableHours] = useState('4');

  // Trigger 1: Progress Analysis
  const handleAnalyzeProgress = async () => {
    if (!project) return;
    setLoading(true);
    setAnalysis(null);

    try {
      const response = await fetch('/api/ai/analyze-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle: project.title,
          progress: project.progress,
          lastSession: project.sessions?.[0] ? `${project.sessions[0].title}: ${project.sessions[0].notes}` : 'None logged yet',
          blockers: project.status === 'on-hold' ? 'Project is currently on standby.' : 'None'
        })
      });

      const resData = await response.json();
      setAnalysis(resData);
    } catch (err) {
      console.error("AI Analysis flow error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger 2: Daily prioritizer
  const handleDailyPrioritizer = async () => {
    setLoading(true);
    setDailyPlan(null);

    const mappedProjects = activeProjects.map(p => ({
      id: p.id,
      title: p.title,
      progress: p.progress,
      status: p.status,
      priority: p.priority
    }));

    try {
      const response = await fetch('/api/ai/daily-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeProjects: mappedProjects,
          availableHours: Number(availableHours) || 4
        })
      });

      const resData = await response.json();
      setDailyPlan(resData);
    } catch (err) {
      console.error("AI Prioritizer flow error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 🚀 AI Progress Advisor (Detailed View) */}
      {project && (
        <div className="glass-card p-5 border-indigo-500/10 bg-indigo-500/5 hover:border-indigo-500/25 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <BrainCircuit className="w-5 h-5 text-accent animate-pulse" />
              <div>
                <h4 className="font-display font-bold text-sm text-text-primary">
                  {isAr ? 'المرشد المهني الذكي' : 'AI Career Advisor'}
                </h4>
                <p className="text-[10px] text-text-secondary mt-0.5">
                  {isAr ? 'تحليل المسار المهني وجدولة المهام الذكية' : 'Intelligent career path analysis and task planning'}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleAnalyzeProgress}
              disabled={loading}
              className="px-3.5 h-8 text-[11px] font-bold bg-accent hover:bg-accent/90 text-white rounded-lg inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAr ? 'حلل التقدم' : 'Analyze Progress'}</span>
                </>
              )}
            </button>
          </div>

          {!analysis && !loading && (
            <p className="text-xs text-text-secondary leading-normal">
              {isAr
                ? 'هل تسير حسب الخطة؟ اضغط على زر "حلل التقدم" للحصول على مراجعة مستمرة، وتوصيات للجلسة التالية، وتقدير الساعات المتبقية.'
                : 'Are you on track? Click "Analyze Progress" to receive a comprehensive review, next session recommendations, and remaining hours estimation.'}
            </p>
          )}

          {loading && (
            <div className="py-6 text-center text-xs font-mono text-text-secondary animate-pulse">
              {isAr ? 'جاري توليد تقييم ذكي للمشروع...' : 'Generating AI project assessment...'}
            </div>
          )}

          {analysis && (
            <div className="space-y-4 pt-3 border-t border-border/10 animate-in fade-in duration-300">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  analysis.onTrack ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                }`}>
                  {analysis.onTrack 
                    ? (isAr ? '✅ على المسار الصحيح' : '✅ On Track') 
                    : (isAr ? '⚠️ متأخر عن الجدول' : '⚠️ Delayed')}
                </span>
                <span className="text-[10px] font-mono text-text-secondary">
                  {isAr ? 'متبقي حوالي ' : 'Estimated remaining: '}
                  <strong>{analysis.estimateRemainingHours}</strong> 
                  {isAr ? ' ساعة' : ' hours'}
                </span>
              </div>

              <div className="p-3 bg-bg-secondary rounded-xl text-xs text-text-secondary leading-relaxed">
                {analysis.recommendation}
              </div>

              {analysis.nextSessionSuggestions?.length > 0 && (
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-bold text-text-secondary uppercase">
                    {isAr ? 'أهداف مقترحة للجلسة القادمة' : 'Suggested Focus Goals'}
                  </span>
                  <ul className="space-y-1 text-xs text-text-secondary pl-3 list-disc">
                    {analysis.nextSessionSuggestions.map((s: string, idx: number) => (
                      <li key={idx} className="leading-relaxed">{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.warnings?.length > 0 && (
                <div className="p-2.5 bg-red-500/5 text-red-400 rounded-lg text-[11px] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{analysis.warnings[0]}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 📅 Daily Workspace Allocator */}
      {activeProjects.length > 0 && (
        <div className="glass-card p-5 border-border/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <ListTodo className="w-5 h-5 text-indigo-400" />
              <div>
                <h4 className="font-display font-bold text-sm text-text-primary">
                  {isAr ? 'موزع وقت اليوم' : 'Daily Time Allocator'}
                </h4>
                <p className="text-[10px] text-text-secondary mt-0.5">
                  {isAr ? 'توزيع ساعات الفراغ على أهدافك النشطة اليوم' : 'Allocate your free hours effectively among active goals today'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="16"
                value={availableHours}
                onChange={(e) => setAvailableHours(e.target.value)}
                className="w-12 h-8 rounded-lg bg-bg-secondary border border-border/15 font-mono text-center text-xs font-bold focus:border-accent"
              />
              <span className="text-[10px] text-text-secondary">{isAr ? 'ساعة' : 'hours'}</span>
            </div>
          </div>

          <button
            onClick={handleDailyPrioritizer}
            disabled={loading}
            className="w-full h-10 text-xs bg-bg-secondary hover:bg-accent hover:text-white border border-border/10 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <BrainCircuit className="w-4 h-4" />
                <span>{isAr ? 'وزع جهدي بذكاء' : 'Distribute my focus intelligently'}</span>
              </>
            )}
          </button>

          {dailyPlan && (
            <div className="space-y-4 mt-4 pt-4 border-t border-border/10 animate-in fade-in duration-300">
              <div className="space-y-3">
                {dailyPlan.prioritizedProjects?.map((pp: any, idx: number) => {
                  const linkedProj = activeProjects.find(ap => ap.id === pp.projectId);
                  return (
                    <div key={idx} className="p-3 bg-bg-secondary rounded-xl border border-border/5 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-text-primary">
                          {linkedProj?.title || (isAr ? 'مشروع مخصص' : 'Custom Project')}
                        </span>
                        <span className="text-xs font-mono font-bold text-accent">
                          {pp.suggestedHours} {isAr ? 'ساعة' : 'hours'}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary leading-relaxed">{pp.reason}</p>
                    </div>
                  );
                })}
              </div>

              {dailyPlan.urgentTasks?.length > 0 && (
                <div className="p-2.5 bg-amber-500/5 text-amber-400 rounded-lg text-xs flex gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-bold">{isAr ? 'مهام عاجلة تحتاج تركيزاً:' : 'Hot items requiring response:'}</span>
                    <span className="leading-snug block mt-0.5 text-[11px]">{dailyPlan.urgentTasks.join(', ')}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
