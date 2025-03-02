// Background script for Reddit Content Extractor
console.log("Reddit Content Extractor background script running");

// Listen for installation
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === "install") {
        // Set default options on first install
        chrome.storage.local.set({
            'includeTitle': true,
            'includeMetadata': true,
            'includeOP': true,
            'includeMedia': true,
            'includeComments': true,
            'commentDepth': 3,
            'commentLimit': 50,
            'commentSort': 'best',
            'commentScoreThreshold': 1,
            'extractTopDiscussions': false,
            'topDiscussionsCount': 5,
            'exportFormat': 'markdown'
        });
    }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Forward messages to popup if needed
    if (message.action === "commentsUpdated" || message.action === "onRedditThread") {
        chrome.runtime.sendMessage(message);
    }

    return false; // Don't keep the messaging channel open
});