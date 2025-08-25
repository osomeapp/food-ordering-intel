# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-powered food ordering application that demonstrates revolutionary UI concepts where AI agents replace traditional static components. Instead of hardcoded menu displays, the app uses Claude AI + MCP (Model Context Protocol) servers to generate dynamic, contextual interfaces based on natural language user input.

**Core Architecture**: `User Input → Claude AI Analysis → MCP Server Data → Dynamic UI Generation`

## Development Commands

### Starting the Application (Two Servers Required)
```bash
# Terminal 1: Start MCP Menu Server
cd mcp-menu-server && npm start

# Terminal 2: Start React Frontend  
cd frontend && npm start
```

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
npm start                   # Start MCP server
npm run dev                 # Start with file watching
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