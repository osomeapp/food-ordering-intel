class MCPClient {
  constructor() {
    this.baseUrl = 'http://localhost:3001/api/mcp';
    this.tools = new Map();
  }

  async initialize() {
    try {
      const response = await fetch(`${this.baseUrl}/tools`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      data.tools.forEach(tool => {
        this.tools.set(tool.name, tool);
      });
      console.log('MCP Client initialized with tools:', Array.from(this.tools.keys()));
    } catch (error) {
      console.error('Failed to initialize MCP client:', error);
      this.initializeMockMode();
    }
  }

  initializeMockMode() {
    console.log('Initializing MCP client in mock mode...');
    this.mockMode = true;
    this.mockData = this.generateMockData();
  }

  async callTool(toolName, args = {}) {
    if (this.mockMode) {
      return this.handleMockToolCall(toolName, args);
    }

    try {
      const response = await fetch(`${this.baseUrl}/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tool: toolName,
          arguments: args
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return JSON.parse(data.content[0].text);
    } catch (error) {
      console.error(`Error calling MCP tool ${toolName}:`, error);
      throw error;
    }
  }

  handleMockToolCall(toolName, args) {
    console.log(`Mock MCP call: ${toolName}`, args);

    switch (toolName) {
      case 'menu_get_categories':
        return {
          categories: ["Appetizers", "Mains", "Sides", "Desserts", "Beverages"],
          totalItems: 100
        };

      case 'menu_get_items':
        let items = [...this.mockData.items];
        
        if (args.category) {
          items = items.filter(item => item.category === args.category);
        }
        if (args.dietary && args.dietary.length > 0) {
          items = items.filter(item => 
            args.dietary.every(diet => item.dietary.includes(diet))
          );
        }
        if (args.maxPrice !== undefined) {
          items = items.filter(item => item.price <= args.maxPrice);
        }
        if (args.spicyLevel !== undefined) {
          items = items.filter(item => item.spicyLevel <= args.spicyLevel);
        }
        
        return {
          items: items,
          count: items.length,
          filters: args
        };

      case 'menu_search':
        const query = args.query.toLowerCase();
        
        // Smart search with concept mapping
        let searchResults = [];
        
        // Check for health-related queries
        if (query.includes('healthy') || query.includes('light') || query.includes('low cal')) {
          searchResults = this.mockData.items.filter(item => 
            item.calories < 400 || 
            item.dietary.includes('vegetarian') || 
            item.dietary.includes('vegan') ||
            item.name.toLowerCase().includes('salad') ||
            item.name.toLowerCase().includes('grilled')
          );
        }
        // Check for spicy queries
        else if (query.includes('spicy') || query.includes('hot')) {
          searchResults = this.mockData.items.filter(item => item.spicyLevel >= 2);
        }
        // Regular text search
        else {
          searchResults = this.mockData.items.filter(item => 
            item.name.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query) ||
            item.ingredients.some(ing => ing.toLowerCase().includes(query)) ||
            item.category.toLowerCase().includes(query)
          );
        }
        
        return {
          query: args.query,
          results: searchResults,
          count: searchResults.length
        };

      case 'menu_get_recommendations':
        const prefs = args.preferences.toLowerCase();
        let recommendations = [];
        
        if (prefs.includes('healthy') || prefs.includes('light')) {
          recommendations = this.mockData.items.filter(item => 
            item.calories < 400 || item.dietary.includes('vegetarian')
          );
        } else if (prefs.includes('spicy')) {
          recommendations = this.mockData.items.filter(item => item.spicyLevel >= 2);
        } else {
          recommendations = this.mockData.items.slice(0, 8);
        }
        
        if (args.budget) {
          recommendations = recommendations.filter(item => item.price <= args.budget);
        }
        
        return {
          preferences: args.preferences,
          budget: args.budget,
          recommendations: recommendations.slice(0, 8),
          count: recommendations.slice(0, 8).length
        };

      case 'cart_add_item':
        console.log('🛒 cart_add_item called with args:', args);
        const item = this.mockData.items.find(item => item.id === args.itemId);
        console.log('🛒 Found item:', item);
        if (!item) {
          console.log('🛒 ERROR: Item not found. Available item IDs:', this.mockData.items.map(i => i.id));
          return { error: "Item not found", itemId: args.itemId };
        }
        
        this.mockData.cart.push({
          itemId: args.itemId,
          item: item,
          quantity: args.quantity,
          specialInstructions: args.specialInstructions || "",
          addedAt: new Date().toISOString()
        });
        
        const total = this.mockData.cart.reduce((sum, cartItem) => 
          sum + (cartItem.item.price * cartItem.quantity), 0
        );
        
        return {
          message: `Added ${args.quantity}x ${item.name} to cart`,
          cart: this.mockData.cart,
          total: total.toFixed(2),
          itemCount: this.mockData.cart.reduce((sum, cartItem) => sum + cartItem.quantity, 0)
        };

      case 'cart_get_contents':
        const cartTotal = this.mockData.cart.reduce((sum, cartItem) => 
          sum + (cartItem.item.price * cartItem.quantity), 0
        );
        const tax = cartTotal * 0.08;
        const finalTotal = cartTotal + tax;
        
        return {
          cart: this.mockData.cart,
          subtotal: cartTotal.toFixed(2),
          tax: tax.toFixed(2),
          total: finalTotal.toFixed(2),
          itemCount: this.mockData.cart.reduce((sum, cartItem) => sum + cartItem.quantity, 0)
        };

      case 'cart_remove_item':
        const cartItemIndex = this.mockData.cart.findIndex(cartItem => cartItem.itemId === args.itemId);
        if (cartItemIndex !== -1) {
          const removedItem = this.mockData.cart.splice(cartItemIndex, 1)[0];
          const totalAfterRemoval = this.mockData.cart.reduce((sum, cartItem) => 
            sum + (cartItem.item.price * cartItem.quantity), 0
          );
          
          return {
            message: `Removed ${removedItem.item.name} from cart`,
            cart: this.mockData.cart,
            total: totalAfterRemoval.toFixed(2),
            itemCount: this.mockData.cart.reduce((sum, cartItem) => sum + cartItem.quantity, 0)
          };
        }
        return { error: "Item not found in cart" };

      case 'cart_clear':
        this.mockData.cart = [];
        return {
          message: "Cart cleared successfully",
          cart: [],
          total: "0.00",
          itemCount: 0
        };

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  }

  generateMockData() {
    const items = [
      { id: "app001", name: "Buffalo Chicken Wings", category: "Appetizers", price: 12.99, description: "Crispy wings tossed in tangy buffalo sauce", ingredients: ["chicken", "buffalo sauce", "celery"], dietary: [], spicyLevel: 3, calories: 450, prepTime: 15, image: "buffalo-wings.jpg", available: true },
      { id: "app002", name: "Mozzarella Sticks", category: "Appetizers", price: 8.99, description: "Golden fried mozzarella with marinara sauce", ingredients: ["mozzarella", "breadcrumbs", "marinara"], dietary: ["vegetarian"], spicyLevel: 0, calories: 380, prepTime: 10, image: "mozzarella-sticks.jpg", available: true },
      { id: "app003", name: "Hummus Platter", category: "Appetizers", price: 9.49, description: "Fresh hummus with pita bread and vegetables", ingredients: ["chickpeas", "tahini", "pita bread"], dietary: ["vegan", "vegetarian"], spicyLevel: 0, calories: 240, prepTime: 5, image: "hummus.jpg", available: true },
      { id: "main001", name: "Grilled Salmon", category: "Mains", price: 22.99, description: "Atlantic salmon with lemon herb butter", ingredients: ["salmon", "lemon", "herbs"], dietary: [], spicyLevel: 0, calories: 450, prepTime: 18, image: "grilled-salmon.jpg", available: true },
      { id: "main002", name: "Chicken Parmesan", category: "Mains", price: 18.99, description: "Breaded chicken breast with marinara and mozzarella", ingredients: ["chicken", "marinara", "mozzarella"], dietary: [], spicyLevel: 0, calories: 520, prepTime: 25, image: "chicken-parm.jpg", available: true },
      { id: "main003", name: "Vegetarian Lasagna", category: "Mains", price: 16.99, description: "Layers of pasta with vegetables and ricotta", ingredients: ["pasta", "vegetables", "ricotta"], dietary: ["vegetarian"], spicyLevel: 0, calories: 480, prepTime: 30, image: "veggie-lasagna.jpg", available: true },
      { id: "main004", name: "Beef Burger", category: "Mains", price: 15.99, description: "Angus beef patty with lettuce, tomato, and fries", ingredients: ["beef", "lettuce", "tomato"], dietary: [], spicyLevel: 0, calories: 620, prepTime: 15, image: "beef-burger.jpg", available: true },
      { id: "main005", name: "Pad Thai", category: "Mains", price: 16.49, description: "Traditional Thai stir-fried noodles", ingredients: ["rice noodles", "shrimp", "peanuts"], dietary: [], spicyLevel: 2, calories: 540, prepTime: 12, image: "pad-thai.jpg", available: true },
      { id: "side001", name: "French Fries", category: "Sides", price: 4.99, description: "Crispy golden french fries", ingredients: ["potatoes", "salt"], dietary: ["vegan", "vegetarian"], spicyLevel: 0, calories: 320, prepTime: 8, image: "french-fries.jpg", available: true },
      { id: "side002", name: "Caesar Salad", category: "Sides", price: 6.49, description: "Crisp romaine with Caesar dressing", ingredients: ["romaine", "croutons", "parmesan"], dietary: ["vegetarian"], spicyLevel: 0, calories: 180, prepTime: 5, image: "caesar-side.jpg", available: true },
      { id: "healthy001", name: "Quinoa Power Bowl", category: "Mains", price: 14.99, description: "Nutritious quinoa with roasted vegetables and tahini", ingredients: ["quinoa", "vegetables", "tahini"], dietary: ["vegan", "vegetarian"], spicyLevel: 0, calories: 320, prepTime: 15, image: "quinoa-bowl.jpg", available: true },
      { id: "healthy002", name: "Grilled Chicken Salad", category: "Mains", price: 13.99, description: "Fresh mixed greens with grilled chicken breast", ingredients: ["chicken", "mixed greens", "vegetables"], dietary: [], spicyLevel: 0, calories: 280, prepTime: 10, image: "chicken-salad.jpg", available: true },
      { id: "healthy003", name: "Steamed Broccoli", category: "Sides", price: 4.99, description: "Fresh steamed broccoli with lemon", ingredients: ["broccoli", "lemon"], dietary: ["vegan", "vegetarian"], spicyLevel: 0, calories: 55, prepTime: 8, image: "steamed-broccoli.jpg", available: true },
      { id: "des001", name: "Chocolate Cake", category: "Desserts", price: 7.99, description: "Rich chocolate layer cake", ingredients: ["chocolate", "flour", "eggs"], dietary: ["vegetarian"], spicyLevel: 0, calories: 450, prepTime: 5, image: "chocolate-cake.jpg", available: true },
      { id: "des002", name: "Cheesecake", category: "Desserts", price: 6.99, description: "New York style cheesecake", ingredients: ["cream cheese", "graham crackers"], dietary: ["vegetarian"], spicyLevel: 0, calories: 380, prepTime: 5, image: "cheesecake.jpg", available: true },
      { id: "bev001", name: "Fresh Orange Juice", category: "Beverages", price: 3.99, description: "Freshly squeezed orange juice", ingredients: ["oranges"], dietary: ["vegan", "vegetarian"], spicyLevel: 0, calories: 110, prepTime: 2, image: "orange-juice.jpg", available: true },
      { id: "bev002", name: "Coffee", category: "Beverages", price: 2.49, description: "Freshly brewed coffee", ingredients: ["coffee beans"], dietary: ["vegan", "vegetarian"], spicyLevel: 0, calories: 5, prepTime: 3, image: "coffee.jpg", available: true }
    ];

    return {
      items,
      cart: []
    };
  }

  getAvailableTools() {
    if (this.mockMode) {
      return [
        'menu_get_categories',
        'menu_get_items',
        'menu_search',
        'menu_get_recommendations',
        'cart_add_item',
        'cart_remove_item',
        'cart_get_contents',
        'cart_clear'
      ];
    }
    return Array.from(this.tools.keys());
  }
}

export default MCPClient;