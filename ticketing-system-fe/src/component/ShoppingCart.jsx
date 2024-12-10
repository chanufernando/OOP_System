import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ShoppingCart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/customer/cart", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("customerToken")}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("customerToken");
          navigate("/customer/login");
          return;
        }
        throw new Error("Failed to fetch cart");
      }

      const data = await response.json();
      setCartItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.price, 0).toFixed(2);
  };

  if (loading) return <div className="loading">Loading cart...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="shopping-cart">
      <div className="cart-card">
        <h2>Shopping Cart</h2>
        {cartItems.length === 0 ? (
          <div className="empty-cart">Your cart is empty</div>
        ) : (
          <>
            <div className="cart-items">
              {cartItems.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="item-details">
                    <h3>Ticket #{item.ticket_number}</h3>
                    <p className="item-price">${item.price}</p>
                  </div>
                  <div className="item-expiry">
                    Expires in: {new Date(item.expires_at).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-summary">
              <div className="total-amount">
                <span>Total:</span>
                <span>${calculateTotal()}</span>
              </div>
              <button
                className="checkout-button"
                onClick={() => navigate("/customer/checkout")}
              >
                Proceed to Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ShoppingCart;
