// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { SystemProvider } from "./context/SystemContext";
import Navbar from "./component/Navbar";
import ConfigForm from "./component/ConfigForm";
import TicketAvailability from "./component/TicketAvailability";
import Logs from "./component/Logs";
import VendorDashboard from "./component/VendorDashboard";
import VendorLogin from "./component/VendorLogin";
import CustomerLogin from "./component/CustomerLogin";
import CustomerRegister from "./component/CustomerRegister";
import CustomerProfile from "./component/CustomerProfile";
import CustomerDashboard from "./component/CustomerDashboard";
import ShoppingCart from "./component/ShoppingCart";
import AdminLogin from "./component/AdminLogin";

function App() {
  return (
    <SystemProvider>
      <Router>
        <div className="app">
          <Navbar />
          <main className="container">
            <Routes>
              <Route path="/config" element={<ConfigForm />} />
              <Route path="/tickets" element={<TicketAvailability />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/vendor/login" element={<VendorLogin />} />
              <Route path="/vendor/dashboard" element={<VendorDashboard />} />
              {/* Customer Routes */}
              <Route path="/customer/login" element={<CustomerLogin />} />
              <Route path="/customer/register" element={<CustomerRegister />} />
              <Route path="/customer/profile" element={<CustomerProfile />} />
              <Route
                path="/customer/dashboard"
                element={<CustomerDashboard />}
              />
              <Route path="/customer/cart" element={<ShoppingCart />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/" element={<TicketAvailability />} />
            </Routes>
          </main>
        </div>
      </Router>
    </SystemProvider>
  );
}

export default App;
