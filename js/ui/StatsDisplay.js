// ============================================================================
// js/ui/StatsDisplay.js - Statistics Visualization (COMPLETE FIXED VERSION)
// ============================================================================

class StatsDisplay {
    constructor() {
        this.goalTracker = new GoalTracker();
    }

    renderDailyProgress() {
        const progress = this.goalTracker.getDailyProgress();
        
        let html = '<div class="space-y-4">';
        html += '<h3 class="text-lg font-semibold mb-3">Today\'s Progress</h3>';

        for (const [nutrient, data] of Object.entries(progress)) {
            const statusColor = this.getStatusColor(data.status);
            const percentage = Math.min(data.percentage, 100);

            html += `
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-medium capitalize">${nutrient}</span>
                        <span class="text-sm text-gray-600">${data.current}${this.getUnit(nutrient)} / ${data.target}${this.getUnit(nutrient)}</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2.5">
                        <div class="h-2.5 rounded-full ${statusColor}" style="width: ${percentage}%"></div>
                    </div>
                    <div class="mt-1 text-xs text-gray-500">
                        ${data.remaining !== null ? `${data.remaining}${this.getUnit(nutrient)} remaining` : ''}
                    </div>
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    renderWeeklyStats() {
        const stats = this.goalTracker.getWeeklyStats();
        
        let html = '<div class="space-y-4">';
        html += '<h3 class="text-lg font-semibold mb-3">Weekly Overview</h3>';
        
        // Calculate averages
        const avgCalories = Math.round(stats.reduce((sum, day) => sum + day.calories, 0) / 7);
        const avgSugar = Math.round(stats.reduce((sum, day) => sum + day.sugar, 0) / 7);
        const totalScans = stats.reduce((sum, day) => sum + day.scannedCount, 0);

        html += `
            <div class="grid grid-cols-3 gap-3">
                <div class="bg-blue-50 rounded-lg p-3 text-center">
                    <div class="text-2xl font-bold text-blue-600">${avgCalories}</div>
                    <div class="text-xs text-gray-600">Avg Calories/Day</div>
                </div>
                <div class="bg-green-50 rounded-lg p-3 text-center">
                    <div class="text-2xl font-bold text-green-600">${totalScans}</div>
                    <div class="text-xs text-gray-600">Products Scanned</div>
                </div>
                <div class="bg-purple-50 rounded-lg p-3 text-center">
                    <div class="text-2xl font-bold text-purple-600">${avgSugar}g</div>
                    <div class="text-xs text-gray-600">Avg Sugar/Day</div>
                </div>
            </div>
        `;

        // Daily breakdown
        html += '<div class="mt-4 space-y-2">';
        stats.forEach(day => {
            const date = new Date(day.date);
            const isToday = date.toDateString() === new Date().toDateString();
            
            html += `
                <div class="flex items-center justify-between p-2 ${isToday ? 'bg-green-50 border-l-4 border-green-500' : 'bg-gray-50'} rounded">
                    <span class="text-sm font-medium">${this.formatDate(date)}</span>
                    <div class="flex space-x-4 text-xs text-gray-600">
                        <span>${day.calories} kcal</span>
                        <span>${day.sugar}g sugar</span>
                        <span>${day.scannedCount} scans</span>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        html += '</div>';
        return html;
    }

    getStatusColor(status) {
        const colors = {
            'on-track': 'bg-green-500',
            'over-target': 'bg-yellow-500',
            'exceeded': 'bg-red-500',
            'under-target': 'bg-blue-500'
        };
        return colors[status] || 'bg-gray-500';
    }

    getUnit(nutrient) {
        const units = {
            calories: 'kcal',
            sugar: 'g',
            sodium: 'mg',
            protein: 'g',
            fiber: 'g',
            fat: 'g'
        };
        return units[nutrient] || '';
    }

    formatDate(date) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        }
    }
}