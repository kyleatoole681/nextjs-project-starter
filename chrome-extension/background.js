// Background service worker for the Aviator Predictor extension

// Initialize default settings when extension is installed
chrome.runtime.onInstalled.addListener(async () => {
    await chrome.storage.sync.set({
        isAutoMode: false,
        threshold: 1.5,
        predictionHistory: []
    });
});

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case 'STORE_PREDICTION':
            storePrediction(message.data);
            break;
        case 'GET_HISTORY':
            getHistory().then(sendResponse);
            return true; // Keep channel open for async response
        case 'CLEAR_HISTORY':
            clearHistory().then(sendResponse);
            return true;
    }
});

// Store prediction in chrome.storage
async function storePrediction(prediction) {
    try {
        const { predictionHistory = [] } = await chrome.storage.sync.get('predictionHistory');
        
        // Add new prediction to history
        predictionHistory.unshift({
            timestamp: Date.now(),
            predicted: prediction.predicted,
            actual: prediction.actual,
            success: prediction.success
        });

        // Keep only last 50 predictions
        if (predictionHistory.length > 50) {
            predictionHistory.pop();
        }

        // Save updated history
        await chrome.storage.sync.set({ predictionHistory });

        // Update badge with success rate
        updateSuccessRateBadge(predictionHistory);
    } catch (error) {
        console.error('Error storing prediction:', error);
    }
}

// Get prediction history
async function getHistory() {
    try {
        const { predictionHistory = [] } = await chrome.storage.sync.get('predictionHistory');
        return predictionHistory;
    } catch (error) {
        console.error('Error getting history:', error);
        return [];
    }
}

// Clear prediction history
async function clearHistory() {
    try {
        await chrome.storage.sync.set({ predictionHistory: [] });
        return { success: true };
    } catch (error) {
        console.error('Error clearing history:', error);
        return { success: false, error: error.message };
    }
}

// Update extension badge with success rate
function updateSuccessRateBadge(history) {
    if (history.length === 0) {
        chrome.action.setBadgeText({ text: '' });
        return;
    }

    // Calculate success rate from last 10 predictions
    const recentHistory = history.slice(0, 10);
    const successCount = recentHistory.filter(p => p.success).length;
    const successRate = Math.round((successCount / recentHistory.length) * 100);

    // Update badge
    chrome.action.setBadgeText({ text: successRate + '%' });
    chrome.action.setBadgeBackgroundColor({ 
        color: successRate >= 70 ? '#10B981' : successRate >= 50 ? '#F59E0B' : '#EF4444'
    });
}

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    // This won't be called if we have a default_popup in manifest
    // But keeping it here in case we want to change behavior later
});
