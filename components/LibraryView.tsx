import React, { useState } from 'react';
import { Search, BookOpen, Cloud, Ghost, Key, Anchor, Compass, Feather } from 'lucide-react';

interface DreamSymbol {
  id: string;
  term: string;
  category: 'nature' | 'object' | 'action' | 'nightmare' | 'animal';
  summary: string;
  interpretation: string;
  psychological: string;
}

const DREAM_LIBRARY: DreamSymbol[] = [
  {
    id: 'fly',
    term: '飞翔',
    category: 'action',
    summary: '摆脱束缚，获得自由与新视角',
    interpretation: '梦见飞翔通常象征着对自由的渴望或对当前困境的超越。如果你飞得轻松，代表自信与掌控力；如果飞得艰难，可能暗示缺乏信心或受到阻碍。',
    psychological: '荣格认为这是“超越功能”的体现，代表意识试图超越当前的心理限制，寻求更高层面的整合。'
  },
  {
    id: 'fall',
    term: '坠落',
    category: 'nightmare',
    summary: '失控感，不安全感，或者是“落地”的需求',
    interpretation: '坠落是极其常见的梦境，往往反映了生活中的焦虑、失控感或害怕失败。它也可能提示你需要“脚踏实地”，回归现实。',
    psychological: '进化心理学认为这是遗留的生存本能（防止从树上掉落）。心理学上，它代表自我的防御机制崩溃，迫使你面对内心深处的不安全感。'
  },
  {
    id: 'teeth',
    term: '掉牙',
    category: 'object',
    summary: '外貌焦虑，沟通障碍，或人生的重大转变',
    interpretation: '牙齿与我们的公众形象和沟通能力有关。掉牙可能象征着害怕在他人面前出丑，或者感到自己失去了力量（无法“咬住”现实）。同时也常伴随人生的重大转折期。',
    psychological: '弗洛伊德将其与某种丧失或压抑有关。现代观点更多认为是成长焦虑的体现——乳牙脱落是成长的标志，但也伴随着痛苦和丧失。'
  },
  {
    id: 'water',
    term: '水 / 海洋',
    category: 'nature',
    summary: '潜意识的情绪状态，生命的源泉',
    interpretation: '水是潜意识最直接的象征。平静的湖水代表内心安宁；汹涌的波涛代表情绪失控；浑浊的水代表困惑。',
    psychological: '水是阴性、母性与情感的象征。入水通常象征着回归母体或深入潜意识进行探索与净化。'
  },
  {
    id: 'chase',
    term: '被追逐',
    category: 'nightmare',
    summary: '逃避现实中的压力或不敢面对的自我面向',
    interpretation: '追逐你的人或怪物，通常是你试图逃避的情绪、责任或性格中的阴影面。',
    psychological: '这是典型的“阴影”原型。追逐者其实是你被压抑的一部分自我。停下来面对追逐者，往往能化解梦魇。'
  },
  {
    id: 'exam',
    term: '考试 / 迟到',
    category: 'action',
    summary: '自我评价的压力，害怕未准备好',
    interpretation: '梦见未复习就考试或考试迟到，常发生在对自己要求很高的人身上。它反映了对失败的恐惧，或感觉自己没有准备好面对生活的挑战。',
    psychological: '这是“超我”的审判。这种梦在成年后依然出现，通常是在提醒你反思当下的能力与责任是否匹配。'
  },
  {
    id: 'house',
    term: '房子 / 房间',
    category: 'object',
    summary: '自我的心灵结构',
    interpretation: '房子通常代表做梦者自己。不同的房间代表生活的不同领域（厨房是营养/关爱，地下室是潜意识，阁楼是精神/智力）。发现新房间代表发现了新的自我潜能。',
    psychological: '房子是人格的具象化。破旧的房子可能代表自我忽视，而豪宅可能代表膨胀的自我意象或潜能。'
  },
  {
    id: 'snake',
    term: '蛇',
    category: 'animal',
    summary: '转化，治愈，性能量，或潜在的威胁',
    interpretation: '蛇是极其复杂的符号。蜕皮象征重生与转化；毒牙象征威胁；它也常与性能量（昆达里尼）或古老的智慧相关。',
    psychological: '蛇代表脊椎脑（本能脑）的能量。它是无意识深处的一股强大的原始力量，既能毁灭也能治愈（如医神杖）。'
  },
  {
    id: 'naked',
    term: '裸体',
    category: 'action',
    summary: '脆弱，羞耻，或渴望真实',
    interpretation: '在公共场合裸体通常与“暴露焦虑”有关，害怕别人看穿你的伪装或缺点。但也可能象征着渴望摆脱社会面具，回归真实。',
    psychological: '这是“人格面具”脱落的时刻。虽然尴尬，但它强迫你面对真实的自我，而非社会期望的样子。'
  },
  {
    id: 'death',
    term: '死亡',
    category: 'action',
    summary: '旧事物的终结，新阶段的开始',
    interpretation: '梦见自己或他人死亡很少预示真实的死亡。它通常象征着某种关系、习惯、生活阶段或旧的自我身份的结束。',
    psychological: '死亡是转化的前奏。只有旧的自我死去，新的自我才能诞生。这是心理炼金术中的“黑化”阶段。'
  }
];

export const LibraryView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: '全部', icon: BookOpen },
    { id: 'nature', label: '自然', icon: Cloud },
    { id: 'object', label: '物品', icon: Key },
    { id: 'action', label: '行为', icon: Compass },
    { id: 'nightmare', label: '梦魇', icon: Ghost },
    { id: 'animal', label: '动物', icon: Feather }, // Added animal category
  ];

  const filteredSymbols = DREAM_LIBRARY.filter(symbol => {
    const matchesSearch = symbol.term.includes(searchTerm) || symbol.summary.includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || symbol.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="animate-fade-in h-full overflow-y-auto pr-2 pb-10 custom-scrollbar">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-hand font-bold text-ink-800 mb-2">梦境灵感库</h1>
        <p className="text-ink-500 font-sans text-sm">探索集体潜意识的符号，解读心灵的通用语言。</p>
      </div>

      {/* Search & Filter */}
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-white shadow-sm mb-8 sticky top-0 z-20">
        <div className="relative mb-6">
           <Search className="absolute left-4 top-3.5 text-lavender-400" size={20} />
           <input 
             type="text" 
             placeholder="搜索梦境符号 (如：飞翔, 掉牙...)"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-lavender-100 focus:outline-none focus:ring-2 focus:ring-lavender-200 font-sans text-ink-700 placeholder-ink-300 transition-all"
           />
        </div>

        <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all font-sans
                        ${selectedCategory === cat.id 
                            ? 'bg-lavender-500 text-white shadow-md transform scale-105' 
                            : 'bg-white text-ink-500 border border-lavender-100 hover:bg-lavender-50'
                        }
                    `}
                >
                    <cat.icon size={14} />
                    {cat.label}
                </button>
            ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {filteredSymbols.map((symbol) => (
            <div 
                key={symbol.id}
                onClick={() => setExpandedId(expandedId === symbol.id ? null : symbol.id)}
                className={`
                    bg-white/80 backdrop-blur-sm border border-white rounded-3xl p-6 cursor-pointer transition-all duration-300 group
                    ${expandedId === symbol.id ? 'row-span-2 shadow-lg ring-2 ring-lavender-100 bg-white' : 'hover:shadow-md hover:-translate-y-1'}
                `}
            >
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`
                            p-3 rounded-2xl transition-colors
                            ${expandedId === symbol.id ? 'bg-lavender-500 text-white' : 'bg-lavender-50 text-lavender-500 group-hover:bg-lavender-100'}
                        `}>
                            {symbol.category === 'nature' && <Cloud size={24} />}
                            {symbol.category === 'object' && <Key size={24} />}
                            {symbol.category === 'action' && <Compass size={24} />}
                            {symbol.category === 'nightmare' && <Ghost size={24} />}
                            {symbol.category === 'animal' && <Feather size={24} />}
                        </div>
                        <div>
                            <h3 className="text-2xl font-hand font-bold text-ink-800">{symbol.term}</h3>
                            <span className="text-[10px] uppercase tracking-wider font-sans text-ink-400 font-bold bg-ink-50 px-2 py-0.5 rounded-md">
                                {categories.find(c => c.id === symbol.category)?.label}
                            </span>
                        </div>
                    </div>
                    <div className={`text-lavender-300 transition-transform duration-300 ${expandedId === symbol.id ? 'rotate-180' : ''}`}>
                        <Anchor size={20} className={expandedId === symbol.id ? 'opacity-0' : 'opacity-100'} /> 
                    </div>
                </div>

                <p className="text-ink-600 font-sans text-sm leading-relaxed mb-4 opacity-90">
                    {symbol.summary}
                </p>

                {/* Expanded Content */}
                <div className={`
                    overflow-hidden transition-all duration-500 ease-in-out
                    ${expandedId === symbol.id ? 'max-h-[500px] opacity-100 mt-4 pt-4 border-t border-dashed border-lavender-100' : 'max-h-0 opacity-0'}
                `}>
                    <div className="mb-4">
                        <h4 className="text-sm font-bold text-lavender-600 mb-2 font-hand flex items-center gap-2">
                             <BookOpen size={14}/> 通用解析
                        </h4>
                        <p className="text-ink-700 text-sm leading-relaxed font-sans text-justify">
                            {symbol.interpretation}
                        </p>
                    </div>
                    
                    <div className="bg-ink-50/50 p-4 rounded-xl border border-ink-100">
                        <h4 className="text-xs font-bold text-ink-500 mb-2 font-sans uppercase tracking-wider flex items-center gap-2">
                             <Key size={12}/> 心理学视角 (荣格/弗洛伊德)
                        </h4>
                        <p className="text-ink-600 text-xs leading-relaxed font-sans italic">
                            "{symbol.psychological}"
                        </p>
                    </div>
                </div>
                
                {expandedId !== symbol.id && (
                     <div className="text-center text-xs text-lavender-400 font-sans mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        点击查看深度解读
                     </div>
                )}
            </div>
        ))}

        {filteredSymbols.length === 0 && (
            <div className="col-span-full text-center py-12 text-ink-400">
                <Ghost size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-hand text-xl">未找到相关符号</p>
                <p className="text-sm font-sans mt-2">试试搜索 "飞翔" 或 "水"...</p>
            </div>
        )}
      </div>
    </div>
  );
};