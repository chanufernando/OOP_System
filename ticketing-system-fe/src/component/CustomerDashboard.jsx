import React from "react";
import { Link } from "react-router-dom";

const CustomerDashboard = () => {
  return (
    <div className="customer-dashboard">
      <h2>Welcome to Your Dashboard</h2>
      <div className="dashboard-grid">
        <Link to="/customer/profile" className="dashboard-card">
          <h3>Profile</h3>
          <p>View and manage your profile</p>
        </Link>
        <Link to="/customer/cart" className="dashboard-card">
          <h3>Shopping Cart</h3>
          <p>View your cart and checkout</p>
        </Link>
        <Link to="/tickets" className="dashboard-card">
          <h3>Book Ticket</h3>
          <p>Book your ticket</p>
        </Link>
        <Link to="/customer/payments" className="dashboard-card">
          <h3>Payment Methods</h3>
          <p>Manage your payment options</p>
        </Link>
      </div>
    </div>
  );
};

export default CustomerDashboard;
