import { menuItems, categories, dietaryFilters, spicyLevels } from '../data/menu-data.js';

let cart = [];

export const menuHandlers = {
  menu_get_categories: {
    name: "menu_get_categories",
    description: "Get all available food categories",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  },

  menu_get_items: {
    name: "menu_get_items",
    description: "Get menu items with optional filters",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Filter by category (Appetizers, Mains, Sides, Desserts, Beverages)"
        },
        dietary: {
          type: "array",
          items: { type: "string" },
          description: "Filter by dietary restrictions (vegetarian, vegan, gluten-free)"
        },
        maxPrice: {
          type: "number",
          description: "Maximum price filter"
        },
        spicyLevel: {
          type: "number",
          description: "Maximum spicy level (0-5)"
        },
        available: {
          type: "boolean",
          description: "Filter by availability"
        }
      },
      required: []
    }
  },

  menu_search: {
    name: "menu_search",
    description: "Search menu items by name, description, or ingredients using natural language",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query (e.g., 'spicy chicken', 'vegetarian pasta', 'healthy options')"
        }
      },
      required: ["query"]
    }
  },

  menu_get_recommendations: {
    name: "menu_get_recommendations",
    description: "Get AI-powered menu recommendations based on preferences",
    inputSchema: {
      type: "object",
      properties: {
        preferences: {
          type: "string",
          description: "User preferences (e.g., 'healthy lunch', 'comfort food', 'date night dinner')"
        },
        budget: {
          type: "number",
          description: "Budget constraint"
        }
      },
      required: ["preferences"]
    }
  },

  cart_add_item: {
    name: "cart_add_item",
    description: "Add an item to the shopping cart",
    inputSchema: {
      type: "object",
      properties: {
        itemId: {
          type: "string",
          description: "Menu item ID"
        },
        quantity: {
          type: "number",
          description: "Quantity to add"
        },
        specialInstructions: {
          type: "string",
          description: "Special cooking instructions"
        }
      },
      required: ["itemId", "quantity"]
    }
  },

  cart_remove_item: {
    name: "cart_remove_item",
    description: "Remove an item from the shopping cart",
    inputSchema: {
      type: "object",
      properties: {
        itemId: {
          type: "string",
          description: "Menu item ID to remove"
        },
        quantity: {
          type: "number",
          description: "Quantity to remove (optional, removes all if not specified)"
        }
      },
      required: ["itemId"]
    }
  },

  cart_get_contents: {
    name: "cart_get_contents",
    description: "Get current cart contents with totals",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  },

  cart_clear: {
    name: "cart_clear",
    description: "Clear all items from the cart",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  }
};

export async function handleToolCall(name, args) {
  switch (name) {
    case 'menu_get_categories':
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              categories: categories,
              totalItems: menuItems.length
            })
          }
        ]
      };

    case 'menu_get_items':
      let filteredItems = menuItems;

      if (args.category) {
        filteredItems = filteredItems.filter(item => item.category === args.category);
      }

      if (args.dietary && args.dietary.length > 0) {
        filteredItems = filteredItems.filter(item => 
          args.dietary.every(diet => item.dietary.includes(diet))
        );
      }

      if (args.maxPrice !== undefined) {
        filteredItems = filteredItems.filter(item => item.price <= args.maxPrice);
      }

      if (args.spicyLevel !== undefined) {
        filteredItems = filteredItems.filter(item => item.spicyLevel <= args.spicyLevel);
      }

      if (args.available !== undefined) {
        filteredItems = filteredItems.filter(item => item.available === args.available);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              items: filteredItems,
              count: filteredItems.length,
              filters: args
            })
          }
        ]
      };

    case 'menu_search':
      const query = args.query.toLowerCase();
      const searchResults = menuItems.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.ingredients.some(ingredient => ingredient.toLowerCase().includes(query)) ||
        item.category.toLowerCase().includes(query) ||
        item.dietary.some(diet => diet.toLowerCase().includes(query))
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              query: args.query,
              results: searchResults,
              count: searchResults.length
            })
          }
        ]
      };

    case 'menu_get_recommendations':
      const prefs = args.preferences.toLowerCase();
      let recommendations = [];

      if (prefs.includes('healthy') || prefs.includes('light')) {
        recommendations = menuItems.filter(item => 
          item.calories < 400 || 
          item.dietary.includes('vegetarian') ||
          item.category === 'Sides' && item.dietary.includes('vegan')
        );
      } else if (prefs.includes('comfort') || prefs.includes('hearty')) {
        recommendations = menuItems.filter(item => 
          item.calories > 500 ||
          item.name.toLowerCase().includes('burger') ||
          item.name.toLowerCase().includes('pasta') ||
          item.name.toLowerCase().includes('pizza')
        );
      } else if (prefs.includes('spicy') || prefs.includes('hot')) {
        recommendations = menuItems.filter(item => item.spicyLevel >= 2);
      } else if (prefs.includes('vegetarian')) {
        recommendations = menuItems.filter(item => item.dietary.includes('vegetarian'));
      } else if (prefs.includes('vegan')) {
        recommendations = menuItems.filter(item => item.dietary.includes('vegan'));
      } else {
        recommendations = menuItems.slice().sort(() => 0.5 - Math.random()).slice(0, 10);
      }

      if (args.budget) {
        recommendations = recommendations.filter(item => item.price <= args.budget);
      }

      recommendations = recommendations.slice(0, 8);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              preferences: args.preferences,
              budget: args.budget,
              recommendations: recommendations,
              count: recommendations.length
            })
          }
        ]
      };

    case 'cart_add_item':
      const item = menuItems.find(item => item.id === args.itemId);
      if (!item) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: "Item not found",
                itemId: args.itemId
              })
            }
          ]
        };
      }

      const existingCartItem = cart.find(cartItem => cartItem.itemId === args.itemId);
      if (existingCartItem) {
        existingCartItem.quantity += args.quantity;
        if (args.specialInstructions) {
          existingCartItem.specialInstructions = args.specialInstructions;
        }
      } else {
        cart.push({
          itemId: args.itemId,
          item: item,
          quantity: args.quantity,
          specialInstructions: args.specialInstructions || "",
          addedAt: new Date().toISOString()
        });
      }

      const total = cart.reduce((sum, cartItem) => sum + (cartItem.item.price * cartItem.quantity), 0);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              message: `Added ${args.quantity}x ${item.name} to cart`,
              cart: cart,
              total: total.toFixed(2),
              itemCount: cart.reduce((sum, cartItem) => sum + cartItem.quantity, 0)
            })
          }
        ]
      };

    case 'cart_remove_item':
      const cartItemIndex = cart.findIndex(cartItem => cartItem.itemId === args.itemId);
      if (cartItemIndex === -1) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: "Item not found in cart",
                itemId: args.itemId
              })
            }
          ]
        };
      }

      const cartItem = cart[cartItemIndex];
      if (args.quantity && args.quantity < cartItem.quantity) {
        cartItem.quantity -= args.quantity;
      } else {
        cart.splice(cartItemIndex, 1);
      }

      const totalAfterRemoval = cart.reduce((sum, cartItem) => sum + (cartItem.item.price * cartItem.quantity), 0);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              message: `Removed ${cartItem.item.name} from cart`,
              cart: cart,
              total: totalAfterRemoval.toFixed(2),
              itemCount: cart.reduce((sum, cartItem) => sum + cartItem.quantity, 0)
            })
          }
        ]
      };

    case 'cart_get_contents':
      const cartTotal = cart.reduce((sum, cartItem) => sum + (cartItem.item.price * cartItem.quantity), 0);
      const tax = cartTotal * 0.08;
      const finalTotal = cartTotal + tax;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              cart: cart,
              subtotal: cartTotal.toFixed(2),
              tax: tax.toFixed(2),
              total: finalTotal.toFixed(2),
              itemCount: cart.reduce((sum, cartItem) => sum + cartItem.quantity, 0)
            })
          }
        ]
      };

    case 'cart_clear':
      cart = [];
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              message: "Cart cleared successfully",
              cart: cart,
              total: "0.00",
              itemCount: 0
            })
          }
        ]
      };

    default:
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: `Unknown tool: ${name}`
            })
          }
        ]
      };
  }
}