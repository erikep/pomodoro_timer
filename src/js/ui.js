export class UI {
    constructor(elements) {
        this.timeDisplay = elements.timeDisplay;
        this.timerStatus = elements.timerStatus;
        this.sessionCountEl = elements.sessionCountEl;
        this.startBtn = elements.startBtn;
        this.pauseBtn = elements.pauseBtn;
        this.resetBtn = elements.resetBtn;
        this.modeButtons = elements.modeButtons;
        this.durationInputs = elements.durationInputs;
        this.progressCircle = elements.progressCircle;
        this.body = elements.body;
    }
    
    updateDisplay(timeLeft, totalTime) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        this.timeDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        // Update progress circle
        const circumference = 2 * Math.PI * 140;
        const elapsed = totalTime - timeLeft;
        const offset = circumference - (elapsed / totalTime) * circumference;
        this.progressCircle.style.strokeDashoffset = offset;
    }
    
    updateStatus(status, mode, isRunning, timeLeft, fullDuration) {
        if (isRunning) {
            const modeNames = {
                pomodoro: 'Focus Time',
                'short-break': 'Short Break',
                'long-break': 'Long Break'
            };
            this.timerStatus.textContent = modeNames[mode] || 'Running';
        } else if (timeLeft === fullDuration) {
            this.timerStatus.textContent = 'Ready to Focus';
        } else {
            this.timerStatus.textContent = 'Paused';
        }
    }
    
    updateModeButtons(activeMode) {
        this.modeButtons.forEach(btn => {
            if (btn.dataset.mode === activeMode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    updateBodyClass(mode) {
        const modeClasses = {
            pomodoro: 'pomodoro-mode',
            'short-break': 'short-break-mode',
            'long-break': 'long-break-mode'
        };
        
        this.body.classList.remove(...Object.values(modeClasses));
        
        if (modeClasses[mode]) {
            this.body.classList.add(modeClasses[mode]);
        }
    }
    
    updateSessionCount(count) {
        this.sessionCountEl.textContent = count;
    }
    
    setButtonStates(isRunning) {
        if (isRunning) {
            this.startBtn.style.display = 'none';
            this.pauseBtn.style.display = 'inline-block';
        } else {
            this.startBtn.style.display = 'inline-block';
            this.pauseBtn.style.display = 'none';
        }
    }
    
    updateDurationInputsState(isRunning) {
        this.durationInputs.forEach(input => {
            input.disabled = isRunning;
        });
    }
    
    initializeDurationInputs(durations) {
        this.durationInputs.forEach(input => {
            const mode = input.dataset.mode;
            input.value = durations[mode] / 60;
        });
    }
}
