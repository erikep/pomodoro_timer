import { DEFAULT_DURATIONS, DEFAULT_NOTIFICATION_ALARM, NOTIFICATION_ALARMS, STORAGE_KEYS } from './config.js';

export class StorageManager {
    static loadDurations() {
        const saved = localStorage.getItem(STORAGE_KEYS.DURATIONS);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return {
                    pomodoro: (parsed.pomodoro || DEFAULT_DURATIONS.pomodoro) * 60,
                    'short-break': (parsed['short-break'] || DEFAULT_DURATIONS['short-break']) * 60,
                    'long-break': (parsed['long-break'] || DEFAULT_DURATIONS['long-break']) * 60
                };
            } catch (e) {
                console.error('Error loading durations:', e);
            }
        }
        
        return {
            pomodoro: DEFAULT_DURATIONS.pomodoro * 60,
            'short-break': DEFAULT_DURATIONS['short-break'] * 60,
            'long-break': DEFAULT_DURATIONS['long-break'] * 60
        };
    }
    
    static saveDurations(durations) {
        const toSave = {
            pomodoro: durations.pomodoro / 60,
            'short-break': durations['short-break'] / 60,
            'long-break': durations['long-break'] / 60
        };
        localStorage.setItem(STORAGE_KEYS.DURATIONS, JSON.stringify(toSave));
    }

    static loadNotificationAlarm() {
        const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATION_ALARM);
        const validAlarms = Object.values(NOTIFICATION_ALARMS);
        
        return validAlarms.includes(saved) ? saved : DEFAULT_NOTIFICATION_ALARM;
    }
    
    static saveNotificationAlarm(alarm) {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATION_ALARM, alarm);
    }
    
    static loadFocusData() {
        const saved = localStorage.getItem(STORAGE_KEYS.FOCUS_DATA);
        return saved ? JSON.parse(saved) : {};
    }
    
    static saveFocusData(data) {
        localStorage.setItem(STORAGE_KEYS.FOCUS_DATA, JSON.stringify(data));
    }
    
    static cleanupOldFocusData() {
        const data = this.loadFocusData();
        if (Object.keys(data).length === 0) {
            return; // No data to clean
        }
        
        // Calculate cutoff date (30 days ago)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];
        
        let hasChanges = false;
        
        // Remove data older than 30 days
        Object.keys(data).forEach(date => {
            if (date < cutoffDate) {
                delete data[date];
                hasChanges = true;
            }
        });
        
        // Save cleaned data back to localStorage if changes were made
        if (hasChanges) {
            this.saveFocusData(data);
        }
    }
}
