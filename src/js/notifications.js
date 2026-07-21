export class NotificationManager {
    static #iconUrl = null;
    static #titleFlashInterval = null;
    static #originalTitle = null;

    static getPermission() {
        if (!('Notification' in window)) {
            return 'unsupported';
        }
        return Notification.permission;
    }

    /**
     * Must be called from a direct user gesture (button click).
     * If the site was previously auto-denied, browsers will not prompt again —
     * the user must reset Notifications for this origin in browser settings.
     */
    static requestPermission() {
        if (!('Notification' in window)) {
            return Promise.resolve('unsupported');
        }

        if (Notification.permission !== 'default') {
            return Promise.resolve(Notification.permission);
        }

        return Notification.requestPermission().catch(() => Notification.permission);
    }

    static getPermissionStatusMessage() {
        switch (this.getPermission()) {
            case 'granted':
                return {
                    state: 'granted',
                    text: 'Browser notifications are on. You will get a banner when a session ends.'
                };
            case 'denied':
                return {
                    state: 'denied',
                    text: 'Browser notifications are blocked for this site. Use the lock/info icon next to the URL → Site settings → Notifications → Allow, then reload.'
                };
            case 'unsupported':
                return {
                    state: 'unsupported',
                    text: 'This browser does not support notifications.'
                };
            default:
                return {
                    state: 'default',
                    text: 'Browser notifications are off. Enable them so alerts work when your laptop is muted.'
                };
        }
    }

    static playSound(alarm = 'relaxing-chime') {
        const alarms = {
            original: () => this.playOriginalBeep(),
            'relaxing-chime': () => this.playRelaxingChime(),
            'urgent-alert': () => this.playUrgentAlert()
        };
        
        (alarms[alarm] || alarms['relaxing-chime'])();
    }

    static createAudioContext() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
            return null;
        }

        return new AudioContext();
    }

    static playOriginalBeep() {
        const audioContext = this.createAudioContext();
        if (!audioContext) {
            return;
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const startTime = audioContext.currentTime;
        const duration = 0.5;
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
        
        setTimeout(() => audioContext.close(), duration * 1000 + 100);
    }

    static playRelaxingChime() {
        const audioContext = this.createAudioContext();
        if (!audioContext) {
            return;
        }

        const masterGain = audioContext.createGain();
        const startTime = audioContext.currentTime;
        const duration = 2.1;
        
        masterGain.gain.setValueAtTime(0.9, startTime);
        masterGain.connect(audioContext.destination);

        const playChimeNote = (frequency, noteStart, noteDuration, peakGain) => {
            const noteTime = startTime + noteStart;
            const tone = audioContext.createOscillator();
            const shimmer = audioContext.createOscillator();
            const toneGain = audioContext.createGain();
            const shimmerGain = audioContext.createGain();

            tone.type = 'sine';
            shimmer.type = 'sine';
            tone.frequency.setValueAtTime(frequency, noteTime);
            shimmer.frequency.setValueAtTime(frequency * 2, noteTime);

            tone.connect(toneGain);
            shimmer.connect(shimmerGain);
            toneGain.connect(masterGain);
            shimmerGain.connect(masterGain);

            toneGain.gain.setValueAtTime(0.001, noteTime);
            toneGain.gain.linearRampToValueAtTime(peakGain, noteTime + 0.04);
            toneGain.gain.exponentialRampToValueAtTime(0.001, noteTime + noteDuration);

            shimmerGain.gain.setValueAtTime(0.001, noteTime);
            shimmerGain.gain.linearRampToValueAtTime(peakGain * 0.18, noteTime + 0.03);
            shimmerGain.gain.exponentialRampToValueAtTime(0.001, noteTime + noteDuration * 0.7);

            tone.start(noteTime);
            shimmer.start(noteTime);
            tone.stop(noteTime + noteDuration);
            shimmer.stop(noteTime + noteDuration);
        };

        // A bright major arpeggio is noticeable without the tension of a siren.
        playChimeNote(523.25, 0, 1.1, 0.14);
        playChimeNote(659.25, 0.32, 1.1, 0.15);
        playChimeNote(783.99, 0.64, 1.05, 0.16);
        playChimeNote(1046.5, 1.02, 0.95, 0.12);
        
        setTimeout(() => audioContext.close(), duration * 1000 + 100);
    }

    static playUrgentAlert() {
        const audioContext = this.createAudioContext();
        if (!audioContext) {
            return;
        }

        const masterGain = audioContext.createGain();
        const startTime = audioContext.currentTime;
        const duration = 1.68;

        masterGain.gain.setValueAtTime(0.92, startTime);
        masterGain.connect(audioContext.destination);

        const filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3200, startTime);
        filter.Q.setValueAtTime(0.7, startTime);
        filter.connect(masterGain);

        const playRhythmHit = (offsetSec, frequency, hitMs, peakGain) => {
            const t0 = startTime + offsetSec;
            const hitDur = hitMs / 1000;
            const tone = audioContext.createOscillator();
            const toneGain = audioContext.createGain();

            tone.type = 'triangle';
            tone.frequency.setValueAtTime(frequency, t0);

            tone.connect(toneGain);
            toneGain.connect(filter);

            toneGain.gain.setValueAtTime(0.0008, t0);
            toneGain.gain.linearRampToValueAtTime(peakGain, t0 + 0.012);
            toneGain.gain.exponentialRampToValueAtTime(0.0008, t0 + hitDur);

            tone.start(t0);
            tone.stop(t0 + hitDur + 0.02);
        };

        const playKick = (offsetSec, peakGain) => {
            const t0 = startTime + offsetSec;
            const kick = audioContext.createOscillator();
            const kickGain = audioContext.createGain();

            kick.type = 'sine';
            kick.frequency.setValueAtTime(150, t0);
            kick.frequency.exponentialRampToValueAtTime(55, t0 + 0.12);

            kick.connect(kickGain);
            kickGain.connect(masterGain);

            kickGain.gain.setValueAtTime(0.0008, t0);
            kickGain.gain.linearRampToValueAtTime(peakGain, t0 + 0.006);
            kickGain.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.14);

            kick.start(t0);
            kick.stop(t0 + 0.16);
        };

        // Staccato groove with downbeat kicks: bold but rounded (triangle + lowpass), not square-wave rigid.
        playKick(0, 0.14);
        playRhythmHit(0, 587.33, 85, 0.26);
        playRhythmHit(0.14, 587.33, 78, 0.22);
        playRhythmHit(0.32, 783.99, 92, 0.3);
        playRhythmHit(0.48, 587.33, 72, 0.2);

        playKick(0.64, 0.12);
        playRhythmHit(0.64, 587.33, 78, 0.24);
        playRhythmHit(0.78, 698.46, 82, 0.26);
        playRhythmHit(0.94, 880, 88, 0.3);
        playRhythmHit(1.08, 587.33, 68, 0.2);

        playKick(1.2, 0.15);
        playRhythmHit(1.2, 783.99, 86, 0.28);
        playRhythmHit(1.34, 698.46, 80, 0.24);
        playRhythmHit(1.48, 1046.5, 105, 0.32);

        setTimeout(() => audioContext.close(), duration * 1000 + 120);
    }

    /** PNG data URL so icons work on GitHub Pages without a separate asset path. */
    static getIconUrl() {
        if (this.#iconUrl) {
            return this.#iconUrl;
        }

        const size = 128;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return undefined;
        }

        ctx.clearRect(0, 0, size, size);

        // Soft tomato body
        const gradient = ctx.createRadialGradient(48, 44, 12, 64, 70, 56);
        gradient.addColorStop(0, '#e8785a');
        gradient.addColorStop(1, '#b84a32');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(64, 72, 48, 42, 0, 0, Math.PI * 2);
        ctx.fill();

        // Leaf
        ctx.fillStyle = '#4a7a3a';
        ctx.beginPath();
        ctx.ellipse(64, 28, 18, 10, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(78, 32, 14, 8, 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Stem
        ctx.strokeStyle = '#3d5f30';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(64, 38);
        ctx.lineTo(64, 22);
        ctx.stroke();

        this.#iconUrl = canvas.toDataURL('image/png');
        return this.#iconUrl;
    }

    static showNotification(title, body, options = {}) {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            return false;
        }

        const {
            tag = `pomodoro-${Date.now()}`,
            requireInteraction = true
        } = options;

        const attempts = [
            {
                body,
                icon: this.getIconUrl(),
                tag,
                requireInteraction,
                silent: false
            },
            // Fallback if icon/options are rejected by the browser.
            {
                body,
                tag,
                requireInteraction
            },
            {
                body
            }
        ];

        for (const opts of attempts) {
            try {
                const notification = new Notification(title, opts);

                notification.onclick = () => {
                    window.focus();
                    this.stopTitleFlash();
                    notification.close();
                };

                notification.onerror = () => {
                    console.error('Notification failed to display');
                };

                return true;
            } catch (error) {
                console.warn('Notification attempt failed, trying simpler options:', error);
            }
        }

        return false;
    }

    static startTitleFlash(message) {
        this.stopTitleFlash();
        this.#originalTitle = document.title;
        let showAlert = false;
        document.title = `⏰ ${message}`;

        this.#titleFlashInterval = setInterval(() => {
            showAlert = !showAlert;
            document.title = showAlert
                ? `⏰ ${message}`
                : (this.#originalTitle || 'Pomodoro Timer');
        }, 1000);
    }

    static stopTitleFlash() {
        if (this.#titleFlashInterval) {
            clearInterval(this.#titleFlashInterval);
            this.#titleFlashInterval = null;
        }
        if (this.#originalTitle !== null) {
            document.title = this.#originalTitle;
            this.#originalTitle = null;
        }
    }

    /**
     * OS banner when allowed; tab-title flash when the page is hidden
     * (covers muted devices and denied notification permission).
     */
    static alertUser(title, body) {
        this.showNotification(title, body, { tag: 'pomodoro-complete' });

        if (document.hidden) {
            this.startTitleFlash(title);
        }
    }
}
