import React, { useState } from 'react';
import './App.css';
import AIMenuDisplay from './components/AIMenuDisplay';
import Cart from './components/Cart';
import ChatInterface from './components/ChatInterface';
import useAIMenu from './hooks/useAIMenu';

function App() {
  console.log('🌟 APP COMPONENT LOADED - Console is working!');
  
  const {
    isLoading,
    error,
    menuItems,
    cart,
    cartTotal,
    aiResponse,
    aiAgent,
    processUserMessage,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    getMenuByCategory,
    checkout,
    clearError
  } = useAIMenu();

  const [currentView, setCurrentView] = useState('welcome');

  const handleUserMessage = async (message) => {
    await processUserMessage(message);
    setCurrentView('menu');
  };

  const handleAddToCart = async (item, quantity, specialInstructions) => {
    await addToCart(item, quantity, specialInstructions);
  };

  const handleCategoryClick = async (category) => {
    await getMenuByCategory(category);
    setCurrentView('menu');
  };

  const handleCheckout = async () => {
    await checkout();
  };

  const renderWelcomeScreen = () => (
    <div style={welcomeScreenStyle}>
      <div style={welcomeContentStyle}>
        <div style={logoStyle}>🍽️</div>
        <h1 style={titleStyle}>AI Food Ordering</h1>
        <p style={subtitleStyle}>
          Experience the future of food ordering with our AI-powered assistant
        </p>
        
        <div style={featuresStyle}>
          <div style={featureStyle}>
            <span style={featureIconStyle}>🤖</span>
            <div>
              <h3>Natural Language Ordering</h3>
              <p>Just tell us what you want - "I want something spicy for lunch"</p>
            </div>
          </div>
          
          <div style={featureStyle}>
            <span style={featureIconStyle}>🎯</span>
            <div>
              <h3>Smart Recommendations</h3>
              <p>Get personalized suggestions based on your preferences</p>
            </div>
          </div>
          
          <div style={featureStyle}>
            <span style={featureIconStyle}>⚡</span>
            <div>
              <h3>Dynamic Menu</h3>
              <p>Menu adapts intelligently based on your requests</p>
            </div>
          </div>
        </div>

        <div style={categoriesStyle}>
          <h3>Browse by Category</h3>
          <div style={categoryButtonsStyle}>
            {['Appetizers', 'Mains', 'Sides', 'Desserts', 'Beverages'].map(category => (
              <button
                key={category}
                style={categoryButtonStyle}
                onClick={() => handleCategoryClick(category)}
                disabled={isLoading}
              >
                <span style={categoryEmojiStyle}>
                  {getCategoryEmoji(category)}
                </span>
                {category}
              </button>
            ))}
          </div>
        </div>

        <div style={getStartedStyle}>
          <p>💬 Click the AI Assistant button below to start ordering!</p>
        </div>
      </div>
    </div>
  );

  const renderMenuView = () => (
    <div style={menuViewStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={headerContentStyle}>
          <button
            style={backButtonStyle}
            onClick={() => setCurrentView('welcome')}
          >
            ← Back
          </button>
          <h1 style={headerTitleStyle}>Menu</h1>
          <div style={menuStatsStyle}>
            {menuItems.length} items
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={errorBannerStyle}>
          <span>⚠️ {error}</span>
          <button style={errorCloseStyle} onClick={clearError}>×</button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div style={loadingStyle}>
          <div style={spinnerStyle}></div>
          <p>Loading delicious options...</p>
        </div>
      )}

      {/* AI Response Message */}
      {aiResponse && aiResponse.message && (
        <div style={aiMessageBannerStyle}>
          <span style={aiIconStyle}>🤖</span>
          {aiResponse.message}
        </div>
      )}

      {/* Menu Display */}
      <AIMenuDisplay
        items={menuItems}
        displayStyle="grid"
        onAddToCart={handleAddToCart}
        onItemClick={(item) => console.log('Item clicked:', item)}
      />
    </div>
  );

  const getCategoryEmoji = (category) => {
    const emojis = {
      'Appetizers': '🥗',
      'Mains': '🍽️',
      'Sides': '🍟',
      'Desserts': '🍰',
      'Beverages': '🥤'
    };
    return emojis[category] || '🍽️';
  };

  return (
    <div className="App" style={appStyle}>
      {currentView === 'welcome' ? renderWelcomeScreen() : renderMenuView()}
      
      {/* Cart Component */}
      <Cart
        cart={cart}
        subtotal={cartTotal.subtotal}
        tax={cartTotal.tax}
        total={cartTotal.total}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        onCheckout={handleCheckout}
      />

      {/* Chat Interface */}
      <ChatInterface
        onUserMessage={handleUserMessage}
        aiResponse={aiResponse}
        isLoading={isLoading}
        aiAgent={aiAgent}
        menuItems={menuItems}
      />
    </div>
  );
}

// Styles
const appStyle = {
  minHeight: '100vh',
  backgroundColor: '#f5f5f5'
};

const welcomeScreenStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px'
};

const welcomeContentStyle = {
  maxWidth: '800px',
  textAlign: 'center',
  backgroundColor: 'white',
  padding: '40px',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
};

const logoStyle = {
  fontSize: '64px',
  marginBottom: '20px'
};

const titleStyle = {
  fontSize: '48px',
  margin: '0 0 16px 0',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontWeight: 'bold'
};

const subtitleStyle = {
  fontSize: '20px',
  color: '#666',
  marginBottom: '40px',
  lineHeight: '1.4'
};

const featuresStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '24px',
  marginBottom: '40px'
};

const featureStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '16px',
  textAlign: 'left',
  padding: '20px',
  backgroundColor: '#f9f9f9',
  borderRadius: '12px'
};

const featureIconStyle = {
  fontSize: '32px',
  flexShrink: 0
};

const categoriesStyle = {
  marginBottom: '32px'
};

const categoryButtonsStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px',
  justifyContent: 'center',
  marginTop: '16px'
};

const categoryButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '12px 20px',
  backgroundColor: 'white',
  border: '2px solid #2196F3',
  borderRadius: '25px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  fontSize: '16px',
  fontWeight: '600',
  color: '#2196F3',
  ':hover': {
    backgroundColor: '#2196F3',
    color: 'white'
  }
};

const categoryEmojiStyle = {
  fontSize: '20px'
};

const getStartedStyle = {
  fontSize: '18px',
  color: '#2196F3',
  fontWeight: '600'
};

const menuViewStyle = {
  minHeight: '100vh',
  paddingBottom: '100px'
};

const headerStyle = {
  backgroundColor: 'white',
  borderBottom: '1px solid #eee',
  position: 'sticky',
  top: 0,
  zIndex: 100
};

const headerContentStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 20px',
  maxWidth: '1200px',
  margin: '0 auto'
};

const backButtonStyle = {
  padding: '8px 16px',
  backgroundColor: '#f0f0f0',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600'
};

const headerTitleStyle = {
  margin: 0,
  fontSize: '24px',
  color: '#333'
};

const menuStatsStyle = {
  fontSize: '14px',
  color: '#666',
  backgroundColor: '#f0f0f0',
  padding: '4px 12px',
  borderRadius: '12px'
};

const errorBannerStyle = {
  backgroundColor: '#ffebee',
  color: '#c62828',
  padding: '12px 20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderLeft: '4px solid #f44336'
};

const errorCloseStyle = {
  background: 'none',
  border: 'none',
  fontSize: '18px',
  cursor: 'pointer',
  color: '#c62828'
};

const loadingStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '60px 20px',
  color: '#666'
};

const spinnerStyle = {
  width: '40px',
  height: '40px',
  border: '4px solid #f0f0f0',
  borderTop: '4px solid #2196F3',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  marginBottom: '16px'
};

const aiMessageBannerStyle = {
  backgroundColor: '#e3f2fd',
  color: '#1565c0',
  padding: '12px 20px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  borderLeft: '4px solid #2196F3'
};

const aiIconStyle = {
  fontSize: '16px'
};

export default App;