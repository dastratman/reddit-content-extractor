let extractedContent = '';

document.addEventListener('DOMContentLoaded', function() {
  const extractBtn = document.getElementById('extractBtn');
  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const statusDiv = document.getElementById('status');
  const spinner = document.getElementById('spinner');
  const previewSection = document.getElementById('previewSection');
  const contentPreview = document.getElementById('contentPreview');
  const contentStats = document.getElementById('contentStats');
  
  // Load saved settings
  chrome.storage.local.get({
    'includeTitle': true,
    'includeMetadata': true,
    'includeOP': true,
    'includeMedia': true,
    'includeComments': true,
    'commentDepth': 3,
    'commentLimit': 50,
    'commentSort': 'top'
  }, function(items) {
    document.getElementById('includeTitle').checked = items.includeTitle;
    document.getElementById('includeMetadata').checked = items.includeMetadata;
    document.getElementById('includeOP').checked = items.includeOP;
    document.getElementById('includeMedia').checked = items.includeMedia;
    document.getElementById('includeComments').checked = items.includeComments;
    document.getElementById('commentDepth').value = items.commentDepth;
    document.getElementById('commentLimit').value = items.commentLimit;
    document.getElementById('commentSort').value = items.commentSort;
  });
  
  // Check if we're on a Reddit thread page
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const url = tabs[0].url;
    if (!url.match(/reddit\.com\/r\/[^\/]+\/comments\//)) {
      statusDiv.innerHTML = "⚠️ This is not a Reddit thread page.";
      extractBtn.disabled = true;
      return;
    }
  });
  
  // Save settings when changed
  const saveSettings = () => {
    chrome.storage.local.set({
      'includeTitle': document.getElementById('includeTitle').checked,
      'includeMetadata': document.getElementById('includeMetadata').checked,
      'includeOP': document.getElementById('includeOP').checked,
      'includeMedia': document.getElementById('includeMedia').checked,
      'includeComments': document.getElementById('includeComments').checked,
      'commentDepth': document.getElementById('commentDepth').value,
      'commentLimit': document.getElementById('commentLimit').value,
      'commentSort': document.getElementById('commentSort').value
    });
  };
  
  // Add change listeners to all settings
  document.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('change', saveSettings);
  });
  
  extractBtn.addEventListener('click', function() {
    statusDiv.innerHTML = "Extracting content...";
    spinner.classList.remove('hidden');
    extractBtn.disabled = true;
    copyBtn.disabled = true;
    downloadBtn.disabled = true;
    previewSection.classList.add('hidden');
    
    // Get options
    const options = {
      includeTitle: document.getElementById('includeTitle').checked,
      includeMetadata: document.getElementById('includeMetadata').checked,
      includeOP: document.getElementById('includeOP').checked,
      includeMedia: document.getElementById('includeMedia').checked,
      includeComments: document.getElementById('includeComments').checked,
      commentDepth: parseInt(document.getElementById('commentDepth').value),
      commentLimit: parseInt(document.getElementById('commentLimit').value),
      commentSort: document.getElementById('commentSort').value
    };
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        function: extractRedditContent,
        args: [options]
      }, function(results) {
        spinner.classList.add('hidden');
        extractBtn.disabled = false;
        
        if (chrome.runtime.lastError) {
          statusDiv.innerHTML = "Error: " + chrome.runtime.lastError.message;
          return;
        }
        
        if (!results || !results[0] || !results[0].result) {
          statusDiv.innerHTML = "Failed to extract content.";
          return;
        }
        
        extractedContent = results[0].result;
        
        // Update stats
        const sizeKB = Math.round(extractedContent.length / 1024 * 10) / 10;
        const wordCount = extractedContent.split(/\s+/).length;
        const lines = extractedContent.split('\n').length;
        contentStats.textContent = `(${sizeKB}KB, ~${wordCount} words, ${lines} lines)`;
        
        // Show preview with first 500 chars
        contentPreview.textContent = extractedContent.substring(0, 500) + 
          (extractedContent.length > 500 ? '...' : '');
        previewSection.classList.remove('hidden');
        
        statusDiv.innerHTML = `✅ Extraction complete!`;
        copyBtn.disabled = false;
        downloadBtn.disabled = false;
      });
    });
  });
  
  copyBtn.addEventListener('click', function() {
    navigator.clipboard.writeText(extractedContent).then(function() {
      statusDiv.innerHTML = "✅ Content copied to clipboard!";
    }, function() {
      statusDiv.innerHTML = "❌ Failed to copy to clipboard.";
    });
  });
  
  downloadBtn.addEventListener('click', function() {
    const blob = new Blob([extractedContent], {type: 'text/markdown'});
    const url = URL.createObjectURL(blob);
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const fileName = utils.sanitizeFilename(tabs[0].title) + ".md";
      
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      
      URL.revokeObjectURL(url);
      statusDiv.innerHTML = "✅ Content downloaded as Markdown!";
    });
  });
});

function extractRedditContent(options) {
  // This function runs in the context of the Reddit page
  try {
    let output = "";
    const isNewReddit = document.querySelector('body').classList.contains('redesign');
    
    // Get subreddit name
    let subreddit = '';
    const subredditElem = document.querySelector('a[href^="/r/"]');
    if (subredditElem) {
      subreddit = subredditElem.textContent.trim();
    }
    
    // Extract post title
    let title = '';
    if (options.includeTitle) {
      const titleElement = document.querySelector('h1, [data-testid="post-title"]');
      if (titleElement) {
        title = titleElement.textContent.trim();
        output += `# ${title}\n\n`;
      }
    }
    
    // Add metadata
    if (options.includeMetadata) {
      output += "## Metadata\n\n";
      
      // Get author
      const authorElement = document.querySelector('[data-testid="post_author"], .author');
      const author = authorElement ? authorElement.textContent.trim() : "Unknown";
      
      // Get post date
      let dateText = "Unknown date";
      const dateElement = document.querySelector('[data-testid="post-timestamp"], time');
      if (dateElement) {
        if (dateElement.getAttribute('datetime')) {
          const datetime = new Date(dateElement.getAttribute('datetime'));
          dateText = datetime.toLocaleString();
        } else {
          dateText = dateElement.textContent.trim();
        }
      }
      
      // Get vote info
      let upvotes = "Unknown";
      const voteElement = document.querySelector('[data-test-id="post-content"] [aria-label*="upvote"], .score');
      if (voteElement) {
        const text = voteElement.textContent.trim();
        upvotes = text;
      }
      
      // Add all metadata
      output += `- **Subreddit**: r/${subreddit}\n`;
      output += `- **Posted by**: u/${author}\n`;
      output += `- **Posted on**: ${dateText}\n`;
      output += `- **Upvotes**: ${upvotes}\n`;
      output += `- **URL**: ${window.location.href}\n\n`;
    }
    
    // Extract original post
    if (options.includeOP) {
      output += "## Original Post\n\n";
      
      // Different selectors for old vs new Reddit
      const opSelector = isNewReddit 
        ? '[data-test-id="post-content"], [data-click-id="text"]' 
        : '.expando, .usertext-body';
      
      const opElement = document.querySelector(opSelector);
      
      if (opElement) {
        // Handle text content
        const textElements = opElement.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, code');
        
        if (textElements.length > 0) {
          textElements.forEach(el => {
            let line = el.textContent.trim();
            
            // Apply Markdown formatting based on element
            if (el.tagName === 'H1') output += `# ${line}\n\n`;
            else if (el.tagName === 'H2') output += `## ${line}\n\n`;
            else if (el.tagName === 'H3') output += `### ${line}\n\n`;
            else if (el.tagName === 'H4') output += `#### ${line}\n\n`;
            else if (el.tagName === 'H5') output += `##### ${line}\n\n`;
            else if (el.tagName === 'H6') output += `###### ${line}\n\n`;
            else if (el.tagName === 'LI') output += `- ${line}\n`;
            else if (el.tagName === 'BLOCKQUOTE') output += `> ${line}\n\n`;
            else if (el.tagName === 'PRE' || el.tagName === 'CODE') output += `\`\`\`\n${line}\n\`\`\`\n\n`;
            else output += `${line}\n\n`;
          });
        } else {
          // Simple fallback if no structured elements found
          output += opElement.textContent.trim() + "\n\n";
        }
        
        // Handle images if requested
        if (options.includeMedia) {
          const images = opElement.querySelectorAll('img');
          if (images.length > 0) {
            output += "\n**Embedded Media:**\n\n";
            images.forEach(img => {
              if (img.src && !img.src.includes('data:image')) {
                const alt = img.alt || 'Image';
                output += `![${alt}](${img.src})\n\n`;
              }
            });
          }
          
          // Handle external links
          const links = opElement.querySelectorAll('a');
          if (links.length > 0) {
            output += "\n**Links:**\n\n";
            const addedLinks = new Set();
            links.forEach(link => {
              const href = link.href;
              if (href && !href.includes('reddit.com') && !addedLinks.has(href)) {
                addedLinks.add(href);
                output += `- [${link.textContent.trim() || href}](${href})\n`;
              }
            });
            output += "\n";
          }
        }
      } else {
        output += "*No text content found in the original post.*\n\n";
      }
    }
    
    // Extract comments
    if (options.includeComments) {
      output += "## Comments\n\n";
      
      // Different selectors for old vs new Reddit
      const commentSelector = isNewReddit 
        ? '[data-testid="comment"], .Comment' 
        : '.comment, .entry';
      
      let commentElements = Array.from(document.querySelectorAll(commentSelector));
      
      // Sort comments
      if (options.commentSort === 'top') {
        // Try to identify comment score and sort by it
        commentElements.sort((a, b) => {
          const scoreA = parseInt(a.querySelector('.score, [data-test-id="comment-top-meta"]')?.textContent || '0');
          const scoreB = parseInt(b.querySelector('.score, [data-test-id="comment-top-meta"]')?.textContent || '0');
          return scoreB - scoreA; // Higher scores first
        });
      } else if (options.commentSort === 'new') {
        // Try to get timestamps and sort by them
        commentElements.sort((a, b) => {
          const timeA = a.querySelector('time')?.getAttribute('datetime') || '';
          const timeB = b.querySelector('time')?.getAttribute('datetime') || '';
          return timeB.localeCompare(timeA); // Newer first
        });
      }
      
      // Limit number of comments
      if (options.commentLimit > 0) {
        commentElements = commentElements.slice(0, options.commentLimit);
      }
      
      const processedComments = new Set();
      
      commentElements.forEach(comment => {
        const commentId = comment.id;
        if (processedComments.has(commentId)) return;
        processedComments.add(commentId);
        
        // Get depth
        const depth = getCommentDepth(comment);
        
        // Skip if beyond depth limit (0 means no limit)
        if (options.commentDepth > 0 && depth > options.commentDepth) return;
        
        // Get author
        const authorElement = comment.querySelector('[data-testid="comment_author"], .author');
        const author = authorElement ? authorElement.textContent.trim() : "Unknown User";
        
        // Get comment text
        const textContainer = comment.querySelector('[data-testid="comment"], .usertext-body');
        if (!textContainer) return;
        
        // Get vote info
        let voteCount = '';
        const voteElement = comment.querySelector('[data-test-id="vote-score"], .score');
        if (voteElement) {
          voteCount = ` | ${voteElement.textContent.trim()} points`;
        }
        
        // Add indentation and author info
        const indent = "  ".repeat(depth);
        output += `${indent}### u/${author}${voteCount}\n\n`;
        
        // Process all text elements
        const textElements = textContainer.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, code');
        
        if (textElements.length > 0) {
          textElements.forEach(el => {
            let line = el.textContent.trim();
            
            // Apply Markdown formatting based on element
            if (el.tagName === 'H1') output += `${indent}# ${line}\n\n`;
            else if (el.tagName === 'H2') output += `${indent}## ${line}\n\n`;
            else if (el.tagName === 'H3') output += `${indent}### ${line}\n\n`;
            else if (el.tagName === 'H4') output += `${indent}#### ${line}\n\n`;
            else if (el.tagName === 'H5') output += `${indent}##### ${line}\n\n`;
            else if (el.tagName === 'H6') output += `${indent}###### ${line}\n\n`;
            else if (el.tagName === 'LI') output += `${indent}- ${line}\n`;
            else if (el.tagName === 'BLOCKQUOTE') output += `${indent}> ${line}\n\n`;
            else if (el.tagName === 'PRE' || el.tagName === 'CODE') output += `${indent}\`\`\`\n${indent}${line}\n${indent}\`\`\`\n\n`;
            else output += `${indent}${line}\n\n`;
          });
        } else {
          // Simple fallback
          output += `${indent}${textContainer.textContent.trim()}\n\n`;
        }
      });
    }
    
    return output.trim();
  } catch (error) {
    return "Error extracting content: " + error.message;
  }
  
  // Helper to determine comment depth
  function getCommentDepth(comment) {
    // Different ways to detect depth based on Reddit's layout changes
    
    // Method 1: Using indentation class
    const indentMatch = Array.from(comment.classList)
      .find(c => c.match(/indent-\d+/));
    if (indentMatch) {
      const depth = parseInt(indentMatch.split('-')[1]);
      return depth || 0;
    }
    
    // Method 2: Count parent containers
    let depth = 0;
    let parent = comment.parentElement;
    const stopAt = document.querySelector('.comments-page, .commentarea');
    
    while (parent && parent !== stopAt) {
      if (parent.matches('.Comment, .comment, .sitetable')) {
        depth++;
      }
      parent = parent.parentElement;
    }
    
    return depth;
  }
}