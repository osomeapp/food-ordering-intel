class AIAgent {
  constructor(mcpClient) {
    this.mcpClient = mcpClient;
    this.conversationHistory = [];
  }

  async processUserIntent(userInput, currentContext = {}) {
    try {
      const intent = await this.analyzeIntent(userInput);
      const response = await this.executeIntent(intent, currentContext);
      
      this.conversationHistory.push({
        userInput,
        intent,
        response,
        timestamp: new Date().toISOString()
      });
      
      return response;
    } catch (error) {
      console.error('Error processing user intent:', error);
      return {
        type: 'error',
        message: 'Sorry, I had trouble understanding that request.',
        suggestions: ['Try asking for menu categories', 'Search for specific dishes', 'Ask for recommendations']
      };
    }
  }

  analyzeIntent(userInput) {
    const input = userInput.toLowerCase().trim();
    
    if (input.includes('show') || input.includes('display') || input.includes('see')) {
      if (input.includes('menu') || input.includes('items') || input.includes('food')) {
        return this.extractMenuIntent(input);
      }
      if (input.includes('cart')) {
        return { type: 'show_cart' };
      }
    }
    
    if (input.includes('add') || input.includes('order') || input.match(/\d+.*(?:burger|pizza|chicken|salad)/)) {
      return this.extractAddToCartIntent(input);
    }
    
    if (input.includes('remove') || input.includes('delete') || input.includes('cancel')) {
      return this.extractRemoveFromCartIntent(input);
    }
    
    if (input.includes('recommend') || input.includes('suggest') || input.includes('what should')) {
      return this.extractRecommendationIntent(input);
    }
    
    if (input.includes('search') || input.includes('find') || input.includes('looking for')) {
      return this.extractSearchIntent(input);
    }
    
    if (input.includes('clear cart') || input.includes('empty cart')) {
      return { type: 'clear_cart' };
    }
    
    return this.extractSearchIntent(input);
  }

  extractMenuIntent(input) {
    const categories = ['appetizers', 'mains', 'sides', 'desserts', 'beverages'];
    const dietary = ['vegetarian', 'vegan', 'gluten-free'];
    
    let filters = {};
    
    for (const category of categories) {
      if (input.includes(category) || input.includes(category.slice(0, -1))) {
        filters.category = category.charAt(0).toUpperCase() + category.slice(1);
        break;
      }
    }
    
    for (const diet of dietary) {
      if (input.includes(diet)) {
        filters.dietary = filters.dietary || [];
        filters.dietary.push(diet);
      }
    }
    
    const priceMatch = input.match(/under \$?(\d+)/);
    if (priceMatch) {
      filters.maxPrice = parseInt(priceMatch[1]);
    }
    
    const spicyMatch = input.match(/(not spicy|mild|medium|hot|very hot|spicy)/);
    if (spicyMatch) {
      const spicyLevels = {
        'not spicy': 0,
        'mild': 1,
        'medium': 2,
        'hot': 3,
        'very hot': 4,
        'spicy': 2
      };
      filters.spicyLevel = spicyLevels[spicyMatch[1]] || 2;
    }
    
    return {
      type: 'show_menu',
      filters,
      displayStyle: this.determineDisplayStyle(input)
    };
  }

  extractAddToCartIntent(input) {
    const quantityMatch = input.match(/(\d+)/);
    const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
    
    const itemHints = input.replace(/\d+|add|order|to cart/g, '').trim();
    
    return {
      type: 'add_to_cart',
      quantity,
      itemHints,
      searchQuery: itemHints
    };
  }

  extractRemoveFromCartIntent(input) {
    const quantityMatch = input.match(/(\d+)/);
    const quantity = quantityMatch ? parseInt(quantityMatch[1]) : null;
    
    const itemHints = input.replace(/\d+|remove|delete|cancel|from cart/g, '').trim();
    
    return {
      type: 'remove_from_cart',
      quantity,
      itemHints
    };
  }

  extractRecommendationIntent(input) {
    let preferences = input;
    let budget = null;
    
    const budgetMatch = input.match(/under \$?(\d+)/);
    if (budgetMatch) {
      budget = parseInt(budgetMatch[1]);
      preferences = input.replace(budgetMatch[0], '').trim();
    }
    
    return {
      type: 'get_recommendations',
      preferences: preferences.replace(/(recommend|suggest|what should)/g, '').trim(),
      budget
    };
  }

  extractSearchIntent(input) {
    const cleanQuery = input.replace(/(search|find|looking for|show me)/g, '').trim();
    return {
      type: 'search_menu',
      query: cleanQuery || input
    };
  }

  determineDisplayStyle(input) {
    if (input.includes('grid') || input.includes('cards')) return 'grid';
    if (input.includes('list') || input.includes('simple')) return 'list';
    return 'grid'; // default
  }

  async executeIntent(intent, currentContext) {
    switch (intent.type) {
      case 'show_menu':
        const menuItems = await this.mcpClient.callTool('menu_get_items', intent.filters || {});
        return {
          type: 'menu_display',
          items: menuItems.items,
          filters: intent.filters,
          displayStyle: intent.displayStyle,
          message: this.generateMenuMessage(menuItems, intent.filters)
        };

      case 'search_menu':
        const searchResults = await this.mcpClient.callTool('menu_search', { query: intent.query });
        return {
          type: 'menu_display',
          items: searchResults.results,
          displayStyle: 'grid',
          message: `Found ${searchResults.count} items matching "${intent.query}"`
        };

      case 'get_recommendations':
        const recommendations = await this.mcpClient.callTool('menu_get_recommendations', {
          preferences: intent.preferences,
          budget: intent.budget
        });
        return {
          type: 'menu_display',
          items: recommendations.recommendations,
          displayStyle: 'grid',
          message: `Here are some recommendations based on your preferences: "${intent.preferences}"`
        };

      case 'add_to_cart':
        if (intent.searchQuery) {
          const searchForAdd = await this.mcpClient.callTool('menu_search', { query: intent.searchQuery });
          if (searchForAdd.results.length === 1) {
            const addResult = await this.mcpClient.callTool('cart_add_item', {
              itemId: searchForAdd.results[0].id,
              quantity: intent.quantity
            });
            return {
              type: 'cart_update',
              message: addResult.message,
              cart: addResult.cart,
              total: addResult.total
            };
          } else if (searchForAdd.results.length > 1) {
            return {
              type: 'clarification_needed',
              message: `I found ${searchForAdd.results.length} items matching "${intent.searchQuery}". Which one would you like?`,
              items: searchForAdd.results.slice(0, 5),
              pendingAction: { type: 'add_to_cart', quantity: intent.quantity }
            };
          } else {
            return {
              type: 'error',
              message: `I couldn't find any items matching "${intent.searchQuery}"`
            };
          }
        }
        break;

      case 'remove_from_cart':
        const cartContents = await this.mcpClient.callTool('cart_get_contents');
        if (intent.itemHints) {
          const cartItem = cartContents.cart.find(item => 
            item.item.name.toLowerCase().includes(intent.itemHints.toLowerCase())
          );
          if (cartItem) {
            const removeResult = await this.mcpClient.callTool('cart_remove_item', {
              itemId: cartItem.itemId,
              quantity: intent.quantity
            });
            return {
              type: 'cart_update',
              message: removeResult.message,
              cart: removeResult.cart,
              total: removeResult.total
            };
          }
        }
        return {
          type: 'show_cart',
          message: "Which item would you like to remove?",
          cart: cartContents.cart,
          total: cartContents.total
        };

      case 'show_cart':
        const currentCart = await this.mcpClient.callTool('cart_get_contents');
        return {
          type: 'show_cart',
          cart: currentCart.cart,
          subtotal: currentCart.subtotal,
          tax: currentCart.tax,
          total: currentCart.total,
          itemCount: currentCart.itemCount,
          message: currentCart.cart.length > 0 ? 'Here\'s your current cart:' : 'Your cart is empty'
        };

      case 'clear_cart':
        const clearResult = await this.mcpClient.callTool('cart_clear');
        return {
          type: 'cart_update',
          message: 'Your cart has been cleared',
          cart: [],
          total: '0.00'
        };

      default:
        return {
          type: 'error',
          message: 'I\'m not sure how to help with that.',
          suggestions: [
            'Try "show me the menu"',
            'Ask for "spicy vegetarian options"',
            'Say "add 2 burgers to cart"',
            'Request "healthy lunch recommendations"'
          ]
        };
    }
  }

  generateMenuMessage(menuData, filters) {
    let message = `Found ${menuData.count} items`;
    
    if (filters.category) {
      message += ` in ${filters.category}`;
    }
    
    if (filters.dietary) {
      message += ` (${filters.dietary.join(', ')})`;
    }
    
    if (filters.maxPrice) {
      message += ` under $${filters.maxPrice}`;
    }
    
    return message;
  }

  async suggestPairings(itemId) {
    try {
      const currentCart = await this.mcpClient.callTool('cart_get_contents');
      const cartItems = currentCart.cart.map(item => item.item.category);
      
      let pairingPreferences = '';
      if (cartItems.includes('Mains')) {
        pairingPreferences = 'sides and beverages';
      } else if (cartItems.includes('Appetizers')) {
        pairingPreferences = 'main courses';
      } else {
        pairingPreferences = 'popular combinations';
      }
      
      const recommendations = await this.mcpClient.callTool('menu_get_recommendations', {
        preferences: pairingPreferences
      });
      
      return recommendations.recommendations.slice(0, 3);
    } catch (error) {
      console.error('Error generating pairings:', error);
      return [];
    }
  }
}

export default AIAgent;