# Reddit Content Extractor

<div align="center">
  <img src="./screenshots/logo.png" alt="Reddit Content Extractor Logo" width="128" height="128">
  <h3>A Chrome extension that extracts Reddit threads in Markdown format for LLM processing</h3>
</div>

<div align="center">
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://chrome.google.com/webstore)
  [![GitHub issues](https://img.shields.io/github/issues/yourusername/reddit-content-extractor)](https://github.com/yourusername/reddit-content-extractor/issues)
  
</div>

## 📖 Overview

Reddit Content Extractor for LLM is a Chrome extension that converts Reddit threads into clean, structured Markdown format suitable for input to Large Language Models (LLMs) like ChatGPT, Claude, or Llama. Extract the original post, comments, and metadata with a single click.

<div align="center">
  <img src="./screenshots/screenshot.png" alt="Extension Screenshot" width="600">
</div>

## ✨ Features

- **Markdown Extraction**: Converts Reddit content to Markdown with proper formatting
- **Customizable Content**: Choose what to include (title, post content, comments, metadata)
- **Comment Filtering**: Set comment depth and limit how many comments to extract
- **Sort Options**: Extract top, new, or controversial comments
- **Media Support**: Include references to images and links in the extracted content
- **Clipboard & Download**: Copy content to clipboard or download as a Markdown file
- **Content Preview**: See a preview of the extracted content before saving
- **Works with Both Reddit Designs**: Compatible with old and new Reddit layouts

## 🚀 Installation

### From Chrome Web Store

1. Visit the [Chrome Web Store page](#) (link coming soon)
2. Click "Add to Chrome"
3. Confirm the installation

### Manual Installation (Developer Mode)

1. Clone this repository or download the ZIP file and extract it
   ```
   git clone https://github.com/yourusername/reddit-content-extractor.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" using the toggle in the top-right corner

4. Click "Load unpacked" and select the extension folder

5. The extension should now appear in your toolbar

## 🔧 Usage

1. **Navigate to a Reddit Thread**
   - The extension only works on Reddit comment threads, not on home pages or subreddit listings

2. **Click the Extension Icon**
   - The popup interface will appear with extraction options

3. **Configure Options**
   - Choose what content to include (title, metadata, post, comments)
   - Set comment depth and limits
   - Select comment sorting method

4. **Extract Content**
   - Click "Extract Content" button
   - Wait for the extraction to complete

5. **Use the Extracted Content**
   - Preview the extracted content
   - Copy to clipboard by clicking "Copy to Clipboard"
   - Download as a Markdown file by clicking "Download Markdown"

6. **Feed to Your Favorite LLM**
   - Paste the extracted content into your preferred LLM tool
   - Ask for a summary or analysis of the Reddit thread

## ⚙️ Configuration Options

| Option                   | Description                                                  |
| ------------------------ | ------------------------------------------------------------ |
| Include post title       | Includes the title of the post as an H1 heading              |
| Include metadata         | Includes subreddit, author, date, and vote info              |
| Include original post    | Extracts the main post content                               |
| Include media references | Includes links to images and external URLs                   |
| Include comments         | Extracts comment content                                     |
| Comment depth            | How many levels of nested comments to include (1-10, or All) |
| Comment limit            | Maximum number of comments to extract (10-250, or All)       |
| Sort by                  | Sort comments by Top, New, or Controversial                  |

## 💡 Example Use Cases

- **Research & Analysis**: Extract Reddit discussions for qualitative research
- **Content Creation**: Gather public opinions and insights for articles
- **Summarization**: Have LLMs create concise summaries of lengthy threads
- **Knowledge Management**: Save important threads in a readable format
- **Data Collection**: Build datasets from Reddit conversations
- **Trend Analysis**: Extract discussions on specific topics for analysis

## 🔍 Technical Details

### Architecture

The extension consists of:
- **Manifest**: Configuration file that defines extension properties
- **Popup UI**: HTML/CSS interface for user interaction
- **Content Script**: JavaScript that runs in the context of Reddit pages
- **Utility Functions**: Helper functions for formatting and processing

### Browser Compatibility

- Chrome 88+
- Edge 88+ (Chromium-based)
- Opera 74+
- Brave

### Permissions

- `activeTab`: To access the current tab's content
- `scripting`: To execute content scripts
- `clipboardWrite`: To copy content to clipboard
- `storage`: To save user preferences

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
   ```
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Test thoroughly**
5. **Submit a pull request**

Please follow these guidelines:
- Keep the code clean and well-commented
- Test on both old and new Reddit designs
- Update the README if adding new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔮 Future Plans

- Firefox extension version
- Direct API integration with popular LLM services
- Support for other social platforms like HackerNews, Twitter/X
- Advanced filtering options (by user, keyword, etc.)
- Support for Reddit polls and other interactive elements
- Dark mode UI

## 🙏 Acknowledgments

- [Reddit](https://www.reddit.com) for the platform
- All the open-source libraries that made this extension possible
- Contributors and users who provide valuable feedback

---

<div align="center">
  <p>If you find this extension useful, please consider giving it a star on GitHub!</p>
  <p>
    <a href="https://github.com/yourusername/reddit-content-extractor/stargazers">⭐ Star us on GitHub</a>
  </p>
</div>