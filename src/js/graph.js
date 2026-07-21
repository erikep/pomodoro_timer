import { StorageManager } from './storage.js';

export class FocusGraph {
    constructor(canvas, ctx, todayTimeEl, weekTimeEl) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.todayTimeEl = todayTimeEl;
        this.weekTimeEl = weekTimeEl;
    }
    
    getWeeklyData() {
        const data = StorageManager.loadFocusData();
        const weeklyData = [];
        const today = new Date();
        
        // Find Monday of the current week
        const dayOfWeek = today.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        
        // Get Monday of current week
        const monday = new Date(today);
        monday.setDate(today.getDate() - daysToMonday);
        monday.setHours(0, 0, 0, 0);
        
        // Get data for 7 days starting from Monday
        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            weeklyData.push({
                date: dateStr,
                dayName: dayName,
                minutes: Math.round((data[dateStr] || 0) / 60)
            });
        }
        
        return weeklyData;
    }
    
    update() {
        if (!this.canvas || !this.ctx) {
            console.warn('Graph canvas or context not available');
            return;
        }
        
        const weeklyData = this.getWeeklyData();
        
        if (!weeklyData || weeklyData.length === 0) {
            console.warn('No weekly data available');
            return;
        }
        
        // Set canvas size
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        // If canvas has no size, use default dimensions
        const width = rect.width || 400;
        const height = rect.height || 200;
        
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        const padding = { top: 20, right: 20, bottom: 40, left: 50 };
        const graphWidth = width - padding.left - padding.right;
        const graphHeight = height - padding.top - padding.bottom;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, width, height);
        
        // Fixed max value: 8 hours (480 minutes)
        const maxValue = 480; // 8 hours in minutes
        const gridLines = 8; // One line per hour (0 to 8 hours)
        
        // Draw grid lines
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= gridLines; i++) {
            const y = padding.top + (graphHeight / gridLines) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(padding.left, y);
            this.ctx.lineTo(padding.left + graphWidth, y);
            this.ctx.stroke();
            
            // Y-axis labels - show hours (0h to 8h)
            const hours = gridLines - i;
            this.ctx.fillStyle = '#666';
            this.ctx.font = '11px sans-serif';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`${hours}h`, padding.left - 8, y + 4);
        }
        
        // Draw line graph
        if (weeklyData.length > 0) {
            const pointSpacing = graphWidth / (weeklyData.length - 1 || 1);
            const points = weeklyData.map((d, i) => ({
                x: padding.left + i * pointSpacing,
                y: padding.top + graphHeight - (d.minutes / maxValue) * graphHeight
            }));
            
            // Draw line
            this.ctx.strokeStyle = `var(--text-color)`;
            this.ctx.lineWidth = 3;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                this.ctx.lineTo(points[i].x, points[i].y);
            }
            this.ctx.stroke();
            
            // Draw points
            this.ctx.fillStyle = `var(--text-color)`;
            points.forEach(point => {
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
                this.ctx.fill();
            });
            
            // Draw area under line
            this.ctx.fillStyle = `var(--text-color)`;
            this.ctx.globalAlpha = 0.1;
            this.ctx.beginPath();
            this.ctx.moveTo(points[0].x, padding.top + graphHeight);
            this.ctx.lineTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                this.ctx.lineTo(points[i].x, points[i].y);
            }
            this.ctx.lineTo(points[points.length - 1].x, padding.top + graphHeight);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
            
            // Draw X-axis labels (day names)
            this.ctx.fillStyle = '#666';
            this.ctx.font = '11px sans-serif';
            this.ctx.textAlign = 'center';
            weeklyData.forEach((d, i) => {
                const x = padding.left + i * pointSpacing;
                this.ctx.fillText(d.dayName, x, height - padding.bottom + 20);
            });
        }
        
        // Update stats
        const todayData = weeklyData[weeklyData.length - 1];
        const weekTotal = weeklyData.reduce((sum, d) => sum + d.minutes, 0);
        
        if (this.todayTimeEl) {
            this.todayTimeEl.textContent = todayData.minutes + ' min';
        }
        if (this.weekTimeEl) {
            this.weekTimeEl.textContent = weekTotal + ' min';
        }
    }
}
