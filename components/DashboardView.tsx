import React, { useMemo, useState } from 'react';
import { DreamEntry } from '../types';
import { Activity, Cloud, PieChart, TrendingUp } from 'lucide-react';

interface DashboardViewProps {
  dreams: DreamEntry[];
}

interface TooltipData {
  x: number;
  y: number;
  date: string;
  title: string;
  intensity: number;
  summary?: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ dreams }) => {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  // Calculate Statistics
  const stats = useMemo(() => {
    if (dreams.length === 0) return null;

    // 1. Keyword Frequency
    const keywordMap: Record<string, number> = {};
    dreams.forEach(d => {
      d.analysis?.keywords.forEach(k => {
        keywordMap[k] = (keywordMap[k] || 0) + 1;
      });
    });
    const sortedKeywords = Object.entries(keywordMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15); // Top 15

    // 2. Emotion Distribution
    const emotionMap: Record<string, number> = {};
    dreams.forEach(d => {
      if (d.analysis?.dominantEmotion) {
        emotionMap[d.analysis.dominantEmotion] = (emotionMap[d.analysis.dominantEmotion] || 0) + 1;
      }
    });
    const sortedEmotions = Object.entries(emotionMap)
      .sort(([, a], [, b]) => b - a);
    const totalEmotions = Object.values(emotionMap).reduce((a, b) => a + b, 0);

    // 3. Intensity Trend (Reverse chronological to Chronological)
    const chronoDreams = [...dreams].reverse().filter(d => d.analysis?.emotionalIntensity !== undefined);
    
    return {
      keywords: sortedKeywords,
      emotions: sortedEmotions,
      totalEmotions,
      chronoDreams,
    };
  }, [dreams]);

  if (!stats || dreams.length === 0) return null;

  // --- SVG Helper for Line Chart ---
  const renderLineChart = () => {
    const data = stats.chronoDreams;
    if (data.length < 2) return (
        <div className="h-40 flex items-center justify-center text-ink-400 text-sm font-hand">
            记录太少，无法生成趋势线
        </div>
    );

    const width = 100;
    const height = 40; // Reduced height relative to width for better aspect ratio
    const paddingX = 2;
    const paddingY = 5;
    
    const maxVal = 10; // Max intensity is 10
    
    // Calculate coordinates
    const points = data.map((d, i) => {
      const x = paddingX + (i / (data.length - 1)) * (width - paddingX * 2);
      // Invert Y because SVG 0 is top
      const y = height - paddingY - ((d.analysis!.emotionalIntensity || 0) / maxVal) * (height - paddingY * 2);
      return { x, y, data: d };
    });

    const pointsString = points.map(p => `${p.x},${p.y}`).join(' ');
    
    // Create area path (start at bottom left, go through points, end at bottom right)
    const areaPathString = `
      ${pointsString} 
      L ${width - paddingX},${height} 
      L ${paddingX},${height} 
      Z
    `;

    return (
      <div className="w-full aspect-[2.5/1] relative group" onMouseLeave={() => setTooltip(null)}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="intensityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#e2e8f0" strokeWidth="0.2" />
            <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#e2e8f0" strokeWidth="0.2" strokeDasharray="1" />
            
            {/* Area Fill */}
            <path 
              d={`M ${points[0].x},${height} L ${areaPathString}`} 
              fill="url(#intensityGradient)" 
              className="transition-all duration-500"
            />

            {/* Line Path */}
            <polyline 
                fill="none" 
                stroke="#8b5cf6" 
                strokeWidth="0.8" 
                points={pointsString} 
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-sm transition-all duration-500"
            />
            
            {/* Interactive Areas & Dots */}
            {points.map((p, i) => (
               <g key={p.data.id} 
                  onMouseEnter={() => setTooltip({
                    x: p.x, 
                    y: p.y, 
                    date: p.data.date, 
                    title: p.data.analysis?.title || '未知',
                    intensity: p.data.analysis?.emotionalIntensity || 0,
                    summary: p.data.analysis?.summary
                  })}
               >
                 {/* Invisible Hit Area for better UX */}
                 <rect 
                    x={p.x - 2} 
                    y={0} 
                    width={4} 
                    height={height} 
                    fill="transparent" 
                    className="cursor-pointer"
                 />
                 
                 {/* Visible Dot */}
                 <circle 
                    cx={p.x} 
                    cy={p.y} 
                    r={tooltip && tooltip.date === p.data.date ? 2 : 1.2} 
                    className={`
                      stroke-[0.5] transition-all duration-300 pointer-events-none
                      ${tooltip && tooltip.date === p.data.date 
                        ? 'fill-lavender-600 stroke-white' 
                        : 'fill-white stroke-lavender-500'}
                    `}
                 />
               </g>
            ))}
        </svg>

        {/* Custom Tooltip Overlay */}
        {tooltip && (
          <div 
            className="absolute z-20 pointer-events-none transition-all duration-200"
            style={{ 
              left: `${tooltip.x}%`, 
              top: `${tooltip.y}%`,
              transform: 'translate(-50%, -115%)' 
            }}
          >
            <div className="bg-white/90 backdrop-blur-md border border-lavender-100 shadow-[0_4px_20px_rgba(139,92,246,0.15)] rounded-xl p-3 w-48 text-left animate-fade-in">
               <div className="text-xs text-lavender-500 font-bold mb-1 font-sans flex justify-between">
                 <span>{tooltip.date}</span>
                 <span className="bg-lavender-100 px-1.5 py-0.5 rounded text-lavender-700">强度 {tooltip.intensity}</span>
               </div>
               <div className="font-hand text-ink-800 text-lg leading-tight mb-1 truncate">
                 {tooltip.title}
               </div>
               {tooltip.summary && (
                 <div className="text-[10px] text-ink-400 font-sans line-clamp-2 leading-relaxed">
                   {tooltip.summary}
                 </div>
               )}
               {/* Arrow */}
               <div className="absolute top-full left-1/2 -ml-2 -mt-[1px] border-4 border-transparent border-t-white/90"></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-fade-in h-full overflow-y-auto pr-2 pb-10 custom-scrollbar">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-hand font-bold text-ink-800 mb-2">梦境洞察</h1>
        <p className="text-ink-500 font-sans text-sm">穿越时间的迷雾，看见潜意识的形状。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1. Mood Flow (Timeline) */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-white shadow-sm md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-lavender-50 rounded-xl text-lavender-500">
                    <Activity size={20} />
                </div>
                <div>
                   <h2 className="text-xl font-hand font-bold text-ink-800 leading-none">情绪波动</h2>
                   <p className="text-xs text-ink-400 font-sans mt-1">近期梦境情绪强度的变化趋势</p>
                </div>
            </div>
            
            {renderLineChart()}
            
            <div className="flex justify-between text-xs text-ink-400 mt-2 px-2 font-sans border-t border-dashed border-gray-100 pt-2">
                <span>最早记录</span>
                <span>最近记录</span>
            </div>
        </div>

        {/* 2. Keyword Cloud */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-white shadow-sm">
             <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-sky-50 rounded-xl text-sky-500">
                    <Cloud size={20} />
                </div>
                <h2 className="text-xl font-hand font-bold text-ink-800">梦境碎片云</h2>
            </div>
            <div className="flex flex-wrap gap-3 items-center justify-center min-h-[200px] content-center p-4 bg-sky-50/30 rounded-2xl">
                {stats.keywords.length > 0 ? stats.keywords.map(([word, count], idx) => {
                    const size = Math.max(0.8, Math.min(2.0, 0.8 + (count - 1) * 0.3));
                    const opacity = Math.max(0.6, Math.min(1, 0.6 + (count - 1) * 0.2));
                    return (
                        <span 
                            key={word} 
                            style={{ fontSize: `${size}rem`, opacity }}
                            className={`font-hand cursor-default hover:scale-110 transition-transform duration-300 select-none ${
                                idx % 3 === 0 ? 'text-indigo-500' : idx % 3 === 1 ? 'text-rose-500' : 'text-emerald-500'
                            }`}
                        >
                            {word}
                        </span>
                    );
                }) : (
                  <span className="text-ink-400 text-sm font-hand">暂无关键词数据</span>
                )}
            </div>
        </div>

        {/* 3. Emotional Spectrum */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-white shadow-sm">
             <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-rose-50 rounded-xl text-rose-500">
                    <PieChart size={20} />
                </div>
                <h2 className="text-xl font-hand font-bold text-ink-800">情绪光谱</h2>
            </div>
            <div className="space-y-4 pr-2 max-h-[220px] overflow-y-auto custom-scrollbar">
                {stats.emotions.length > 0 ? stats.emotions.map(([emotion, count]) => {
                    const percentage = Math.round((count / stats.totalEmotions) * 100);
                    return (
                        <div key={emotion} className="group">
                            <div className="flex justify-between text-sm mb-1 font-sans text-ink-600">
                                <span>{emotion}</span>
                                <span className="font-bold text-ink-400 text-xs">{percentage}%</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-rose-300 rounded-full group-hover:bg-rose-400 transition-colors"
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                }) : (
                   <span className="text-ink-400 text-sm font-hand">暂无情绪数据</span>
                )}
            </div>
        </div>

        {/* 4. Stats Summary */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-6 border border-indigo-100 shadow-sm md:col-span-2 flex justify-around items-center text-center">
             <div className="hover:scale-105 transition-transform duration-300">
                 <div className="text-4xl font-hand font-bold text-indigo-600 drop-shadow-sm">{dreams.length}</div>
                 <div className="text-xs text-indigo-400 font-sans uppercase tracking-wider mt-1 font-bold">记录总数</div>
             </div>
             <div className="w-px h-12 bg-indigo-200/50"></div>
             <div className="hover:scale-105 transition-transform duration-300">
                 <div className="text-4xl font-hand font-bold text-rose-600 drop-shadow-sm">
                    {Math.round(stats.chronoDreams.reduce((acc, curr) => acc + (curr.analysis?.emotionalIntensity || 0), 0) / (stats.chronoDreams.length || 1))}
                 </div>
                 <div className="text-xs text-rose-400 font-sans uppercase tracking-wider mt-1 font-bold">平均强度</div>
             </div>
             <div className="w-px h-12 bg-indigo-200/50"></div>
             <div className="hover:scale-105 transition-transform duration-300">
                 <div className="text-4xl font-hand font-bold text-emerald-600 drop-shadow-sm">
                    {stats.keywords.length}
                 </div>
                 <div className="text-xs text-emerald-400 font-sans uppercase tracking-wider mt-1 font-bold">独特意象</div>
             </div>
        </div>

      </div>
    </div>
  );
};
