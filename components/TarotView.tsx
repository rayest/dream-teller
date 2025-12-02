import React, { useState, useEffect } from 'react';
import { TarotCard, TarotReadingResult } from '../types';
import { interpretTarotReading } from '../services/geminiService';
import { Sparkles, HelpCircle, Loader2, RotateCcw, Eye, MoveRight } from 'lucide-react';

// Simplified Major Arcana Data
const MAJOR_ARCANA = [
    { id: 0, name: "The Fool", name_cn: "愚人", meaning_upright: "新的开始，冒险，纯真", meaning_reversed: "鲁莽，不负责任" },
    { id: 1, name: "The Magician", name_cn: "魔术师", meaning_upright: "创造力，行动，专注", meaning_reversed: "欺骗，混乱，意志薄弱" },
    { id: 2, name: "The High Priestess", name_cn: "女祭司", meaning_upright: "直觉，潜意识，神秘", meaning_reversed: "表面，被压抑的情感" },
    { id: 3, name: "The Empress", name_cn: "皇后", meaning_upright: "丰饶，母性，自然", meaning_reversed: "依赖，创造力受阻" },
    { id: 4, name: "The Emperor", name_cn: "皇帝", meaning_upright: "权威，结构，稳固", meaning_reversed: "专制，僵化，无纪律" },
    { id: 5, name: "The Hierophant", name_cn: "教皇", meaning_upright: "传统，精神指引，信仰", meaning_reversed: "叛逆，打破常规" },
    { id: 6, name: "The Lovers", name_cn: "恋人", meaning_upright: "爱，和谐，选择", meaning_reversed: "不和谐，分离，错误的选择" },
    { id: 7, name: "The Chariot", name_cn: "战车", meaning_upright: "意志力，胜利，决心", meaning_reversed: "失控，攻击性，失败" },
    { id: 8, name: "Strength", name_cn: "力量", meaning_upright: "勇气，耐心，同情", meaning_reversed: "自我怀疑，软弱" },
    { id: 9, name: "The Hermit", name_cn: "隐士", meaning_upright: "内省，孤独，指引", meaning_reversed: "孤立，退缩" },
    { id: 10, name: "Wheel of Fortune", name_cn: "命运之轮", meaning_upright: "改变，周期，命运", meaning_reversed: "坏运气，阻力" },
    { id: 11, name: "Justice", name_cn: "正义", meaning_upright: "公平，真理，因果", meaning_reversed: "不公，逃避责任" },
    { id: 12, name: "The Hanged Man", name_cn: "倒吊人", meaning_upright: "牺牲，新视角，等待", meaning_reversed: "停滞，无谓的牺牲" },
    { id: 13, name: "Death", name_cn: "死神", meaning_upright: "结束，转化，重生", meaning_reversed: "抗拒改变，停滞不前" },
    { id: 14, name: "Temperance", name_cn: "节制", meaning_upright: "平衡，适度，耐心", meaning_reversed: "失衡，过度" },
    { id: 15, name: "The Devil", name_cn: "恶魔", meaning_upright: "束缚，物质主义，诱惑", meaning_reversed: "挣脱束缚，觉醒" },
    { id: 16, name: "The Tower", name_cn: "高塔", meaning_upright: "突变，混乱，启示", meaning_reversed: "避免灾难，恐惧改变" },
    { id: 17, name: "The Star", name_cn: "星星", meaning_upright: "希望，灵感，宁静", meaning_reversed: "绝望，缺乏信心" },
    { id: 18, name: "The Moon", name_cn: "月亮", meaning_upright: "幻觉，恐惧，潜意识", meaning_reversed: "释放恐惧，清晰" },
    { id: 19, name: "The Sun", name_cn: "太阳", meaning_upright: "快乐，成功，活力", meaning_reversed: "暂时的消沉，过度自信" },
    { id: 20, name: "Judgement", name_cn: "审判", meaning_upright: "觉醒，重生，感召", meaning_reversed: "自我怀疑，拒绝感召" },
    { id: 21, name: "The World", name_cn: "世界", meaning_upright: "完成，整合，成就", meaning_reversed: "未完成，缺乏闭环" },
];

export const TarotView: React.FC = () => {
    const [question, setQuestion] = useState('');
    const [stage, setStage] = useState<'question' | 'shuffle' | 'select' | 'reveal' | 'reading'>('question');
    const [deck, setDeck] = useState<TarotCard[]>([]);
    const [selectedCards, setSelectedCards] = useState<TarotCard[]>([]);
    const [reading, setReading] = useState<TarotReadingResult | null>(null);
    const [isInterpreting, setIsInterpreting] = useState(false);

    // Prepare Deck
    const initDeck = () => {
        const newDeck = MAJOR_ARCANA.map(card => ({
            ...card,
            isReversed: Math.random() > 0.5 // Random upright/reversed
        }));
        // Fisher-Yates Shuffle
        for (let i = newDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
        }
        setDeck(newDeck);
    };

    const handleStart = () => {
        setStage('shuffle');
        initDeck();
        setTimeout(() => {
            setStage('select');
        }, 2000); // 2s Shuffle animation
    };

    const handleSelectCard = (index: number) => {
        if (selectedCards.length < 3) {
            const card = deck[index];
            // Prevent selecting same card (though logic usually handles index)
            if (selectedCards.find(c => c.id === card.id)) return;
            
            const newSelection = [...selectedCards, card];
            setSelectedCards(newSelection);
            
            // Remove from deck display to prevent re-selection (visually)
            const newDeck = [...deck];
            newDeck.splice(index, 1);
            setDeck(newDeck);

            if (newSelection.length === 3) {
                setTimeout(() => setStage('reveal'), 800);
            }
        }
    };

    const handleInterpret = async () => {
        setIsInterpreting(true);
        try {
            const result = await interpretTarotReading(question, selectedCards);
            setReading(result);
            setStage('reading');
        } catch (error) {
            alert("解读失败，请检查网络或稍后再试。");
        } finally {
            setIsInterpreting(false);
        }
    };

    const reset = () => {
        setQuestion('');
        setStage('question');
        setSelectedCards([]);
        setReading(null);
    };

    return (
        <div className="animate-fade-in h-full overflow-y-auto pr-2 pb-10 custom-scrollbar relative">
            
            {/* Ambient Background for Tarot */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-10 right-10 w-64 h-64 bg-violet-200/20 rounded-full blur-[80px] mix-blend-multiply"></div>
                <div className="absolute bottom-10 left-10 w-64 h-64 bg-fuchsia-200/20 rounded-full blur-[80px] mix-blend-multiply"></div>
            </div>

            {/* Header */}
            <div className="mb-8 relative z-10">
                <h1 className="text-4xl font-hand font-bold text-ink-800 mb-2">心灵塔罗</h1>
                <p className="text-ink-500 font-sans text-sm">穿越迷雾，聆听原型的指引。</p>
            </div>

            {/* Content Area */}
            <div className="relative z-10 min-h-[500px] flex flex-col items-center">
                
                {/* STAGE 1: QUESTION */}
                {stage === 'question' && (
                    <div className="w-full max-w-lg bg-white/60 backdrop-blur-md rounded-3xl p-8 shadow-sm border border-white animate-fade-in text-center">
                        <div className="mb-6 mx-auto w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center text-violet-500">
                            <Sparkles size={32} />
                        </div>
                        <h2 className="text-2xl font-hand font-bold text-ink-800 mb-4">心中所惑？</h2>
                        <p className="text-ink-500 font-sans text-sm mb-6">
                            请在心中默念你的问题，或者保持空白，单纯地请求指引。
                            <br/>我们将抽取三张牌：过去、现在、未来。
                        </p>
                        <textarea
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="在此输入你的问题 (选填)..."
                            className="w-full h-32 p-4 rounded-xl bg-white border border-violet-100 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none resize-none font-hand text-lg text-ink-700 mb-6 placeholder-ink-300"
                        />
                        <button
                            onClick={handleStart}
                            className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold font-sans transition-all shadow-lg shadow-violet-200 hover:scale-105"
                        >
                            开始洗牌
                        </button>
                    </div>
                )}

                {/* STAGE 2: SHUFFLE */}
                {stage === 'shuffle' && (
                    <div className="flex flex-col items-center justify-center h-[400px]">
                        <div className="relative w-40 h-60">
                            {[...Array(5)].map((_, i) => (
                                <div 
                                    key={i}
                                    className="absolute inset-0 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-xl border-2 border-white shadow-xl"
                                    style={{
                                        animation: `shuffle 2s ease-in-out infinite`,
                                        animationDelay: `${i * 0.1}s`,
                                        transform: `rotate(${i * 2}deg)`
                                    }}
                                >
                                    <div className="w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
                                    <div className="absolute inset-2 border border-white/30 rounded-lg"></div>
                                </div>
                            ))}
                        </div>
                        <p className="mt-8 text-violet-500 font-hand text-xl animate-pulse">正在洗牌...</p>
                    </div>
                )}

                {/* STAGE 3: SELECT */}
                {stage === 'select' && (
                    <div className="w-full animate-fade-in">
                        <p className="text-center text-ink-500 font-hand text-xl mb-8">
                            请凭直觉抽取 <span className="text-violet-600 font-bold">{3 - selectedCards.length}</span> 张牌
                        </p>
                        
                        {/* Selected Cards Display */}
                        <div className="flex justify-center gap-4 mb-12 h-32">
                             {selectedCards.map((card, i) => (
                                 <div key={i} className="w-20 h-32 bg-violet-100 rounded-lg border-2 border-violet-300 flex items-center justify-center shadow-md animate-fade-in">
                                     <div className="text-violet-400 font-bold text-xs">{i === 0 ? '过去' : i === 1 ? '现在' : '未来'}</div>
                                 </div>
                             ))}
                             {[...Array(3 - selectedCards.length)].map((_, i) => (
                                 <div key={i} className="w-20 h-32 border-2 border-dashed border-ink-200 rounded-lg flex items-center justify-center">
                                     <span className="text-ink-300 text-xs">?</span>
                                 </div>
                             ))}
                        </div>

                        {/* Deck Grid */}
                        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-11 gap-2 max-w-4xl mx-auto perspective-1000">
                            {deck.map((card, index) => (
                                <button
                                    key={card.id}
                                    onClick={() => handleSelectCard(index)}
                                    className="w-full aspect-[2/3] bg-gradient-to-br from-violet-600 to-indigo-700 rounded-md shadow-sm hover:-translate-y-4 transition-all duration-300 cursor-pointer border border-white/20 group relative overflow-hidden"
                                >
                                     {/* Card Back Pattern */}
                                     <div className="absolute inset-1 border border-white/20 rounded-sm opacity-50"></div>
                                     <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* STAGE 4: REVEAL */}
                {stage === 'reveal' && (
                    <div className="w-full max-w-4xl animate-fade-in flex flex-col items-center">
                        <h2 className="text-3xl font-hand font-bold text-ink-800 mb-10">牌阵显现</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 w-full px-4">
                            {selectedCards.map((card, index) => (
                                <div key={index} className="flex flex-col items-center perspective-1000 group">
                                    <div className="text-sm font-bold text-violet-500 uppercase tracking-widest mb-3 font-sans">
                                        {index === 0 ? 'Past / 过去' : index === 1 ? 'Present / 现在' : 'Future / 未来'}
                                    </div>
                                    
                                    {/* Card Flipper */}
                                    <div className={`relative w-48 h-72 transition-all duration-1000 transform-style-3d group-hover:scale-105
                                        ${stage === 'reveal' ? 'rotate-y-0' : 'rotate-y-180'}
                                    `}>
                                        {/* Front (technically back because we start flipped... simplified here just rendering face) */}
                                        <div className={`absolute inset-0 w-full h-full bg-white rounded-2xl shadow-xl border-2 border-violet-100 flex flex-col items-center justify-between p-4
                                            ${card.isReversed ? 'rotate-180' : ''}
                                        `}>
                                            <div className="text-xs text-ink-300 font-sans font-bold">{card.id === 0 ? '0' : card.id}</div>
                                            <div className="text-center">
                                                <h3 className="text-xl font-hand font-bold text-ink-800">{card.name_cn}</h3>
                                                <p className="text-xs text-ink-400 font-sans">{card.name}</p>
                                            </div>
                                            <div className="text-2xl text-violet-200">✦</div>
                                        </div>
                                    </div>

                                    <div className="mt-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold font-sans ${card.isReversed ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                            {card.isReversed ? '逆位' : '正位'}
                                        </span>
                                        <p className="text-xs text-ink-500 mt-2 max-w-[150px] mx-auto opacity-80">
                                            {card.isReversed ? card.meaning_reversed : card.meaning_upright}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleInterpret}
                            disabled={isInterpreting}
                            className="px-10 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-2xl font-bold font-sans shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2"
                        >
                            {isInterpreting ? <Loader2 className="animate-spin" /> : <Sparkles />}
                            {isInterpreting ? "正在通灵..." : "解读牌意"}
                        </button>
                    </div>
                )}

                {/* STAGE 5: READING */}
                {stage === 'reading' && reading && (
                    <div className="w-full max-w-4xl animate-fade-in pb-10">
                        <div className="flex items-center justify-between mb-6 px-4">
                             <button onClick={reset} className="flex items-center gap-2 text-sm text-ink-400 hover:text-violet-600 transition-colors">
                                 <RotateCcw size={16} /> 重新占卜
                             </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 px-4">
                             {selectedCards.map((card, idx) => (
                                 <div key={idx} className="bg-white/50 p-3 rounded-xl border border-white flex items-center gap-3">
                                     <div className={`w-10 h-14 bg-violet-100 rounded border border-violet-200 flex items-center justify-center text-[10px] font-bold text-violet-400 ${card.isReversed ? 'rotate-180' : ''}`}>
                                         {card.isReversed ? 'R' : 'U'}
                                     </div>
                                     <div>
                                         <div className="text-xs text-ink-400 uppercase font-bold">{idx === 0 ? 'Past' : idx === 1 ? 'Present' : 'Future'}</div>
                                         <div className="text-sm font-hand font-bold text-ink-800">{card.name_cn}</div>
                                     </div>
                                 </div>
                             ))}
                        </div>

                        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-white shadow-lg space-y-8">
                            
                            {/* Overview */}
                            <div className="border-b border-dashed border-violet-100 pb-6">
                                <div className="flex items-center gap-3 mb-4 text-violet-600">
                                    <Eye size={24} />
                                    <h3 className="text-2xl font-hand font-bold">整体启示</h3>
                                </div>
                                <p className="text-ink-700 leading-relaxed font-sans whitespace-pre-line text-lg">
                                    {reading.overview}
                                </p>
                            </div>

                            {/* Timeline Detail */}
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="bg-slate-50 p-5 rounded-2xl">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase mb-2">过去 / The Roots</h4>
                                    <p className="text-sm text-ink-600 leading-relaxed">{reading.past}</p>
                                </div>
                                <div className="bg-violet-50 p-5 rounded-2xl">
                                    <h4 className="text-sm font-bold text-violet-400 uppercase mb-2">现在 / The Energy</h4>
                                    <p className="text-sm text-ink-600 leading-relaxed">{reading.present}</p>
                                </div>
                                <div className="bg-fuchsia-50 p-5 rounded-2xl">
                                    <h4 className="text-sm font-bold text-fuchsia-400 uppercase mb-2">未来 / The Path</h4>
                                    <p className="text-sm text-ink-600 leading-relaxed">{reading.future}</p>
                                </div>
                            </div>

                            {/* Guidance */}
                            <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 p-6 rounded-2xl border border-violet-100">
                                <div className="flex items-center gap-2 mb-3 text-fuchsia-600">
                                    <Sparkles size={20} />
                                    <h3 className="text-xl font-hand font-bold">指引</h3>
                                </div>
                                <p className="text-ink-800 italic font-serif leading-relaxed">
                                    "{reading.guidance}"
                                </p>
                            </div>

                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};