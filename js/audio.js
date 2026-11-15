/**
 * ORBITAL CLEANUP: MISSION ZERO
 * Audio Synthesis Engine using Web Audio API
 * Provides procedural sound effects and ambient sci-fi space music
 */

class SoundSystem {
    constructor() {
        this.ctx = null;
        this.initialized = false;
        this.sfxEnabled = true;
        this.musicEnabled = true;
        this.masterVolume = 0.85;
        this.sfxVolume = 0.9;
        this.musicVolume = 0.55;
        
        // Active audio nodes
        this.thrusterNode = null;
        this.thrusterGain = null;
        this.tractorNode = null;
        this.tractorGain = null;
        this.warningInterval = null;
        this.isWarningPlaying = false;
        
        // Ambient music nodes
        this.ambientMusicGain = null;
        this.isMusicPlaying = false;
        this.musicTimer = null;
    }

    init() {
        if (this.initialized && this.ctx) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) {
                console.warn("Web Audio API not supported on this browser.");
                return;
            }
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);
            
            this.initialized = true;
            this.setupThrusterNode();
            this.setupTractorNode();
            
            if (this.musicEnabled && !this.isMusicPlaying) {
                this.startAmbientMusic();
            }
        } catch (e) {
            console.warn("Web Audio API initialization error:", e);
        }
    }

    resume() {
        if (!this.initialized) {
            this.init();
        }
        if (this.ctx) {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume().then(() => {
                    if (this.musicEnabled && !this.isMusicPlaying) {
                        this.startAmbientMusic();
                    }
                }).catch(e => console.warn("Audio resume error:", e));
            } else if (this.musicEnabled && !this.isMusicPlaying) {
                this.startAmbientMusic();
            }
        }
    }

    setupThrusterNode() {
        if (!this.ctx) return;
        try {
            const bufferSize = this.ctx.sampleRate * 2;
            const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }

            const whiteNoise = this.ctx.createBufferSource();
            whiteNoise.buffer = noiseBuffer;
            whiteNoise.loop = true;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(160, this.ctx.currentTime);

            this.thrusterGain = this.ctx.createGain();
            this.thrusterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

            whiteNoise.connect(filter);
            filter.connect(this.thrusterGain);
            this.thrusterGain.connect(this.masterGain);

            whiteNoise.start(0);
            this.thrusterNode = { source: whiteNoise, filter: filter };
        } catch (e) {
            console.warn("Thruster setup error:", e);
        }
    }

    setThruster(active, intensity = 1.0) {
        if (!this.initialized) this.resume();
        if (!this.sfxEnabled || !this.thrusterGain || !this.ctx) return;
        const now = this.ctx.currentTime;
        if (active) {
            const targetGain = 0.35 * intensity * this.sfxVolume;
            this.thrusterGain.gain.setTargetAtTime(targetGain, now, 0.05);
            if (this.thrusterNode && this.thrusterNode.filter) {
                this.thrusterNode.filter.frequency.setTargetAtTime(260 + intensity * 240, now, 0.05);
            }
        } else {
            this.thrusterGain.gain.setTargetAtTime(0.0001, now, 0.08);
        }
    }

    setupTractorNode() {
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(85, this.ctx.currentTime);

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(320, this.ctx.currentTime);
            filter.Q.setValueAtTime(4, this.ctx.currentTime);

            this.tractorGain = this.ctx.createGain();
            this.tractorGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

            osc.connect(filter);
            filter.connect(this.tractorGain);
            this.tractorGain.connect(this.masterGain);

            osc.start(0);
            this.tractorNode = { osc, filter };
        } catch (e) {
            console.warn("Tractor setup error:", e);
        }
    }

    setTractorBeam(active) {
        if (!this.initialized) this.resume();
        if (!this.sfxEnabled || !this.tractorGain || !this.ctx) return;
        const now = this.ctx.currentTime;
        if (active) {
            this.tractorGain.gain.setTargetAtTime(0.28 * this.sfxVolume, now, 0.06);
            if (this.tractorNode && this.tractorNode.osc) {
                this.tractorNode.osc.frequency.setTargetAtTime(130 + Math.sin(now * 12) * 30, now, 0.05);
            }
        } else {
            this.tractorGain.gain.setTargetAtTime(0.0001, now, 0.08);
        }
    }

    playCollect(rarity = 1) {
        this.resume();
        if (!this.sfxEnabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        
        // Pentatonic chime chords
        const baseFreq = 523.25; // C5
        const freqs = [baseFreq, baseFreq * 1.25, baseFreq * 1.5];
        if (rarity > 1) freqs.push(baseFreq * 2.0);

        freqs.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.04);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.05, now + idx * 0.04 + 0.3);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.setValueAtTime(0.22 * this.sfxVolume, now + idx * 0.04);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 0.45);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now + idx * 0.04);
            osc.stop(now + idx * 0.04 + 0.5);
        });
    }

    playNetLaunch() {
        this.resume();
        if (!this.sfxEnabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(850, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.35);

        gain.gain.setValueAtTime(0.26 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.35);
    }

    playArmGrapple() {
        this.resume();
        if (!this.sfxEnabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(130, now + 0.12);

        gain.gain.setValueAtTime(0.24 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    playCollision() {
        this.resume();
        if (!this.sfxEnabled || !this.ctx) return;
        const now = this.ctx.currentTime;

        // Sub-bass impact
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.3);

        oscGain.gain.setValueAtTime(0.45 * this.sfxVolume, now);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

        osc.connect(oscGain);
        oscGain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.35);

        // Metal crunch noise
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.25);
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, now);
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.3 * this.sfxVolume, now);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(now);
    }

    playExplosion() {
        this.resume();
        if (!this.sfxEnabled || !this.ctx) return;
        const now = this.ctx.currentTime;

        // Low boom
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.8);

        gain.gain.setValueAtTime(0.6 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.85);

        // Crackle noise
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.7);
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(550, now);
        filter.frequency.exponentialRampToValueAtTime(80, now + 0.6);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.5 * this.sfxVolume, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(now);
    }

    playDockingRecycle() {
        this.resume();
        if (!this.sfxEnabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        
        // Mechanical recycling whine
        const notes = [330, 440, 554, 659, 880];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);

            gain.gain.setValueAtTime(0.001, now + idx * 0.08);
            gain.gain.setValueAtTime(0.18 * this.sfxVolume, now + idx * 0.08 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.35);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.4);
        });
    }

    playLaserNudge() {
        this.resume();
        if (!this.sfxEnabled || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(1300, now);
            osc.frequency.exponentialRampToValueAtTime(260, now + 0.14);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.setValueAtTime(0.32 * this.sfxVolume, now + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 0.18);
        } catch (e) {
            console.warn('Laser nudge audio error:', e);
        }
    }

    playStripDebris() {
        this.resume();
        if (!this.sfxEnabled || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            // Laser cutter deconstruction chord
            const pitches = [587, 784, 987, 1174];
            pitches.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + idx * 0.05);

                gain.gain.setValueAtTime(0.001, now + idx * 0.05);
                gain.gain.setValueAtTime(0.2 * this.sfxVolume, now + idx * 0.05 + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.25);

                osc.connect(gain);
                gain.connect(this.masterGain);
                osc.start(now + idx * 0.05);
                osc.stop(now + idx * 0.05 + 0.28);
            });
        } catch (e) {
            console.warn('Strip debris audio error:', e);
        }
    }

    playConjunctionAlarm() {
        this.resume();
        if (!this.sfxEnabled || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            [1046, 1318].forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, now + idx * 0.09);

                gain.gain.setValueAtTime(0.001, now + idx * 0.09);
                gain.gain.setValueAtTime(0.18 * this.sfxVolume, now + idx * 0.09 + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 0.08);

                osc.connect(gain);
                gain.connect(this.masterGain);
                osc.start(now + idx * 0.09);
                osc.stop(now + idx * 0.09 + 0.1);
            });
        } catch (e) {
            console.warn('Conjunction alarm audio error:', e);
        }
    }

    playWarning(trigger = true) {
        try {
            if (!this.initialized) this.resume();
            if (!this.sfxEnabled || !this.ctx) return;
            if (trigger && !this.isWarningPlaying) {
                this.isWarningPlaying = true;
                if (this.warningInterval) {
                    clearInterval(this.warningInterval);
                    this.warningInterval = null;
                }
                this.warningInterval = setInterval(() => {
                    try {
                        if (!this.isWarningPlaying || !this.ctx || this.ctx.state !== 'running') return;
                        const now = this.ctx.currentTime;
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = 'sawtooth';
                        osc.frequency.setValueAtTime(880, now);
                        osc.frequency.setValueAtTime(740, now + 0.08);

                        const vol = Math.max(0.0001, 0.2 * (this.sfxVolume || 0.8));
                        gain.gain.setValueAtTime(vol, now);
                        gain.gain.linearRampToValueAtTime(0.0001, now + 0.16);

                        osc.connect(gain);
                        gain.connect(this.masterGain);
                        osc.start(now);
                        osc.stop(now + 0.18);
                    } catch (e) {
                        // Safe audio error suppression
                    }
                }, 350);
            } else if (!trigger && this.isWarningPlaying) {
                this.isWarningPlaying = false;
                if (this.warningInterval) {
                    clearInterval(this.warningInterval);
                    this.warningInterval = null;
                }
            }
        } catch (e) {
            // Safe audio error suppression
        }
    }

    playUiClick() {
        this.resume();
        if (!this.sfxEnabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.04);

        gain.gain.setValueAtTime(0.25 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.06);
    }

    playMissionSuccess() {
        this.resume();
        if (!this.sfxEnabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        const chord = [440, 554.37, 659.25, 880]; // A major
        chord.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.1);

            gain.gain.setValueAtTime(0.28 * this.sfxVolume, now + idx * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 1.2);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now + idx * 0.1);
            osc.stop(now + idx * 0.1 + 1.3);
        });
    }

    playMissionFailed() {
        this.resume();
        if (!this.sfxEnabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [293.66, 277.18, 261.63, 220]; // D minor melancholy
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + idx * 0.22);

            gain.gain.setValueAtTime(0.25 * this.sfxVolume, now + idx * 0.22);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.22 + 0.6);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now + idx * 0.22);
            osc.stop(now + idx * 0.22 + 0.65);
        });
    }

    startAmbientMusic() {
        if (!this.ctx || this.isMusicPlaying || !this.musicEnabled) return;
        this.isMusicPlaying = true;

        // Ambient Drone Pad with Warm Polyphonic Harmonies
        const chords = [
            [110, 164.81, 220, 277.18], // A Major 7th
            [98, 146.83, 196, 246.94],  // G Major 9th
            [82.41, 123.47, 164.81, 220] // E minor 7th
        ];
        let chordIndex = 0;

        if (!this.ambientMusicGain) {
            this.ambientMusicGain = this.ctx.createGain();
            this.ambientMusicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
            this.ambientMusicGain.connect(this.masterGain);
        } else {
            this.ambientMusicGain.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.1);
        }

        const playDrone = () => {
            if (!this.isMusicPlaying || !this.ctx || !this.musicEnabled) return;
            const currentChord = chords[chordIndex % chords.length];
            chordIndex++;

            const now = this.ctx.currentTime;
            const duration = 6.0;

            currentChord.forEach(freq => {
                const osc = this.ctx.createOscillator();
                const nodeGain = this.ctx.createGain();
                const filter = this.ctx.createBiquadFilter();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);

                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(500, now);
                filter.frequency.linearRampToValueAtTime(800, now + duration * 0.5);
                filter.frequency.linearRampToValueAtTime(400, now + duration);

                nodeGain.gain.setValueAtTime(0.001, now);
                nodeGain.gain.linearRampToValueAtTime(0.22, now + 1.5);
                nodeGain.gain.linearRampToValueAtTime(0.001, now + duration);

                osc.connect(filter);
                filter.connect(nodeGain);
                nodeGain.connect(this.ambientMusicGain);

                osc.start(now);
                osc.stop(now + duration);
            });

            this.musicTimer = setTimeout(playDrone, (duration - 1.2) * 1000);
        };

        playDrone();
    }

    stopAmbientMusic() {
        this.isMusicPlaying = false;
        if (this.musicTimer) {
            clearTimeout(this.musicTimer);
            this.musicTimer = null;
        }
        if (this.ambientMusicGain && this.ctx) {
            this.ambientMusicGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.3);
        }
    }

    toggleSFX() {
        this.resume();
        this.sfxEnabled = !this.sfxEnabled;
        if (!this.sfxEnabled) {
            this.setThruster(false);
            this.setTractorBeam(false);
            this.playWarning(false);
        } else {
            this.playUiClick();
        }
        return this.sfxEnabled;
    }

    toggleMusic() {
        this.resume();
        this.musicEnabled = !this.musicEnabled;
        if (this.musicEnabled) {
            this.startAmbientMusic();
        } else {
            this.stopAmbientMusic();
        }
        return this.musicEnabled;
    }
}

// Global instance
window.soundSystem = new SoundSystem();

// Global user gesture unlocker for Web Audio Autoplay Policy
['click', 'keydown', 'pointerdown', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, () => {
        if (window.soundSystem) {
            window.soundSystem.resume();
        }
    }, { once: false });
});
