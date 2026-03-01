# bnbot-mcp-server

MCP Server for [BNBOT Chrome Extension](https://chromewebstore.google.com/detail/bnbot-your-ai-growth-agen/haammgigdkckogcgnbkigfleejpaiiln) - Control Twitter/X via AI assistants like OpenClaw or Claude Desktop.

## Architecture

```
AI Assistant (OpenClaw / Claude Desktop)
    ↓ stdio (MCP protocol)
bnbot-mcp-server (local Node.js process)
    ↓↑ WebSocket (ws://localhost:18900)
BNBOT Chrome Extension
    ↓ DOM operations
Twitter/X
```

## Setup

### 1. Install BNBOT Chrome Extension

Install from the Chrome Web Store.

### 2. Enable OpenClaw Integration

In the BNBOT extension sidebar, open **Settings** and turn on the **OpenClaw** toggle.

### 3. Configure Your AI Assistant

#### OpenClaw / Claude Desktop

Add to your MCP config:

```json
{
  "mcpServers": {
    "bnbot": {
      "command": "npx",
      "args": ["bnbot-mcp-server"]
    }
  }
}
```

#### Custom Port

```json
{
  "mcpServers": {
    "bnbot": {
      "command": "npx",
      "args": ["bnbot-mcp-server", "--port", "9999"]
    }
  }
}
```

### 4. Use It

Ask your AI assistant:
- "Scrape my Twitter timeline"
- "Search for tweets about AI"
- "Post a tweet saying hello world"
- "Navigate to my bookmarks and scrape them"

## Available Tools

### Scrape
| Tool | Description |
|------|-------------|
| `scrape_timeline` | Scrape tweets from the timeline |
| `scrape_bookmarks` | Scrape bookmarked tweets |
| `scrape_search_results` | Search and scrape results |
| `scrape_current_view` | Scrape currently visible tweets |
| `account_analytics` | Get account analytics data |

### Tweet
| Tool | Description |
|------|-------------|
| `post_tweet` | Post a tweet with optional images |
| `post_thread` | Post a thread of tweets |
| `submit_reply` | Reply to a tweet |

### Navigation
| Tool | Description |
|------|-------------|
| `navigate_to_tweet` | Go to a specific tweet |
| `navigate_to_search` | Go to search page |
| `navigate_to_bookmarks` | Go to bookmarks |
| `navigate_to_notifications` | Go to notifications |
| `return_to_timeline` | Go back to timeline |

### Status
| Tool | Description |
|------|-------------|
| `get_extension_status` | Check extension connection |
| `get_current_page_info` | Get current page info |

## Testing

Use the MCP Inspector to test tools directly:

```bash
npx @modelcontextprotocol/inspector npx bnbot-mcp-server
```

## License

MIT
