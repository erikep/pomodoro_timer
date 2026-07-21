export class Timer {
    constructor(durations, onTick) {
        this.durations = durations;
        this.mode = 'pomodoro';
        this.timeLeft = durations[this.mode];
        this.isRunning = false;
        this.intervalId = null;
        this.startTime = null;
        this.initialTimeLeft = null;
        this.onTick = onTick || (() => {});
    }
    
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.startTime = Date.now();
            this.initialTimeLeft = this.timeLeft;
            this.intervalId = setInterval(() => {
                const result = this.tick();
                this.onTick(result);
            }, 100);
        }
    }
    
    pause() {
        if (this.isRunning) {
            this.isRunning = false;
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
            this.startTime = null;
            this.initialTimeLeft = null;
        }
    }
    
    reset() {
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.startTime = null;
        this.initialTimeLeft = null;
        this.timeLeft = this.durations[this.mode];
    }
    
    setMode(mode) {
        this.mode = mode;
        this.timeLeft = this.durations[mode];
    }
    
    updateDuration(mode, durationSeconds) {
        this.durations[mode] = durationSeconds;
        if (this.mode === mode && !this.isRunning) {
            this.timeLeft = durationSeconds;
        }
    }
    
    syncTimer() {
        if (!this.isRunning || !this.startTime || this.initialTimeLeft === null) {
            return false;
        }
        
        const now = Date.now();
        const elapsed = Math.floor((now - this.startTime) / 1000);
        const newTimeLeft = this.initialTimeLeft - elapsed;
        
        if (newTimeLeft <= 0) {
            this.timeLeft = 0;
            return true; // Timer completed
        } else {
            this.timeLeft = newTimeLeft;
            return false;
        }
    }
    
    tick() {
        if (!this.isRunning || !this.startTime || this.initialTimeLeft === null) {
            return false;
        }
        
        const now = Date.now();
        const elapsed = Math.floor((now - this.startTime) / 1000);
        const newTimeLeft = this.initialTimeLeft - elapsed;
        
        if (newTimeLeft <= 0) {
            this.timeLeft = 0;
            return true; // Timer completed
        } else {
            const previousSeconds = Math.floor(this.timeLeft);
            const newSeconds = Math.floor(newTimeLeft);
            
            if (previousSeconds !== newSeconds) {
                this.timeLeft = newTimeLeft;
                return 'update'; // Need to update display
            }
            return false;
        }
    }
    
    getState() {
        return {
            mode: this.mode,
            timeLeft: this.timeLeft,
            isRunning: this.isRunning,
            durations: { ...this.durations }
        };
    }
}
