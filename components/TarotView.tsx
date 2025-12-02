
import React, { useState, useEffect } from 'react';
import { TarotCard, TarotReadingResult, MajorArcanaCard, MinorArcanaCard, TarotSpread } from '../types';
import { interpretTarotReading } from '../services/geminiService';
import { Sparkles, Loader2, RotateCcw, Eye, Layers, ChevronDown, CheckCircle2 } from 'lucide-react';

// --- Tarot Data & Image Helpers ---

// Base URL for public domain Rider-Waite-Smith images
const IMAGE_BASE_URL = "https://www.sacred-texts.com/tarot/pkt/img";

const getMajorArcanaImage = (id: number): string => {
    const paddedId = id.toString().padStart(2, '0');
    return `${IMAGE_BASE_URL}/ar${paddedId}.jpg`;
};

const getMinorArcanaImage = (suit: string, rank: number): string => {
    let prefix = '';
    switch (suit) {
        case 'wands': prefix = 'wa'; break;
        case 'cups': prefix = 'cu'; break;
        case 'swords': prefix = 'sw'; break;
        case 'pentacles': prefix = 'pe'; break;
    }
    
    let suffix = '';
    switch (rank) {
        case 1: suffix = 'ac'; break; // Ace
        case 11: suffix = 'pa'; break; // Page
        case 12: suffix = 'kn'; break; // Knight
        case 13: suffix = 'qu'; break; // Queen
        case 14: suffix = 'ki'; break; // King
        default: suffix = rank.toString().padStart(2, '0'); break; // 02-10
    }

    return `${IMAGE_BASE_URL}/${prefix}${suffix}.jpg`;
};

const MAJOR_ARCANA_DATA: Omit<MajorArcanaCard, 'isReversed' | 'image'>[] = [
    { id: 0, type: 'major', name: "The Fool", name_cn: "愚人", meaning_upright: "新的开始，冒险，纯真", meaning_reversed: "鲁莽，不负责任" },
    { id: 1, type: 'major', name: "The Magician", name_cn: "魔术师", meaning_upright: "创造力，行动，专注", meaning_reversed: "欺骗，混乱，意志薄弱" },
    { id: 2, type: 'major', name: "The High Priestess", name_cn: "女祭司", meaning_upright: "直觉，潜意识，神秘", meaning_reversed: "表面，被压抑的情感" },
    { id: 3, type: 'major', name: "The Empress", name_cn: "皇后", meaning_upright: "丰饶，母性，自然", meaning_reversed: "依赖，创造力受阻" },
    { id: 4, type: 'major', name: "The Emperor", name_cn: "皇帝", meaning_upright: "权威，结构，稳固", meaning_reversed: "专制，僵化，无纪律" },
    { id: 5, type: 'major', name: "The Hierophant", name_cn: "教皇", meaning_upright: "传统，精神指引，信仰", meaning_reversed: "叛逆，打破常规" },
    { id: 6, type: 'major', name: "The Lovers", name_cn: "恋人", meaning_upright: "爱，和谐，选择", meaning_reversed: "不和谐，分离，错误的选择" },
    { id: 7, type: 'major', name: "The Chariot", name_cn: "战车", meaning_upright: "意志力，胜利，决心", meaning_reversed: "失控，攻击性，失败" },
    { id: 8, type: 'major', name: "Strength", name_cn: "力量", meaning_upright: "勇气，耐心，同情", meaning_reversed: "自我怀疑，软弱" },
    { id: 9, type: 'major', name: "The Hermit", name_cn: "隐士", meaning_upright: "内省，孤独，指引", meaning_reversed: "孤立，退缩" },
    { id: 10, type: 'major', name: "Wheel of Fortune", name_cn: "命运之轮", meaning_upright: "改变，周期，命运", meaning_reversed: "坏运气，阻力" },
    { id: 11, type: 'major', name: "Justice", name_cn: "正义", meaning_upright: "公平，真理，因果", meaning_reversed: "不公，逃避责任" },
    { id: 12, type: 'major', name: "The Hanged Man", name_cn: "倒吊人", meaning_upright: "牺牲，新视角，等待", meaning_reversed: "停滞，无谓的牺牲" },
    { id: 13, type: 'major', name: "Death", name_cn: "死神", meaning_upright: "结束，转化，重生", meaning_reversed: "抗拒改变，停滞不前" },
    { id: 14, type: 'major', name: "Temperance", name_cn: "节制", meaning_upright: "平衡，适度，耐心", meaning_reversed: "失衡，过度" },
    { id: 15, type: 'major', name: "The Devil", name_cn: "恶魔", meaning_upright: "束缚，物质主义，诱惑", meaning_reversed: "挣脱束缚，觉醒" },
    { id: 16, type: 'major', name: "The Tower", name_cn: "高塔", meaning_upright: "突变，混乱，启示", meaning_reversed: "避免灾难，恐惧改变" },
    { id: 17, type: 'major', name: "The Star", name_cn: "星星", meaning_upright: "希望，灵感，宁静", meaning_reversed: "绝望，缺乏信心" },
    { id: 18, type: 'major', name: "The Moon", name_cn: "月亮", meaning_upright: "幻觉，恐惧，潜意识", meaning_reversed: "释放恐惧，清晰" },
    { id: 19, type: 'major', name: "The Sun", name_cn: "太阳", meaning_upright: "快乐，成功，活力", meaning_reversed: "暂时的消沉，过度自信" },
    { id: 20, type: 'major', name: "Judgement", name_cn: "审判", meaning_upright: "觉醒，重生，感召", meaning_reversed: "自我怀疑，拒绝感召" },
    { id: 21, type: 'major', name: "The World", name_cn: "世界", meaning_upright: "完成，整合，成就", meaning_reversed: "未完成，缺乏闭环" },
];

const generateDeck = (): TarotCard[] => {
    const deck: TarotCard[] = [];

    // Major Arcana
    MAJOR_ARCANA_DATA.forEach(data => {
        deck.push({
            ...data,
            isReversed: false, // Set during shuffle
            image: getMajorArcanaImage(data.id)
        } as MajorArcanaCard);
    });

    // Minor Arcana
    const suits: { id: MinorArcanaCard['suit'], name: string, name_cn: string }[] = [
        { id: 'wands', name: 'Wands', name_cn: '权杖' },
        { id: 'cups', name: 'Cups', name_cn: '圣杯' },
        { id: 'swords', name: 'Swords', name_cn: '宝剑' },
        { id: 'pentacles', name: 'Pentacles', name_cn: '星币' },
    ];

    const ranks = [
        { id: 1, name: 'Ace', name_cn: '首牌', upright: '新的开始, 创造力, 潜力', reversed: '错失良机, 延误' },
        { id: 2, name: 'Two', name_cn: '二', upright: '计划, 决定, 平衡', reversed: '恐惧未知, 优柔寡断' },
        { id: 3, name: 'Three', name_cn: '三', upright: '探索, 展望, 扩张', reversed: '延期, 失望' },
        { id: 4, name: 'Four', name_cn: '四', upright: '庆祝, 稳定, 归属', reversed: '家庭冲突, 不稳定' },
        { id: 5, name: 'Five', name_cn: '五', upright: '竞争, 冲突, 挑战', reversed: '避免冲突, 内心矛盾' },
        { id: 6, name: 'Six', name_cn: '六', upright: '胜利, 认可, 前进', reversed: '失败, 缺乏自信' },
        { id: 7, name: 'Seven', name_cn: '七', upright: '防御, 坚持立场', reversed: '放弃, 不知所措' },
        { id: 8, name: 'Eight', name_cn: '八', upright: '迅速, 变化, 消息', reversed: '停滞, 嫉妒' },
        { id: 9, name: 'Nine', name_cn: '九', upright: '韧性, 坚持, 勇气', reversed: '筋疲力尽, 偏执' },
        { id: 10, name: 'Ten', name_cn: '十', upright: '完成, 负担, 责任', reversed: '崩溃, 压力过大' },
        { id: 11, name: 'Page', name_cn: '侍从', upright: '好奇心, 新消息, 学习', reversed: '坏消息, 幼稚' },
        { id: 12, name: 'Knight', name_cn: '骑士', upright: '行动, 冲动, 热情', reversed: '鲁莽, 不负责任' },
        { id: 13, name: 'Queen', name_cn: '王后', upright: '关怀, 自信, 魅力', reversed: '嫉妒, 冷漠, 依赖' },
        { id: 14, name: 'King', name_cn: '国王', upright: '权威, 掌控, 成功', reversed: '专制, 软弱' },
    ];

    suits.forEach(suit => {
        ranks.forEach(rank => {
            deck.push({
                type: 'minor',
                id: `${suit.id}_${rank.id}`,
                suit: suit.id,
                rank: rank.id,
                name: `${rank.name} of ${suit.name}`,
                name_cn: `${suit.name_cn}${rank.name_cn}`,
                meaning_upright: rank.upright,
                meaning_reversed: rank.reversed,
                image: getMinorArcanaImage(suit.id, rank.id)
            } as MinorArcanaCard);
        });
    });

    return deck;
};

// --- Spreads Configuration ---

const SPREADS: TarotSpread[] = [
    {
        id: 'daily',
        name: '每日一牌 (1张)',
        description: '获取当下的核心能量与指引，适合每日晨间冥想。',
        cardCount: 1,
        positions: [
            { id: 'daily', name: '今日指引', description: '此时此刻的核心能量与建议' }
        ]
    },
    {
        id: 'time',
        name: '时间流 (3张)',
        description: '探索事情的来龙去脉：过去、现在与未来。',
        cardCount: 3,
        positions: [
            { id: 'past', name: '过去', description: '问题的根源或背景' },
            { id: 'present', name: '现在', description: '当下的状态与能量' },
            { id: 'future', name: '未来', description: '潜在的发展趋势' }
        ]
    },
    {
        id: 'love',
        name: '恋人金字塔 (4张)',
        description: '深度剖析感情关系、双方状态及未来走向。',
        cardCount: 4,
        positions: [
            { id: 'self', name: '自己', description: '你在关系中的状态与态度' },
            { id: 'partner', name: '对方', description: '对方的想法与感受' },
            { id: 'relationship', name: '关系', description: '目前两人的互动模式' },
            { id: 'future', name: '未来', description: '关系的未来发展' }
        ]
    },
    {
        id: 'celtic',
        name: '凯尔特十字 (10张)',
        description: '最经典的深度牌阵，全方位解析复杂问题的方方面面。',
        cardCount: 10,
        positions: [
            { id: '1', name: '现状', description: '当下的核心状况' },
            { id: '2', name: '阻碍/助力', description: '面临的挑战或支持力量' },
            { id: '3', name: '潜意识', description: '潜在的根基或过去的影响' },
            { id: '4', name: '目标', description: '理想状态或未来的可能性' },
            { id: '5', name: '过去', description: '近期已经发生的事情' },
            { id: '6', name: '未来', description: '即将发生的事情' },
            { id: '7', name: '自我', description: '你对问题的态度' },
            { id: '8', name: '环境', description: '周围人或环境的影响' },
            { id: '9', name: '希望/恐惧', description: '内心的期待或担忧' },
            { id: '10', name: '结果', description: '最终的综合结果' }
        ]
    }
];

// --- Visual Helpers ---
const RenderSpreadIcon = ({ id }: { id: string }) => {
    switch (id) {
        case 'daily':
            return (
                <div className="w-8 h-12 border-2 border-current rounded-sm flex items-center justify-center">
                    <div className="w-4 h-6 bg-current rounded-sm opacity-50"></div>
                </div>
            );
        case 'time':
            return (
                <div className="flex gap-1 items-center">
                     <div className="w-3 h-5 border border-current rounded-[1px] opacity-40"></div>
                     <div className="w-4 h-6 border-2 border-current rounded-sm"></div>
                     <div className="w-3 h-5 border border-current rounded-[1px] opacity-40"></div>
                </div>
            );
        case 'love':
            return (
                <div className="flex flex-col items-center gap-0.5">
                    <div className="w-3 h-4 border border-current rounded-[1px]"></div>
                    <div className="flex gap-0.5">
                         <div className="w-3 h-4 border border-current rounded-[1px] opacity-60"></div>
                         <div className="w-3 h-4 border border-current rounded-[1px] opacity-60"></div>
                    </div>
                    <div className="w-3 h-4 border border-current rounded-[1px]"></div>
                </div>
            );
        case 'celtic':
            return (
                <div className="flex gap-1 items-center">
                    <div className="relative w-6 h-8">
                         <div className="absolute inset-0 m-auto w-3 h-5 border border-current"></div>
                         <div className="absolute inset-0 m-auto w-5 h-3 border border-current rotate-90 opacity-60"></div>
                    </div>
                    <div className="flex flex-col gap-[1px]">
                        <div className="w-1.5 h-2 bg-current opacity-30"></div>
                        <div className="w-1.5 h-2 bg-current opacity-50"></div>
                        <div className="w-1.5 h-2 bg-current opacity-70"></div>
                        <div className="w-1.5 h-2 bg-current"></div>
                    </div>
                </div>
            );
        default:
             return <Layers size={24} />;
    }
}

// --- View Component ---

export const TarotView: React.FC = () => {
    const [question, setQuestion] = useState('');
    const [selectedSpreadId, setSelectedSpreadId] = useState<string>('time');
    const [stage, setStage] = useState<'question' | 'shuffle' | 'select' | 'reveal' | 'reading'>('question');
    const [deck, setDeck] = useState<TarotCard[]>([]);
    const [selectedCards, setSelectedCards] = useState<TarotCard[]>([]);
    const [reading, setReading] = useState<TarotReadingResult | null>(null);
    const [isInterpreting, setIsInterpreting] = useState(false);

    const currentSpread = SPREADS.find(s => s.id === selectedSpreadId) || SPREADS[1];

    // Initialize Deck
    const initDeck = () => {
        const fullDeck = generateDeck().map(card => ({
            ...card,
            isReversed: Math.random() > 0.5
        }));

        // Fisher-Yates Shuffle
        for (let i = fullDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [fullDeck[i], fullDeck[j]] = [fullDeck[j], fullDeck[i]];
        }
        setDeck(fullDeck);
    };

    const handleStart = () => {
        setStage('shuffle');
        initDeck();
        setTimeout(() => {
            setStage('select');
        }, 3000); // Extended Shuffle time
    };

    const handleSelectCard = (index: number) => {
        if (selectedCards.length < currentSpread.cardCount) {
            const card = deck[index];
            if (selectedCards.find(c => c.name === card.name)) return;
            
            const newSelection = [...selectedCards, card];
            setSelectedCards(newSelection);
            
            if (newSelection.length === currentSpread.cardCount) {
                setTimeout(() => setStage('reveal'), 800);
            }
        }
    };

    const handleInterpret = async () => {
        setIsInterpreting(true);
        try {
            const result = await interpretTarotReading(question, selectedCards, currentSpread);
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

    // Card Back Component for reuse
    const CardBack = () => (
        <div className="absolute inset-0 w-full h-full card-back-pattern rounded-[inherit] border border-white/10 shadow-inner overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center opacity-70">
                 {/* Mystic Emblem: Eye & Star */}
                 <svg viewBox="0 0 100 100" className="w-2/3 h-2/3 text-amber-200/40 fill-current animate-[spin_60s_linear_infinite]">
                     {/* Outer Star */}
                     <path d="M50 0 L65 35 L100 50 L65 65 L50 100 L35 65 L0 50 L35 35 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
                     {/* Inner Circle */}
                     <circle cx="50" cy="50" r="25" stroke="currentColor" strokeWidth="1" fill="none" />
                     {/* Eye */}
                     <path d="M25 50 Q50 25 75 50 Q50 75 25 50 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                     <circle cx="50" cy="50" r="8" fill="currentColor" />
                 </svg>
            </div>
            {/* Corner Details */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-amber-500/30"></div>
            <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-amber-500/30"></div>
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-amber-500/30"></div>
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-amber-500/30"></div>
        </div>
    );

    return (
        <div className="animate-fade-in h-full overflow-y-auto pr-2 pb-10 custom-scrollbar relative">
            
            {/* Inject Animations & Patterns */}
            <style>{`
                @keyframes shuffle-left {
                    0% { transform: translateX(0) rotate(0); z-index: 10; }
                    25% { transform: translateX(-80px) translateY(-5px) rotate(-12deg); z-index: 10; }
                    50% { transform: translateX(0) rotate(0); z-index: 30; }
                    100% { transform: translateX(0) rotate(0); z-index: 10; }
                }
                @keyframes shuffle-right {
                    0% { transform: translateX(0) rotate(0); z-index: 20; }
                    25% { transform: translateX(80px) translateY(-5px) rotate(12deg); z-index: 20; }
                    50% { transform: translateX(0) rotate(0); z-index: 40; }
                    100% { transform: translateX(0) rotate(0); z-index: 20; }
                }
                .card-back-pattern {
                    background-color: #0f172a; /* slate-900 */
                    background-image: url("data:image/svg+xml,%3Csvg width='60' height='100' viewBox='0 0 60 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0 L60 50 L30 100 L0 50 Z' fill='none' stroke='%23334155' stroke-width='0.5' opacity='0.4'/%3E%3Ccircle cx='30' cy='50' r='18' fill='none' stroke='%23d97706' stroke-width='0.5' opacity='0.3'/%3E%3Cpath d='M30 20 L40 50 L30 80 L20 50 Z' fill='%231e293b' opacity='0.4'/%3E%3Ccircle cx='30' cy='50' r='2' fill='%23fcd34d' opacity='0.6'/%3E%3C/svg%3E");
                    background-size: 60px 100px;
                }
            `}</style>

            {/* Ambient Background for Tarot */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-10 right-10 w-64 h-64 bg-sky-200/20 rounded-full blur-[80px] mix-blend-multiply"></div>
                <div className="absolute bottom-10 left-10 w-64 h-64 bg-amber-200/20 rounded-full blur-[80px] mix-blend-multiply"></div>
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
                        <div className="mb-6 mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                            <Sparkles size={32} />
                        </div>
                        <h2 className="text-2xl font-hand font-bold text-ink-800 mb-2">心中所惑？</h2>
                        <p className="text-ink-500 font-sans text-sm mb-6">
                            请选择牌阵并默念你的问题。
                        </p>
                        
                        {/* Visual Spread Selector */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {SPREADS.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => setSelectedSpreadId(s.id)}
                                    className={`relative p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2 group
                                        ${selectedSpreadId === s.id 
                                            ? 'bg-white border-amber-400 shadow-md ring-2 ring-amber-100 text-amber-700' 
                                            : 'bg-white/50 border-slate-100 hover:border-slate-300 text-slate-500 hover:bg-white'}
                                    `}
                                >
                                    {/* Mini Visual Layout */}
                                    <div className={`${selectedSpreadId === s.id ? 'text-amber-500' : 'text-slate-400 group-hover:text-slate-500'}`}>
                                        <RenderSpreadIcon id={s.id} />
                                    </div>

                                    {/* Text Info */}
                                    <div className="text-center">
                                        <div className="font-hand font-bold text-lg leading-tight">{s.name}</div>
                                        <div className="text-[10px] font-sans opacity-70 mt-1">{s.cardCount} 张牌</div>
                                    </div>

                                    {/* Selected Checkmark */}
                                    {selectedSpreadId === s.id && (
                                        <div className="absolute top-2 right-2 text-amber-500">
                                            <CheckCircle2 size={14} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                        
                        <div className="mb-6 text-xs text-ink-400 bg-white/40 p-3 rounded-lg border border-slate-100 font-sans text-left">
                           <span className="font-bold text-slate-600">牌阵详情：</span>{currentSpread.description}
                        </div>

                        <textarea
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="在此输入你的问题 (选填)..."
                            className="w-full h-24 p-4 rounded-xl bg-white border border-slate-200 focus:border-slate-300 focus:ring-2 focus:ring-slate-100 outline-none resize-none font-hand text-lg text-ink-700 mb-6 placeholder-ink-300"
                        />
                        <button
                            onClick={handleStart}
                            className="px-8 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold font-sans transition-all shadow-lg shadow-slate-200 hover:scale-105 w-full"
                        >
                            开始洗牌
                        </button>
                    </div>
                )}

                {/* STAGE 2: SHUFFLE */}
                {stage === 'shuffle' && (
                    <div className="flex flex-col items-center justify-center h-[400px] w-full relative perspective-1000">
                        {/* Shuffling Deck Visualization */}
                        <div className="relative w-40 h-64">
                            {/* Render 24 cards for density */}
                            {[...Array(24)].map((_, i) => (
                                <div 
                                    key={i}
                                    className="absolute inset-0 rounded-lg shadow-xl"
                                    style={{
                                        // Even cards go left, Odd cards go right
                                        animation: i % 2 === 0 
                                            ? `shuffle-left 1s ease-in-out infinite` 
                                            : `shuffle-right 1s ease-in-out infinite`,
                                        animationDelay: `${i * 0.04}s`,
                                        top: -i * 0.6, // Stack effect
                                        zIndex: 24 - i
                                    }}
                                >
                                    <CardBack />
                                </div>
                            ))}
                        </div>
                        <p className="mt-12 text-slate-600 font-hand text-xl animate-pulse font-bold tracking-widest">正在洗牌...</p>
                        <p className="text-xs text-ink-400 font-sans mt-2">将能量注入 {currentSpread.name}</p>
                    </div>
                )}

                {/* STAGE 3: SELECT */}
                {stage === 'select' && (
                    <div className="w-full animate-fade-in">
                        <p className="text-center text-ink-500 font-hand text-xl mb-8">
                            请凭直觉抽取 <span className="text-amber-600 font-bold">{currentSpread.cardCount - selectedCards.length}</span> 张牌
                        </p>
                        
                        {/* Selected Cards Display - Scrollable if many cards */}
                        <div className="flex justify-center gap-2 mb-12 h-32 sm:h-40 perspective-1000 overflow-x-auto pb-4 px-4">
                             {selectedCards.map((card, i) => (
                                 <div key={i} className="flex-shrink-0 w-20 sm:w-24 h-full bg-amber-50 rounded-lg border-2 border-amber-200 shadow-md animate-fade-in relative overflow-hidden group">
                                     <img 
                                        src={card.image} 
                                        alt={card.name}
                                        className="w-full h-full object-cover opacity-80 mix-blend-multiply filter sepia-[.3]"
                                     />
                                     <div className="absolute top-0 left-0 w-full bg-black/50 text-white text-[10px] text-center py-0.5 font-sans truncate px-1">
                                         {currentSpread.positions[i].name}
                                     </div>
                                 </div>
                             ))}
                             {[...Array(currentSpread.cardCount - selectedCards.length)].map((_, i) => (
                                 <div key={i} className="flex-shrink-0 w-20 sm:w-24 h-full border-2 border-dashed border-ink-200 rounded-lg flex items-center justify-center bg-white/30">
                                     <span className="text-ink-300 text-xs font-sans">?</span>
                                 </div>
                             ))}
                        </div>

                        {/* Deck Grid */}
                        <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-13 gap-1.5 max-w-5xl mx-auto perspective-1000 px-2">
                            {deck.map((card, index) => {
                                const isSelected = selectedCards.includes(card);
                                if (isSelected) return <div key={index} className="w-full aspect-[2/3]"></div>; // Placeholder
                                
                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleSelectCard(index)}
                                        className="w-full aspect-[2/3] rounded-md shadow-sm hover:-translate-y-4 hover:shadow-lg transition-all duration-300 cursor-pointer group relative"
                                    >
                                         <CardBack />
                                         <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors rounded-md pointer-events-none"></div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* STAGE 4: REVEAL */}
                {stage === 'reveal' && (
                    <div className="w-full max-w-6xl animate-fade-in flex flex-col items-center">
                        <h2 className="text-3xl font-hand font-bold text-ink-800 mb-2">{currentSpread.name}</h2>
                        <p className="text-ink-500 font-sans text-sm mb-10">牌阵显现</p>
                        
                        <div className="flex flex-wrap justify-center gap-6 mb-12 w-full px-4">
                            {selectedCards.map((card, index) => (
                                <div key={index} className="flex flex-col items-center perspective-1000 group w-40 sm:w-48">
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 font-sans h-5 text-center">
                                        {currentSpread.positions[index].name}
                                    </div>
                                    
                                    {/* Card Flipper */}
                                    <div className={`relative w-full aspect-[2/3.4] transition-all duration-1000 transform-style-3d group-hover:scale-105 cursor-pointer
                                        ${stage === 'reveal' ? 'rotate-y-0' : 'rotate-y-180'}
                                    `}>
                                        <div className="absolute inset-0 w-full h-full bg-white rounded-xl shadow-2xl overflow-hidden border-4 border-white">
                                            <img 
                                                src={card.image} 
                                                alt={card.name} 
                                                className={`w-full h-full object-cover filter contrast-[1.1] sepia-[0.2] ${card.isReversed ? 'rotate-180' : ''}`}
                                            />
                                            {/* Vintage texture overlay */}
                                            <div className="absolute inset-0 bg-yellow-100/10 mix-blend-multiply pointer-events-none"></div>
                                            <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] pointer-events-none rounded-xl"></div>
                                        </div>
                                    </div>

                                    <div className="mt-4 text-center">
                                        <div className="flex items-center justify-center gap-2 mb-1 flex-wrap">
                                            <h3 className="text-sm font-hand font-bold text-ink-800">{card.name_cn}</h3>
                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-sans uppercase ${card.isReversed ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                {card.isReversed ? 'Rev' : 'Upr'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleInterpret}
                            disabled={isInterpreting}
                            className="px-10 py-4 bg-gradient-to-r from-slate-700 to-slate-900 text-white rounded-2xl font-bold font-sans shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2"
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
                             <button onClick={reset} className="flex items-center gap-2 text-sm text-ink-400 hover:text-slate-800 transition-colors">
                                 <RotateCcw size={16} /> 重新占卜
                             </button>
                        </div>

                        {/* Small Card Summary */}
                        <div className="flex flex-wrap justify-center gap-2 mb-8 px-4">
                             {selectedCards.map((card, idx) => (
                                 <div key={idx} className={`relative w-16 h-24 rounded overflow-hidden border border-white/50 shadow-sm ${card.isReversed ? 'rotate-180' : ''}`} title={card.name_cn}>
                                     <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
                                 </div>
                             ))}
                        </div>

                        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-white shadow-lg space-y-8">
                            
                            {/* Overview */}
                            <div className="border-b border-dashed border-slate-100 pb-6">
                                <div className="flex items-center gap-3 mb-4 text-slate-700">
                                    <Eye size={24} />
                                    <h3 className="text-2xl font-hand font-bold">整体启示</h3>
                                </div>
                                <p className="text-ink-700 leading-relaxed font-sans whitespace-pre-line text-lg">
                                    {reading.overview}
                                </p>
                            </div>

                            {/* Detailed Interpretations */}
                            <div className="grid md:grid-cols-2 gap-6">
                                {reading.interpretations.map((item, idx) => (
                                    <div key={idx} className={`p-5 rounded-2xl ${
                                        idx % 3 === 0 ? 'bg-slate-50' : idx % 3 === 1 ? 'bg-amber-50' : 'bg-sky-50'
                                    }`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className={`text-sm font-bold uppercase ${
                                                idx % 3 === 0 ? 'text-slate-500' : idx % 3 === 1 ? 'text-amber-600' : 'text-sky-600'
                                            }`}>
                                                {item.positionName}
                                            </h4>
                                            <span className="text-xs font-hand font-bold text-ink-500">{item.cardName}</span>
                                        </div>
                                        <p className="text-sm text-ink-600 leading-relaxed">{item.content}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Guidance */}
                            <div className="bg-gradient-to-r from-slate-50 to-amber-50 p-6 rounded-2xl border border-amber-100">
                                <div className="flex items-center gap-2 mb-3 text-amber-600">
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
