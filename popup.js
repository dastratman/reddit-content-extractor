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
        'commentSort': 'best'
    }, function (items) {
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
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
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
            commentSort: document.getElementById('commentSort').value
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
        navigator.clipboard.writeText(extractedContent).then(function () {
            statusDiv.innerHTML = "✅ Content copied to clipboard!";
        }, function () {
            statusDiv.innerHTML = "❌ Failed to copy to clipboard.";
        });
    });

    // Download button handler
    downloadBtn.addEventListener('click', function () {
        const blob = new Blob([extractedContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);

        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const fileName = sanitizeFilename(tabs[0].title) + ".md";

            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();

            URL.revokeObjectURL(url);
            statusDiv.innerHTML = "✅ Content downloaded as Markdown!";
        });
    });

    // Helper function to sanitize filenames
    function sanitizeFilename(name) {
        return name
            .replace(/[^a-z0-9]/gi, '_')
            .toLowerCase()
            .replace(/_+/g, '_')
            .substring(0, 50);
    }
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

                // Sort comments if needed
                let sortedComments = [...commentsData];
                if (options.commentSort === 'top' || options.commentSort === 'best') {
                    sortedComments.sort((a, b) => {
                        if (!a.data || !b.data) return 0;
                        return (b.data.score || 0) - (a.data.score || 0);
                    });
                } else if (options.commentSort === 'new') {
                    sortedComments.sort((a, b) => {
                        if (!a.data || !b.data) return 0;
                        return (b.data.created_utc || 0) - (a.data.created_utc || 0);
                    });
                }

                // Limit the number of top-level comments if specified
                if (options.commentLimit > 0) {
                    sortedComments = sortedComments.slice(0, options.commentLimit);
                }

                // Process each comment thread
                for (const commentObj of sortedComments) {
                    if (commentObj.kind === 't1') { // t1 = comment
                        // Define processComment here so it has access to output
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
            // IMPORTANT: Define this function here so it can access the 'output' variable
            function processComment(comment, depth) {
                // Skip if beyond depth limit
                if (options.commentDepth > 0 && depth >= options.commentDepth) {
                    return;
                }

                // Skip deleted/removed comments with no content
                if ((comment.author === '[deleted]' || !comment.author) && !comment.body) {
                    return;
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