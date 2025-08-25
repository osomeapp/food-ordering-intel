import React, { useState } from 'react';

const AIMenuDisplay = ({ items = [], displayStyle = 'grid', onAddToCart, onItemClick }) => {
  const [selectedItem, setSelectedItem] = useState(null);

  const handleItemClick = (item) => {
    setSelectedItem(item);
    if (onItemClick) {
      onItemClick(item);
    }
  };

  const handleAddToCart = (item, quantity = 1) => {
    if (onAddToCart) {
      onAddToCart(item, quantity);
    }
    setSelectedItem(null);
  };

  const getSpicyLevelDisplay = (level) => {
    const levels = ['🔥'.repeat(level) || 'Not Spicy'];
    return levels[0];
  };

  const getDietaryBadges = (dietary) => {
    const badges = {
      vegetarian: { color: '#4CAF50', label: 'Vegetarian' },
      vegan: { color: '#8BC34A', label: 'Vegan' },
      'gluten-free': { color: '#FF9800', label: 'Gluten-Free' }
    };

    return dietary.map(diet => badges[diet] || { color: '#666', label: diet });
  };

  const formatPrice = (price) => `$${price.toFixed(2)}`;

  if (!items.length) {
    return (
      <div style={emptyStateStyle}>
        <div>🍽️</div>
        <h3>No items found</h3>
        <p>Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={displayStyle === 'grid' ? gridStyle : listStyle}>
        {items.map(item => (
          <div key={item.id} style={itemStyle} onClick={() => handleItemClick(item)}>
            <div style={itemImageStyle}>
              <div style={placeholderImageStyle}>
                <span style={categoryEmojiStyle}>
                  {getCategoryEmoji(item.category)}
                </span>
              </div>
              {item.dietary.length > 0 && (
                <div style={badgeContainerStyle}>
                  {getDietaryBadges(item.dietary).map((badge, index) => (
                    <span key={index} style={{...badgeStyle, backgroundColor: badge.color}}>
                      {badge.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div style={itemContentStyle}>
              <div style={itemHeaderStyle}>
                <h3 style={itemNameStyle}>{item.name}</h3>
                <span style={priceStyle}>{formatPrice(item.price)}</span>
              </div>
              
              <p style={descriptionStyle}>{item.description}</p>
              
              <div style={itemMetaStyle}>
                <span style={caloriesStyle}>{item.calories} cal</span>
                <span style={prepTimeStyle}>⏱️ {item.prepTime}min</span>
                {item.spicyLevel > 0 && (
                  <span style={spicyStyle}>{getSpicyLevelDisplay(item.spicyLevel)}</span>
                )}
              </div>
              
              <button
                style={addButtonStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart(item, 1);
                }}
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedItem && (
        <ItemModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
};

const ItemModal = ({ item, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <h2>{item.name}</h2>
          <button style={closeButtonStyle} onClick={onClose}>×</button>
        </div>
        
        <div style={modalContentStyle}>
          <div style={modalImageStyle}>
            <div style={largePlaceholderImageStyle}>
              <span style={largeCategoryEmojiStyle}>
                {getCategoryEmoji(item.category)}
              </span>
            </div>
          </div>
          
          <div style={modalInfoStyle}>
            <p style={modalDescriptionStyle}>{item.description}</p>
            
            <div style={modalMetaStyle}>
              <div><strong>Ingredients:</strong> {item.ingredients.join(', ')}</div>
              <div><strong>Calories:</strong> {item.calories}</div>
              <div><strong>Prep Time:</strong> {item.prepTime} minutes</div>
              {item.spicyLevel > 0 && <div><strong>Spicy Level:</strong> {item.spicyLevel}/5</div>}
            </div>
            
            <div style={quantityContainerStyle}>
              <label>Quantity:</label>
              <div style={quantityControlStyle}>
                <button 
                  style={quantityButtonStyle}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </button>
                <span style={quantityDisplayStyle}>{quantity}</span>
                <button 
                  style={quantityButtonStyle}
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>
            
            <div style={instructionsContainerStyle}>
              <label>Special Instructions:</label>
              <textarea
                style={textareaStyle}
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Any special requests..."
              />
            </div>
            
            <div style={modalActionsStyle}>
              <span style={modalPriceStyle}>
                ${(item.price * quantity).toFixed(2)}
              </span>
              <button
                style={modalAddButtonStyle}
                onClick={() => onAddToCart(item, quantity, specialInstructions)}
              >
                Add {quantity} to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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

// Styles
const containerStyle = {
  padding: '20px'
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: '20px'
};

const listStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px'
};

const itemStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  overflow: 'hidden',
  cursor: 'pointer',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  ':hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
  }
};

const itemImageStyle = {
  position: 'relative',
  height: '200px'
};

const placeholderImageStyle = {
  width: '100%',
  height: '100%',
  backgroundColor: '#f0f0f0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const categoryEmojiStyle = {
  fontSize: '48px'
};

const badgeContainerStyle = {
  position: 'absolute',
  top: '10px',
  left: '10px',
  display: 'flex',
  flexWrap: 'wrap',
  gap: '5px'
};

const badgeStyle = {
  color: 'white',
  padding: '4px 8px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 'bold'
};

const itemContentStyle = {
  padding: '16px'
};

const itemHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '8px'
};

const itemNameStyle = {
  margin: 0,
  fontSize: '18px',
  fontWeight: '600',
  color: '#333',
  flex: 1
};

const priceStyle = {
  fontSize: '18px',
  fontWeight: '700',
  color: '#2196F3'
};

const descriptionStyle = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '1.4',
  margin: '0 0 12px 0'
};

const itemMetaStyle = {
  display: 'flex',
  gap: '12px',
  fontSize: '12px',
  color: '#888',
  marginBottom: '12px'
};

const caloriesStyle = {
  color: '#FF9800'
};

const prepTimeStyle = {
  color: '#4CAF50'
};

const spicyStyle = {
  color: '#F44336'
};

const addButtonStyle = {
  width: '100%',
  padding: '10px',
  backgroundColor: '#2196F3',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: '600',
  transition: 'background-color 0.2s ease'
};

const emptyStateStyle = {
  textAlign: 'center',
  padding: '60px 20px',
  color: '#666',
  fontSize: '48px'
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
};

const modalStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  width: '90%',
  maxWidth: '600px',
  maxHeight: '90vh',
  overflow: 'auto'
};

const modalHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px 20px 0 20px',
  borderBottom: '1px solid #eee'
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '24px',
  cursor: 'pointer',
  padding: '0',
  width: '30px',
  height: '30px'
};

const modalContentStyle = {
  padding: '20px'
};

const modalImageStyle = {
  marginBottom: '20px'
};

const largePlaceholderImageStyle = {
  width: '100%',
  height: '200px',
  backgroundColor: '#f0f0f0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '8px'
};

const largeCategoryEmojiStyle = {
  fontSize: '72px'
};

const modalInfoStyle = {
  marginBottom: '20px'
};

const modalDescriptionStyle = {
  fontSize: '16px',
  lineHeight: '1.5',
  marginBottom: '16px',
  color: '#333'
};

const modalMetaStyle = {
  backgroundColor: '#f9f9f9',
  padding: '16px',
  borderRadius: '8px',
  marginBottom: '20px'
};

const quantityContainerStyle = {
  marginBottom: '16px'
};

const quantityControlStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginTop: '8px'
};

const quantityButtonStyle = {
  width: '32px',
  height: '32px',
  border: '1px solid #ddd',
  backgroundColor: 'white',
  cursor: 'pointer',
  borderRadius: '4px'
};

const quantityDisplayStyle = {
  fontSize: '18px',
  fontWeight: '600',
  minWidth: '30px',
  textAlign: 'center'
};

const instructionsContainerStyle = {
  marginBottom: '20px'
};

const textareaStyle = {
  width: '100%',
  minHeight: '60px',
  padding: '8px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  resize: 'vertical',
  marginTop: '8px'
};

const modalActionsStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const modalPriceStyle = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#2196F3'
};

const modalAddButtonStyle = {
  padding: '12px 24px',
  backgroundColor: '#2196F3',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '16px'
};

export default AIMenuDisplay;