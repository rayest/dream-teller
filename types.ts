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

export interface TarotCard {
  id: number;
  name: string;
  name_cn: string;
  isReversed: boolean;
  meaning_upright: string;
  meaning_reversed: string;
}

export interface TarotReadingResult {
  overview: string;
  past: string;
  present: string;
  future: string;
  guidance: string;
}