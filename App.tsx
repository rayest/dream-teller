
import React, { useState, useEffect } from 'react';
import { DreamEntry, SecondLifeState, SecondLifeProfile } from './types';
import { analyzeDream } from './services/geminiService';
import { DreamCard } from './components/DreamCard';
import { AnalysisView } from './components/AnalysisView';
import { DashboardView } from './components/DashboardView';
import { LibraryView } from './components/LibraryView';
import { TarotView } from './components/TarotView';
import { SecondLifeView } from './components/SecondLifeView';
import { PlusCircle, Loader2, Sparkles, History, Menu, X, Brain, HeartHandshake, Lightbulb, Feather, BarChart3, BookHeart, Quote, Compass, Eye, PenLine, Dna } from 'lucide-react';

const STORAGE_KEY = 'dreamweaver_data';
const SL_STORAGE_KEY = 'dreamweaver_secondlife';

const DEFAULT_SL_STATE: SecondLifeState = {
  profile: {
    level: 1,
    exp: 0,
    archetype: 'Dreamer',
    title: 'Novice Oneiric',
    attributes: { lucidity: 5, imagination: 5, resilience: 5 }
  },
  events: [],
  inventory: [],
  syncedDreamIds: []
};

const App: React.FC = () => {
  // State
  const [dreams, setDreams] = useState<DreamEntry[]>([]);
  const [slState, setSlState] = useState<SecondLifeState>(DEFAULT_SL_STATE);
  
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedDreamId, setSelectedDreamId] = useState<string | null>(null);
  const [showHistoryMobile, setShowHistoryMobile] = useState(false);
  const [viewMode, setViewMode] = useState<'entry' | 'dashboard' | 'library' | 'tarot' | 'secondLife'>('entry');

  // Load Dreams
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setDreams(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored dreams", e);
      }
    }
  }, []);

  // Load Second Life Data
  useEffect(() => {
    const storedSL = localStorage.getItem(SL_STORAGE_KEY);
    if (storedSL) {
        try {
            setSlState(JSON.parse(storedSL));
        } catch (e) {
            console.error("Failed to parse SL data", e);
        }
    }
  }, []);

  // Save Dreams
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dreams));
  }, [dreams]);

  // Save Second Life Data
  useEffect(() => {
    localStorage.setItem(SL_STORAGE_KEY, JSON.stringify(slState));
  }, [slState]);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;

    setIsAnalyzing(true);
    const tempId = Date.now().toString();
    
    // Optimistic UI could be added here, but for now we wait for result
    try {
      const result = await analyzeDream(inputText);
      
      const newDream: DreamEntry = {
        id: tempId,
        date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }),
        content: inputText,
        analysis: result,
        timestamp: Date.now(),
      };

      setDreams(prev => [newDream, ...prev]);
      setSelectedDreamId(tempId);
      setViewMode('entry'); // Ensure we show the result
      setInputText('');
      // Switch view on mobile if needed
      setShowHistoryMobile(false); 
    } catch (error) {
      alert("解析失败，请稍后重试或检查网络连接。");
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpdateDream = (id: string, updates: Partial<DreamEntry>) => {
    setDreams(prev => prev.map(dream => 
      dream.id === id ? { ...dream, ...updates } : dream
    ));
  };

  const handleDeleteDream = (id: string) => {
    if (window.confirm("确定要删除这条梦境记录吗？此操作无法撤销。")) {
      setDreams(prev => prev.filter(d => d.id !== id));
      if (selectedDreamId === id) {
        setSelectedDreamId(null);
      }
    }
  };

  const currentDream = dreams.find(d => d.id === selectedDreamId);
  const latestDream = dreams.length > 0 ? dreams[0] : null;

  // Main UI Render
  return (
    <div className="min-h-screen bg-paper text-ink-800 flex overflow-hidden relative selection:bg-amber-100 selection:text-amber-900 font-sans">
      
      {/* Background Ambience - Mystical Slate/Amber theme */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none bg-paper">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-slate-200/40 rounded-full blur-[100px] animate-blob mix-blend-multiply"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-100/40 rounded-full blur-[120px] animate-blob animation-delay-2000 mix-blend-multiply"></div>
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-sky-100/30 rounded-full blur-[80px] animate-blob animation-delay-4000 mix-blend-multiply"></div>
      </div>

      {/* Mobile Header / Nav */}
      <div className="md:hidden fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2 text-slate-700">
           <Feather size={20} />
           <span className="font-hand font-bold text-xl text-ink-800">Dream Journal</span>
        </div>
        <button onClick={() => setShowHistoryMobile(!showHistoryMobile)} className="text-ink-500">
          {showHistoryMobile ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar (History & Nav) */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-80 bg-white/50 backdrop-blur-xl border-r border-slate-200/60 transform transition-transform duration-500 ease-in-out shadow-[4px_0_24px_rgba(0,0,0,0.02)]
        md:relative md:translate-x-0 md:bg-white/30 md:backdrop-blur-none
        ${showHistoryMobile ? 'translate-x-0 top-[60px]' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full p-4 md:p-6">
          <div className="hidden md:flex items-center gap-3 mb-8 text-slate-600 px-2 mt-2">
            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
              <Feather size={24} />
            </div>
            <h1 className="font-hand font-bold text-3xl text-ink-800 tracking-wide">Dream Journal</h1>
          </div>

          <div className="grid grid-cols-5 gap-1 mb-8">
            <button 
                onClick={() => {
                setSelectedDreamId(null);
                setViewMode('entry');
                setShowHistoryMobile(false);
                }}
                className={`flex flex-col items-center justify-center gap-1 py-3 px-1 rounded-2xl transition-all border
                ${viewMode === 'entry' && !selectedDreamId 
                    ? 'bg-white shadow-md border-slate-200 text-slate-800' 
                    : 'bg-white/40 border-transparent hover:bg-white/60 text-ink-400 hover:text-ink-600'}`}
                title="记梦"
            >
                <PlusCircle size={20} />
            </button>
            <button 
                onClick={() => {
                setSelectedDreamId(null);
                setViewMode('dashboard');
                setShowHistoryMobile(false);
                }}
                className={`flex flex-col items-center justify-center gap-1 py-3 px-1 rounded-2xl transition-all border
                ${viewMode === 'dashboard' 
                    ? 'bg-white shadow-md border-slate-200 text-slate-800' 
                    : 'bg-white/40 border-transparent hover:bg-white/60 text-ink-400 hover:text-ink-600'}`}
                title="洞察"
            >
                <BarChart3 size={20} />
            </button>
            <button 
                onClick={() => {
                setSelectedDreamId(null);
                setViewMode('library');
                setShowHistoryMobile(false);
                }}
                className={`flex flex-col items-center justify-center gap-1 py-3 px-1 rounded-2xl transition-all border
                ${viewMode === 'library' 
                    ? 'bg-white shadow-md border-slate-200 text-slate-800' 
                    : 'bg-white/40 border-transparent hover:bg-white/60 text-ink-400 hover:text-ink-600'}`}
                title="灵感"
            >
                <Compass size={20} />
            </button>
            <button 
                onClick={() => {
                setSelectedDreamId(null);
                setViewMode('tarot');
                setShowHistoryMobile(false);
                }}
                className={`flex flex-col items-center justify-center gap-1 py-3 px-1 rounded-2xl transition-all border
                ${viewMode === 'tarot' 
                    ? 'bg-white shadow-md border-slate-200 text-slate-800' 
                    : 'bg-white/40 border-transparent hover:bg-white/60 text-ink-400 hover:text-ink-600'}`}
                title="塔罗"
            >
                <Eye size={20} />
            </button>
            <button 
                onClick={() => {
                setSelectedDreamId(null);
                setViewMode('secondLife');
                setShowHistoryMobile(false);
                }}
                className={`flex flex-col items-center justify-center gap-1 py-3 px-1 rounded-2xl transition-all border
                ${viewMode === 'secondLife' 
                    ? 'bg-white shadow-md border-slate-200 text-slate-800' 
                    : 'bg-white/40 border-transparent hover:bg-white/60 text-ink-400 hover:text-ink-600'}`}
                title="第二人生"
            >
                <Dna size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2 text-ink-400 text-xs font-bold uppercase tracking-widest mb-4 px-2 font-sans">
            <History size={12} />
            <span>时间轴</span>
          </div>

          <div className="flex-1 overflow-y-auto -mx-2 px-2 pb-20 md:pb-0 custom-scrollbar">
            {dreams.length === 0 ? (
              <div className="text-center text-ink-400 mt-10 p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-white/30">
                <BookHeart size={32} className="mx-auto mb-2 opacity-50"/>
                <p className="text-sm font-hand text-lg">暂无记录</p>
                <p className="text-xs mt-2 opacity-70 font-sans">记录今夜的梦，<br/>开启心灵的对话。</p>
              </div>
            ) : (
              <div className="relative">
                 {dreams.map((dream, index) => (
                    <DreamCard 
                    key={dream.id} 
                    dream={dream} 
                    isSelected={selectedDreamId === dream.id}
                    isLast={index === dreams.length - 1}
                    onClick={(d) => {
                        setSelectedDreamId(d.id);
                        setViewMode('entry');
                        setShowHistoryMobile(false);
                    }}
                    onDelete={handleDeleteDream}
                    />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative z-10 flex flex-col h-screen overflow-hidden pt-[60px] md:pt-0">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 max-w-5xl mx-auto w-full custom-scrollbar">
          
          {viewMode === 'dashboard' ? (
             <DashboardView dreams={dreams} />
          ) : viewMode === 'library' ? (
             <LibraryView />
          ) : viewMode === 'tarot' ? (
             <TarotView />
          ) : viewMode === 'secondLife' ? (
             <SecondLifeView 
                state={slState} 
                dreams={dreams} 
                onUpdateState={setSlState} 
             />
          ) : selectedDreamId && currentDream ? (
            <AnalysisView 
              dream={currentDream} 
              onBack={() => setSelectedDreamId(null)}
              onUpdateDream={handleUpdateDream}
            />
          ) : (
            // New Entry View - Optimized Journal Look
            <div className="h-full flex flex-col justify-center items-center max-w-2xl mx-auto animate-fade-in pb-10">
              
              {/* Daily Dream Quote */}
              {latestDream && latestDream.analysis && (
                <div className="w-full mb-8 animate-fade-in">
                  <div className="bg-white/40 backdrop-blur-sm p-6 rounded-2xl border border-white/60 shadow-sm relative overflow-hidden group hover:bg-white/60 transition-colors mx-auto max-w-xl">
                    <Quote className="absolute top-4 left-4 text-sky-200 w-8 h-8 opacity-40 transform -scale-x-100" />
                    <Quote className="absolute bottom-4 right-4 text-sky-200 w-8 h-8 opacity-40" />
                    <div className="relative z-10 text-center px-4">
                        <div className="flex items-center justify-center gap-2 mb-3">
                           <Sparkles size={14} className="text-sky-400"/>
                           <h3 className="text-xs font-bold text-sky-600 uppercase tracking-widest font-sans">今日梦语</h3>
                           <Sparkles size={14} className="text-sky-400"/>
                        </div>
                        <p className="text-ink-700 font-hand text-xl md:text-2xl leading-relaxed opacity-90">
                          "{latestDream.analysis.guidance.length > 50 ? latestDream.analysis.guidance.substring(0, 48) + '...' : latestDream.analysis.guidance}"
                        </p>
                        <div className="mt-4 text-xs text-ink-400 font-sans flex items-center justify-center gap-1 opacity-70">
                          <span>— 源自梦境</span>
                          <span className="font-bold text-slate-600">《{latestDream.analysis.title}》</span>
                        </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center p-3 bg-slate-100 rounded-full mb-4 text-slate-500">
                    <PenLine size={24} />
                </div>
                <h2 className="text-4xl md:text-5xl font-hand font-medium mb-3 text-ink-800 leading-tight">
                  记梦空间
                </h2>
                <p className="text-ink-500 font-sans text-sm md:text-base tracking-wide max-w-md mx-auto">
                  在这片柔和的角落，记下潜意识的低语。
                </p>
              </div>

              {/* Enhanced Input Area - Journal Style */}
              <div className="w-full bg-white rounded-3xl p-1 shadow-xl shadow-slate-200/50 relative group focus-within:shadow-2xl focus-within:shadow-slate-300/50 transition-all duration-500 border border-white">
                <div className="relative rounded-[20px] overflow-hidden bg-[#fff] border border-slate-100">
                    {/* Paper Lines */}
                    <div className="absolute inset-0 pointer-events-none opacity-10" 
                        style={{ backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '100% 2rem', marginTop: '1.5rem' }}>
                    </div>
                    
                    <textarea 
                    className="w-full h-48 md:h-64 bg-transparent border-none resize-none p-6 text-lg text-ink-700 placeholder-slate-300 focus:ring-0 focus:outline-none font-hand leading-loose tracking-wide relative z-10"
                    placeholder="昨晚的梦境依然清晰吗？
例如：我梦见在一片发光的森林中迷路，遇到了一只会说话的猫头鹰..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={isAnalyzing}
                    style={{ lineHeight: '2rem' }} // Match background lines
                    />
                </div>
                
                <div className="flex justify-between items-center px-4 pb-3 pt-3">
                  <span className="text-xs text-ink-400 font-sans pl-2">
                    {inputText.length > 0 ? `${inputText.length} 字` : ' '}
                  </span>
                  
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !inputText.trim()}
                    className={`
                      flex items-center gap-2 px-8 py-3 rounded-2xl font-bold transition-all duration-300 shadow-sm font-sans text-sm tracking-wide
                      ${isAnalyzing || !inputText.trim()
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-800 text-white hover:bg-slate-700 hover:shadow-lg hover:shadow-slate-300 hover:-translate-y-1'}
                    `}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        <span>正在解读...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        <span>解读梦境</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-center px-4 opacity-80">
                 <div className="p-4 rounded-2xl bg-white/30 border border-white hover:bg-white hover:shadow-sm transition-all duration-300">
                    <h3 className="text-xs font-bold text-slate-600 font-sans mb-1 flex items-center justify-center gap-1"><Brain size={14}/> 潜意识连接</h3>
                    <p className="text-[10px] text-ink-400">触碰内心深处的柔软</p>
                 </div>
                 <div className="p-4 rounded-2xl bg-white/30 border border-white hover:bg-white hover:shadow-sm transition-all duration-300">
                    <h3 className="text-xs font-bold text-amber-600 font-sans mb-1 flex items-center justify-center gap-1"><HeartHandshake size={14}/> 情绪疗愈</h3>
                    <p className="text-[10px] text-ink-400">拥抱真实的感受</p>
                 </div>
                 <div className="p-4 rounded-2xl bg-white/30 border border-white hover:bg-white hover:shadow-sm transition-all duration-300">
                    <h3 className="text-xs font-bold text-sky-600 font-sans mb-1 flex items-center justify-center gap-1"><Lightbulb size={14}/> 生活指引</h3>
                    <p className="text-[10px] text-ink-400">照亮前行的方向</p>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
