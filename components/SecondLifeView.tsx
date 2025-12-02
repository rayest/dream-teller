
import React, { useState } from 'react';
import { DreamEntry, SecondLifeState, SecondLifeEvent } from '../types';
import { evolveSecondLife } from '../services/geminiService';
import { Shield, Zap, Sparkles, Scroll, Trophy, Gift, Dna, Crown, Map, Swords, Loader2, ArrowRight } from 'lucide-react';

interface SecondLifeViewProps {
  state: SecondLifeState;
  dreams: DreamEntry[];
  onUpdateState: (newState: SecondLifeState) => void;
}

export const SecondLifeView: React.FC<SecondLifeViewProps> = ({ state, dreams, onUpdateState }) => {
  const [isEvolving, setIsEvolving] = useState(false);

  // Identify unsynced dreams
  const unsyncedDreams = dreams.filter(d => !state.syncedDreamIds.includes(d.id));

  const handleSync = async () => {
    if (unsyncedDreams.length === 0) return;
    
    setIsEvolving(true);
    const dreamToSync = unsyncedDreams[0]; // Sync one at a time for dramatic effect

    try {
      const { event, profileUpdates } = await evolveSecondLife(dreamToSync, state);

      // Level Up Logic (Simple: every 100 exp or just accumulated stats)
      // Let's just accumulate stats and calculate level derived from total stats
      const newAttributes = {
         lucidity: state.profile.attributes.lucidity + (event.attributeChanges.lucidity || 0),
         imagination: state.profile.attributes.imagination + (event.attributeChanges.imagination || 0),
         resilience: state.profile.attributes.resilience + (event.attributeChanges.resilience || 0),
      };

      const totalStats = newAttributes.lucidity + newAttributes.imagination + newAttributes.resilience;
      const newLevel = Math.floor(totalStats / 10) + 1; // Simple formula

      const newState: SecondLifeState = {
        ...state,
        profile: {
          ...state.profile,
          level: newLevel,
          attributes: newAttributes,
          // Could also update title/archetype based on dominant stat in future
        },
        events: [event, ...state.events],
        inventory: event.acquiredTotem ? [event.acquiredTotem, ...state.inventory] : state.inventory,
        syncedDreamIds: [...state.syncedDreamIds, dreamToSync.id]
      };

      onUpdateState(newState);

    } catch (error) {
      alert("同步失败，请稍后重试。");
    } finally {
      setIsEvolving(false);
    }
  };

  const { profile } = state;

  return (
    <div className="animate-fade-in h-full overflow-y-auto pr-2 pb-10 custom-scrollbar">
      {/* Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
           <h1 className="text-4xl font-hand font-bold text-ink-800 mb-2">第二人生</h1>
           <p className="text-ink-500 font-sans text-sm">梦境编织的平行宇宙，你的英雄之旅。</p>
        </div>
        {unsyncedDreams.length > 0 && (
           <button 
             onClick={handleSync}
             disabled={isEvolving}
             className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all font-bold font-sans flex items-center gap-2"
           >
             {isEvolving ? <Loader2 className="animate-spin" /> : <Dna size={18} />}
             <span>同步梦境能量 ({unsyncedDreams.length})</span>
           </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Character Sheet */}
        <div className="lg:col-span-1 space-y-6">
           
           {/* Profile Card */}
           <div className="bg-slate-800 text-slate-100 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
               {/* Bg Pattern */}
               <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
               <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/30 rounded-full blur-2xl"></div>

               <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-slate-700 rounded-full border-4 border-slate-600 flex items-center justify-center mb-3 shadow-inner">
                      <span className="text-4xl">🧙‍♂️</span>
                  </div>
                  <h2 className="text-2xl font-hand font-bold text-amber-400">{profile.title}</h2>
                  <p className="text-xs font-sans text-slate-400 uppercase tracking-widest mb-4">{profile.archetype}</p>
                  
                  <div className="w-full h-px bg-slate-700 mb-4"></div>

                  <div className="w-full grid grid-cols-3 gap-2 text-center">
                     <div className="flex flex-col items-center">
                        <div className="p-2 bg-sky-900/50 rounded-lg text-sky-400 mb-1"><Zap size={16}/></div>
                        <span className="text-lg font-bold">{profile.attributes.lucidity}</span>
                        <span className="text-[10px] text-slate-500">清醒</span>
                     </div>
                     <div className="flex flex-col items-center">
                        <div className="p-2 bg-purple-900/50 rounded-lg text-purple-400 mb-1"><Sparkles size={16}/></div>
                        <span className="text-lg font-bold">{profile.attributes.imagination}</span>
                        <span className="text-[10px] text-slate-500">想象</span>
                     </div>
                     <div className="flex flex-col items-center">
                        <div className="p-2 bg-red-900/50 rounded-lg text-red-400 mb-1"><Shield size={16}/></div>
                        <span className="text-lg font-bold">{profile.attributes.resilience}</span>
                        <span className="text-[10px] text-slate-500">韧性</span>
                     </div>
                  </div>
                  
                  <div className="mt-4 px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold font-sans">
                     Level {profile.level}
                  </div>
               </div>
           </div>

           {/* Inventory */}
           <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-white shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-slate-600">
                  <Gift size={20} />
                  <h3 className="font-hand font-bold text-xl">梦境行囊</h3>
              </div>
              <div className="grid grid-cols-4 gap-2">
                 {state.inventory.length > 0 ? state.inventory.map((item) => (
                    <div key={item.id} className="aspect-square bg-slate-100 rounded-xl flex items-center justify-center text-2xl relative group cursor-help border border-slate-200 hover:border-amber-300 transition-colors">
                        {item.icon}
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 text-center">
                           <div className={`font-bold mb-1 ${
                               item.rarity === 'legendary' ? 'text-amber-400' : 
                               item.rarity === 'epic' ? 'text-purple-400' : 
                               item.rarity === 'rare' ? 'text-sky-400' : 'text-slate-300'
                           }`}>{item.name}</div>
                           <div className="opacity-80 text-[10px]">{item.description}</div>
                        </div>
                    </div>
                 )) : (
                    <div className="col-span-4 text-center text-xs text-slate-400 py-4 border-2 border-dashed border-slate-100 rounded-xl">
                       暂无图腾
                    </div>
                 )}
              </div>
           </div>
           
           {/* Current Quest */}
           {state.events.length > 0 && (
               <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 border border-amber-100 shadow-sm">
                   <div className="flex items-center gap-2 mb-3 text-amber-700">
                       <Scroll size={20} />
                       <h3 className="font-hand font-bold text-xl">同步性任务</h3>
                   </div>
                   <div className="bg-white/60 p-4 rounded-xl text-ink-700 font-sans text-sm leading-relaxed border border-amber-200/30">
                       {state.events[0].realWorldQuest}
                   </div>
                   <div className="mt-2 text-[10px] text-amber-500 font-sans text-right">
                       完成任务以增强梦境连接
                   </div>
               </div>
           )}

        </div>

        {/* Right Col: Timeline */}
        <div className="lg:col-span-2">
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-white shadow-sm min-h-[500px]">
                <div className="flex items-center gap-2 mb-6 text-slate-600">
                    <Map size={20} />
                    <h3 className="font-hand font-bold text-xl">冒险日志</h3>
                </div>

                <div className="space-y-8 relative pl-4">
                    {/* Vertical Line */}
                    <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-slate-200"></div>

                    {state.events.length > 0 ? state.events.map((event, idx) => (
                        <div key={event.id} className="relative pl-10 animate-fade-in group">
                            {/* Dot */}
                            <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-4 border-slate-300 group-hover:border-amber-400 transition-colors z-10"></div>
                            
                            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-hand font-bold text-lg text-ink-800">{event.chapterTitle}</h4>
                                    <span className="text-xs font-sans text-slate-400 bg-slate-50 px-2 py-1 rounded">{event.date}</span>
                                </div>
                                <p className="text-ink-600 font-sans text-sm leading-relaxed mb-3 text-justify">
                                    {event.narrative}
                                </p>
                                
                                {/* Changes/Rewards */}
                                <div className="flex flex-wrap gap-2 text-xs font-sans">
                                    {event.attributeChanges.lucidity && event.attributeChanges.lucidity > 0 && (
                                        <span className="px-2 py-1 bg-sky-50 text-sky-600 rounded flex items-center gap-1">
                                            <Zap size={10} /> +{event.attributeChanges.lucidity} 清醒
                                        </span>
                                    )}
                                    {event.attributeChanges.imagination && event.attributeChanges.imagination > 0 && (
                                        <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded flex items-center gap-1">
                                            <Sparkles size={10} /> +{event.attributeChanges.imagination} 想象
                                        </span>
                                    )}
                                    {event.attributeChanges.resilience && event.attributeChanges.resilience > 0 && (
                                        <span className="px-2 py-1 bg-red-50 text-red-600 rounded flex items-center gap-1">
                                            <Shield size={10} /> +{event.attributeChanges.resilience} 韧性
                                        </span>
                                    )}
                                    {event.acquiredTotem && (
                                        <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded flex items-center gap-1 font-bold border border-amber-100">
                                            <Trophy size={10} /> 获得: {event.acquiredTotem.name}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="pl-10 text-slate-400 text-sm font-hand italic py-10">
                            冒险尚未开始...同步梦境以开启第二人生。
                        </div>
                    )}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};
