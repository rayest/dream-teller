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
}

export interface UserState {
  dreams: DreamEntry[];
  currentDreamInput: string;
  isAnalyzing: boolean;
  selectedDreamId: string | null;
}