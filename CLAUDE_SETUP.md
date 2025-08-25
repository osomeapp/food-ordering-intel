# 🤖 Claude API Integration Setup

Your AI Food Ordering App is now enhanced with Claude API for truly intelligent conversations! Follow these steps to activate Claude-powered AI.

## 🔑 Setting Up Your API Key

### Step 1: Get Your Anthropic API Key
1. Visit [https://console.anthropic.com](https://console.anthropic.com)
2. Create an account or sign in
3. Navigate to **API Keys** section
4. Create a new API key
5. Copy the key (starts with `sk-ant-...`)

### Step 2: Add API Key to Your App
1. Open the file: `/Users/alfie/Food ordering app/frontend/.env`
2. Replace `your-api-key-here` with your actual API key:

```bash
# Claude API Configuration
REACT_APP_ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here

# Development Settings
REACT_APP_AI_FALLBACK_MODE=true
REACT_APP_DEBUG_AI=false
```

### Step 3: Restart the Frontend Server
```bash
# Stop the current server (Ctrl+C in the terminal)
# Then restart:
cd "/Users/alfie/Food ordering app/frontend" && npm start
```

## ✨ Claude-Powered Features

Once your API key is configured, you'll have access to:

### 🧠 **Advanced Natural Language Understanding**
- **Complex Queries**: "I'm vegetarian but my friend isn't - suggest a meal we can both enjoy"
- **Contextual Conversations**: "Make it spicier" (remembers previous context)
- **Dietary Analysis**: "What's the healthiest option that's also filling?"
- **Preference Learning**: Claude remembers your preferences throughout the conversation

### 🎯 **Intelligent Recommendations**
- **Situational**: "What's good for a romantic dinner date?"
- **Dietary-Aware**: "I'm gluten-free and trying to eat low-carb"
- **Budget-Conscious**: "Show me hearty options under $15"
- **Mood-Based**: "I want comfort food that won't make me feel guilty"

### 🛒 **Smart Cart Management**
- **Natural Commands**: "Remove the expensive items from my cart"
- **Smart Additions**: "Add something that goes with the pasta I already ordered"
- **Quantity Adjustments**: "Make it a meal for 4 people"
- **Substitutions**: "Replace the beef with a vegetarian option"

## 🔧 Configuration Options

### Debug Mode
Set `REACT_APP_DEBUG_AI=true` to see Claude's thinking process in the browser console.

### Fallback Mode
Keep `REACT_APP_AI_FALLBACK_MODE=true` so the app works even if Claude API is unavailable.

## 🚀 Test These Advanced Queries

Once Claude is activated, try these sophisticated requests:

### Contextual Conversations
```
You: "I'm having a dinner party for 6 people"
Claude: [Suggests party-appropriate dishes]
You: "Two of them are vegetarian"
Claude: [Adjusts recommendations accordingly]
You: "And we want something elegant but not too expensive"
Claude: [Refines suggestions with budget and style in mind]
```

### Complex Dietary Needs
```
"My girlfriend is vegan and I'm on keto - what can we both eat?"
"I need something dairy-free but still want comfort food"
"Show me protein-rich options that aren't meat-based"
```

### Situational Recommendations
```
"What's good for a first date that won't leave me garlic breath?"
"I'm stress-eating after a bad day - suggest something that'll cheer me up"
"Quick lunch that I can eat while working and won't make me sleepy"
```

### Smart Shopping
```
"Build me a complete Italian dinner from appetizer to dessert"
"I have $40 for food for the week - what's the most filling options?"
"Add wine pairings to my current order"
```

## 🔍 How to Tell If Claude Is Active

1. **Welcome Message**: The chat will say "Claude-powered" if active
2. **Intelligent Responses**: Much more nuanced understanding of complex requests
3. **Context Awareness**: Claude remembers your conversation history
4. **Conversational Flow**: Natural back-and-forth like talking to a human

## ⚡ Performance Notes

- **First Request**: May take 2-3 seconds (Claude is thinking!)
- **Subsequent Requests**: Faster as context is established
- **Fallback**: If Claude fails, automatically switches to basic AI
- **Cost**: Claude API has usage costs - monitor your Anthropic dashboard

## 🛡️ Security Notes

- **Browser-based**: API key visible in browser (demo purposes only)
- **Production**: Use a backend proxy to hide API keys
- **Rate Limits**: Anthropic API has rate limits
- **Costs**: Monitor usage to avoid unexpected charges

## 🎉 You're Ready!

Your food ordering app now has one of the most advanced AI assistants available. The combination of:
- **Claude's intelligence** for understanding complex requests
- **MCP server** for dynamic data access  
- **React interface** for smooth user experience

Creates a truly revolutionary food ordering experience!

---

**🤖 Enjoy conversing with Claude about your food preferences!**