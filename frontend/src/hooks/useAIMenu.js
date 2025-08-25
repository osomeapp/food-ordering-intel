import { useState, useEffect, useCallback } from 'react';
import MCPClient from '../services/mcp-client';
import ClaudeAIAgent from '../services/claude-ai-agent';

const useAIMenu = () => {
  const [mcpClient] = useState(() => new MCPClient());
  const [aiAgent] = useState(() => new ClaudeAIAgent());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [cartTotal, setCartTotal] = useState({
    subtotal: '0.00',
    tax: '0.00',
    total: '0.00',
    itemCount: 0
  });
  const [aiResponse, setAiResponse] = useState(null);

  // Initialize MCP client and AI agent
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        await mcpClient.initialize();
        aiAgent.mcpClient = mcpClient;
        
        // Load initial menu
        const initialMenu = await mcpClient.callTool('menu_get_items', {});
        setMenuItems(initialMenu.items || []);
        
        // Load cart
        await updateCartState();
        
        setError(null);
      } catch (err) {
        console.error('Failed to initialize:', err);
        setError('Failed to connect to menu service. Using offline mode.');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  // Update cart state from MCP server
  const updateCartState = useCallback(async () => {
    try {
      const cartData = await mcpClient.callTool('cart_get_contents');
      setCart(cartData.cart || []);
      setCartTotal({
        subtotal: cartData.subtotal || '0.00',
        tax: cartData.tax || '0.00',
        total: cartData.total || '0.00',
        itemCount: cartData.itemCount || 0
      });
    } catch (err) {
      console.error('Failed to update cart:', err);
    }
  }, [mcpClient]);

  // Stricter matching algorithm for menu items
  const fuzzyMatchMenuItem = useCallback((itemName, suggestion) => {
    console.log('🔍 STRICT MATCHING:', itemName, 'vs', suggestion);
    
    // Clean the suggestion (remove prices, IDs, and extra info)
    let cleanSuggestion = suggestion.replace(/\s*\([^)]*\)/, ''); // Remove (parentheses)
    cleanSuggestion = cleanSuggestion.replace(/\s*-\s*\$[\d.]+/, ''); // Remove - $price
    cleanSuggestion = cleanSuggestion.replace(/\s*\$[\d.]+/, ''); // Remove $price
    cleanSuggestion = cleanSuggestion.trim();
    
    const itemLower = itemName.toLowerCase();
    const suggestionLower = cleanSuggestion.toLowerCase();
    
    console.log('🔍 CLEANED SUGGESTION:', suggestion, '→', cleanSuggestion);
    
    // Exact match (highest priority)
    if (itemLower === suggestionLower) {
      console.log('🔍 ✅ EXACT MATCH');
      return true;
    }
    
    // Full suggestion contained in item name
    if (itemLower.includes(suggestionLower)) {
      console.log('🔍 ✅ ITEM CONTAINS SUGGESTION');
      return true;
    }
    
    // Full item name contained in suggestion (less common but valid)
    if (suggestionLower.includes(itemLower)) {
      console.log('🔍 ✅ SUGGESTION CONTAINS ITEM');
      return true;
    }
    
    // Word-by-word matching with stricter requirements
    const itemWords = itemLower.split(' ').filter(word => word.length > 3); // Increased minimum length
    const suggestionWords = suggestionLower.split(' ').filter(word => word.length > 3);
    
    // Skip fuzzy matching if either has too few meaningful words
    if (itemWords.length === 0 || suggestionWords.length === 0) {
      console.log('🔍 ❌ NO MEANINGFUL WORDS TO MATCH');
      return false;
    }
    
    // Check for exact word matches only (no partial word matching)
    let exactWordMatches = 0;
    for (const itemWord of itemWords) {
      for (const suggestionWord of suggestionWords) {
        if (itemWord === suggestionWord) { // Exact word match only
          exactWordMatches++;
          break;
        }
      }
    }
    
    // Require at least 70% of words to match exactly, and at least 1 match
    const matchRatio = exactWordMatches / Math.max(itemWords.length, suggestionWords.length);
    const isMatch = exactWordMatches > 0 && matchRatio >= 0.7;
    
    if (isMatch) {
      console.log('🔍 ✅ STRICT WORD MATCH:', `${exactWordMatches}/${Math.max(itemWords.length, suggestionWords.length)} words matched exactly`);
    } else {
      console.log('🔍 ❌ NO MATCH:', `${exactWordMatches}/${Math.max(itemWords.length, suggestionWords.length)} words matched (need 70%+)`);
    }
    
    return isMatch;
  }, []);

  // Process user message through AI agent
  const processUserMessage = useCallback(async (userInput) => {
    if (!userInput.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Prepare context for Claude
      const currentContext = {
        cartCount: cartTotal.itemCount,
        cartTotal: cartTotal.total,
        menuItemsCount: menuItems.length,
        hasItems: menuItems.length > 0,
        menuItems: menuItems  // Pass the actual menu items to Claude
      };
      
      const response = await aiAgent.processUserIntent(userInput, currentContext);
      setAiResponse(response);


      // Update UI based on response type
      switch (response.type) {
        case 'menu_display':
          // If menu_display has suggestions, filter by suggestions instead of showing all items
          if (response.suggestions && response.suggestions.length > 0) {
            console.log('🔧 FILTERING (MENU_DISPLAY) - Suggestions:', response.suggestions);
            
            // Get full menu to filter from if response.items is not provided
            let itemsToFilter = response.items;
            if (!itemsToFilter || itemsToFilter.length === 0) {
              const fullMenu = await mcpClient.callTool('menu_get_items', {});
              itemsToFilter = fullMenu.items || [];
            }
            console.log('🔧 FILTERING (MENU_DISPLAY) - Items to filter from:', itemsToFilter.length);
            
            const filteredItems = itemsToFilter.filter(item => {
              return response.suggestions.some(suggestion => {
                const match = fuzzyMatchMenuItem(item.name, suggestion);
                if (match) {
                  console.log('🔧 MATCH FOUND (MENU_DISPLAY):', item.name, '<=>', suggestion);
                }
                return match;
              });
            });
            
            console.log('🔧 FILTERING (MENU_DISPLAY) - Filtered items:', filteredItems.length, filteredItems.map(i => i.name));
            
            // Fallback: if filtering resulted in no items but we have items from tool call, show those
            if (filteredItems.length === 0 && response.items && response.items.length > 0) {
              console.log('🔧 FALLBACK: No matches found, showing tool result items');
              setMenuItems(response.items);
            } else {
              setMenuItems(filteredItems);
            }
          } else {
            setMenuItems(response.items || []);
          }
          break;
        
        case 'cart_update':
        case 'show_cart':
          await updateCartState();
          break;
        
        case 'clarification_needed':
          setMenuItems(response.items || []);
          break;
        
        case 'conversation':
          // If conversation has suggestions, filter menu items to show only suggested items
          if (response.suggestions && response.suggestions.length > 0) {
            console.log('🔧 FILTERING (CONVERSATION) - Suggestions:', response.suggestions);
            
            // Get full menu to filter from (not current filtered state)
            const fullMenu = await mcpClient.callTool('menu_get_items', {});
            const itemsToFilter = fullMenu.items || [];
            console.log('🔧 FILTERING (CONVERSATION) - Full menu items:', itemsToFilter.length);
            
            const filteredItems = itemsToFilter.filter(item => {
              return response.suggestions.some(suggestion => {
                const match = fuzzyMatchMenuItem(item.name, suggestion);
                if (match) {
                  console.log('🔧 MATCH FOUND (CONVERSATION):', item.name, '<=>', suggestion);
                }
                return match;
              });
            });
            
            console.log('🔧 FILTERING (CONVERSATION) - Filtered items:', filteredItems.length, filteredItems.map(i => i.name));
            
            // Fallback: if no items matched suggestions, show all menu items matching the original criteria
            if (filteredItems.length === 0) {
              console.log('🔧 FALLBACK: No matches found, showing all available items');
              setMenuItems(itemsToFilter);
            } else {
              setMenuItems(filteredItems);
            }
          }
          break;
        
        default:
          break;
      }
    } catch (err) {
      console.error('Error processing user message:', err);
      setError('Sorry, I had trouble processing your request.');
      setAiResponse({
        type: 'error',
        message: 'Sorry, I had trouble processing your request.',
        suggestions: ['Try "show me the menu"', 'Ask for "recommendations"']
      });
    } finally {
      setIsLoading(false);
    }
  }, [aiAgent, updateCartState, fuzzyMatchMenuItem]);

  // Add item to cart
  const addToCart = useCallback(async (item, quantity = 1, specialInstructions = '') => {
    setIsLoading(true);
    try {
      const result = await mcpClient.callTool('cart_add_item', {
        itemId: item.id,
        quantity,
        specialInstructions
      });
      
      if (result.error) {
        setError(result.error);
      } else {
        await updateCartState();
        setAiResponse({
          type: 'cart_update',
          message: result.message,
          cart: result.cart,
          total: result.total
        });
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      setError('Failed to add item to cart');
    } finally {
      setIsLoading(false);
    }
  }, [mcpClient, updateCartState]);

  // Remove item from cart
  const removeFromCart = useCallback(async (itemId, quantity = null) => {
    setIsLoading(true);
    try {
      const result = await mcpClient.callTool('cart_remove_item', {
        itemId,
        quantity
      });
      
      if (result.error) {
        setError(result.error);
      } else {
        await updateCartState();
        setAiResponse({
          type: 'cart_update',
          message: result.message,
          cart: result.cart,
          total: result.total
        });
      }
    } catch (err) {
      console.error('Error removing from cart:', err);
      setError('Failed to remove item from cart');
    } finally {
      setIsLoading(false);
    }
  }, [mcpClient, updateCartState]);

  // Update item quantity in cart
  const updateCartQuantity = useCallback(async (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    const cartItem = cart.find(item => item.itemId === itemId);
    if (!cartItem) return;

    const quantityDiff = newQuantity - cartItem.quantity;
    
    if (quantityDiff > 0) {
      await addToCart(cartItem.item, quantityDiff);
    } else {
      await removeFromCart(itemId, Math.abs(quantityDiff));
    }
  }, [cart, addToCart, removeFromCart]);

  // Clear entire cart
  const clearCart = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await mcpClient.callTool('cart_clear');
      await updateCartState();
      setAiResponse({
        type: 'cart_update',
        message: result.message,
        cart: [],
        total: '0.00'
      });
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError('Failed to clear cart');
    } finally {
      setIsLoading(false);
    }
  }, [mcpClient, updateCartState]);

  // Search menu items
  const searchMenu = useCallback(async (query) => {
    setIsLoading(true);
    try {
      const result = await mcpClient.callTool('menu_search', { query });
      setMenuItems(result.results || []);
      setAiResponse({
        type: 'menu_display',
        items: result.results,
        message: `Found ${result.count} items matching "${query}"`
      });
    } catch (err) {
      console.error('Error searching menu:', err);
      setError('Failed to search menu');
    } finally {
      setIsLoading(false);
    }
  }, [mcpClient]);

  // Get menu by category
  const getMenuByCategory = useCallback(async (category) => {
    setIsLoading(true);
    try {
      const result = await mcpClient.callTool('menu_get_items', { category });
      setMenuItems(result.items || []);
      setAiResponse({
        type: 'menu_display',
        items: result.items,
        message: `Showing ${category} items`
      });
    } catch (err) {
      console.error('Error getting menu by category:', err);
      setError('Failed to get menu items');
    } finally {
      setIsLoading(false);
    }
  }, [mcpClient]);

  // Get recommendations
  const getRecommendations = useCallback(async (preferences, budget = null) => {
    setIsLoading(true);
    try {
      const result = await mcpClient.callTool('menu_get_recommendations', {
        preferences,
        budget
      });
      setMenuItems(result.recommendations || []);
      setAiResponse({
        type: 'menu_display',
        items: result.recommendations,
        message: `Here are some recommendations for "${preferences}"`
      });
    } catch (err) {
      console.error('Error getting recommendations:', err);
      setError('Failed to get recommendations');
    } finally {
      setIsLoading(false);
    }
  }, [mcpClient]);

  // Checkout (placeholder for now)
  const checkout = useCallback(async () => {
    if (cart.length === 0) {
      setError('Your cart is empty');
      return;
    }

    // In a real app, this would integrate with a payment system
    setAiResponse({
      type: 'info',
      message: `Order placed successfully! Total: $${cartTotal.total}. Thank you for your order!`
    });
    
    // Clear cart after successful order
    await clearCart();
  }, [cart, cartTotal.total, clearCart]);

  return {
    // State
    isLoading,
    error,
    menuItems,
    cart,
    cartTotal,
    aiResponse,
    aiAgent,
    
    // Actions
    processUserMessage,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    searchMenu,
    getMenuByCategory,
    getRecommendations,
    checkout,
    
    // Utilities
    setError: (error) => setError(error),
    clearError: () => setError(null),
    clearAiResponse: () => setAiResponse(null)
  };
};

export default useAIMenu;