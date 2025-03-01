// Common utility functions
const utils = {
    // Format timestamps to readable format
    formatDate: function(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp * 1000);
      return date.toLocaleString();
    },
    
    // Format numbers for readability
    formatNumber: function(num) {
      if (num === null || num === undefined) return '';
      return new Intl.NumberFormat().format(num);
    },
    
    // Clean text for markdown
    cleanMarkdown: function(text) {
      if (!text) return '';
      return text
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive newlines
        .replace(/\*\*/g, '*') // Normalize bold markers
        .trim();
    },
    
    // Sanitize filename
    sanitizeFilename: function(name) {
      return name
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase()
        .replace(/_+/g, '_')
        .substring(0, 50);
    },
    
    // Get comment depth from DOM
    getCommentDepth: function(comment) {
      // Different ways to detect depth based on Reddit's layout changes
      
      // Method 1: Using indentation class
      const indentMatch = Array.from(comment.classList)
        .find(c => c.match(/indent-\d+/));
      if (indentMatch) {
        const depth = parseInt(indentMatch.split('-')[1]);
        return depth || 0;
      }
      
      // Method 2: Counting parent containers
      let depth = 0;
      let parent = comment.parentElement;
      const stopAt = document.querySelector('.comments-page');
      
      while (parent && parent !== stopAt) {
        if (parent.matches('.Comment, .comment, .sitetable')) {
          depth++;
        }
        parent = parent.parentElement;
      }
      
      return depth;
    }
  };