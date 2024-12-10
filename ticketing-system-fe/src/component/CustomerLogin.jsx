import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const CustomerLogin = () => {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3001/api/customer/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      localStorage.setItem("customerToken", data.token);
      window.location.href = "/customer/dashboard";
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="customer-auth">
      <div className="auth-card">
        <h2>Customer Login</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={credentials.email}
              onChange={(e) =>
                setCredentials({ ...credentials, email: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) =>
                setCredentials({ ...credentials, password: e.target.value })
              }
              required
            />
          </div>
          <button type="submit" className="submit-button">
            Login
          </button>
          <p className="auth-switch">
            Don't have an account? <a href="/customer/register">Register</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default CustomerLogin;
