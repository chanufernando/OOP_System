import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useSystem } from "../context/SystemContext";

const Navbar = () => {
  const { isSystemRunning, toggleSystem } = useSystem();
  const [isCustomerLoggedIn, setIsCustomerLoggedIn] = useState(false);
  const [isVendorLoggedIn, setIsVendorLoggedIn] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("customerToken");
    setIsCustomerLoggedIn(!!token);
  }, [localStorage.getItem("customerToken")]);

  const handleCustomerLogout = () => {
    localStorage.removeItem("customerToken");
    setIsCustomerLoggedIn(false);
    window.location.href = "/";
  };

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    setIsAdminLoggedIn(!!token);
  }, [localStorage.getItem("adminToken")]);

  const handleAdminLogout = () => {
    localStorage.removeItem("adminToken");
    setIsAdminLoggedIn(false);
    window.location.href = "/";
  };

  useEffect(() => {
    const token = localStorage.getItem("vendorToken");
    setIsVendorLoggedIn(!!token);
  }, [localStorage.getItem("vendorToken")]);

  const handleVendorLogout = () => {
    localStorage.removeItem("vendorToken");
    setIsVendorLoggedIn(false);
    window.location.href = "/";
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <NavLink to="/" className="nav-logo">
          Ticketing System
        </NavLink>

        <div style={{ display: "flex" }}>
          <div className="dropdown-container">
            <div className="dropdown-trigger">
              {isVendorLoggedIn ? "Vendor Menu" : "Vendor"}
              <span className="dropdown-arrow">▼</span>
            </div>
            <div className="dropdown-menu">
              {!isVendorLoggedIn ? (
                <NavLink
                  to="/vendor/login"
                  className={({ isActive }) =>
                    `dropdown-item ${isActive ? "active" : ""}`
                  }
                >
                  Vendor Login
                </NavLink>
              ) : (
                <>
                  <NavLink
                    to="/vendor/dashboard"
                    className={({ isActive }) =>
                      `dropdown-item ${isActive ? "active" : ""}`
                    }
                  >
                    Vendor Dashboard
                  </NavLink>
                  <button
                    onClick={handleVendorLogout}
                    className="dropdown-item logout-button"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="dropdown-container">
            <div className="dropdown-trigger">
              {isCustomerLoggedIn ? "Customer Menu" : "Customer"}
              <span className="dropdown-arrow">▼</span>
            </div>
            <div className="dropdown-menu">
              {isCustomerLoggedIn ? (
                <>
                  <NavLink
                    to="/customer/dashboard"
                    className={({ isActive }) =>
                      `dropdown-item ${isActive ? "active" : ""}`
                    }
                  >
                    Dashboard
                  </NavLink>
                  <NavLink
                    to="/customer/cart"
                    className={({ isActive }) =>
                      `dropdown-item ${isActive ? "active" : ""}`
                    }
                  >
                    Cart
                  </NavLink>
                  <button
                    onClick={handleCustomerLogout}
                    className="dropdown-item logout-button"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <NavLink
                    to="/customer/login"
                    className={({ isActive }) =>
                      `dropdown-item ${isActive ? "active" : ""}`
                    }
                  >
                    Login
                  </NavLink>
                  <NavLink
                    to="/customer/register"
                    className={({ isActive }) =>
                      `dropdown-item ${isActive ? "active" : ""}`
                    }
                  >
                    Register
                  </NavLink>
                </>
              )}
            </div>
          </div>

          <div className="dropdown-container">
            <div className="dropdown-trigger">
              {isAdminLoggedIn ? "Admin Menu" : "Admin"}
              <span className="dropdown-arrow">▼</span>
            </div>
            <div className="dropdown-menu">
              {!isAdminLoggedIn ? (
                <NavLink
                  to="/admin/login"
                  className={({ isActive }) =>
                    `dropdown-item ${isActive ? "active" : ""}`
                  }
                >
                  Admin Login
                </NavLink>
              ) : (
                <>
                  <NavLink
                    to="/config"
                    className={({ isActive }) =>
                      `dropdown-item ${isActive ? "active" : ""}`
                    }
                  >
                    Configuration
                  </NavLink>
                  <NavLink
                    to="/logs"
                    className={({ isActive }) =>
                      `dropdown-item ${isActive ? "active" : ""}`
                    }
                  >
                    System Logs
                  </NavLink>
                  <button
                    onClick={handleAdminLogout}
                    className="dropdown-item logout-button"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>

          {isAdminLoggedIn && (
            <div className="system-control">
              <div className="system-status">
                <div
                  className={`status-indicator ${
                    isSystemRunning ? "status-running" : "status-stopped"
                  }`}
                />
                <span>
                  {isSystemRunning ? "System Running" : "System Stopped"}
                </span>
              </div>
              <button
                className={`control-button ${
                  isSystemRunning ? "stop" : "start"
                }`}
                onClick={toggleSystem}
              >
                {isSystemRunning ? "Stop System" : "Start System"}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
