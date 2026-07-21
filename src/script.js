import { DEFAULT_DURATIONS } from './js/config.js';
import { StorageManager } from './js/storage.js';
import { FocusGraph } from './js/graph.js';
import { Timer } from './js/timer.js';
import { UI } from './js/ui.js';
import { NotificationManager } from './js/notifications.js';

class PomodoroTimer {
    constructor() {
        // Initialize storage and load data
        this.durations = StorageManager.loadDurations();
        this.notificationAlarm = StorageManager.loadNotificationAlarm();
        this.sessionCount = 0;
        
        // Initialize timer with tick callback
        this.timer = new Timer(this.durations, (result) => {
            if (result === true) {
                this.complete();
            } else if (result === 'update') {
                this.updateDisplay();
            }
        });
        
        // Initialize UI elements
        this.initializeElements();
        
        // Initialize UI helpers
        this.ui = new UI({
            timeDisplay: this.timeDisplay,
            timerStatus: this.timerStatus,
            sessionCountEl: this.sessionCountEl,
            startBtn: this.startBtn,
            pauseBtn: this.pauseBtn,
            resetBtn: this.resetBtn,
            modeButtons: this.modeButtons,
            durationInputs: this.durationInputs,
            progressCircle: this.progressCircle,
            body: this.body
        });
        
        // Initialize graph (only if canvas exists)
        if (this.graphCanvas && this.graphCtx) {
            this.graph = new FocusGraph(
                this.graphCanvas,
                this.graphCtx,
                this.todayTimeEl,
                this.weekTimeEl
            );
        } else {
            this.graph = null;
        }
        
        // Initialize UI state
        this.ui.initializeDurationInputs(this.durations);
        this.ui.updateBodyClass(this.timer.mode);
        if (this.notificationAlarmSelect) {
            this.notificationAlarmSelect.value = this.notificationAlarm;
        }
        this.updateNotificationPermissionUI();
        
        // Clean up old data and update display
        StorageManager.cleanupOldFocusData();
        this.updateDisplay();
        this.updateStatus();
        this.ui.updateDurationInputsState(this.timer.isRunning);
        if (this.graph) {
            this.graph.update();
        }
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    initializeElements() {
        this.timeDisplay = document.getElementById('time-display');
        this.timerStatus = document.getElementById('timer-status');
        this.sessionCountEl = document.getElementById('session-count');
        this.startBtn = document.getElementById('start-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.notificationAlarmSelect = document.getElementById('notification-alarm');
        this.testAlarmBtn = document.getElementById('test-alarm-btn');
        this.enableNotificationsBtn = document.getElementById('enable-notifications-btn');
        this.testNotificationBtn = document.getElementById('test-notification-btn');
        this.notificationPermissionStatus = document.getElementById('notification-permission-status');
        this.settingsBtn = document.getElementById('settings-btn');
        this.settingsModal = document.getElementById('settings-modal');
        this.settingsCloseBtn = document.getElementById('settings-close-btn');
        this.modeButtons = document.querySelectorAll('.mode-btn');
        this.durationInputs = document.querySelectorAll('.duration-input');
        this.progressCircle = document.querySelector('.progress-ring-circle');
        this.graphCanvas = document.getElementById('focus-graph');
        this.graphCtx = this.graphCanvas ? this.graphCanvas.getContext('2d') : null;
        this.todayTimeEl = document.getElementById('today-time');
        this.weekTimeEl = document.getElementById('week-time');
        this.body = document.body;
    }

    openSettings() {
        if (!this.settingsModal) {
            return;
        }

        this.updateNotificationPermissionUI();

        if (typeof this.settingsModal.showModal === 'function') {
            this.settingsModal.showModal();
        } else {
            this.settingsModal.setAttribute('open', '');
        }

        this.settingsCloseBtn?.focus();
    }

    closeSettings() {
        if (!this.settingsModal) {
            return;
        }

        if (typeof this.settingsModal.close === 'function' && this.settingsModal.open) {
            this.settingsModal.close();
        } else {
            this.settingsModal.removeAttribute('open');
        }

        this.settingsBtn?.focus();
    }

    updateNotificationPermissionUI() {
        const status = NotificationManager.getPermissionStatusMessage();

        if (this.notificationPermissionStatus) {
            this.notificationPermissionStatus.textContent = status.text;
            this.notificationPermissionStatus.dataset.state = status.state;
        }

        if (this.enableNotificationsBtn) {
            const canPrompt = status.state === 'default';
            this.enableNotificationsBtn.disabled = !canPrompt;
            this.enableNotificationsBtn.textContent = status.state === 'granted'
                ? 'Browser Notifications Enabled'
                : status.state === 'denied'
                    ? 'Notifications Blocked — Use Browser Settings'
                    : 'Enable Browser Notifications';
        }

        if (this.testNotificationBtn) {
            this.testNotificationBtn.disabled = status.state !== 'granted';
        }
    }

    async enableBrowserNotifications() {
        const permission = await NotificationManager.requestPermission();
        this.updateNotificationPermissionUI();

        if (permission === 'granted') {
            this.testBrowserNotification();
        }
    }

    testBrowserNotification() {
        const sent = NotificationManager.showNotification(
            'Test notification',
            'If you can read this, browser banners are working.',
            { tag: `pomodoro-test-${Date.now()}`, requireInteraction: true }
        );

        if (!this.notificationPermissionStatus) {
            return;
        }

        if (!sent) {
            this.notificationPermissionStatus.textContent =
                'Could not create a notification. Check the browser console for errors.';
            this.notificationPermissionStatus.dataset.state = 'denied';
            return;
        }

        // macOS often suppresses banners while this tab is focused; they still appear
        // in Notification Center, and show as banners when the tab is in the background.
        this.notificationPermissionStatus.dataset.state = 'granted';
        this.notificationPermissionStatus.textContent = document.hidden
            ? 'Test notification sent. Look for the OS banner.'
            : 'Test notification sent. Switch to another app/tab for ~2 seconds, or check Notification Center — macOS often hides banners while this tab is focused.';
    }
    
    setupEventListeners() {
        // Timer controls
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => this.start());
        }
        if (this.pauseBtn) {
            this.pauseBtn.addEventListener('click', () => this.pause());
        }
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => this.reset());
        }
        if (this.testAlarmBtn) {
            this.testAlarmBtn.addEventListener('click', () => {
                NotificationManager.playSound(this.notificationAlarm);
            });
        }
        if (this.enableNotificationsBtn) {
            this.enableNotificationsBtn.addEventListener('click', () => {
                this.enableBrowserNotifications();
            });
        }
        if (this.testNotificationBtn) {
            this.testNotificationBtn.addEventListener('click', () => {
                this.testBrowserNotification();
            });
        }
        if (this.settingsBtn) {
            this.settingsBtn.addEventListener('click', () => this.openSettings());
        }
        if (this.settingsCloseBtn) {
            this.settingsCloseBtn.addEventListener('click', () => this.closeSettings());
        }
        if (this.settingsModal) {
            this.settingsModal.addEventListener('click', (e) => {
                // Close when clicking the backdrop (the dialog element itself).
                if (e.target === this.settingsModal) {
                    this.closeSettings();
                }
            });
            this.settingsModal.addEventListener('cancel', (e) => {
                e.preventDefault();
                this.closeSettings();
            });
        }
        if (this.notificationAlarmSelect) {
            this.notificationAlarmSelect.addEventListener('change', (e) => {
                this.notificationAlarm = e.target.value;
                StorageManager.saveNotificationAlarm(this.notificationAlarm);
            });
        }
        
        // Mode selection
        this.modeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!this.timer.isRunning) {
                    this.setMode(e.target.dataset.mode);
                }
            });
        });
        
        // Duration input changes
        this.durationInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                if (!this.timer.isRunning) {
                    this.updateDuration(e.target);
                }
            });
            
            input.addEventListener('blur', (e) => {
                if (!this.timer.isRunning) {
                    this.updateDuration(e.target);
                }
            });
            
            input.addEventListener('focus', () => {
                if (this.timer.isRunning) {
                    input.blur();
                }
            });
        });
        
        // Tab visibility and focus events
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                NotificationManager.stopTitleFlash();
                if (this.timer.isRunning) {
                    this.syncTimer();
                }
            }
        });
        
        window.addEventListener('focus', () => {
            NotificationManager.stopTitleFlash();
            if (this.timer.isRunning) {
                this.syncTimer();
            }
        });
        
        // Window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (this.graph) {
                    this.graph.update();
                }
            }, 250);
        });
    }
    
    start() {
        // Best-effort prompt on Start; dedicated Enable button is the reliable path.
        NotificationManager.requestPermission().then(() => {
            this.updateNotificationPermissionUI();
        });
        this.timer.start();
        this.ui.setButtonStates(true);
        this.updateStatus();
        this.ui.updateDurationInputsState(true);
    }
    
    pause() {
        this.syncTimer();
        this.timer.pause();
        this.ui.setButtonStates(false);
        this.updateStatus();
        this.ui.updateDurationInputsState(false);
    }
    
    reset() {
        this.timer.reset();
        this.ui.setButtonStates(false);
        this.updateDisplay();
        this.updateStatus();
        this.ui.updateDurationInputsState(false);
    }
    
    updateStatus() {
        const state = this.timer.getState();
        this.ui.updateStatus(null, state.mode, state.isRunning, state.timeLeft, state.durations[state.mode]);
    }
    
    setMode(mode) {
        this.timer.setMode(mode);
        this.ui.updateModeButtons(mode);
        this.updateDisplay();
        this.ui.updateBodyClass(mode);
    }
    
    updateDuration(input) {
        const mode = input.dataset.mode;
        let minutes = parseInt(input.value);
        
        // Validate input
        if (isNaN(minutes) || minutes < 1) {
            minutes = DEFAULT_DURATIONS[mode];
            input.value = minutes;
        } else if (minutes > 99) {
            minutes = 99;
            input.value = 99;
        }
        
        const newDuration = minutes * 60;
        
        if (this.durations[mode] !== newDuration) {
            this.durations[mode] = newDuration;
            // Update timer's durations reference
            this.timer.durations[mode] = newDuration;
            StorageManager.saveDurations(this.durations);
            this.timer.updateDuration(mode, newDuration);
            
            if (this.timer.mode === mode && !this.timer.isRunning) {
                this.updateDisplay();
            }
        }
    }
    
    syncTimer() {
        const completed = this.timer.syncTimer();
        if (completed) {
            this.complete();
        } else {
            this.updateDisplay();
        }
    }
    
    complete() {
        this.timer.pause();
        this.ui.setButtonStates(false);
        this.ui.updateDurationInputsState(false);
        
        NotificationManager.playSound(this.notificationAlarm);

        const completedMode = this.timer.mode;
        let title;
        let body;
        
        // Update session count for completed pomodoros
        if (completedMode === 'pomodoro') {
            this.sessionCount++;
            this.ui.updateSessionCount(this.sessionCount);
            
            // Track completed pomodoro for graph
            this.trackFocusTime(this.durations.pomodoro);
            
            // Auto-switch to break after 4 pomodoros
            if (this.sessionCount % 4 === 0) {
                this.setMode('long-break');
                this.timerStatus.textContent = 'Take a Long Break!';
            } else {
                this.setMode('short-break');
                this.timerStatus.textContent = 'Take a Short Break!';
            }

            title = 'Pomodoro Complete!';
            body = 'Time for a break. Click to return to the timer.';
        } else {
            // Auto-switch back to pomodoro after break
            this.setMode('pomodoro');
            this.timerStatus.textContent = 'Ready to Focus';

            title = 'Break Complete!';
            body = 'Time to get back to work. Click to return to the timer.';
        }
        
        NotificationManager.alertUser(title, body);
    }
    
    trackFocusTime(durationSeconds) {
        const today = new Date().toISOString().split('T')[0];
        const data = StorageManager.loadFocusData();
        
        if (!data[today]) {
            data[today] = 0;
        }
        
        data[today] += durationSeconds;
        
        // Clean up old data (keep only last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];
        
        Object.keys(data).forEach(date => {
            if (date < cutoffDate) {
                delete data[date];
            }
        });
        
        StorageManager.saveFocusData(data);
        if (this.graph) {
            this.graph.update();
        }
    }
    
    updateDisplay() {
        const state = this.timer.getState();
        this.ui.updateDisplay(state.timeLeft, state.durations[state.mode]);
    }
}

// Initialize timer when page loads
document.addEventListener('DOMContentLoaded', () => {
    try {
        new PomodoroTimer();
    } catch (error) {
        console.error('Error initializing PomodoroTimer:', error);
    }
});
