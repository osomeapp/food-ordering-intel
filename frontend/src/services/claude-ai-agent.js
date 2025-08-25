import Anthropic from '@anthropic-ai/sdk';

class ClaudeAIAgent {
  constructor(mcpClient) {
    console.log('🚀 CLAUDE AGENT CONSTRUCTOR CALLED - THIS SHOULD ALWAYS APPEAR');
    
    this.mcpClient = mcpClient;
    this.conversationHistory = [];
    this.userPreferences = new Map();
    
    // Initialize Claude client
    const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
    const fallbackMode = process.env.REACT_APP_AI_FALLBACK_MODE === 'true';
    const debug = process.env.REACT_APP_DEBUG_AI === 'true';
    
    console.log('🤖 === CLAUDE AGENT CONSTRUCTOR ===');
    console.log('🤖 API Key exists:', !!apiKey);
    console.log('🤖 API Key length:', apiKey?.length || 0);
    console.log('🤖 API Key preview:', apiKey ? `${apiKey.substring(0, 10)}...` : 'None');
    console.log('🤖 Fallback mode:', fallbackMode);
    console.log('🤖 Debug mode:', debug);
    
    if (apiKey && apiKey !== 'your-api-key-here') {
      try {
        console.log('🤖 Creating Anthropic client...');
        this.anthropic = new Anthropic({
          apiKey: apiKey,
          dangerouslyAllowBrowser: true // Note: In production, use a backend proxy
        });
        this.useClaudeAPI = true;
        console.log('🤖 ✅ Claude API initialized successfully');
        console.log('🤖 Anthropic client object:', this.anthropic);
      } catch (error) {
        console.error('🤖 ❌ Failed to initialize Claude API:', error);
        this.useClaudeAPI = false;
      }
    } else {
      console.log('🤖 ❌ No valid API key - Running in mock mode');
      this.useClaudeAPI = false;
    }
    
    this.fallbackMode = fallbackMode;
    this.debug = debug;
    
    console.log('🤖 Final useClaudeAPI state:', this.useClaudeAPI);
  }

  async processUserIntent(userInput, currentContext = {}) {
    console.log('🤖 === AI AGENT PROCESSING USER INPUT ===');
    console.log('🤖 User Input:', userInput);
    console.log('🤖 Current Context:', currentContext);
    console.log('🤖 Menu Items Count:', currentContext.menuItems?.length || 0);
    console.log('🤖 useClaudeAPI:', this.useClaudeAPI);
    
    console.log('🤖 AI Agent Processing:', {
      userInput,
      useClaudeAPI: this.useClaudeAPI,
      currentContext
    });
    
    try {
      if (this.useClaudeAPI) {
        console.log('🤖 Using Claude API for processing');
        return await this.processWithClaude(userInput, currentContext);
      } else {
        console.log('🤖 Using fallback mode for processing');
        return await this.processWithFallback(userInput, currentContext);
      }
    } catch (error) {
      console.error('🤖 Error in AI processing:', error);
      
      if (this.useClaudeAPI && this.fallbackMode) {
        console.log('🤖 Falling back to mock mode...');
        return await this.processWithFallback(userInput, currentContext);
      }
      
      return {
        type: 'error',
        message: 'Sorry, I had trouble understanding that request.',
        suggestions: ['Try asking for menu categories', 'Search for specific dishes', 'Ask for recommendations']
      };
    }
  }

  async processWithClaude(userInput, currentContext = {}) {
    console.log('🤖 === ENTERING processWithClaude ===');
    console.log('🤖 Claude API client exists:', !!this.anthropic);
    console.log('🤖 useClaudeAPI flag:', this.useClaudeAPI);
    
    const systemPrompt = this.buildSystemPrompt(currentContext);
    const conversationContext = this.buildConversationContext();
    
    console.log('🤖 About to call Claude API with:');
    console.log('🤖 - Model: claude-3-haiku-20240307');
    console.log('🤖 - User Input:', userInput);
    console.log('🤖 - System Prompt Length:', systemPrompt.length);
    console.log('🤖 - Conversation Context Length:', conversationContext.length);

    try {
      console.log('🤖 === CALLING CLAUDE API NOW ===');
      const response = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          ...conversationContext,
          {
            role: 'user',
            content: userInput
          }
        ]
      });
      
      console.log('🤖 === CLAUDE API RESPONSE RECEIVED ===');
      console.log('🤖 Raw Response Object:', response);
      
      const claudeResponse = response.content[0].text;
      console.log('🤖 Claude Response Text:', claudeResponse);
      
      // Parse Claude's response and execute actions
      const result = await this.parseAndExecuteClaudeResponse(claudeResponse, userInput, currentContext);
      console.log('🤖 Final processed result:', result);
      
      return result;
      
    } catch (error) {
      console.error('🤖 === CLAUDE API ERROR ===');
      console.error('🤖 Error details:', error);
      console.error('🤖 Error message:', error.message);
      console.error('🤖 Error stack:', error.stack);
      throw error;
    }
  }

  buildSystemPrompt(currentContext) {
    const availableTools = this.mcpClient?.getAvailableTools?.() || [
      'menu_get_categories', 'menu_get_items', 'menu_search', 'menu_get_recommendations',
      'cart_add_item', 'cart_remove_item', 'cart_get_contents', 'cart_clear'
    ];

    // Include menu data in the prompt for intelligent recommendations
    const menuData = currentContext.menuItems || [];
    console.log('🤖 SYSTEM PROMPT - Menu data received:', menuData.length, 'items');
    console.log('🤖 SYSTEM PROMPT - Current context:', currentContext);
    
    // Group menu by categories for better understanding
    const menuByCategory = menuData.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});
    
    const menuSummary = menuData.length > 0 ? 
      Object.entries(menuByCategory).map(([category, items]) => 
        `${category.toUpperCase()} (${items.length} items):\n` +
        items.slice(0, 5).map(item => `- ${item.name} (${item.id}): $${item.price} - ${item.description} [${item.calories || 'N/A'} cal, Spice: ${item.spicyLevel || 0}/4, Dietary: ${item.dietary?.join(', ') || 'none'}]`).join('\n') +
        (items.length > 5 ? `\n... and ${items.length - 5} more ${category} items` : '')
      ).join('\n\n')
      : 'Menu not loaded yet';
    
    const categories = Object.keys(menuByCategory);

    return `🚨 CRITICAL: YOU MUST ONLY USE ITEMS FROM THE EXACT MENU BELOW 🚨

📋 COMPLETE MENU DATABASE - THESE ARE THE ONLY ITEMS THAT EXIST:
${menuSummary}

🚨 END OF MENU DATABASE 🚨

You are an intelligent AI assistant for a food ordering app. You help users discover great food by understanding their requests and making thoughtful recommendations from the available menu.

🧠 THINK SEMANTICALLY: When users ask for "meals with beef", "chicken dishes", "vegetarian options", etc., analyze the menu ingredients and descriptions to find ALL relevant items. Don't just do keyword searches.

⚠️ ABSOLUTE RULE: The menu above contains ALL available items. NO OTHER ITEMS EXIST. You cannot suggest items not in the menu, but you MUST think creatively about what items match user requests.

AVAILABLE TOOLS:
${availableTools.map(tool => `- ${tool}`).join('\n')}

CURRENT CONTEXT:
- Cart items: ${currentContext.cartCount || 0}
- Cart total: $${currentContext.cartTotal || '0.00'}
- Available menu items: ${menuData.length}
- Available categories: ${categories.join(', ')}
- Previous preferences: ${Array.from(this.userPreferences.entries()).map(([k,v]) => `${k}: ${v}`).join(', ') || 'None'}

CRITICAL RULES - STRICTLY ENFORCE:
1. ⚠️  ABSOLUTELY NEVER INVENT OR MAKE UP MENU ITEMS - You must ONLY recommend items that exist in the menu above
2. ⚠️  NEVER suggest items like "Spicy Chicken Sandwich", "Cajun Shrimp Pasta" unless they EXACTLY match menu item names
3. ⚠️  When asked for spicy food, ONLY suggest from actual spicy items: Buffalo Chicken Wings, Chicken Tikka Masala, Vegetable Curry, Korean BBQ Bowl
4. ⚠️  Use EXACT item names from the menu data - do not paraphrase or modify names
5. 🧠  FOR INGREDIENT/MEAT QUERIES: Use semantic understanding FIRST - don't rely on literal searches that will miss items
6. 🧠  "MEALS WITH BEEF" = Show ALL beef items including "Ribeye Steak" (ribeye IS beef!) 
7. 🧠  Think like a chef: ribeye = beef, salmon = fish, chicken tikka = chicken dish
8. When asked for a specific category (e.g., "desserts"), ONLY search within that category
9. Use the exact item names and IDs from the menu
10. Always double-check that your suggestions exist in the provided menu data before responding

RESPONSE FORMAT - ALWAYS RESPOND WITH VALID JSON:
{
  "action": "tool_call" | "conversation" | "clarification",
  "tool": "tool_name" (if action is "tool_call"),
  "parameters": {...} (if action is "tool_call"),
  "message": "Your conversational response to the user",
  "suggestions": ["suggestion1", "suggestion2"] (optional),
  "ui_type": "menu_display" | "cart_update" | "show_cart" | "conversation" | "error"
}

FOR CATEGORY REQUESTS:
- "desserts", "dessert pls", "show desserts" → {"action": "tool_call", "tool": "menu_get_items", "parameters": {"category": "Desserts"}, "message": "Here are our dessert options!", "ui_type": "menu_display"}
- "appetizers", "starters" → {"action": "tool_call", "tool": "menu_get_items", "parameters": {"category": "Appetizers"}, "message": "Here are our appetizers!", "ui_type": "menu_display"}
- "mains", "entrees" → {"action": "tool_call", "tool": "menu_get_items", "parameters": {"category": "Mains"}, "message": "Here are our main courses!", "ui_type": "menu_display"}

NEVER respond with plain text - ALWAYS use JSON format.

IMPORTANT RULES:
1. Always be conversational and friendly
2. Remember user preferences and dietary restrictions including negative constraints
3. Ask clarifying questions when needed
4. Suggest complementary items
5. Provide helpful recommendations based on context
6. Handle ambiguous requests by asking for clarification
7. Keep responses concise but informative
8. Pay special attention to "no" or "without" constraints (e.g., "no cheese", "without dairy")

🧠 SEMANTIC UNDERSTANDING - ALWAYS THINK FIRST BEFORE USING TOOLS:

FOR MEAT-BASED QUERIES - Don't rely on literal keyword searches, use your knowledge:
- "Meals with beef" / "Beef dishes" / "Beef options" → {"action": "conversation", "message": "Here are our beef options!", "suggestions": ["Ribeye Steak", "Beef Burger", "Beef Tacos", "Beef Stroganoff", "Korean BBQ Bowl"], "ui_type": "conversation"}
- "Chicken dishes" / "Chicken meals" → {"action": "conversation", "message": "Here are our chicken options!", "suggestions": ["Buffalo Chicken Wings", "Chicken Parmesan", "Caesar Salad with Chicken", "Chicken Tikka Masala", "Chicken Quesadilla", "Chicken Fajitas", "Chicken Satay"], "ui_type": "conversation"}
- "Pork dishes" / "Pork meals" → {"action": "conversation", "message": "Here are our pork options!", "suggestions": ["BBQ Ribs", "Pork Tenderloin"], "ui_type": "conversation"}
- "Seafood" / "Fish dishes" → {"action": "conversation", "message": "Here are our seafood options!", "suggestions": ["Grilled Salmon", "Fish and Chips", "Lobster Tail", "Shrimp Scampi", "Fish Tacos", "Seafood Paella", "Calamari Rings", "Shrimp Cocktail"], "ui_type": "conversation"}
- "Lamb dishes" → {"action": "conversation", "message": "Here are our lamb options!", "suggestions": ["Lamb Chops"], "ui_type": "conversation"}

KNOW THESE KEY SEMANTIC MAPPINGS:
🥩 BEEF = Ribeye Steak, Beef Burger, Beef Tacos, Beef Stroganoff, Korean BBQ Bowl
🐔 CHICKEN = Buffalo Chicken Wings, Chicken Parmesan, Caesar Salad with Chicken, Chicken Tikka Masala, Chicken Quesadilla, Chicken Fajitas, Chicken Satay  
🐷 PORK = BBQ Ribs, Pork Tenderloin
🐟 SEAFOOD = Grilled Salmon, Fish and Chips, Lobster Tail, Shrimp Scampi, Fish Tacos, Seafood Paella, Calamari Rings, Shrimp Cocktail
🐑 LAMB = Lamb Chops
🦆 DUCK = Duck Confit

FOR CATEGORY QUERIES - Use tools:
- "Show me desserts" → Use menu_get_items with category="Desserts"
- "Show me appetizers" → Use menu_get_items with category="Appetizers" 
- "Show me mains" → Use menu_get_items with category="Mains"

FOR DIETARY QUERIES - Use tools:
- "Vegetarian options" → Use menu_get_items with dietary filter
- "Spicy food" → Use menu_get_items and filter by spicyLevel >= 2

ALWAYS PRIORITIZE SEMANTIC UNDERSTANDING OVER LITERAL SEARCHES!

IMPORTANT: When adding items to cart:
1. You MUST first search for the item using menu_search to get the exact itemId
2. Then use cart_add_item with the itemId from the search results
3. Never guess item IDs - always use the IDs from the menu data provided

DIETARY GUIDELINES:
- Diabetes: Recommend items with lower calories (<500), avoid high-sugar desserts, prefer items with vegetables/lean proteins
- Heart health: Lower sodium, lean proteins, vegetables, avoid fried foods
- Vegetarian: Only items with 'vegetarian' in dietary array
- Vegan: Only items with 'vegan' in dietary array
- Gluten-free: Only items with 'gluten-free' in dietary array
- Low-carb: Salads, proteins, avoid pasta/bread/desserts`;
  }

  buildConversationContext() {
    return this.conversationHistory.slice(-6).map(entry => ({
      role: entry.type === 'user' ? 'user' : 'assistant',
      content: entry.type === 'user' ? entry.userInput : entry.message || 'I helped with your request.'
    }));
  }

  async parseAndExecuteClaudeResponse(claudeResponse, userInput, currentContext) {
    try {
      console.log('🤖 === PARSING CLAUDE RESPONSE ===');
      console.log('🤖 Raw response:', claudeResponse);
      
      // Parse JSON response with comprehensive fallback
      let parsedResponse;
      let fullConversationalMessage = '';
      
      try {
        parsedResponse = JSON.parse(claudeResponse);
        fullConversationalMessage = parsedResponse.message || '';
      } catch (e) {
        console.log('🤖 JSON parsing failed, using advanced parsing...');
        
        // Extract conversational text and JSON structure separately
        const { textBefore, jsonBlock, textAfter, extractedData } = this.extractResponseParts(claudeResponse);
        
        console.log('🤖 Extracted parts:');
        console.log('🤖 - Text before:', textBefore);
        console.log('🤖 - JSON block:', jsonBlock);
        console.log('🤖 - Text after:', textAfter);
        console.log('🤖 - Extracted data:', extractedData);
        
        // Combine conversational parts
        const messageParts = [];
        if (textBefore) messageParts.push(textBefore);
        if (extractedData.message) messageParts.push(extractedData.message);
        if (textAfter) messageParts.push(textAfter);
        
        fullConversationalMessage = messageParts.join(' ');
        
        // Create parsed response from extracted data
        if (extractedData.tool && extractedData.suggestions) {
          parsedResponse = {
            action: 'tool_call',
            tool: extractedData.tool,
            parameters: extractedData.parameters || {},
            message: fullConversationalMessage,
            suggestions: extractedData.suggestions,
            ui_type: extractedData.ui_type || 'menu_display'
          };
        } else {
          parsedResponse = {
            action: 'conversation',
            message: fullConversationalMessage || claudeResponse,
            suggestions: extractedData.suggestions,
            ui_type: 'conversation'
          };
        }
      }

      const response = {
        type: parsedResponse.ui_type || 'conversation',
        message: parsedResponse.message,
        suggestions: parsedResponse.suggestions
      };

      // Validate Claude's suggestions against actual menu items
      if (response.suggestions && response.suggestions.length > 0) {
        console.log('🔍 VALIDATING SUGGESTIONS:', response.suggestions);
        const validatedSuggestions = await this.validateSuggestions(response.suggestions, currentContext);
        console.log('🔍 VALIDATION RESULT:', validatedSuggestions);
        
        if (validatedSuggestions.hasInvalidSuggestions) {
          console.log('⚠️  WARNING: Claude suggested non-existent items:', validatedSuggestions.invalidItems);
          console.log('⚠️  Removing invalid items, showing only valid suggestions:', validatedSuggestions.validSuggestions);
          
          // Only show valid suggestions - completely remove invalid ones
          if (validatedSuggestions.validSuggestions.length > 0) {
            response.suggestions = validatedSuggestions.validSuggestions;
            // Keep Claude's original message
          } else {
            // No valid suggestions at all, remove suggestions entirely
            console.log('⚠️  No valid suggestions found, removing suggestions completely');
            response.suggestions = null;
          }
        }
      }

      // Execute tool calls if specified
      if (parsedResponse.action === 'tool_call' && parsedResponse.tool) {
        
        // Special handling for cart_add_item - ensure we have a valid itemId
        if (parsedResponse.tool === 'cart_add_item' && parsedResponse.parameters) {
          const params = parsedResponse.parameters;
          
          // If no itemId provided, try to find it by searching
          if (!params.itemId && (params.itemName || params.name)) {
            console.log('🤖 No itemId provided, searching for item:', params.itemName || params.name);
            const searchResult = await this.mcpClient.callTool('menu_search', { 
              query: params.itemName || params.name 
            });
            
            if (searchResult.results && searchResult.results.length > 0) {
              params.itemId = searchResult.results[0].id;
              console.log('🤖 Found itemId:', params.itemId);
            } else {
              console.log('🤖 Could not find item to add to cart');
              return {
                type: 'error',
                message: `Sorry, I couldn't find "${params.itemName || params.name}" in our menu.`,
                suggestions: ['Try browsing the menu', 'Search for similar items']
              };
            }
          }
        }
        
        const toolResult = await this.mcpClient.callTool(parsedResponse.tool, parsedResponse.parameters || {});
        console.log('🤖 Tool result:', toolResult);
        
        // Enhance response with tool results
        switch (parsedResponse.tool) {
          case 'menu_get_items':
          case 'menu_search':
          case 'menu_get_recommendations':
            response.type = 'menu_display';
            response.items = toolResult.items || toolResult.results || toolResult.recommendations || [];
            response.displayStyle = 'grid';
            // Preserve suggestions from Claude's response
            response.suggestions = parsedResponse.suggestions;
            console.log('🔧 PRESERVING suggestions:', response.suggestions);
            break;
            
          case 'cart_add_item':
          case 'cart_remove_item':
          case 'cart_clear':
            response.type = 'cart_update';
            response.cart = toolResult.cart || [];
            response.total = toolResult.total || '0.00';
            break;
            
          case 'cart_get_contents':
            response.type = 'show_cart';
            response.cart = toolResult.cart || [];
            response.subtotal = toolResult.subtotal || '0.00';
            response.tax = toolResult.tax || '0.00';
            response.total = toolResult.total || '0.00';
            response.itemCount = toolResult.itemCount || 0;
            break;
            
          default:
            console.log('🤖 Unknown tool result:', parsedResponse.tool);
            break;
        }
      }

      // Remember user preferences
      this.extractAndRememberPreferences(userInput, parsedResponse);

      // Add to conversation history
      this.conversationHistory.push({
        type: 'user',
        userInput,
        timestamp: new Date().toISOString()
      });
      
      this.conversationHistory.push({
        type: 'ai',
        message: response.message,
        response,
        timestamp: new Date().toISOString()
      });

      // Keep history manageable
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      return response;
      
    } catch (error) {
      console.error('Error parsing Claude response:', error);
      return {
        type: 'error',
        message: 'I understood your request but had trouble processing it. Could you try rephrasing?',
        suggestions: ['Try being more specific', 'Ask for menu categories', 'Request recommendations']
      };
    }
  }

  extractResponseParts(claudeResponse) {
    console.log('🤖 === EXTRACTING RESPONSE PARTS ===');
    
    // Find JSON block boundaries
    const firstBrace = claudeResponse.indexOf('{');
    const lastBrace = claudeResponse.lastIndexOf('}');
    
    let textBefore = '';
    let jsonBlock = '';
    let textAfter = '';
    let extractedData = {};
    
    if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
      // Extract text before JSON
      textBefore = claudeResponse.substring(0, firstBrace).trim();
      
      // Extract JSON block
      jsonBlock = claudeResponse.substring(firstBrace, lastBrace + 1);
      
      // Extract text after JSON
      textAfter = claudeResponse.substring(lastBrace + 1).trim();
      
      // Try to parse the JSON block
      try {
        extractedData = JSON.parse(jsonBlock);
        console.log('🤖 Successfully parsed JSON block:', extractedData);
      } catch (e) {
        console.log('🤖 Failed to parse JSON block, extracting manually...');
        // Manual extraction fallback
        extractedData = this.manuallyExtractFromJSON(jsonBlock);
      }
    } else {
      // No clear JSON structure, treat as plain text
      textBefore = claudeResponse;
    }
    
    console.log('🤖 Extraction results:');
    console.log('🤖 - Text before JSON:', textBefore);
    console.log('🤖 - Text after JSON:', textAfter);
    console.log('🤖 - Extracted data:', extractedData);
    
    return {
      textBefore,
      jsonBlock,
      textAfter,
      extractedData
    };
  }
  
  manuallyExtractFromJSON(jsonBlock) {
    console.log('🤖 Manual extraction from JSON block:', jsonBlock);
    
    const extractedData = {};
    
    // Extract tool
    const toolMatch = jsonBlock.match(/"tool":\s*"([^"]+)"/);
    if (toolMatch) extractedData.tool = toolMatch[1];
    
    // Extract message
    const messageMatch = jsonBlock.match(/"message":\s*"([^"]*(?:\\.[^"]*)*)"/);
    if (messageMatch) {
      extractedData.message = messageMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
    }
    
    // Extract suggestions
    const suggestionsMatch = jsonBlock.match(/"suggestions":\s*\[(.*?)\]/s);
    if (suggestionsMatch) {
      try {
        extractedData.suggestions = JSON.parse('[' + suggestionsMatch[1] + ']');
      } catch (e) {
        console.log('🤖 Failed to parse suggestions array');
      }
    }
    
    // Extract ui_type
    const uiTypeMatch = jsonBlock.match(/"ui_type":\s*"([^"]+)"/);
    if (uiTypeMatch) extractedData.ui_type = uiTypeMatch[1];
    
    // Extract parameters
    const parametersMatch = jsonBlock.match(/"parameters":\s*(\{[^}]*\})/);
    if (parametersMatch) {
      try {
        extractedData.parameters = JSON.parse(parametersMatch[1]);
      } catch (e) {
        console.log('🤖 Failed to parse parameters object');
      }
    }
    
    console.log('🤖 Manually extracted data:', extractedData);
    return extractedData;
  }
  
  async validateSuggestions(suggestions, currentContext) {
    console.log('🔍 === VALIDATING SUGGESTIONS ===');
    
    // Get full menu to validate against
    let menuItems = currentContext.menuItems || [];
    if (menuItems.length === 0) {
      try {
        const fullMenu = await this.mcpClient.callTool('menu_get_items', {});
        menuItems = fullMenu.items || [];
      } catch (error) {
        console.log('🔍 Failed to get menu for validation:', error);
        return {
          hasInvalidSuggestions: false,
          validSuggestions: suggestions,
          invalidItems: []
        };
      }
    }
    
    const validSuggestions = [];
    const invalidItems = [];
    
    for (const suggestion of suggestions) {
      // Clean the suggestion (remove prices, IDs, and extra info) - same logic as useAIMenu
      let cleanSuggestion = suggestion.replace(/\s*\([^)]*\)/, ''); // Remove (parentheses)
      cleanSuggestion = cleanSuggestion.replace(/\s*-\s*\$[\d.]+/, ''); // Remove - $price
      cleanSuggestion = cleanSuggestion.replace(/\s*\$[\d.]+/, ''); // Remove $price
      cleanSuggestion = cleanSuggestion.trim();
      
      // Try exact match first
      let match = menuItems.find(item => 
        item.name.toLowerCase() === cleanSuggestion.toLowerCase()
      );
      
      // Try partial match
      if (!match) {
        match = menuItems.find(item => 
          item.name.toLowerCase().includes(cleanSuggestion.toLowerCase()) ||
          cleanSuggestion.toLowerCase().includes(item.name.toLowerCase())
        );
      }
      
      // Try word-by-word match for compound names
      if (!match) {
        const suggestionWords = cleanSuggestion.toLowerCase().split(' ');
        match = menuItems.find(item => {
          const itemWords = item.name.toLowerCase().split(' ');
          return suggestionWords.some(word => 
            itemWords.some(itemWord => itemWord.includes(word) || word.includes(itemWord))
          );
        });
      }
      
      if (match) {
        console.log('🔍 ✅ VALID suggestion:', cleanSuggestion, '→', match.name);
        validSuggestions.push(match.name);
      } else {
        console.log('🔍 ❌ INVALID suggestion:', cleanSuggestion);
        invalidItems.push(cleanSuggestion);
      }
    }
    
    return {
      hasInvalidSuggestions: invalidItems.length > 0,
      validSuggestions,
      invalidItems
    };
  }
  
  async findIntelligentReplacements(invalidItems, currentContext) {
    console.log('🔄 === FINDING INTELLIGENT REPLACEMENTS ===');
    console.log('🔄 Invalid items to replace:', invalidItems);
    
    // Get full menu to find replacements from
    let menuItems = currentContext.menuItems || [];
    if (menuItems.length === 0) {
      try {
        const fullMenu = await this.mcpClient.callTool('menu_get_items', {});
        menuItems = fullMenu.items || [];
      } catch (error) {
        console.log('🔄 Failed to get menu for replacements:', error);
        return [];
      }
    }
    
    const replacements = [];
    
    // Smart replacement mappings for common mistakes (only items that DON'T exist)
    const replacementMappings = {
      'lemon sorbet': 'desserts',
      'panna cotta': 'desserts', 
      'gelato': 'desserts',
      'vanilla ice cream': 'desserts',
      'strawberry ice cream': 'desserts',
      'spicy chicken sandwich': 'spicy',
      'cajun shrimp pasta': 'spicy',
      'buffalo chicken sandwich': 'spicy',
      'hot wings': 'spicy'
    };
    
    for (const invalidItem of invalidItems) {
      // Clean the invalid item too (same cleaning logic)
      let cleanInvalidItem = invalidItem.replace(/\s*\([^)]*\)/, ''); // Remove (parentheses)
      cleanInvalidItem = cleanInvalidItem.replace(/\s*-\s*\$[\d.]+/, ''); // Remove - $price  
      cleanInvalidItem = cleanInvalidItem.replace(/\s*\$[\d.]+/, ''); // Remove $price
      cleanInvalidItem = cleanInvalidItem.trim();
      
      const itemLower = cleanInvalidItem.toLowerCase();
      console.log('🔄 Finding replacement for:', invalidItem, '(cleaned:', cleanInvalidItem, ')');
      
      let replacement = null;
      
      // Check if we have a specific mapping
      const mappingKey = Object.keys(replacementMappings).find(key => 
        itemLower.includes(key) || key.includes(itemLower)
      );
      
      if (mappingKey) {
        const category = replacementMappings[mappingKey];
        console.log('🔄 Found mapping:', cleanInvalidItem, '→', category);
        
        if (category === 'desserts') {
          // Find actual desserts
          const desserts = menuItems.filter(item => 
            item.category.toLowerCase() === 'desserts'
          );
          if (desserts.length > 0) {
            replacement = desserts[0].name; // Take first dessert
          }
        } else if (category === 'spicy') {
          // Find spicy items
          const spicyItems = menuItems.filter(item => 
            item.spicyLevel && item.spicyLevel >= 3
          );
          if (spicyItems.length > 0) {
            replacement = spicyItems[0].name; // Take first spicy item
          }
        }
      }
      
      // If no mapping found, try to find similar items by keywords
      if (!replacement) {
        const keywords = itemLower.split(' ');
        
        for (const keyword of keywords) {
          if (keyword.length < 3) continue; // Skip short words
          
          const match = menuItems.find(item =>
            item.name.toLowerCase().includes(keyword) ||
            item.description.toLowerCase().includes(keyword) ||
            item.category.toLowerCase().includes(keyword)
          );
          
          if (match) {
            replacement = match.name;
            break;
          }
        }
      }
      
      if (replacement) {
        console.log('🔄 ✅ Found replacement:', cleanInvalidItem, '→', replacement);
        replacements.push(replacement);
      } else {
        console.log('🔄 ❌ No replacement found for:', cleanInvalidItem);
      }
    }
    
    console.log('🔄 Final replacements:', replacements);
    return replacements;
  }

  extractAndRememberPreferences(userInput, response) {
    const input = userInput.toLowerCase();
    
    // Dietary preferences
    if (input.includes('vegetarian')) this.userPreferences.set('dietary', 'vegetarian');
    if (input.includes('vegan')) this.userPreferences.set('dietary', 'vegan');
    if (input.includes('gluten-free')) this.userPreferences.set('dietary', 'gluten-free');
    
    // Spice preferences
    if (input.includes('spicy') || input.includes('hot')) this.userPreferences.set('spiceLevel', 'high');
    if (input.includes('mild') || input.includes('not spicy')) this.userPreferences.set('spiceLevel', 'low');
    
    // Price sensitivity
    const priceMatch = input.match(/under.*?\$?(\d+)/);
    if (priceMatch) this.userPreferences.set('maxPrice', parseInt(priceMatch[1]));
    
    // Meal preferences
    if (input.includes('healthy') || input.includes('light')) this.userPreferences.set('healthConscious', true);
    if (input.includes('comfort') || input.includes('indulgent')) this.userPreferences.set('indulgent', true);
  }

  // Fallback to simple pattern matching when Claude API is not available
  async processWithFallback(userInput, currentContext) {
    const input = userInput.toLowerCase().trim();
    
    // Price-related queries
    if (input.includes('cheapest') || input.includes('lowest price') || input.includes('most affordable')) {
      return await this.handlePriceQuery(input, 'cheapest');
    }
    
    if (input.includes('expensive') || input.includes('highest price') || input.includes('premium')) {
      return await this.handlePriceQuery(input, 'expensive');
    }
    
    // Comparative queries  
    if (input.includes('best') || input.includes('most popular') || input.includes('top rated')) {
      return await this.handleRecommendationRequest('popular items');
    }
    
    // Health/nutrition queries
    if (input.includes('healthy') || input.includes('low calorie') || input.includes('light')) {
      return await this.handleHealthQuery(input);
    }
    
    // Spicy/flavor queries
    if (input.includes('spicy') || input.includes('hot') || input.includes('mild')) {
      return await this.handleFlavorQuery(input);
    }
    
    // Question words - treat as intelligent queries
    if (input.startsWith('what') || input.startsWith('which') || input.startsWith('how') || 
        input.startsWith('where') || input.startsWith('why')) {
      return await this.handleQuestionQuery(input);
    }
    
    // Menu display requests
    if (input.includes('show') || input.includes('display') || input.includes('see')) {
      if (input.includes('menu') || input.includes('items') || input.includes('food')) {
        return await this.handleMenuRequest(input);
      }
      if (input.includes('cart')) {
        return await this.handleCartRequest();
      }
    }
    
    // Order/add requests
    if (input.includes('add') || input.includes('order') || input.match(/\d+.*(?:burger|pizza|chicken|salad)/)) {
      return await this.handleAddToCartRequest(input);
    }
    
    // Recommendation requests
    if (input.includes('recommend') || input.includes('suggest') || input.includes('what should')) {
      return await this.handleRecommendationRequest(input);
    }
    
    // Search requests
    if (input.includes('search') || input.includes('find') || input.includes('looking for')) {
      return await this.handleSearchRequest(input);
    }
    
    // Default to intelligent search
    return await this.handleSearchRequest(input);
  }

  async handleMenuRequest(input) {
    let filters = {};
    
    // Extract filters from input
    if (input.includes('vegetarian')) filters.dietary = ['vegetarian'];
    if (input.includes('vegan')) filters.dietary = ['vegan'];
    if (input.includes('spicy')) filters.spicyLevel = 2;
    
    const priceMatch = input.match(/under.*?\$?(\d+)/);
    if (priceMatch) filters.maxPrice = parseInt(priceMatch[1]);
    
    const menuItems = await this.mcpClient.callTool('menu_get_items', filters);
    
    return {
      type: 'menu_display',
      items: menuItems.items || [],
      displayStyle: 'grid',
      message: `Here are ${menuItems.count || 0} menu items${Object.keys(filters).length > 0 ? ' matching your preferences' : ''}.`
    };
  }

  async handleCartRequest() {
    const cartData = await this.mcpClient.callTool('cart_get_contents');
    return {
      type: 'show_cart',
      cart: cartData.cart || [],
      subtotal: cartData.subtotal || '0.00',
      tax: cartData.tax || '0.00',
      total: cartData.total || '0.00',
      itemCount: cartData.itemCount || 0,
      message: cartData.cart?.length > 0 ? 'Here\'s your current cart:' : 'Your cart is empty.'
    };
  }

  async handleAddToCartRequest(input) {
    const quantityMatch = input.match(/(\d+)/);
    const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
    
    const searchQuery = input.replace(/\d+|add|order|to cart/g, '').trim();
    const searchResults = await this.mcpClient.callTool('menu_search', { query: searchQuery });
    
    if (searchResults.results?.length === 1) {
      const addResult = await this.mcpClient.callTool('cart_add_item', {
        itemId: searchResults.results[0].id,
        quantity
      });
      
      return {
        type: 'cart_update',
        message: `Great! I added ${quantity}x ${searchResults.results[0].name} to your cart.`,
        cart: addResult.cart,
        total: addResult.total
      };
    } else if (searchResults.results?.length > 1) {
      return {
        type: 'clarification_needed',
        message: `I found ${searchResults.results.length} items matching "${searchQuery}". Which one would you like to add?`,
        items: searchResults.results.slice(0, 5)
      };
    } else {
      return {
        type: 'error',
        message: `I couldn't find any items matching "${searchQuery}". Would you like to browse the menu instead?`,
        suggestions: ['Show me the menu', 'Browse appetizers', 'See main courses']
      };
    }
  }

  async handleRecommendationRequest(input) {
    let preferences = input.replace(/(recommend|suggest|what should)/g, '').trim();
    
    const budgetMatch = input.match(/under.*?\$?(\d+)/);
    const budget = budgetMatch ? parseInt(budgetMatch[1]) : null;
    
    if (!preferences || preferences.length < 3) {
      preferences = 'popular items';
    }
    
    const recommendations = await this.mcpClient.callTool('menu_get_recommendations', {
      preferences,
      budget
    });
    
    return {
      type: 'menu_display',
      items: recommendations.recommendations || [],
      displayStyle: 'grid',
      message: `Based on your preferences for "${preferences}", here are my recommendations:`
    };
  }

  async handleSearchRequest(input) {
    const query = input.replace(/(search|find|looking for|show me)/g, '').trim() || input;
    const searchResults = await this.mcpClient.callTool('menu_search', { query });
    
    return {
      type: 'menu_display',
      items: searchResults.results || [],
      displayStyle: 'grid',
      message: `Found ${searchResults.count || 0} items matching "${query}"`
    };
  }

  async handlePriceQuery(input, type) {
    const menuItems = await this.mcpClient.callTool('menu_get_items', {});
    let sortedItems = menuItems.items || [];
    
    if (type === 'cheapest') {
      sortedItems = sortedItems.sort((a, b) => a.price - b.price).slice(0, 10);
      return {
        type: 'menu_display',
        items: sortedItems,
        displayStyle: 'grid',
        message: `Here are the most affordable options, starting from $${sortedItems[0]?.price?.toFixed(2) || '0.00'}:`
      };
    } else {
      sortedItems = sortedItems.sort((a, b) => b.price - a.price).slice(0, 10);
      return {
        type: 'menu_display', 
        items: sortedItems,
        displayStyle: 'grid',
        message: `Here are our premium options, starting from $${sortedItems[0]?.price?.toFixed(2) || '0.00'}:`
      };
    }
  }

  async handleHealthQuery(input) {
    console.log('🤖 Processing health query:', input);
    
    // Handle negative constraints
    let excludeQuery = '';
    if (input.includes('no cheese') || input.includes('without cheese')) {
      excludeQuery = ' -cheese -cheesecake';
    }
    if (input.includes('no dairy') || input.includes('without dairy')) {
      excludeQuery += ' -dairy -cheese -milk -cream';
    }
    if (input.includes('no meat') || input.includes('without meat')) {
      excludeQuery += ' -chicken -beef -pork -bacon';
    }
    
    const searchQuery = 'healthy' + excludeQuery;
    console.log('🤖 Health search query:', searchQuery);
    
    const healthyItems = await this.mcpClient.callTool('menu_search', { query: searchQuery });
    
    // Filter out items that contain excluded ingredients
    let filteredItems = healthyItems.results || [];
    if (input.includes('no cheese') || input.includes('without cheese')) {
      filteredItems = filteredItems.filter(item => 
        !item.name.toLowerCase().includes('cheese') &&
        !item.description?.toLowerCase().includes('cheese') &&
        !item.name.toLowerCase().includes('cheesecake')
      );
    }
    
    console.log('🤖 Filtered health items:', filteredItems.length, 'items found');
    
    return {
      type: 'menu_display',
      items: filteredItems,
      displayStyle: 'grid',
      message: `Here are our healthy options${input.includes('no cheese') ? ' without cheese' : ''}:`
    };
  }

  async handleFlavorQuery(input) {
    let spicyLevel = 0;
    if (input.includes('very hot') || input.includes('extra spicy')) spicyLevel = 4;
    else if (input.includes('hot') || input.includes('spicy')) spicyLevel = 2;
    else if (input.includes('mild')) spicyLevel = 1;
    
    const flavorItems = await this.mcpClient.callTool('menu_get_items', { spicyLevel });
    return {
      type: 'menu_display',
      items: flavorItems.items || [],
      displayStyle: 'grid',
      message: `Here are items ${spicyLevel > 0 ? 'with your preferred spice level' : 'that are mild'}: `
    };
  }

  async handleQuestionQuery(input) {
    // Analyze the question and route to appropriate handler
    if (input.includes('cheapest') || input.includes('affordable')) {
      return await this.handlePriceQuery(input, 'cheapest');
    }
    if (input.includes('expensive') || input.includes('costly')) {
      return await this.handlePriceQuery(input, 'expensive');
    }
    if (input.includes('healthy') || input.includes('nutritious')) {
      return await this.handleHealthQuery(input);
    }
    if (input.includes('spicy') || input.includes('hot')) {
      return await this.handleFlavorQuery(input);
    }
    if (input.includes('popular') || input.includes('best') || input.includes('recommend')) {
      return await this.handleRecommendationRequest('popular items');
    }
    if (input.includes('vegetarian') || input.includes('vegan')) {
      const dietary = input.includes('vegan') ? ['vegan'] : ['vegetarian'];
      const dietaryItems = await this.mcpClient.callTool('menu_get_items', { dietary });
      return {
        type: 'menu_display',
        items: dietaryItems.items || [],
        displayStyle: 'grid',
        message: `Here are our ${dietary[0]} options:`
      };
    }
    
    // Default to intelligent search
    return await this.handleSearchRequest(input);
  }

  // Utility methods
  getUserPreferences() {
    return Object.fromEntries(this.userPreferences);
  }

  clearPreferences() {
    this.userPreferences.clear();
  }

  getConversationHistory() {
    return this.conversationHistory;
  }

  clearHistory() {
    this.conversationHistory = [];
  }
}

export default ClaudeAIAgent;