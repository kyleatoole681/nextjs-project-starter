// Popup interface logic
class AviatorPopup {
    constructor() {
        this.predictionValue = document.getElementById('predictionValue');
        this.predictionTime = document.getElementById('predictionTime');
        this.autoCashoutToggle = document.getElementById('autoCashoutToggle');
        this.thresholdInput = document.getElementById('threshold');
        this.historyBody = document.getElementById('historyBody');
        this.refreshBtn = document.getElementById('refreshBtn');
        
        this.history = [];
        this.setupEventListeners();
        this.loadSettings();
        this.startUpdates();
    }

    async loadSettings() {
        const settings = await chrome.storage.sync.get(['isAutoMode', 'threshold']);
        this.autoCashoutToggle.checked = settings.isAutoMode || false;
        this.thresholdInput.value = settings.threshold || 1.5;
    }

    setupEventListeners() {
        // Auto cashout toggle
        this.autoCashoutToggle.addEventListener('change', () => {
            const isAutoMode = this.autoCashoutToggle.checked;
            chrome.storage.sync.set({ isAutoMode });
            
            // Notify content script
            this.sendMessageToContentScript({
                type: 'TOGGLE_AUTO',
                value: isAutoMode
            });
        });

        // Threshold change
        this.thresholdInput.addEventListener('change', () => {
            const threshold = parseFloat(this.thresholdInput.value);
            if (threshold >= 1.1 && threshold <= 10) {
                chrome.storage.sync.set({ threshold });
                this.sendMessageToContentScript({
                    type: 'UPDATE_THRESHOLD',
                    value: threshold
                });
            }
        });

        // Refresh button
        this.refreshBtn.addEventListener('click', () => {
            this.refreshPrediction();
        });
    }

    async sendMessageToContentScript(message) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
            chrome.tabs.sendMessage(tab.id, message);
        }
    }

    async refreshPrediction() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab?.id) {
                const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PREDICTION' });
                if (response && response.prediction) {
                    this.updatePrediction(response.prediction);
                }
            }
        } catch (error) {
            console.error('Error getting prediction:', error);
            this.predictionValue.textContent = 'Error';
        }
    }

    updatePrediction(value) {
        this.predictionValue.textContent = value.toFixed(2) + 'x';
        this.predictionTime.textContent = 'Updated: ' + new Date().toLocaleTimeString();
    }

    updateHistory(entry) {
        this.history.unshift(entry);
        if (this.history.length > 10) {
            this.history.pop();
        }
        this.renderHistory();
    }

    renderHistory() {
        this.historyBody.innerHTML = '';
        this.history.forEach(entry => {
            const row = document.createElement('tr');
            const resultClass = entry.success ? 'success' : 'failure';
            
            row.innerHTML = `
                <td>${entry.time}</td>
                <td>${entry.predicted.toFixed(2)}x</td>
                <td>${entry.actual.toFixed(2)}x</td>
                <td class="${resultClass}">${entry.success ? '✓' : '✗'}</td>
            `;
            
            this.historyBody.appendChild(row);
        });
    }

    startUpdates() {
        // Refresh prediction every 5 seconds
        setInterval(() => this.refreshPrediction(), 5000);
        
        // Initial refresh
        this.refreshPrediction();
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const popup = new AviatorPopup();
});
