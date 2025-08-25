import React, { useState, useRef, useEffect } from 'react';

const ChatInterface = ({ onUserMessage, aiResponse, isLoading, aiAgent, menuItems = [] }) => {
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      type: 'ai',
      message: `Hi! I'm your ${aiAgent?.useClaudeAPI ? 'Claude-powered' : 'AI'} food ordering assistant. You can ask me things like:\n• "Show me vegetarian options"\n• "I want something spicy for lunch"\n• "Add 2 burgers to cart"\n• "What goes well with pasta?"\n• "I'm vegetarian but my friend isn't - suggest something we can both enjoy"${aiAgent?.useClaudeAPI ? '\n\n✨ I\'m powered by Claude AI for natural conversation!' : ''}`,
      timestamp: new Date().toISOString()
    }
  ]);
  const [isExpanded, setIsExpanded] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const quickActions = [
    "Show me the menu",
    "Vegetarian options",
    "Spicy food",
    "Healthy choices",
    "Desserts",
    "Show my cart"
  ];

  useEffect(() => {
    if (aiResponse) {
      setChatHistory(prev => [
        ...prev,
        {
          type: 'ai',
          message: aiResponse.message || 'Here are your results:',
          data: aiResponse,
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, [aiResponse]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  // Auto-focus input when chat is expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 300); // Wait for panel animation
    }
  }, [isExpanded]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      type: 'user',
      message: input.trim(),
      timestamp: new Date().toISOString()
    };

    setChatHistory(prev => [...prev, userMessage]);
    onUserMessage(input.trim());
    setInput('');
  };

  const handleQuickAction = (action) => {
    setInput(action);
    const userMessage = {
      type: 'user',
      message: action,
      timestamp: new Date().toISOString()
    };

    setChatHistory(prev => [...prev, userMessage]);
    onUserMessage(action);
    setInput('');
  };

  const formatMessage = (message) => {
    return message.split('\n').map((line, index) => (
      <div key={index}>{line}</div>
    ));
  };

  // Helper function to get menu item details from suggestion - only return if item exists
  const getItemFromSuggestion = (suggestion) => {
    if (typeof suggestion === 'object') return suggestion;
    
    // Extract item ID from suggestion like "Grilled Salmon (main024)"
    const idMatch = suggestion.match(/\(([^)]+)\)$/);
    if (idMatch) {
      const itemId = idMatch[1];
      const menuItem = menuItems.find(item => item.id === itemId);
      if (menuItem) {
        return menuItem;
      }
    }
    
    // Clean the suggestion (remove prices, IDs, and extra info) - same logic as validation
    let cleanName = suggestion.replace(/\s*\([^)]*\)/, ''); // Remove (parentheses)
    cleanName = cleanName.replace(/\s*-\s*\$[\d.]+/, ''); // Remove - $price
    cleanName = cleanName.replace(/\s*\$[\d.]+/, ''); // Remove $price
    cleanName = cleanName.trim();
    
    const menuItem = menuItems.find(item => 
      item.name.toLowerCase() === cleanName.toLowerCase()
    );
    
    // Only return the menu item if it actually exists - don't create fake items
    return menuItem;
  };

  const renderAIResponseData = (data) => {
    if (!data || !data.type) return null;

    switch (data.type) {
      case 'menu_display':
        // For responses with suggestions, show the suggestion count, not total items
        const allSuggestions = data.suggestions && data.suggestions.length > 0 
          ? data.suggestions 
          : data.items || [];
        
        // Filter to only valid menu items
        const validSuggestions = allSuggestions.filter(item => getItemFromSuggestion(item) !== null);
        const itemsToShow = validSuggestions.slice(0, 3);
        const totalCount = validSuggestions.length;
        
        return (
          <div style={responseDataStyle}>
            <div style={itemCountStyle}>
              {totalCount} items found
            </div>
            {itemsToShow.map((item, index) => {
              const menuItem = getItemFromSuggestion(item);
              // Only render if the menu item actually exists
              if (!menuItem) return null;
              
              return (
                <div key={menuItem.id || index} style={quickItemStyle}>
                  <span style={itemEmojiStyle}>🍽️</span>
                  <div>
                    <strong>{menuItem.name}</strong>
                    {menuItem.price && ` - $${menuItem.price.toFixed(2)}`}
                    {menuItem.description && <div style={itemDescStyle}>{menuItem.description}</div>}
                  </div>
                </div>
              );
            }).filter(item => item !== null)}
            {totalCount > 3 && (
              <div style={moreItemsStyle}>
                +{totalCount - 3} more items available
              </div>
            )}
          </div>
        );

      case 'cart_update':
      case 'show_cart':
        return (
          <div style={responseDataStyle}>
            <div style={cartSummaryStyle}>
              Total: ${data.total}
              {data.itemCount && (
                <span> ({data.itemCount} items)</span>
              )}
            </div>
            {data.cart?.slice(0, 2).map((cartItem, index) => (
              <div key={index} style={cartItemStyle}>
                <span>{cartItem.quantity}x {cartItem.item?.name || cartItem.name}</span>
              </div>
            ))}
          </div>
        );

      case 'clarification_needed':
        return (
          <div style={responseDataStyle}>
            <div style={clarificationStyle}>
              {data.items?.map(item => (
                <button
                  key={item.id}
                  style={clarificationButtonStyle}
                  onClick={() => handleQuickAction(`Add ${item.name} to cart`)}
                >
                  {item.name} - ${item.price.toFixed(2)}
                </button>
              ))}
            </div>
          </div>
        );

      case 'conversation':
        // Handle conversation responses that might have suggestions
        if (data.suggestions && data.suggestions.length > 0) {
          // Filter to only valid menu items
          const validSuggestions = data.suggestions.filter(item => getItemFromSuggestion(item) !== null);
          const itemsToShow = validSuggestions.slice(0, 3);
          const totalCount = validSuggestions.length;
          
          return (
            <div style={responseDataStyle}>
              <div style={itemCountStyle}>
                {totalCount} items found
              </div>
              {itemsToShow.map((item, index) => {
                const menuItem = getItemFromSuggestion(item);
                // Only render if the menu item actually exists
                if (!menuItem) return null;
                
                return (
                  <div key={index} style={quickItemStyle}>
                    <span style={itemEmojiStyle}>🍽️</span>
                    <div>
                      <strong>{menuItem.name}</strong>
                      {menuItem.price && ` - $${menuItem.price.toFixed(2)}`}
                    </div>
                  </div>
                );
              }).filter(item => item !== null)}
              {totalCount > 3 && (
                <div style={moreItemsStyle}>
                  +{totalCount - 3} more items available
                </div>
              )}
            </div>
          );
        }
        return null;

      case 'error':
        return (
          <div style={errorStyle}>
            <div>❌ {data.message}</div>
            {data.suggestions && (
              <div style={suggestionsStyle}>
                <div>Try:</div>
                {data.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    style={suggestionButtonStyle}
                    onClick={() => handleQuickAction(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={chatContainerStyle}>
      {/* Chat Toggle Button */}
      <button
        style={{...chatToggleStyle, backgroundColor: isExpanded ? '#F44336' : '#2196F3'}}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? '✕' : '💬'} AI Assistant
      </button>

      {/* Chat Panel */}
      <div style={{
        ...chatPanelStyle, 
        transform: isExpanded 
          ? 'translateY(-50%)' 
          : 'translateY(calc(-50% - 100%))'
      }}>
        {/* Chat Header */}
        <div style={chatHeaderStyle}>
          <div style={headerTitleStyle}>
            <span style={aiIconStyle}>🤖</span>
            AI Food Assistant
            {process.env.REACT_APP_DEBUG_AI === 'true' && (
              <span style={debugModeStyle}> [DEBUG]</span>
            )}
          </div>
          <button
            style={headerCloseStyle}
            onClick={() => setIsExpanded(false)}
          >
            ✕
          </button>
        </div>

        {/* Quick Actions */}
        <div style={quickActionsStyle}>
          {quickActions.map((action, index) => (
            <button
              key={index}
              style={quickActionButtonStyle}
              onClick={() => handleQuickAction(action)}
              disabled={isLoading}
            >
              {action}
            </button>
          ))}
        </div>

        {/* Chat Messages */}
        <div style={chatMessagesStyle}>
          {chatHistory.map((msg, index) => (
            <div
              key={index}
              style={msg.type === 'user' ? userMessageStyle : aiMessageStyle}
            >
              <div style={msg.type === 'user' ? userBubbleStyle : aiBubbleStyle}>
                {formatMessage(msg.message)}
                {msg.type === 'ai' && msg.data && renderAIResponseData(msg.data)}
              </div>
              <div style={timestampStyle}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div style={aiMessageStyle}>
              <div style={aiBubbleStyle}>
                <div style={typingIndicatorStyle}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <form style={chatInputFormStyle} onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            style={chatInputStyle}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me about the menu, add items to cart, or get recommendations..."
            disabled={isLoading}
          />
          <button
            style={{...sendButtonStyle, opacity: isLoading || !input.trim() ? 0.5 : 1}}
            type="submit"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? '...' : '➤'}
          </button>
        </form>
      </div>

      {/* Overlay */}
      {isExpanded && (
        <div
          style={overlayStyle}
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
};

// Styles
const chatContainerStyle = {
  position: 'fixed',
  top: '20px',
  left: '20px',
  zIndex: 900
};

const chatToggleStyle = {
  padding: '12px 20px',
  color: 'white',
  border: 'none',
  borderRadius: '25px',
  cursor: 'pointer',
  fontSize: '16px',
  fontWeight: 'bold',
  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  transition: 'all 0.3s ease'
};

const chatPanelStyle = {
  position: 'fixed',
  top: '95%',
  left: '20px',
  transform: 'translateY(-50%)',
  width: '400px',
  height: '500px',
  backgroundColor: 'white',
  borderRadius: '12px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease',
  zIndex: 1000
};

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.3)',
  zIndex: 999
};

const chatHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 20px',
  backgroundColor: '#2196F3',
  color: 'white',
  borderRadius: '12px 12px 0 0'
};

const headerTitleStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '18px',
  fontWeight: 'bold'
};

const aiIconStyle = {
  fontSize: '20px'
};

const headerCloseStyle = {
  background: 'none',
  border: 'none',
  color: 'white',
  fontSize: '20px',
  cursor: 'pointer',
  padding: '0'
};

const quickActionsStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  padding: '12px 16px',
  borderBottom: '1px solid #eee'
};

const quickActionButtonStyle = {
  padding: '6px 12px',
  fontSize: '12px',
  backgroundColor: '#f0f0f0',
  border: 'none',
  borderRadius: '16px',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
  ':hover': {
    backgroundColor: '#e0e0e0'
  }
};

const chatMessagesStyle = {
  flex: 1,
  overflowY: 'auto',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
};

const userMessageStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end'
};

const aiMessageStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start'
};

const userBubbleStyle = {
  backgroundColor: '#2196F3',
  color: 'white',
  padding: '12px 16px',
  borderRadius: '18px 18px 4px 18px',
  maxWidth: '80%',
  wordWrap: 'break-word'
};

const aiBubbleStyle = {
  backgroundColor: '#f0f0f0',
  color: '#333',
  padding: '12px 16px',
  borderRadius: '18px 18px 18px 4px',
  maxWidth: '80%',
  wordWrap: 'break-word'
};

const timestampStyle = {
  fontSize: '10px',
  color: '#999',
  marginTop: '4px',
  marginBottom: '4px'
};

const chatInputFormStyle = {
  display: 'flex',
  padding: '16px',
  borderTop: '1px solid #eee',
  gap: '8px'
};

const chatInputStyle = {
  flex: 1,
  padding: '12px',
  border: '1px solid #ddd',
  borderRadius: '20px',
  fontSize: '14px',
  outline: 'none',
  backgroundColor: 'white',
  color: '#333',
  fontFamily: 'inherit'
};

const sendButtonStyle = {
  width: '40px',
  height: '40px',
  backgroundColor: '#2196F3',
  color: 'white',
  border: 'none',
  borderRadius: '50%',
  cursor: 'pointer',
  fontSize: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const typingIndicatorStyle = {
  display: 'flex',
  gap: '4px'
};

const responseDataStyle = {
  marginTop: '8px',
  padding: '8px',
  backgroundColor: 'rgba(33, 150, 243, 0.1)',
  borderRadius: '8px',
  fontSize: '13px'
};

const itemCountStyle = {
  fontWeight: 'bold',
  marginBottom: '8px',
  color: '#2196F3'
};

const quickItemStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px',
  marginBottom: '8px',
  padding: '4px',
  backgroundColor: 'white',
  borderRadius: '4px'
};

const itemEmojiStyle = {
  fontSize: '16px'
};

const itemDescStyle = {
  fontSize: '11px',
  color: '#666',
  marginTop: '2px'
};

const moreItemsStyle = {
  fontSize: '12px',
  color: '#666',
  fontStyle: 'italic',
  textAlign: 'center',
  marginTop: '8px'
};

const cartSummaryStyle = {
  fontWeight: 'bold',
  color: '#4CAF50',
  marginBottom: '8px'
};

const cartItemStyle = {
  fontSize: '12px',
  color: '#666',
  marginBottom: '4px'
};

const clarificationStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px'
};

const clarificationButtonStyle = {
  padding: '4px 8px',
  fontSize: '11px',
  backgroundColor: '#2196F3',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer'
};

const errorStyle = {
  color: '#F44336'
};

const suggestionsStyle = {
  marginTop: '8px'
};

const suggestionButtonStyle = {
  display: 'block',
  padding: '4px 8px',
  fontSize: '11px',
  backgroundColor: '#4CAF50',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  marginBottom: '4px',
  width: '100%',
  textAlign: 'left'
};

const debugModeStyle = {
  fontSize: '12px',
  color: '#FFD700',
  fontWeight: 'normal'
};

export default ChatInterface;