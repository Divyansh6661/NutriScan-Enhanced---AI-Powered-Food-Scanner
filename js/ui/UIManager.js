class UIManager {
    constructor() {
        this.currentView = 'scanner';
        this.isSettingsOpen = false;
    }

    showView(viewName) {
        // Hide all views
        const views = ['scanner-view', 'results-view', 'stats-view'];
        views.forEach(view => {
            document.getElementById(view)?.classList.add('hidden');
        });

        // Show requested view
        const viewElement = document.getElementById(`${viewName}-view`);
        if (viewElement) {
            viewElement.classList.remove('hidden');
            this.currentView = viewName;
        }
    }

    toggleSettings() {
        const panel = document.getElementById('settings-panel');
        if (panel) {
            panel.classList.toggle('hidden');
            this.isSettingsOpen = !panel.classList.contains('hidden');
        }
    }

    showLoading(message = 'Loading...') {
        // You can implement a loading overlay here
        console.log('Loading:', message);
    }

    hideLoading() {
        console.log('Loading complete');
    }

    updateNavigation(activeNav) {
        const navItems = ['nav-scanner', 'nav-stats', 'nav-profile'];
        navItems.forEach(item => {
            const element = document.getElementById(item);
            if (element) {
                if (item === `nav-${activeNav}`) {
                    element.classList.add('text-green-600', 'font-bold');
                } else {
                    element.classList.remove('text-green-600', 'font-bold');
                }
            }
        });
    }
}
