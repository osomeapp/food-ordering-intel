# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-powered food ordering application that demonstrates revolutionary UI concepts where AI agents replace traditional static components. Instead of hardcoded menu displays, the app uses Claude AI + MCP (Model Context Protocol) servers to generate dynamic, contextual interfaces based on natural language user input.

**Core Architecture**: `User Input → Claude AI Analysis → MCP Server Data → Dynamic UI Generation`

## Development Commands

### Starting the Application (Two Servers Required)
```bash
# Terminal 1: Start MCP Menu Server (HTTP mode for frontend)
cd mcp-menu-server && npm start

# Terminal 2: Start React Frontend  
cd frontend && npm start
```

**Important**: The MCP server runs in HTTP mode (`npm start` → `http-server.js`) for frontend communication. The original MCP stdio server (`npm run start:mcp` → `server.js`) is for direct CLI usage only.

### Development Commands
```bash
# Frontend development
cd frontend
npm start                    # Development server (http://localhost:3000)
npm run build               # Production build
npm test                    # Run tests
npm test -- --watch        # Run tests in watch mode

# MCP Server development  
cd mcp-menu-server
npm start                   # HTTP server on port 3001 (for frontend)
npm run start:mcp           # Original MCP stdio server (for CLI)
npm run dev                 # HTTP server with file watching
```

### Testing API Endpoints
```bash
# Test MCP server health
curl http://localhost:3001/health

# List available tools
curl http://localhost:3001/api/mcp/tools

# Test menu items call
curl -X POST http://localhost:3001/api/mcp/call \
  -H "Content-Type: application/json" \
  -d '{"tool": "menu_get_items", "arguments": {"category": "Desserts"}}'
```

### Package Management
```bash
# Frontend dependencies
cd frontend && npm install

# MCP server dependencies  
cd mcp-menu-server && npm install
```

## High-Level Architecture

### Three-Tier System
1. **React Frontend** (`frontend/`) - Dynamic UI that adapts based on AI responses
2. **Claude AI Agent** (`frontend/src/services/claude-ai-agent.js`) - Natural language processing and intent analysis
3. **MCP Menu Server** (`mcp-menu-server/`) - Data operations and menu management

### AI Agent System
The app uses a dual-mode AI system:
- **Claude Mode**: Uses Anthropic's Claude API for advanced conversational AI
- **Fallback Mode**: Pattern-matching AI agent when Claude API is unavailable
- **Auto-switching**: Gracefully falls back if Claude API fails

### Key Data Flow
```
User: "Show me spicy vegetarian options under $20"
↓
ClaudeAIAgent.processUserIntent() analyzes intent
↓  
Calls MCP tools: menu_get_items({dietary: ["vegetarian"], spicyLevel: 2, maxPrice: 20})
↓
Returns structured data to React components
↓
AIMenuDisplay renders dynamic interface
```

### MCP Server Tools
The MCP server exposes 8 tools for menu operations:
- `menu_get_categories`, `menu_get_items`, `menu_search`, `menu_get_recommendations`
- `cart_add_item`, `cart_remove_item`, `cart_get_contents`, `cart_clear`

## Critical Configuration

### Environment Variables (frontend/.env)
```bash
REACT_APP_ANTHROPIC_API_KEY=your-claude-api-key  # Claude API integration
REACT_APP_AI_FALLBACK_MODE=true                  # Enable fallback mode
REACT_APP_DEBUG_AI=false                         # AI debugging logs
```

### Claude API Integration
- Claude API key is configured in `frontend/.env`
- `ClaudeAIAgent` class handles both Claude API and fallback modes
- Uses `claude-3-haiku-20240307` model with system prompts for food ordering context
- Includes conversation history and user preference tracking

## Component Architecture

### Core Components
- **AIMenuDisplay** (`components/AIMenuDisplay.js`) - Dynamically renders menu based on AI responses, not hardcoded data
- **ChatInterface** (`components/ChatInterface.js`) - Natural language interface with Claude
- **Cart** (`components/Cart.js`) - Intelligent cart with AI-powered recommendations

### Service Layer
- **claude-ai-agent.js** - Primary AI agent with Claude integration and fallback logic
- **mcp-client.js** - Communication layer with MCP server (includes mock mode)
- **useAIMenu.js** - React hook orchestrating AI agent, MCP client, and UI state

### AI Response Processing
AI responses follow specific types that determine UI generation:
- `menu_display` → Shows filtered menu items
- `cart_update` → Updates cart state and displays confirmation
- `show_cart` → Shows current cart contents
- `clarification_needed` → Shows disambiguation options
- `error` → Shows error with suggestions

## Important Development Notes

### No Static Menu Components
Unlike traditional apps, this codebase has **no hardcoded menu displays**. All menu interfaces are generated dynamically by the AI agent based on user intent and MCP server data.

### MCP Server Data Structure
Menu items in `mcp-menu-server/data/menu-data.js` include rich metadata:
- Dietary restrictions, spice levels, calories, prep time
- Used for intelligent filtering and recommendations
- 100 diverse items across 5 categories for comprehensive testing

### AI Agent Intent Processing
The Claude AI agent uses structured JSON responses with specific schemas:
```javascript
{
  "action": "tool_call" | "conversation" | "clarification",
  "tool": "mcp_tool_name",
  "parameters": {...},
  "message": "conversational response",
  "ui_type": "menu_display" | "cart_update" | "show_cart"
}
```

### Conversation Context
The AI agent maintains:
- Conversation history (last 6 exchanges)
- User preferences map (dietary, price, spice level)
- Cart state awareness for contextual recommendations

## Testing the AI System

### Mock Mode Testing (No API Key)
The app works fully in mock mode with pattern-matching AI:
```
"Show me vegetarian options" → Filters menu items by dietary preference
"Add 2 burgers" → Searches for burgers, adds to cart
```

### Claude Mode Testing (With API Key)
Advanced natural language processing:
```
"I'm vegetarian but my friend isn't - suggest something we can both enjoy"
"What's good for a romantic dinner that won't break the bank?"
```

### Environment Configuration
- `REACT_APP_DEBUG_AI=true` shows Claude's reasoning in browser console
- `REACT_APP_AI_FALLBACK_MODE=true` enables graceful degradation
- MCP server runs independently and can be tested with direct tool calls

## Common Development Issues & Solutions

### MCP Server Connection Issues
- **Error**: `GET http://localhost:3001/api/mcp/tools 404 (Not Found)`
- **Solution**: Ensure you're running `npm start` (not `npm run start:mcp`) to start the HTTP server

### Claude JSON Parsing Issues
- **Error**: `JSON parsing failed` in console
- **Solution**: The app has robust fallback parsing that extracts suggestions even from malformed JSON responses
- **Debug**: Use `REACT_APP_DEBUG_AI=true` to see detailed parsing logs

### Filtering Not Working with Suggestions
- **Issue**: Claude provides suggestions but UI shows all items instead of filtered ones
- **Solution**: Check that `response.suggestions` is properly preserved through tool calls in `claude-ai-agent.js`
- **Debug**: Look for `🔧 FILTERING` logs in browser console

### Port Conflicts
- **Frontend**: Runs on port 3000 (React default)
- **MCP Server**: Runs on port 3001 (configurable via PORT env var)
- **Solution**: Kill existing processes with `lsof -ti :PORT | xargs kill -9`

## Debugging Suggestions Feature

When working on the suggestions filtering system:

1. **Check Response Structure**: Ensure suggestions are preserved in tool call responses
2. **Verify Filtering Logic**: Look for exact vs. partial name matching in `useAIMenu.js`
3. **Calorie Info Handling**: Suggestions may include calorie data `"Item Name (XXX cal)"` that needs stripping
4. **UI Type Handling**: Both `menu_display` and `conversation` response types can contain suggestions

## Architecture Notes

### HTTP vs. MCP Protocol
The app uses a dual-server approach:
- `http-server.js`: Express HTTP wrapper for frontend communication
- `server.js`: Original MCP stdio server for direct protocol usage

### AI Response Processing Pipeline
1. **User Input** → `useAIMenu.processMessage()`
2. **Claude Processing** → `claude-ai-agent.js` (JSON parsing with fallbacks)
3. **Tool Execution** → MCP server via HTTP calls
4. **Response Enhancement** → Suggestions preservation and UI type determination
5. **UI Updates** → Dynamic filtering and component rendering