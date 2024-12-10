import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const CustomerRegister = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        "http://localhost:3001/api/customer/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      localStorage.setItem("customerToken", data.token);
      navigate("/customer/profile");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="customer-auth">
      <div className="auth-card">
        <h2>Customer Registration</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              required
            />
          </div>
          <button type="submit" className="submit-button">
            Register
          </button>
          <p className="auth-switch">
            Already have an account? <a href="/customer/login">Login</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default CustomerRegister;
