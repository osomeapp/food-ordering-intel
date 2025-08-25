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

    return `You are an AI assistant for a food ordering app. You help users browse menus, make recommendations, and manage their cart through natural conversation.

AVAILABLE TOOLS:
${availableTools.map(tool => `- ${tool}`).join('\n')}

CURRENT CONTEXT:
- Cart items: ${currentContext.cartCount || 0}
- Cart total: $${currentContext.cartTotal || '0.00'}
- Available menu items: ${menuData.length}
- Available categories: ${categories.join(', ')}
- Previous preferences: ${Array.from(this.userPreferences.entries()).map(([k,v]) => `${k}: ${v}`).join(', ') || 'None'}

COMPLETE MENU BY CATEGORY:
${menuSummary}

CRITICAL RULES:
1. ONLY recommend items that exist in the menu above - NEVER make up items like "Lemon Sorbet", "Yogurt Parfait" etc.
2. When asked for a specific category (e.g., "desserts"), ONLY search within that category
3. Use the exact item names and IDs from the menu
4. For "not too sweet" desserts, recommend Fruit Tart (280 cal) or Key Lime Pie (350 cal) which are actually available

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

Examples:
- "Show me vegetarian options" → Use menu_get_items with dietary filter
- "I want desserts that is not too sweet" → Use menu_get_items with category="Desserts", then recommend Fruit Tart or Key Lime Pie from actual menu
- "Add 2 burgers" → First use menu_search to find "Beef Burger" (main008), then cart_add_item with itemId: "main008"
- "Add grilled chicken salad" → Search for "Caesar Salad with Chicken" (main010), then cart_add_item with itemId: "main010"
- "What goes with pasta?" → Recommend actual items like "Shrimp Scampi" (main025) which has pasta
- "I'm hungry for something spicy" → Use menu_get_items with spicyLevel >= 2
- "Remove the pizza" → Use cart_remove_item for "Margherita Pizza" (main007)
- "Something without dairy" → Search for vegan items from actual menu
- "What do you suggest for old people with diabetes?" → Recommend low-calorie items like "Vegetable Stir Fry" (340 cal) or "Quinoa Bowl" (380 cal)
- "Show me appetizers" → Use menu_get_items with category="Appetizers"

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
      // Parse JSON response with fallback to manual extraction
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(claudeResponse);
      } catch (e) {
        // Extract suggestions manually from the response
        const suggestionsMatch = claudeResponse.match(/"suggestions":\s*\[(.*?)\]/s);
        const toolMatch = claudeResponse.match(/"tool":\s*"(.*?)"/);
        
        if (suggestionsMatch) {
          try {
            const suggestionsArray = JSON.parse('[' + suggestionsMatch[1] + ']');
            const tool = toolMatch ? toolMatch[1] : 'menu_get_items';
            
            // Determine parameters based on context
            let parameters = {};
            if (suggestionsArray.some(s => s.toLowerCase().includes('dessert') || s.includes('tart') || s.includes('pie'))) {
              parameters = { category: 'Desserts' };
            }
            
            parsedResponse = {
              action: 'tool_call',
              tool: tool,
              parameters: parameters,
              message: 'Here are some options for you:',
              suggestions: suggestionsArray,
              ui_type: 'menu_display'
            };
          } catch (e2) {
            parsedResponse = {
              action: 'conversation',
              message: claudeResponse,
              ui_type: 'conversation'
            };
          }
        } else {
          parsedResponse = {
            action: 'conversation',
            message: claudeResponse,
            ui_type: 'conversation'
          };
        }
      }

      const response = {
        type: parsedResponse.ui_type || 'conversation',
        message: parsedResponse.message,
        suggestions: parsedResponse.suggestions
      };

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