// Import CSS
import './styles.css';

// Utility functions
const utils = {
    // Sanitize filename
    sanitizeFilename: function (name) {
        return name
            .replace(/[^a-z0-9]/gi, '_')
            .toLowerCase()
            .replace(/_+/g, '_')
            .substring(0, 50);
    },

    // Format conversion utilities
    convertToHtml: function (markdownContent) {
        // Basic Markdown to HTML conversion
        return markdownContent
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2">')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
            .replace(/^- (.*$)/gm, '<li>$1</li>')
            .replace(/\n\n/g, '<br><br>')
            .replace(/^>/gm, '<blockquote>')
            .replace(/```([^`]*?)```/g, '<pre><code>\$1</code></pre>');
    },

    convertToPlainText: function (markdownContent) {
        // Remove Markdown formatting
        return markdownContent
            .replace(/^# (.*$)/gm, '\$1\n')
            .replace(/^## (.*$)/gm, '\$1\n')
            .replace(/^### (.*$)/gm, '\$1\n')
            .replace(/\*\*(.*?)\*\*/g, '\$1')
            .replace(/\*(.*?)\*/g, '\$1')
            .replace(/!$$(.*?)$$$(.*?)$/g, '[Image: \$1]')
            .replace(/$$(.*?)$$$(.*?)$/g, '\$1 (\$2)')
            .replace(/^- (.*$)/gm, '- \$1')
            .replace(/^>/gm, '> ');
    }
};

let extractedContent = '';

document.addEventListener('DOMContentLoaded', function () {
    const extractBtn = document.getElementById('extractBtn');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const statusDiv = document.getElementById('status');
    const spinner = document.getElementById('spinner');
    const previewSection = document.getElementById('previewSection');
    const contentPreview = document.getElementById('contentPreview');
    const contentStats = document.getElementById('contentStats');
    const extractTopDiscussions = document.getElementById('extractTopDiscussions');
    const togglePreviewBtn = document.getElementById('togglePreview');

    // Accordion functionality - simplified and robust
    document.querySelectorAll('.accordion-header').forEach(header => {
        console.log('Adding click handler to header:', header.textContent.trim());

        // Use onclick instead of addEventListener for more direct binding
        header.onclick = function () {
            console.log('Header clicked:', this.textContent.trim());

            const accordionItem = this.parentElement;
            const wasActive = accordionItem.classList.contains('active');

            // First remove active class from all items
            document.querySelectorAll('.accordion-item').forEach(item => {
                item.classList.remove('active');
                const btn = item.querySelector('.toggle-btn');
                if (btn) btn.textContent = '+';
            });

            // Then toggle the clicked one if it wasn't already active
            if (!wasActive) {
                accordionItem.classList.add('active');
                const btn = accordionItem.querySelector('.toggle-btn');
                if (btn) btn.textContent = '×';
                console.log('Accordion opened');
            } else {
                console.log('Accordion closed (was active)');
            }

            return false; // Prevent event bubbling
        };
    });

    // Manually set the first item as active
    const firstAccordion = document.querySelector('.accordion-item');
    if (firstAccordion) {
        console.log('Setting first accordion as active');
        firstAccordion.classList.add('active');
        const firstBtn = firstAccordion.querySelector('.toggle-btn');
        if (firstBtn) firstBtn.textContent = '×';
    } else {
        console.error('No accordion items found!');
    }

    // Open first accordion by default
    document.querySelector('.accordion-item').classList.add('active');
    document.querySelector('.accordion-item .toggle-btn').textContent = '×';

    // Preview toggle - use the already declared previewSection variable
    togglePreviewBtn.addEventListener('click', function () {
        const isHidden = previewSection.classList.contains('hidden');
        if (isHidden) {
            previewSection.classList.remove('hidden');
            togglePreviewBtn.textContent = 'Hide Preview';
        } else {
            previewSection.classList.add('hidden');
            togglePreviewBtn.textContent = 'Show Preview';
        }
    });

    // Initialize top discussions count visibility
    document.getElementById('topDiscussionsCount').style.display =
        document.getElementById('extractTopDiscussions').checked ? 'inline-block' : 'none';

    // Initialize UI state
    copyBtn.disabled = true;
    downloadBtn.disabled = true;

    // Initialize UI state
    copyBtn.disabled = true;
    downloadBtn.disabled = true;

    // Load saved settings
    chrome.storage.local.get({
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
    }, function (items) {
        document.getElementById('includeTitle').checked = items.includeTitle;
        document.getElementById('includeMetadata').checked = items.includeMetadata;
        document.getElementById('includeOP').checked = items.includeOP;
        document.getElementById('includeMedia').checked = items.includeMedia;
        document.getElementById('includeComments').checked = items.includeComments;
        document.getElementById('commentDepth').value = items.commentDepth;
        document.getElementById('commentLimit').value = items.commentLimit;
        document.getElementById('commentSort').value = items.commentSort;
        document.getElementById('commentScoreThreshold').value = items.commentScoreThreshold;
        document.getElementById('extractTopDiscussions').checked = items.extractTopDiscussions;
        document.getElementById('topDiscussionsCount').value = items.topDiscussionsCount;

        // Set export format
        const formatRadio = document.querySelector(`input[name="exportFormat"][value="${items.exportFormat}"]`);
        if (formatRadio) formatRadio.checked = true;

        // Show/hide dependent options
        document.getElementById('topDiscussionsCount').style.display =
            items.extractTopDiscussions ? 'inline-block' : 'none';
    });

    // Check if we're on a Reddit thread page
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        // Add error handling for missing tabs
        if (!tabs || tabs.length === 0) {
            statusDiv.innerHTML = "⚠️ Unable to access current tab.";
            extractBtn.disabled = true;
            return;
        }

        const url = tabs[0].url;
        // Add null/undefined check
        if (!url) {
            statusDiv.innerHTML = "⚠️ Cannot access page URL.";
            extractBtn.disabled = true;
            return;
        }

        if (!url.match(/reddit\.com\/r\/[^\/]+\/comments\//)) {
            statusDiv.innerHTML = "⚠️ This is not a Reddit thread page.";
            extractBtn.disabled = true;
            return;
        }
    });

    // Toggle visibility of dependent options
    document.getElementById('extractTopDiscussions').addEventListener('change', function () {
        document.getElementById('topDiscussionsCount').style.display =
            this.checked ? 'inline-block' : 'none';
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
            'commentSort': document.getElementById('commentSort').value,
            'commentScoreThreshold': parseInt(document.getElementById('commentScoreThreshold').value) || 1,
            'extractTopDiscussions': document.getElementById('extractTopDiscussions').checked,
            'topDiscussionsCount': document.getElementById('topDiscussionsCount').value,
            'exportFormat': document.querySelector('input[name="exportFormat"]:checked').value
        });
    };

    // Add change listeners to all settings
    document.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('change', saveSettings);
    });

    // Listen for messages from content script
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        if (message.action === "extractionComplete") {
            spinner.classList.add('hidden');
            extractBtn.disabled = false;

            extractedContent = message.content;

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
        }
        else if (message.action === "extractionError") {
            spinner.classList.add('hidden');
            extractBtn.disabled = false;
            statusDiv.innerHTML = `❌ Error: ${message.error}`;
        }
        else if (message.action === "onRedditThread") {
            // Received when content.js detects we're on a Reddit thread
            // We could use this to update the UI if needed
        }
    });

    // Extract button handler
    extractBtn.addEventListener('click', function () {
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
            commentSort: document.getElementById('commentSort').value,
            commentScoreThreshold: parseInt(document.getElementById('commentScoreThreshold').value) || 1,
            extractTopDiscussions: document.getElementById('extractTopDiscussions').checked,
            topDiscussionsCount: parseInt(document.getElementById('topDiscussionsCount').value)
        };

        // Save settings
        saveSettings();

        // Execute the content script
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: extractRedditContent,
                args: [options]
            }, function (results) {
                if (chrome.runtime.lastError) {
                    spinner.classList.add('hidden');
                    extractBtn.disabled = false;
                    statusDiv.innerHTML = "❌ Error: " + chrome.runtime.lastError.message;
                    console.error("Script execution error:", chrome.runtime.lastError);
                }

                // Now we wait for the message with the actual content
                console.log("Script executed, waiting for results via message");
            });
        });
    });

    // Copy button handler
    copyBtn.addEventListener('click', function () {
        const format = document.querySelector('input[name="exportFormat"]:checked').value;
        let contentToCopy = extractedContent;

        if (format === 'html') {
            contentToCopy = utils.convertToHtml(extractedContent);
        } else if (format === 'plaintext') {
            contentToCopy = utils.convertToPlainText(extractedContent);
        }

        navigator.clipboard.writeText(contentToCopy).then(function () {
            statusDiv.innerHTML = `✅ Content copied to clipboard as ${format.toUpperCase()}!`;
        }, function () {
            statusDiv.innerHTML = "❌ Failed to copy to clipboard.";
        });
    });

    // Download button handler
    downloadBtn.addEventListener('click', function () {
        const format = document.querySelector('input[name="exportFormat"]:checked').value;
        let contentToDownload = extractedContent;
        let fileExtension = 'md';
        let mimeType = 'text/markdown';

        if (format === 'html') {
            contentToDownload = utils.convertToHtml(extractedContent);
            fileExtension = 'html';
            mimeType = 'text/html';
        } else if (format === 'plaintext') {
            contentToDownload = utils.convertToPlainText(extractedContent);
            fileExtension = 'txt';
            mimeType = 'text/plain';
        }

        const blob = new Blob([contentToDownload], { type: mimeType });
        const url = URL.createObjectURL(blob);

        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const fileName = utils.sanitizeFilename(tabs[0].title) + `.${fileExtension}`;

            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();

            URL.revokeObjectURL(url);
            statusDiv.innerHTML = `✅ Content downloaded as ${format.toUpperCase()}!`;
        });
    });
});

function extractRedditContent(options) {
    // This needs to return synchronously for Chrome's executeScript
    console.log("Starting extraction with options:", options);

    // Instead of returning a Promise directly, we'll use the messaging system
    const currentUrl = window.location.href;
    const jsonUrl = currentUrl.replace(/\/$/, '') + '.json';

    console.log("Fetching JSON from:", jsonUrl);

    // Perform the fetch directly
    fetch(jsonUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch JSON data: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("JSON data received, processing...");
            let output = ""; // Define output variable here

            if (!data || !Array.isArray(data) || data.length < 2) {
                throw new Error("Invalid JSON response format");
            }

            const postData = data[0].data.children[0].data;
            const commentsData = data[1].data.children;

            // Extract post title
            if (options.includeTitle && postData.title) {
                output += `# ${postData.title}\n\n`;
            }

            // Add metadata
            if (options.includeMetadata) {
                output += "## Metadata\n\n";

                const subreddit = postData.subreddit_name_prefixed || `r/${postData.subreddit}`;
                const author = postData.author ? `u/${postData.author}` : "[deleted]";
                const created = new Date(postData.created_utc * 1000).toLocaleString();
                const score = postData.score !== undefined ? postData.score : "Hidden";

                output += `- **Subreddit**: ${subreddit}\n`;
                output += `- **Posted by**: ${author}\n`;
                output += `- **Posted on**: ${created}\n`;
                output += `- **Upvotes**: ${score}\n`;
                output += `- **URL**: ${window.location.href}\n\n`;
            }

            // Extract original post
            if (options.includeOP) {
                output += "## Original Post\n\n";

                if (postData.selftext) {
                    // Add the post content directly
                    output += `${postData.selftext}\n\n`;
                } else if (postData.url && options.includeMedia) {
                    // Handle link posts
                    if (isImageUrl(postData.url)) {
                        output += `![${postData.title}](${postData.url})\n\n`;
                    } else {
                        output += `[${postData.title}](${postData.url})\n\n`;
                    }
                }

                // Handle crosspost
                if (postData.crosspost_parent_list && postData.crosspost_parent_list.length > 0) {
                    const crosspost = postData.crosspost_parent_list[0];
                    output += `*This is a crosspost from r/${crosspost.subreddit} by u/${crosspost.author}*\n\n`;

                    if (crosspost.selftext) {
                        output += `${crosspost.selftext}\n\n`;
                    }
                }
            }

            // Extract comments
            if (options.includeComments) {
                output += "## Comments\n\n";

                let commentsToProcess = [...commentsData];

                // Use top discussions if that option is enabled
                if (options.extractTopDiscussions) {
                    const topDiscussions = extractTopDiscussions(commentsData, options);
                    output += `*Showing the top ${topDiscussions.length} discussion threads based on engagement*\n\n`;

                    // Replace with only the top discussion root comments
                    commentsToProcess = topDiscussions.map(discussion => {
                        return {
                            kind: 't1',
                            data: discussion.rootComment
                        };
                    });
                }

                // Sort comments if needed
                if (options.commentSort === 'top' || options.commentSort === 'best') {
                    commentsToProcess.sort((a, b) => {
                        if (!a.data || !b.data) return 0;
                        return (b.data.score || 0) - (a.data.score || 0);
                    });
                } else if (options.commentSort === 'new') {
                    commentsToProcess.sort((a, b) => {
                        if (!a.data || !b.data) return 0;
                        return (b.data.created_utc || 0) - (a.data.created_utc || 0);
                    });
                }

                // Limit the number of top-level comments if specified
                if (options.commentLimit > 0) {
                    commentsToProcess = commentsToProcess.slice(0, options.commentLimit);
                }

                // Process each comment thread
                for (const commentObj of commentsToProcess) {
                    if (commentObj.kind === 't1') { // t1 = comment
                        processComment(commentObj.data, 0);
                    } else if (commentObj.kind === 'more') {
                        // "Load more comments" indicator
                        output += `  *[${commentObj.data.count} more comments not shown]*\n\n`;
                    }
                }
            }

            console.log("Processing complete, sending data back");
            // Send the result back to the popup
            chrome.runtime.sendMessage({
                action: "extractionComplete",
                content: output.trim()
            });

            // Helper function to process comments recursively
            function processComment(comment, depth) {
                // Skip if beyond depth limit
                if (options.commentDepth > 0 && depth >= options.commentDepth) {
                    return;
                }

                // Skip deleted/removed comments with no content
                if ((comment.author === '[deleted]' || !comment.author) && !comment.body) {
                    return;
                }

                // Skip comments below score threshold
                if (comment.score < options.commentScoreThreshold) {
                    return; // Skip comments below threshold
                }

                // Add indentation and author info
                const indent = "  ".repeat(depth);
                const authorText = comment.author ? `u/${comment.author}` : "[deleted]";
                const scoreText = comment.score !== undefined ? ` | ${comment.score} points` : '';

                output += `${indent}### ${authorText}${scoreText}\n\n`;

                // Add comment body
                if (comment.body) {
                    // Add indentation to each line
                    comment.body.split('\n').forEach(line => {
                        if (line.trim()) {
                            output += `${indent}${line}\n`;
                        }
                    });
                    output += '\n';
                }

                // Process replies recursively
                if (comment.replies && comment.replies.data && comment.replies.data.children) {
                    let replies = comment.replies.data.children;

                    // Sort replies if needed
                    if (options.commentSort === 'top' || options.commentSort === 'best') {
                        replies = [...replies].sort((a, b) => {
                            if (!a.data || !b.data) return 0;
                            return (b.data.score || 0) - (a.data.score || 0);
                        });
                    } else if (options.commentSort === 'new') {
                        replies = [...replies].sort((a, b) => {
                            if (!a.data || !b.data) return 0;
                            return (b.data.created_utc || 0) - (a.data.created_utc || 0);
                        });
                    }

                    for (const replyObj of replies) {
                        if (replyObj.kind === 't1') { // t1 = comment
                            processComment(replyObj.data, depth + 1);
                        } else if (replyObj.kind === 'more' && replyObj.data.count > 0) {
                            // "Load more comments" indicator
                            output += `${indent}  *[${replyObj.data.count} more replies not shown]*\n\n`;
                        }
                    }
                }
            }

            // Function to extract top discussions
            function extractTopDiscussions(commentsData, options) {
                // Score comments and their threads based on engagement metrics
                const discussions = [];

                for (const commentObj of commentsData) {
                    if (commentObj.kind !== 't1') continue;

                    const comment = commentObj.data;
                    if (!comment || comment.score < options.commentScoreThreshold) continue;

                    // Calculate engagement score
                    // Factors: upvotes, number of replies, awards, comment length
                    let engagementScore = comment.score;

                    // Add score for replies if any
                    if (comment.replies && comment.replies.data && comment.replies.data.children) {
                        const replies = comment.replies.data.children;
                        const replyCount = replies.filter(r => r.kind === 't1').length;
                        engagementScore += replyCount * 2;

                        // Add scores from child comments
                        for (const replyObj of replies) {
                            if (replyObj.kind === 't1') {
                                engagementScore += Math.max(0, replyObj.data.score);
                            }
                        }
                    }

                    // Bonus points for longer comments (more substantial)
                    if (comment.body) {
                        engagementScore += Math.min(10, comment.body.length / 100);
                    }

                    // Bonus for awards
                    if (comment.all_awardings) {
                        engagementScore += comment.all_awardings.length * 5;
                    }

                    // Store the discussion thread with its score
                    discussions.push({
                        rootComment: comment,
                        engagementScore: engagementScore
                    });
                }

                // Sort by engagement score and take the top N
                discussions.sort((a, b) => b.engagementScore - a.engagementScore);
                return discussions.slice(0, options.topDiscussionsCount);
            }
        })
        .catch(error => {
            console.error("Error extracting Reddit content:", error);
            chrome.runtime.sendMessage({
                action: "extractionError",
                error: error.message || "Unknown error occurred"
            });
        });

    // Helper to check if URL is an image
    function isImageUrl(url) {
        return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
    }

    // Return a message to show we've started the process
    return "Extraction started";
}