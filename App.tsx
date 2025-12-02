import React, { useState, useEffect } from 'react';
import { DreamEntry } from './types';
import { analyzeDream } from './services/geminiService';
import { DreamCard } from './components/DreamCard';
import { AnalysisView } from './components/AnalysisView';
import { DashboardView } from './components/DashboardView';
import { LibraryView } from './components/LibraryView';
import { TarotView } from './components/TarotView';
import { PlusCircle, Loader2, Sparkles, History, Menu, X, Brain, HeartHandshake, Lightbulb, Feather, BarChart3, BookHeart, Quote, Compass, Eye } from 'lucide-react';

const STORAGE_KEY = 'dreamweaver_data';

const App: React.FC = () => {
  // State
  const [dreams, setDreams] = useState<DreamEntry[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedDreamId, setSelectedDreamId] = useState<string | null>(null);
  const [showHistoryMobile, setShowHistoryMobile] = useState(false);
  const [viewMode, setViewMode] = useState<'entry' | 'dashboard' | 'library' | 'tarot'>('entry');

  // Load from local storage on mount
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

  // Save to local storage whenever dreams change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dreams));
  }, [dreams]);

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
    <div className="min-h-screen bg-paper text-ink-800 flex overflow-hidden relative selection:bg-lavender-200 selection:text-indigo-900 font-sans">
      
      {/* Background Ambience - Softer blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none bg-paper">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-100/40 rounded-full blur-[100px] animate-blob mix-blend-multiply"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-100/40 rounded-full blur-[120px] animate-blob animation-delay-2000 mix-blend-multiply"></div>
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-pink-100/30 rounded-full blur-[80px] animate-blob animation-delay-4000 mix-blend-multiply"></div>
      </div>

      {/* Mobile Header / Nav */}
      <div className="md:hidden fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-lavender-100 p-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2 text-lavender-600">
           <Feather size={20} />
           <span className="font-hand font-bold text-xl text-ink-800">DreamWeaver</span>
        </div>
        <button onClick={() => setShowHistoryMobile(!showHistoryMobile)} className="text-ink-500">
          {showHistoryMobile ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar (History & Nav) */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-80 bg-white/50 backdrop-blur-xl border-r border-white/40 transform transition-transform duration-500 ease-in-out shadow-[4px_0_24px_rgba(0,0,0,0.02)]
        md:relative md:translate-x-0 md:bg-white/30 md:backdrop-blur-none
        ${showHistoryMobile ? 'translate-x-0 top-[60px]' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full p-4 md:p-6">
          <div className="hidden md:flex items-center gap-3 mb-8 text-lavender-500 px-2 mt-2">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <Feather size={24} />
            </div>
            <h1 className="font-hand font-bold text-3xl text-ink-800 tracking-wide">DreamWeaver</h1>
          </div>

          <div className="grid grid-cols-4 gap-1 mb-8">
            <button 
                onClick={() => {
                setSelectedDreamId(null);
                setViewMode('entry');
                setShowHistoryMobile(false);
                }}
                className={`flex flex-col items-center justify-center gap-1 py-3 px-1 rounded-2xl transition-all border
                ${viewMode === 'entry' && !selectedDreamId 
                    ? 'bg-white shadow-md border-lavender-100 text-lavender-600' 
                    : 'bg-white/40 border-transparent hover:bg-white/60 text-ink-500'}`}
            >
                <PlusCircle size={20} />
                <span className="font-sans text-[10px] font-bold">记梦</span>
            </button>
            <button 
                onClick={() => {
                setSelectedDreamId(null);
                setViewMode('dashboard');
                setShowHistoryMobile(false);
                }}
                className={`flex flex-col items-center justify-center gap-1 py-3 px-1 rounded-2xl transition-all border
                ${viewMode === 'dashboard' 
                    ? 'bg-white shadow-md border-lavender-100 text-lavender-600' 
                    : 'bg-white/40 border-transparent hover:bg-white/60 text-ink-500'}`}
            >
                <BarChart3 size={20} />
                <span className="font-sans text-[10px] font-bold">洞察</span>
            </button>
            <button 
                onClick={() => {
                setSelectedDreamId(null);
                setViewMode('library');
                setShowHistoryMobile(false);
                }}
                className={`flex flex-col items-center justify-center gap-1 py-3 px-1 rounded-2xl transition-all border
                ${viewMode === 'library' 
                    ? 'bg-white shadow-md border-lavender-100 text-lavender-600' 
                    : 'bg-white/40 border-transparent hover:bg-white/60 text-ink-500'}`}
            >
                <Compass size={20} />
                <span className="font-sans text-[10px] font-bold">灵感</span>
            </button>
            <button 
                onClick={() => {
                setSelectedDreamId(null);
                setViewMode('tarot');
                setShowHistoryMobile(false);
                }}
                className={`flex flex-col items-center justify-center gap-1 py-3 px-1 rounded-2xl transition-all border
                ${viewMode === 'tarot' 
                    ? 'bg-white shadow-md border-lavender-100 text-lavender-600' 
                    : 'bg-white/40 border-transparent hover:bg-white/60 text-ink-500'}`}
            >
                <Eye size={20} />
                <span className="font-sans text-[10px] font-bold">塔罗</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-ink-400 text-xs font-bold uppercase tracking-widest mb-4 px-2 font-sans">
            <History size={12} />
            <span>时间轴</span>
          </div>

          <div className="flex-1 overflow-y-auto -mx-2 px-2 pb-20 md:pb-0 custom-scrollbar">
            {dreams.length === 0 ? (
              <div className="text-center text-ink-400 mt-10 p-6 border-2 border-dashed border-lavender-100 rounded-2xl bg-white/30">
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
          ) : selectedDreamId && currentDream ? (
            <AnalysisView 
              dream={currentDream} 
              onBack={() => setSelectedDreamId(null)}
              onUpdateDream={handleUpdateDream}
            />
          ) : (
            // New Entry View
            <div className="h-full flex flex-col justify-center items-center max-w-2xl mx-auto animate-fade-in pb-10">
              
              {/* Daily Dream Quote */}
              {latestDream && latestDream.analysis && (
                <div className="w-full mb-8 animate-fade-in">
                  <div className="bg-white/40 backdrop-blur-sm p-6 rounded-2xl border border-white/50 shadow-sm relative overflow-hidden group hover:bg-white/60 transition-colors mx-auto max-w-xl">
                    <Quote className="absolute top-4 left-4 text-lavender-300 w-8 h-8 opacity-30 transform -scale-x-100" />
                    <Quote className="absolute bottom-4 right-4 text-lavender-300 w-8 h-8 opacity-30" />
                    <div className="relative z-10 text-center px-4">
                        <div className="flex items-center justify-center gap-2 mb-3">
                           <Sparkles size={14} className="text-lavender-400"/>
                           <h3 className="text-xs font-bold text-lavender-500 uppercase tracking-widest font-sans">今日梦语</h3>
                           <Sparkles size={14} className="text-lavender-400"/>
                        </div>
                        <p className="text-ink-700 font-hand text-xl md:text-2xl leading-relaxed opacity-90">
                          "{latestDream.analysis.guidance.length > 50 ? latestDream.analysis.guidance.substring(0, 48) + '...' : latestDream.analysis.guidance}"
                        </p>
                        <div className="mt-4 text-xs text-ink-400 font-sans flex items-center justify-center gap-1 opacity-70">
                          <span>— 源自梦境</span>
                          <span className="font-bold text-lavender-500">《{latestDream.analysis.title}》</span>
                        </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-center mb-10">
                <h2 className="text-4xl md:text-6xl font-hand font-medium mb-4 text-ink-800 leading-tight">
                  今晚，<br className="md:hidden"/>梦见了什么？
                </h2>
                <p className="text-ink-500 font-sans text-sm md:text-base tracking-wide max-w-md mx-auto">
                  在这片柔和的角落，记下潜意识的低语。<br/>我们将为你轻轻解开心灵的谜题。
                </p>
              </div>

              <div className="w-full bg-white rounded-3xl p-3 shadow-xl shadow-indigo-100/50 relative group focus-within:shadow-2xl focus-within:shadow-indigo-200/50 transition-all duration-500 border border-white">
                {/* Notebook lines effect (optional styling choice, keeping it clean for now) */}
                <textarea 
                  className="w-full h-48 md:h-64 bg-transparent border-none resize-none p-4 md:p-6 text-lg text-ink-700 placeholder-ink-300 focus:ring-0 focus:outline-none font-hand leading-loose tracking-wide"
                  placeholder="在这里写下你的梦境... 
例如：我梦见在一个铺满棉花糖的云端散步，手里拿着一把会唱歌的蓝色雨伞..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={isAnalyzing}
                />
                
                <div className="flex justify-between items-center px-4 pb-4 mt-2 border-t border-dashed border-gray-100 pt-4">
                  <span className="text-xs text-ink-400 font-sans">
                    {inputText.length > 0 ? `${inputText.length} 字` : ' '}
                  </span>
                  
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !inputText.trim()}
                    className={`
                      flex items-center gap-2 px-8 py-3 rounded-2xl font-bold transition-all duration-300 shadow-sm font-sans text-sm tracking-wide
                      ${isAnalyzing || !inputText.trim()
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-lavender-600 text-white hover:bg-lavender-500 hover:shadow-lg hover:shadow-lavender-300 hover:-translate-y-1'}
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

              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-center px-4">
                 <div className="p-5 rounded-2xl bg-white/50 border border-white shadow-sm hover:bg-white hover:shadow-md transition-all duration-300">
                    <div className="text-indigo-400 mb-3 flex justify-center bg-indigo-50 w-10 h-10 items-center rounded-full mx-auto"><Brain size={20}/></div>
                    <h3 className="text-sm font-bold text-ink-700 font-sans mb-1">潜意识连接</h3>
                    <p className="text-xs text-ink-400">触碰内心深处的柔软</p>
                 </div>
                 <div className="p-5 rounded-2xl bg-white/50 border border-white shadow-sm hover:bg-white hover:shadow-md transition-all duration-300">
                    <div className="text-rose-400 mb-3 flex justify-center bg-rose-50 w-10 h-10 items-center rounded-full mx-auto"><HeartHandshake size={20}/></div>
                    <h3 className="text-sm font-bold text-ink-700 font-sans mb-1">情绪疗愈</h3>
                    <p className="text-xs text-ink-400">拥抱真实的感受</p>
                 </div>
                 <div className="p-5 rounded-2xl bg-white/50 border border-white shadow-sm hover:bg-white hover:shadow-md transition-all duration-300">
                    <div className="text-emerald-400 mb-3 flex justify-center bg-emerald-50 w-10 h-10 items-center rounded-full mx-auto"><Lightbulb size={20}/></div>
                    <h3 className="text-sm font-bold text-ink-700 font-sans mb-1">生活指引</h3>
                    <p className="text-xs text-ink-400">照亮前行的方向</p>
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