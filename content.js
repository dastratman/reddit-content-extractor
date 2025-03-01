// This script provides functionality when the extension is first loaded on a Reddit page
console.log("Reddit Content Extractor is ready");

// Detect Reddit version and thread type
const isNewReddit = document.querySelector('body').classList.contains('redesign');
const isRedditThread = window.location.href.match(/reddit\.com\/r\/[^\/]+\/comments\//);

// This helps with the initial detection of whether we're on a Reddit thread
if (isRedditThread) {
  chrome.runtime.sendMessage({
    action: "onRedditThread",
    url: window.location.href,
    isNewReddit: isNewReddit
  });
  
  // Add MutationObserver to detect when Reddit loads more comments
  // This helps with extracting more content when user expands comments
  const observer = new MutationObserver(mutations => {
    const hasNewComments = mutations.some(mutation => {
      return Array.from(mutation.addedNodes).some(node => {
        return node.nodeType === 1 && 
              (node.classList.contains('Comment') || 
               node.querySelector('[data-testid="comment"]') ||
               node.classList.contains('sitetable') ||
               node.classList.contains('comment'));
      });
    });
    
    if (hasNewComments) {
      chrome.runtime.sendMessage({
        action: "commentsUpdated"
      });
    }
  });
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}