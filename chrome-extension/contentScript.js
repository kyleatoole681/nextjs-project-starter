// Game monitoring and prediction logic
class AviatorPredictor {
  constructor() {
    this.multiplierHistory = [];
    this.isAutoMode = false;
    this.crashPoint = 0;
    this.setupEventListeners();
    this.loadSettings();
  }

  async loadSettings() {
    const data = await chrome.storage.sync.get(['isAutoMode']);
    this.isAutoMode = data.isAutoMode || false;
  }

  setupEventListeners() {
    // Monitor game state changes
    const gameContainer = document.querySelector('#game-container');
    if (gameContainer) {
      const observer = new MutationObserver(() => this.onGameStateChange());
      observer.observe(gameContainer, { 
        childList: true, 
        subtree: true 
      });
    }

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'GET_PREDICTION') {
        sendResponse({ prediction: this.getPrediction() });
      } else if (message.type === 'TOGGLE_AUTO') {
        this.isAutoMode = message.value;
        sendResponse({ success: true });
      }
    });
  }

  onGameStateChange() {
    const multiplierElement = document.querySelector('.multiplier-value');
    if (multiplierElement) {
      const currentMultiplier = parseFloat(multiplierElement.textContent);
      if (!isNaN(currentMultiplier)) {
        this.updateMultiplierHistory(currentMultiplier);
        
        if (this.isAutoMode) {
          const prediction = this.getPrediction();
          if (currentMultiplier >= prediction * 0.9) { // Cash out at 90% of predicted crash
            this.autoCashOut();
          }
        }
      }
    }
  }

  updateMultiplierHistory(multiplier) {
    this.multiplierHistory.push(multiplier);
    if (this.multiplierHistory.length > 50) { // Keep last 50 rounds
      this.multiplierHistory.shift();
    }
  }

  getPrediction() {
    if (this.multiplierHistory.length < 3) return 2.0; // Default prediction
    
    // Advanced prediction algorithm
    const recentMultipliers = this.multiplierHistory.slice(-3);
    const avg = recentMultipliers.reduce((a, b) => a + b) / recentMultipliers.length;
    const variance = Math.sqrt(
      recentMultipliers.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / recentMultipliers.length
    );
    
    // Predict based on pattern recognition and variance
    let prediction = avg - variance;
    
    // Add safety margin
    prediction = Math.max(prediction * 0.85, 1.5);
    
    return parseFloat(prediction.toFixed(2));
  }

  autoCashOut() {
    const cashOutButton = document.querySelector('.cashout-button');
    if (cashOutButton && !cashOutButton.disabled) {
      cashOutButton.click();
    }
  }
}

// Initialize predictor when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const predictor = new AviatorPredictor();
});
