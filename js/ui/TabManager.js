class TabManager {
    constructor(tabsSelector, contentsSelector) {
        this.tabs = document.querySelectorAll(tabsSelector);
        this.contents = document.querySelectorAll(contentsSelector);
        this.currentTab = null;
        
        this.init();
    }

    init() {
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Activate first tab by default
        if (this.tabs.length > 0) {
            const firstTab = this.tabs[0].dataset.tab;
            this.switchTab(firstTab);
        }
    }

    switchTab(tabName) {
        // Update tab styles
        this.tabs.forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
                this.currentTab = tabName;
            } else {
                tab.classList.remove('active');
            }
        });

        // Show/hide content
        this.contents.forEach(content => {
            if (content.id === `tab-${tabName}`) {
                content.classList.remove('hidden');
            } else {
                content.classList.add('hidden');
            }
        });
    }

    getCurrentTab() {
        return this.currentTab;
    }

    addTab(tabName, tabLabel, content) {
        // Create tab element
        const tab = document.createElement('div');
        tab.className = 'tab';
        tab.dataset.tab = tabName;
        tab.textContent = tabLabel;
        tab.addEventListener('click', () => this.switchTab(tabName));
        
        // Create content element
        const contentDiv = document.createElement('div');
        contentDiv.id = `tab-${tabName}`;
        contentDiv.className = 'tab-content hidden';
        contentDiv.innerHTML = content;

        // Add to DOM
        this.tabs[0].parentNode.appendChild(tab);
        this.contents[0].parentNode.appendChild(contentDiv);

        // Update references
        this.tabs = document.querySelectorAll('[data-tab]');
        this.contents = document.querySelectorAll('.tab-content');
    }

    removeTab(tabName) {
        const tab = Array.from(this.tabs).find(t => t.dataset.tab === tabName);
        const content = document.getElementById(`tab-${tabName}`);

        if (tab) tab.remove();
        if (content) content.remove();

        // Update references
        this.tabs = document.querySelectorAll('[data-tab]');
        this.contents = document.querySelectorAll('.tab-content');

        // Switch to first tab if current was removed
        if (this.currentTab === tabName && this.tabs.length > 0) {
            this.switchTab(this.tabs[0].dataset.tab);
        }
    }
}