import React from 'react';
import { DreamEntry } from '../types';
import { Moon, Calendar, Trash2 } from 'lucide-react';

interface DreamCardProps {
  dream: DreamEntry;
  onClick: (dream: DreamEntry) => void;
  onDelete: (id: string) => void;
  isSelected: boolean;
  isLast: boolean;
}

export const DreamCard: React.FC<DreamCardProps> = ({ dream, onClick, onDelete, isSelected, isLast }) => {
  return (
    <div className="relative pl-8 sm:pl-10">
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute left-[11px] sm:left-[19px] top-8 bottom-[-20px] w-0.5 bg-lavender-200/60 z-0"></div>
      )}
      
      {/* Timeline Dot */}
      <div className={`absolute left-0 sm:left-2 top-8 w-6 h-6 rounded-full border-4 z-10 transition-colors duration-300 ${
        isSelected ? 'bg-lavender-500 border-lavender-100' : 'bg-white border-lavender-200'
      }`}></div>

      <div 
        onClick={() => onClick(dream)}
        className={`group relative p-5 rounded-2xl cursor-pointer transition-all duration-500 mb-6 border
          ${isSelected 
            ? 'bg-white border-lavender-200 shadow-[0_4px_20px_rgba(139,92,246,0.15)] scale-[1.02]' 
            : 'bg-white/60 border-transparent hover:bg-white hover:shadow-lg hover:scale-[1.01]'
          }`}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-hand font-medium text-ink-800 truncate pr-2 flex-1 tracking-wide">
            {dream.analysis?.title || '未命名的梦'}
          </h3>
          <div className="flex items-center gap-2 shrink-0">
            {dream.analysis && (
              <Moon size={16} className="text-lavender-500 mt-0.5" />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(dream.id);
              }}
              className="text-ink-400 hover:text-rose-400 transition-colors p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
              title="删除记录"
              aria-label="删除记录"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {dream.analysis?.summary && (
          <p className="text-lavender-600/90 text-sm line-clamp-2 mb-2 font-hand leading-relaxed tracking-wide">
             {dream.analysis.summary}
          </p>
        )}

        <p className={`text-ink-500 line-clamp-2 font-sans mb-3 pr-2 leading-relaxed ${dream.analysis?.summary ? 'text-xs opacity-70' : 'text-sm'}`}>
          {dream.content}
        </p>

        <div className="flex items-center text-xs text-ink-400 font-sans">
          <Calendar size={12} className="mr-1" />
          {dream.date}
        </div>
      </div>
    </div>
  );
};