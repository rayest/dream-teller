import React, { useState, useEffect, useRef } from 'react';
import { DreamEntry } from '../types';
import { Sparkles, HeartHandshake, Brain, Lightbulb, Tag, Share2, Check, Info, Waves, PlayCircle, StopCircle, Loader2, Palette, Image as ImageIcon, Wand2, Feather, BookOpen, Scroll, HelpCircle } from 'lucide-react';
import { generateSoundscapeParams, generateDreamImage, generateCreativeWriting } from '../services/geminiService';
import { DreamSynthesizer } from '../utils/audioEngine';

interface AnalysisViewProps {
  dream: DreamEntry;
  onBack: () => void;
  onUpdateDream?: (id: string, updates: Partial<DreamEntry>) => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ dream, onBack, onUpdateDream }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingCreative, setIsGeneratingCreative] = useState(false);
  
  // Audio Engine Refs
  const synthRef = useRef<DreamSynthesizer | null>(null);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.stop();
      }
    };
  }, []);

  if (!dream.analysis) return null;

  const { title, summary, interpretation, emotionalState, psychologicalMeaning, guidance, keywords, dominantEmotion, emotionalIntensity, followUpQuestions } = dream.analysis;

  const handleShare = async () => {
    const shareText = `【梦境解析】\n\n🌙 ${title}\n\n📜 摘要：\n${summary}\n\n🧠 解析：\n${interpretation}\n\n💡 建议：\n${guidance}\n\n✨ 来自 梦境日记`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `梦境日记: ${title}`,
          text: shareText,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
        alert('复制失败，请手动复制');
      }
    }
  };

  const handleGenerateSoundscape = async () => {
    if (!dream.analysis || !onUpdateDream) return;
    
    setIsGeneratingMusic(true);
    try {
      const params = await generateSoundscapeParams(dream.analysis);
      onUpdateDream(dream.id, { soundscapeParams: params });
    } catch (error) {
      console.error(error);
      alert("无法生成音景参数，请稍后再试。");
    } finally {
      setIsGeneratingMusic(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!dream.analysis || !onUpdateDream) return;

    // System automatically sets style to Surrealism
    const styleToUse = "超现实主义 (Surrealism)";
    
    setIsGeneratingImage(true);
    try {
        const imageBase64 = await generateDreamImage(dream.analysis, styleToUse);
        onUpdateDream(dream.id, { 
            generatedImage: imageBase64,
            artStyle: styleToUse
        });
    } catch (error) {
        console.error(error);
        alert("无法生成图像，请检查 API 密钥权限或稍后再试。");
    } finally {
        setIsGeneratingImage(false);
    }
  };

  const handleGenerateCreative = async (type: 'story' | 'poem') => {
      if (!dream.analysis || !onUpdateDream) return;
      setIsGeneratingCreative(true);
      try {
          const result = await generateCreativeWriting(dream.content, dream.analysis, type);
          onUpdateDream(dream.id, { creativeWriting: result });
      } catch (error) {
          console.error(error);
          alert("创作失败，请稍后再试。");
      } finally {
          setIsGeneratingCreative(false);
      }
  }

  const togglePlayback = () => {
    if (!dream.soundscapeParams) return;

    if (isPlaying) {
      synthRef.current?.stop();
      setIsPlaying(false);
    } else {
      synthRef.current = new DreamSynthesizer(dream.soundscapeParams);
      synthRef.current.start();
      setIsPlaying(true);
    }
  };

  // Helper to determine visual style based on soundscape params
  const getVisualizerStyle = (texture: string) => {
    switch (texture) {
        case 'ethereal':
            return {
                bg: 'bg-gradient-to-br from-cyan-100 via-sky-100 to-blue-50',
                text: 'text-cyan-900',
                accent: 'bg-white/40',
                iconColor: 'text-cyan-600',
                particle: 'bg-cyan-300',
                border: 'border-white/50'
            };
        case 'warm':
            return {
                bg: 'bg-gradient-to-br from-orange-100 via-amber-100 to-yellow-50',
                text: 'text-amber-900',
                accent: 'bg-white/40',
                iconColor: 'text-amber-600',
                particle: 'bg-orange-300',
                border: 'border-white/50'
            };
        case 'dark':
            return {
                bg: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950',
                text: 'text-slate-100',
                accent: 'bg-white/10',
                iconColor: 'text-slate-300',
                particle: 'bg-slate-400',
                border: 'border-white/10'
            };
        case 'gritty':
            return {
                bg: 'bg-gradient-to-br from-stone-200 via-stone-300 to-stone-100',
                text: 'text-stone-800',
                accent: 'bg-stone-400/20',
                iconColor: 'text-stone-600',
                particle: 'bg-stone-500',
                border: 'border-stone-400/30'
            };
        default:
            return {
                bg: 'bg-gradient-to-br from-gray-100 to-gray-200',
                text: 'text-gray-800',
                accent: 'bg-white',
                iconColor: 'text-gray-600',
                particle: 'bg-gray-400',
                border: 'border-gray-200'
            };
    }
  };

  const visualStyle = dream.soundscapeParams 
    ? getVisualizerStyle(dream.soundscapeParams.texture)
    : getVisualizerStyle('default');

  return (
    <div className="animate-fade-in h-full overflow-y-auto pr-2 pb-10 custom-scrollbar">
      <button 
        onClick={onBack}
        className="md:hidden mb-4 text-sm text-ink-500 hover:text-slate-600 flex items-center transition-colors font-sans"
      >
        ← 返回列表
      </button>

      {/* Header Section */}
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-6 md:p-8 border border-white/60 shadow-sm mb-6 relative overflow-hidden group/header">
        {/* Share Button */}
        <button
          onClick={handleShare}
          className="absolute top-4 right-4 md:top-6 md:right-6 p-2.5 rounded-full bg-white/60 hover:bg-white text-ink-400 hover:text-slate-600 transition-all duration-300 shadow-sm z-20 backdrop-blur-sm group-hover/header:opacity-100"
          title="分享梦境"
        >
          {isCopied ? <Check size={20} className="text-emerald-500" /> : <Share2 size={20} />}
        </button>

        {/* Decorative background blob */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-slate-200/20 rounded-full blur-3xl"></div>
        
        <div className="flex items-center gap-2 text-slate-500 mb-3 text-sm uppercase tracking-widest font-bold">
           <Sparkles size={16} /> 
           <span className="font-sans">梦境解析</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-hand text-ink-900 mb-5 leading-relaxed drop-shadow-sm pr-12">{title}</h1>
        
        <div className="flex flex-wrap gap-2 mb-6 relative z-10">
          {keywords.map((keyword, idx) => (
            <span key={idx} className="px-4 py-1.5 rounded-full bg-white text-sm text-ink-600 border border-slate-100 shadow-sm flex items-center font-hand">
              <Tag size={12} className="mr-1.5 text-slate-400" /> {keyword}
            </span>
          ))}
        </div>
        
        <div className="bg-white/60 rounded-2xl p-6 text-ink-600 italic border-l-4 border-slate-300 font-sans leading-loose relative z-10">
          "{summary}"
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Recall Guide */}
        {followUpQuestions && followUpQuestions.length > 0 && (
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-white shadow-sm hover:shadow-md transition-all duration-500 md:col-span-2">
                <div className="flex items-center gap-3 mb-4 text-sky-600">
                    <div className="p-2 bg-sky-50 rounded-xl">
                        <HelpCircle size={24} />
                    </div>
                    <h2 className="text-2xl font-hand font-bold text-ink-800">记忆回溯</h2>
                </div>
                <div className="bg-sky-50/30 rounded-2xl p-4 border border-sky-100/50">
                    <p className="text-sm text-ink-500 font-sans mb-3">AI 察觉到梦境中可能隐藏着更多细节。尝试回想以下问题，也许能唤醒更深层的连接：</p>
                    <ul className="space-y-2">
                        {followUpQuestions.map((q, i) => (
                            <li key={i} className="flex items-start gap-2 text-ink-700 font-hand text-lg">
                                <span className="text-sky-300 mt-1">•</span>
                                {q}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        )}

        {/* Interpretation - Slate Theme */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-white shadow-sm hover:shadow-md transition-all duration-500 group">
          <div className="flex items-center gap-3 mb-4 text-slate-500 group-hover:scale-105 transition-transform origin-left">
            <div className="p-2 bg-slate-100 rounded-xl">
               <Brain size={24} />
            </div>
            <h2 className="text-2xl font-hand font-bold text-ink-800">深度解析</h2>
          </div>
          <p className="text-ink-600 leading-relaxed whitespace-pre-line font-sans">{interpretation}</p>
        </div>

        {/* Psychological Meaning - Sky/Slate Theme (Replaced Purple) */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-white shadow-sm hover:shadow-md transition-all duration-500 group relative z-10">
          <div className="flex items-start gap-3 mb-4 text-sky-600 group-hover:scale-105 transition-transform origin-left">
            <div className="p-2 bg-sky-50 rounded-xl mt-1">
              <Lightbulb size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-hand font-bold text-ink-800 leading-none mb-1.5">潜意识讯息</h2>
              <div className="flex items-center gap-1.5 relative group/tooltip cursor-help w-fit">
                 <span className="text-xs font-sans font-bold text-sky-500/80 uppercase tracking-wider">分析师的洞察</span>
                 <Info size={13} className="text-sky-300" />
                 
                 {/* Tooltip */}
                 <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-slate-800/95 backdrop-blur-sm text-white text-xs rounded-xl shadow-xl opacity-0 translate-y-2 group-hover/tooltip:opacity-100 group-hover/tooltip:translate-y-0 transition-all duration-300 pointer-events-none z-50 font-sans leading-relaxed border border-white/10">
                   此板块尝试解读梦境表象之下的深层心理活动，包括被压抑的愿望、未解决的冲突或内心成长的指引。
                   <div className="absolute top-full left-6 -mt-[1px] border-4 border-transparent border-t-slate-800/95"></div>
                 </div>
              </div>
            </div>
          </div>
          <p className="text-ink-600 leading-relaxed whitespace-pre-line font-sans">{psychologicalMeaning}</p>
        </div>

        {/* Emotional State - Amber Theme */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-white shadow-sm hover:shadow-md transition-all duration-500 group">
          <div className="flex items-center gap-3 mb-4 text-amber-500 group-hover:scale-105 transition-transform origin-left">
            <div className="p-2 bg-amber-50 rounded-xl">
              <HeartHandshake size={24} />
            </div>
            <h2 className="text-2xl font-hand font-bold text-ink-800">情绪图谱</h2>
          </div>
          
          <div className="mb-6 bg-amber-50/50 rounded-2xl p-4 border border-amber-100/50">
            {dominantEmotion && (
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-ink-500 font-sans font-semibold">主导情绪</span>
                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm font-hand font-bold">
                  {dominantEmotion}
                </span>
              </div>
            )}
            
            {emotionalIntensity !== undefined && (
              <div>
                <div className="flex justify-between text-xs text-ink-400 mb-1.5 font-sans">
                  <span>平静</span>
                  <span>强烈</span>
                </div>
                <div className="h-3 w-full bg-amber-100/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-300 to-amber-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${emotionalIntensity * 10}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <p className="text-ink-600 leading-relaxed whitespace-pre-line font-sans">{emotionalState}</p>
        </div>

        {/* Creative Studio - Stone/Amber Theme */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-white shadow-sm hover:shadow-md transition-all duration-500 group">
            <div className="flex items-center gap-3 mb-4 text-stone-500 group-hover:scale-105 transition-transform origin-left">
                <div className="p-2 bg-stone-100 rounded-xl">
                    <Feather size={24} />
                </div>
                <h2 className="text-2xl font-hand font-bold text-ink-800">创意工坊</h2>
            </div>
            
            {!dream.creativeWriting ? (
                <div className="text-center py-6 bg-stone-50/50 rounded-2xl border border-stone-100">
                    <p className="text-ink-500 font-sans text-sm mb-4 px-4">将零散的梦境碎片，编织成文学作品。</p>
                    <div className="flex gap-3 justify-center">
                        <button 
                            onClick={() => handleGenerateCreative('story')}
                            disabled={isGeneratingCreative}
                            className="px-4 py-2 bg-white text-ink-700 border border-stone-200 rounded-xl hover:bg-stone-100 hover:text-stone-800 transition-colors flex items-center gap-2 text-sm font-bold shadow-sm"
                        >
                            {isGeneratingCreative ? <Loader2 size={16} className="animate-spin"/> : <BookOpen size={16} />}
                            编织故事
                        </button>
                        <button 
                            onClick={() => handleGenerateCreative('poem')}
                            disabled={isGeneratingCreative}
                            className="px-4 py-2 bg-white text-ink-700 border border-stone-200 rounded-xl hover:bg-stone-100 hover:text-stone-800 transition-colors flex items-center gap-2 text-sm font-bold shadow-sm"
                        >
                             {isGeneratingCreative ? <Loader2 size={16} className="animate-spin"/> : <Scroll size={16} />}
                            谱写诗歌
                        </button>
                    </div>
                </div>
            ) : (
                <div className="relative animate-fade-in">
                    <div className="bg-[#fcfbf7] p-6 rounded-xl border border-stone-200 shadow-inner font-hand relative">
                        {/* Paper texture effect */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-b from-black/5 to-transparent"></div>
                        
                        <div className="text-center mb-4 pb-4 border-b border-stone-200 border-dashed">
                             <span className="text-xs text-stone-400 uppercase tracking-widest font-sans font-bold block mb-1">
                                {dream.creativeWriting.type === 'story' ? 'MICRO FICTION' : 'POETRY'}
                             </span>
                             <h3 className="text-2xl text-ink-800 font-bold">{dream.creativeWriting.title}</h3>
                        </div>
                        
                        <div className={`text-ink-700 leading-loose whitespace-pre-line ${dream.creativeWriting.type === 'poem' ? 'text-center' : 'text-justify'}`}>
                            {dream.creativeWriting.content}
                        </div>

                        <button 
                            onClick={() => onUpdateDream && onUpdateDream(dream.id, { creativeWriting: undefined })}
                            className="mt-6 w-full py-2 text-xs text-stone-400 hover:text-amber-600 font-sans flex items-center justify-center gap-1 transition-colors border-t border-stone-100"
                        >
                            <Wand2 size={12} /> 重新创作
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* AI Generative Soundscape */}
        <div className={`
            rounded-3xl p-6 shadow-lg relative overflow-hidden group transition-all duration-1000
            ${visualStyle.bg} ${visualStyle.text} border ${visualStyle.border}
        `}>
           {/* Dynamic Background Particles */}
           {isPlaying && (
              <>
                <div className={`absolute top-0 left-0 w-full h-full mix-blend-overlay opacity-30 animate-pulse bg-gradient-to-r from-transparent via-white/20 to-transparent`}></div>
                <div className={`absolute -right-10 -bottom-10 w-48 h-48 rounded-full blur-3xl transition-all duration-[3000ms] animate-blob ${visualStyle.particle} opacity-40`}></div>
                <div className={`absolute -left-10 -top-10 w-40 h-40 rounded-full blur-3xl transition-all duration-[4000ms] animate-blob animation-delay-2000 ${visualStyle.particle} opacity-30`}></div>
              </>
           )}

           <div className={`flex items-center gap-3 mb-4 relative z-10 ${visualStyle.iconColor}`}>
              <div className={`p-2 rounded-xl backdrop-blur-md ${visualStyle.accent}`}>
                 <Waves size={24} />
              </div>
              <h2 className="text-2xl font-hand font-bold">音律共鸣 (AI 生成)</h2>
           </div>

           {!dream.soundscapeParams ? (
              <div className="relative z-10">
                 <p className="opacity-80 text-sm mb-4 font-sans leading-relaxed">
                   根据梦境情绪实时合成独一无二的音景。
                 </p>
                 <button 
                   onClick={handleGenerateSoundscape}
                   disabled={isGeneratingMusic}
                   className={`w-full py-3 ${visualStyle.accent} hover:bg-white/50 border border-white/20 rounded-xl flex items-center justify-center gap-2 transition-all font-sans font-medium text-sm`}
                 >
                   {isGeneratingMusic ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16} />}
                   {isGeneratingMusic ? "正在解析频率..." : "生成梦境音景"}
                 </button>
              </div>
           ) : (
             <div className="relative z-10 animate-fade-in">
                <div className={`${visualStyle.accent} rounded-xl p-4 mb-4 backdrop-blur-sm border ${visualStyle.border}`}>
                   <p className="text-lg font-hand mb-2 font-bold opacity-90">
                     "{dream.soundscapeParams.moodDescription}"
                   </p>
                   <div className="flex gap-2 text-[10px] opacity-60 uppercase tracking-widest font-sans mb-4">
                      <span className="border border-current px-2 py-1 rounded">{dream.soundscapeParams.scale.replace('_', ' ')}</span>
                      <span className="border border-current px-2 py-1 rounded">{dream.soundscapeParams.rootFreq} Hz</span>
                      <span className="border border-current px-2 py-1 rounded">{dream.soundscapeParams.texture}</span>
                   </div>

                   <button 
                     onClick={togglePlayback}
                     className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 transition-all font-sans font-bold shadow-lg text-white
                       ${isPlaying 
                         ? 'bg-amber-500/90 hover:bg-amber-600' 
                         : 'bg-slate-700/90 hover:bg-slate-600'}
                     `}
                   >
                     {isPlaying ? (
                       <>
                         <StopCircle size={24} className="animate-pulse"/> 
                         <span>停止共鸣</span>
                       </>
                     ) : (
                       <>
                         <PlayCircle size={24} /> 
                         <span>播放音景</span>
                       </>
                     )}
                   </button>
                </div>
             </div>
           )}
        </div>

        {/* Dream Gallery - Slate Theme (Replaced Violet) */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-white shadow-sm hover:shadow-md transition-all duration-500 group md:col-span-2">
            <div className="flex items-center gap-3 mb-4 text-slate-600 group-hover:scale-[1.01] transition-transform origin-left">
                <div className="p-2 bg-slate-100 rounded-xl">
                    <Palette size={24} />
                </div>
                <h2 className="text-2xl font-hand font-bold text-ink-800">梦境画廊 (超现实主义)</h2>
            </div>

            {!dream.generatedImage ? (
                <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100/50 flex flex-col items-center text-center">
                    <p className="text-ink-500 font-sans text-sm mb-4 max-w-md">
                        AI 将根据梦境关键词，自动为你绘制一幅<b>超现实主义 (Surrealism)</b> 风格的艺术画作，重现潜意识的梦幻场景。
                    </p>

                    <button
                        onClick={handleGenerateImage}
                        disabled={isGeneratingImage}
                        className={`px-8 py-3 rounded-xl font-bold text-white transition-all flex items-center gap-2 shadow-lg shadow-slate-200
                            ${isGeneratingImage 
                                ? 'bg-slate-300 cursor-not-allowed' 
                                : 'bg-slate-800 hover:bg-slate-900 hover:scale-105'}
                        `}
                    >
                        {isGeneratingImage ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                        <span>揭示梦境映像</span>
                    </button>
                </div>
            ) : (
                <div className="relative animate-fade-in group/image">
                     {/* Image Display */}
                     <div className="relative rounded-2xl overflow-hidden shadow-xl border-4 border-white bg-white">
                         <img 
                            src={dream.generatedImage} 
                            alt={`Generated dream art: ${dream.analysis.title}`} 
                            className="w-full h-auto object-cover max-h-[500px]"
                         />
                         
                         {/* Overlay Info */}
                         <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/80 to-transparent p-6 text-white translate-y-full group-hover/image:translate-y-0 transition-transform duration-300">
                             <div className="flex items-center gap-2 mb-1">
                                <ImageIcon size={16} className="text-slate-300" />
                                <span className="text-sm font-bold opacity-90">{dream.artStyle || 'Surrealism'}</span>
                             </div>
                             <p className="text-xs opacity-80 font-sans line-clamp-2">{dream.analysis.summary}</p>
                         </div>
                     </div>
                     
                     {/* Regenerate Button */}
                     <button
                        onClick={() => onUpdateDream(dream.id, { generatedImage: undefined })}
                        className="mt-4 text-xs text-ink-400 hover:text-slate-600 flex items-center gap-1 mx-auto transition-colors font-sans"
                     >
                        <Wand2 size={12} />
                        重新生成
                     </button>
                </div>
            )}
        </div>

        {/* Guidance - Sky Theme */}
        <div className="bg-gradient-to-br from-sky-50 to-cyan-50/30 rounded-3xl p-6 border border-sky-100 shadow-sm hover:shadow-md transition-all duration-500 relative overflow-hidden group md:col-span-2 lg:col-span-1">
          {/* Decorative leaf/nature vibe */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-200/10 rounded-full blur-2xl"></div>

          <div className="flex items-center gap-3 mb-4 text-sky-600 group-hover:scale-105 transition-transform origin-left relative z-10">
            <div className="p-2 bg-sky-100/50 rounded-xl">
               <Sparkles size={24} />
            </div>
            <h2 className="text-2xl font-hand font-bold text-sky-800">疗愈建议</h2>
          </div>
          <p className="text-sky-800/80 leading-relaxed whitespace-pre-line font-medium font-sans relative z-10">{guidance}</p>
        </div>
      </div>
      
      <div className="mt-12 text-center text-xs text-ink-400 font-sans opacity-60">
        * AI生成内容仅供娱乐与参考，不可替代专业医疗诊断。
      </div>
    </div>
  );
};