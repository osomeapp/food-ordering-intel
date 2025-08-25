import React, { useState } from 'react';

const Cart = ({ cart = [], subtotal = '0.00', tax = '0.00', total = '0.00', onUpdateQuantity, onRemoveItem, onClearCart, onCheckout }) => {
  const [isOpen, setIsOpen] = useState(false);

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      onRemoveItem(itemId);
    } else {
      onUpdateQuantity(itemId, newQuantity);
    }
  };

  const CartIcon = () => (
    <div style={cartIconStyle} onClick={() => setIsOpen(!isOpen)}>
      <div style={iconStyle}>🛒</div>
      {itemCount > 0 && (
        <div style={badgeStyle}>{itemCount}</div>
      )}
      <span style={totalLabelStyle}>${total}</span>
    </div>
  );

  const CartPanel = () => (
    <div style={{...cartPanelStyle, right: isOpen ? '0' : '-400px'}}>
      <div style={cartHeaderStyle}>
        <h2 style={cartTitleStyle}>Your Cart</h2>
        <button style={closeButtonStyle} onClick={() => setIsOpen(false)}>
          ×
        </button>
      </div>

      {cart.length === 0 ? (
        <div style={emptyCartStyle}>
          <div style={emptyIconStyle}>🛒</div>
          <p>Your cart is empty</p>
        </div>
      ) : (
        <>
          <div style={cartItemsStyle}>
            {cart.map(cartItem => (
              <CartItem
                key={cartItem.itemId}
                cartItem={cartItem}
                onQuantityChange={handleQuantityChange}
                onRemove={() => onRemoveItem(cartItem.itemId)}
              />
            ))}
          </div>

          <div style={cartSummaryStyle}>
            <div style={summaryRowStyle}>
              <span>Subtotal:</span>
              <span>${subtotal}</span>
            </div>
            <div style={summaryRowStyle}>
              <span>Tax:</span>
              <span>${tax}</span>
            </div>
            <div style={{...summaryRowStyle, ...totalRowStyle}}>
              <span>Total:</span>
              <span>${total}</span>
            </div>
          </div>

          <div style={cartActionsStyle}>
            <button style={clearButtonStyle} onClick={onClearCart}>
              Clear Cart
            </button>
            <button style={checkoutButtonStyle} onClick={onCheckout}>
              Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      <CartIcon />
      <CartPanel />
      {isOpen && <div style={overlayStyle} onClick={() => setIsOpen(false)} />}
    </>
  );
};

const CartItem = ({ cartItem, onQuantityChange, onRemove }) => {
  const { item, quantity, specialInstructions } = cartItem;
  const itemTotal = (item.price * quantity).toFixed(2);

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
    <div style={cartItemStyle}>
      <div style={itemImageStyle}>
        <div style={placeholderStyle}>
          {getCategoryEmoji(item.category)}
        </div>
      </div>
      
      <div style={itemDetailsStyle}>
        <h4 style={itemNameStyle}>{item.name}</h4>
        <p style={itemPriceStyle}>${item.price.toFixed(2)} each</p>
        
        {specialInstructions && (
          <p style={instructionsStyle}>
            Note: {specialInstructions}
          </p>
        )}
        
        <div style={quantityControlsStyle}>
          <button
            style={quantityButtonStyle}
            onClick={() => onQuantityChange(cartItem.itemId, quantity - 1)}
          >
            -
          </button>
          <span style={quantityDisplayStyle}>{quantity}</span>
          <button
            style={quantityButtonStyle}
            onClick={() => onQuantityChange(cartItem.itemId, quantity + 1)}
          >
            +
          </button>
        </div>
      </div>
      
      <div style={itemTotalStyle}>
        <div style={itemTotalPriceStyle}>${itemTotal}</div>
        <button style={removeButtonStyle} onClick={onRemove}>
          🗑️
        </button>
      </div>
    </div>
  );
};

// Styles
const cartIconStyle = {
  position: 'fixed',
  top: '20px',
  right: '20px',
  backgroundColor: '#2196F3',
  color: 'white',
  padding: '12px 16px',
  borderRadius: '25px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
  zIndex: 900,
  transition: 'transform 0.2s ease',
  ':hover': {
    transform: 'scale(1.05)'
  }
};

const iconStyle = {
  fontSize: '20px'
};

const badgeStyle = {
  backgroundColor: '#F44336',
  color: 'white',
  borderRadius: '50%',
  width: '20px',
  height: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  fontWeight: 'bold',
  marginLeft: '-8px'
};

const totalLabelStyle = {
  fontWeight: 'bold',
  fontSize: '16px'
};

const cartPanelStyle = {
  position: 'fixed',
  top: '0',
  right: '-400px',
  width: '400px',
  height: '100vh',
  backgroundColor: 'white',
  boxShadow: '-4px 0 12px rgba(0,0,0,0.1)',
  zIndex: 1000,
  transition: 'right 0.3s ease',
  display: 'flex',
  flexDirection: 'column'
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

const cartHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px',
  borderBottom: '1px solid #eee'
};

const cartTitleStyle = {
  margin: 0,
  fontSize: '24px',
  color: '#333'
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '28px',
  cursor: 'pointer',
  padding: '0',
  color: '#666'
};

const emptyCartStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  color: '#666'
};

const emptyIconStyle = {
  fontSize: '48px',
  marginBottom: '16px'
};

const cartItemsStyle = {
  flex: 1,
  overflowY: 'auto',
  padding: '20px'
};

const cartItemStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  padding: '16px 0',
  borderBottom: '1px solid #f0f0f0'
};

const itemImageStyle = {
  flexShrink: 0
};

const placeholderStyle = {
  width: '60px',
  height: '60px',
  backgroundColor: '#f0f0f0',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '24px'
};

const itemDetailsStyle = {
  flex: 1,
  minWidth: 0
};

const itemNameStyle = {
  margin: '0 0 4px 0',
  fontSize: '16px',
  fontWeight: '600',
  color: '#333'
};

const itemPriceStyle = {
  margin: '0 0 8px 0',
  fontSize: '14px',
  color: '#666'
};

const instructionsStyle = {
  margin: '0 0 8px 0',
  fontSize: '12px',
  color: '#888',
  fontStyle: 'italic'
};

const quantityControlsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};

const quantityButtonStyle = {
  width: '28px',
  height: '28px',
  border: '1px solid #ddd',
  backgroundColor: 'white',
  cursor: 'pointer',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const quantityDisplayStyle = {
  fontSize: '14px',
  fontWeight: '600',
  minWidth: '20px',
  textAlign: 'center'
};

const itemTotalStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '8px'
};

const itemTotalPriceStyle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#2196F3'
};

const removeButtonStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '16px',
  color: '#F44336',
  padding: '4px'
};

const cartSummaryStyle = {
  padding: '20px',
  borderTop: '1px solid #eee',
  backgroundColor: '#f9f9f9'
};

const summaryRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '8px',
  fontSize: '14px'
};

const totalRowStyle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#333',
  borderTop: '1px solid #ddd',
  paddingTop: '8px',
  marginTop: '8px'
};

const cartActionsStyle = {
  padding: '20px',
  display: 'flex',
  gap: '12px'
};

const clearButtonStyle = {
  flex: 1,
  padding: '12px',
  border: '1px solid #ddd',
  backgroundColor: 'white',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: '600'
};

const checkoutButtonStyle = {
  flex: 2,
  padding: '12px',
  backgroundColor: '#4CAF50',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '16px'
};

export default Cart;