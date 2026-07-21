export const DEFAULT_DURATIONS = {
    pomodoro: 25,
    'short-break': 5,
    'long-break': 15
};

export const NOTIFICATION_ALARMS = {
    ORIGINAL: 'original',
    RELAXING_CHIME: 'relaxing-chime',
    URGENT_ALERT: 'urgent-alert'
};

export const DEFAULT_NOTIFICATION_ALARM = NOTIFICATION_ALARMS.RELAXING_CHIME;

export const STORAGE_KEYS = {
    DURATIONS: 'pomodoroDurations',
    FOCUS_DATA: 'pomodoroFocusData',
    NOTIFICATION_ALARM: 'pomodoroNotificationAlarm'
};
