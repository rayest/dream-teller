import { SoundscapeParams } from "../types";

// Musical Scale intervals (semitones from root)
const SCALES: Record<string, number[]> = {
    major: [0, 2, 4, 5, 7, 9, 11, 12],
    minor: [0, 2, 3, 5, 7, 8, 10, 12],
    pentatonic_major: [0, 2, 4, 7, 9, 12],
    pentatonic_minor: [0, 3, 5, 7, 10, 12],
    lydian: [0, 2, 4, 6, 7, 9, 11, 12], // Dreamy
    dorian: [0, 2, 3, 5, 7, 9, 10, 12], // Medieval/Mysterious
    whole_tone: [0, 2, 4, 6, 8, 10, 12], // Unsettling
};

export class DreamSynthesizer {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private oscillators: OscillatorNode[] = [];
    private gainNodes: GainNode[] = [];
    private intervals: number[] = [];
    private params: SoundscapeParams;
    private isPlaying: boolean = false;

    constructor(params: SoundscapeParams) {
        this.params = params;
    }

    private getScaleFrequencies(root: number, scaleType: string): number[] {
        const intervals = SCALES[scaleType] || SCALES.major;
        const freqs: number[] = [];
        // Generate 2 octaves
        intervals.forEach(interval => {
            freqs.push(root * Math.pow(2, interval / 12));
        });
        intervals.forEach(interval => {
            freqs.push((root * 2) * Math.pow(2, interval / 12));
        });
        return freqs;
    }

    public start() {
        if (this.isPlaying) return;
        
        const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.masterGain.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + 3); // Fade in

        this.isPlaying = true;
        this.createDrone();
        this.createSparkles();
    }

    public stop() {
        if (!this.ctx || !this.masterGain) return;
        
        // Fade out
        const now = this.ctx.currentTime;
        try {
            this.masterGain.gain.cancelScheduledValues(now);
            this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
            this.masterGain.gain.exponentialRampToValueAtTime(0.001, now + 3);
        } catch (e) {
            // Ignore potential errors if context is in a weird state
        }

        setTimeout(() => {
            this.oscillators.forEach(osc => {
                try { osc.stop(); } catch(e) {}
            });
            this.intervals.forEach(id => window.clearInterval(id));
            
            // Fix: Check state before closing to avoid "Cannot close a closed AudioContext"
            if (this.ctx && this.ctx.state !== 'closed') {
                try {
                    this.ctx.close();
                } catch (e) {
                    console.error("Error closing AudioContext:", e);
                }
            }
            
            this.isPlaying = false;
            this.oscillators = [];
            this.gainNodes = [];
            this.intervals = [];
            this.ctx = null;
            this.masterGain = null;
        }, 3100);
    }

    private createDrone() {
        if (!this.ctx || !this.masterGain) return;

        // Create 2-3 oscillators for a thick drone
        const count = 3;
        const detuneSpread = 15; // cents

        for (let i = 0; i < count; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            // Setup Oscillator
            osc.type = this.params.waveShape;
            // Lower octave for drone
            osc.frequency.value = this.params.rootFreq / 2; 
            // Slight detuning for thickness
            osc.detune.value = (Math.random() * detuneSpread * 2) - detuneSpread;

            // Setup Filter (Lowpass for warmth)
            filter.type = 'lowpass';
            const brightness = this.params.texture === 'dark' ? 400 : this.params.texture === 'gritty' ? 2000 : 800;
            filter.frequency.value = brightness;
            
            // LFO for filter modulation (movement)
            const lfo = this.ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = (this.params.tempo / 60) * 0.1; // Very slow
            const lfoGain = this.ctx.createGain();
            lfoGain.gain.value = 200; // Filter modulation depth
            lfo.connect(lfoGain);
            lfoGain.connect(filter.frequency);
            lfo.start();
            this.oscillators.push(lfo);

            // Connect graph
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            gain.gain.value = 0.15; // Low volume for drone

            osc.start();
            this.oscillators.push(osc);
            this.gainNodes.push(gain);
        }
    }

    private createSparkles() {
        if (!this.ctx || !this.masterGain) return;

        const scaleFreqs = this.getScaleFrequencies(this.params.rootFreq, this.params.scale);
        
        // Interval determined by tempo
        const intervalTime = (60 / this.params.tempo) * 1000;

        const intervalId = window.setInterval(() => {
            // Safety check inside interval
            if (!this.ctx || !this.masterGain || this.ctx.state === 'closed') {
                window.clearInterval(intervalId);
                return;
            }

            // Random chance to play a note
            if (Math.random() > 0.4) return;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const pan = this.ctx.createStereoPanner();

            osc.type = this.params.waveShape === 'square' ? 'triangle' : 'sine'; // Softer for melody
            
            // Pick random note from scale
            const noteFreq = scaleFreqs[Math.floor(Math.random() * scaleFreqs.length)];
            // Sometimes go up an octave
            osc.frequency.value = Math.random() > 0.7 ? noteFreq * 2 : noteFreq;

            pan.pan.value = (Math.random() * 2) - 1; // Random pan

            // Envelope
            const now = this.ctx.currentTime;
            const attack = this.params.texture === 'gritty' ? 0.05 : 1.5;
            const release = 3.0;

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.1, now + attack);
            gain.gain.exponentialRampToValueAtTime(0.001, now + attack + release);

            osc.connect(pan);
            pan.connect(gain);
            gain.connect(this.masterGain);

            osc.start();
            osc.stop(now + attack + release + 1);

            // Cleanup node references
            setTimeout(() => {
                try {
                    osc.disconnect();
                    gain.disconnect();
                    pan.disconnect();
                } catch (e) {}
            }, (attack + release + 1.1) * 1000);

        }, intervalTime);

        this.intervals.push(intervalId);
    }
}