
export interface DreamAnalysis {
  title: string;
  summary: string;
  interpretation: string;
  emotionalState: string;
  psychologicalMeaning: string;
  guidance: string;
  keywords: string[];
  dominantEmotion?: string;
  emotionalIntensity?: number;
  followUpQuestions?: string[]; // Questions to guide further recall
}

export interface MusicRecommendation {
  intro: string;
  tracks: { title: string; uri: string }[];
}

export interface SoundscapeParams {
  rootFreq: number; // Base frequency in Hz (e.g., 440, 220)
  scale: 'major' | 'minor' | 'pentatonic_major' | 'pentatonic_minor' | 'lydian' | 'dorian' | 'whole_tone';
  waveShape: 'sine' | 'triangle' | 'sawtooth' | 'square';
  texture: 'ethereal' | 'warm' | 'dark' | 'gritty';
  tempo: number; // BPM for modulation/arpeggiation
  moodDescription: string;
}

export interface CreativeWriting {
  type: 'story' | 'poem';
  title: string;
  content: string;
}

export interface DreamEntry {
  id: string;
  date: string;
  content: string;
  analysis: DreamAnalysis | null;
  timestamp: number;
  musicRecommendation?: MusicRecommendation;
  soundscapeParams?: SoundscapeParams;
  generatedImage?: string; // Base64 data URI
  artStyle?: string;
  creativeWriting?: CreativeWriting;
}

export interface UserState {
  dreams: DreamEntry[];
  currentDreamInput: string;
  isAnalyzing: boolean;
  selectedDreamId: string | null;
}

// --- Tarot Types ---

export interface BaseTarotCard {
  name: string;
  name_cn: string;
  isReversed: boolean;
  meaning_upright: string;
  meaning_reversed: string;
  image: string; // URL to the card image
}

export interface MajorArcanaCard extends BaseTarotCard {
  type: 'major';
  id: number;
}

export interface MinorArcanaCard extends BaseTarotCard {
  type: 'minor';
  suit: 'wands' | 'cups' | 'swords' | 'pentacles';
  rank: number; // 1-14 (1=Ace, 11=Page, 12=Knight, 13=Queen, 14=King)
  id: string;
}

export type TarotCard = MajorArcanaCard | MinorArcanaCard;

export interface TarotSpreadPosition {
  id: string;
  name: string;
  description: string;
}

export interface TarotSpread {
  id: string;
  name: string;
  description: string;
  cardCount: number;
  positions: TarotSpreadPosition[];
}

export interface TarotReadingResult {
  overview: string;
  // Generic interpretations array to support variable spreads
  interpretations: {
    positionName: string;
    cardName: string;
    content: string;
  }[]; 
  guidance: string;
  // Legacy fields for backward compatibility if needed, but we will move to generic
  past?: string;
  present?: string;
  future?: string;
}

// --- Second Life (RPG) Types ---

export interface SecondLifeProfile {
  level: number;
  exp: number; // 0-100 to next level
  archetype: string; // e.g. "Dream Walker", "Astral Mage", "Void Traveler"
  title: string; // e.g. "Novice Oneiric"
  attributes: {
    lucidity: number; // Clarity / Logic
    imagination: number; // Creativity / Magic
    resilience: number; // Emotional strength / HP
  };
}

export interface DreamTotem {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  sourceDreamId: string;
  icon: string; // emoji or keyword
}

export interface SecondLifeEvent {
  id: string;
  date: string;
  dreamId: string;
  chapterTitle: string;
  narrative: string; // The RPG story progression
  attributeChanges: {
    lucidity?: number;
    imagination?: number;
    resilience?: number;
  };
  acquiredTotem?: DreamTotem;
  realWorldQuest: string; // "Synchronicity Task"
}

export interface SecondLifeState {
  profile: SecondLifeProfile;
  events: SecondLifeEvent[];
  inventory: DreamTotem[];
  syncedDreamIds: string[];
}
