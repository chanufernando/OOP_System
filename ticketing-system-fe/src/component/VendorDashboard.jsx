// src/components/vendor/VendorDashboard.jsx
import React, { useState, useEffect } from "react";
import { useSystem } from "../context/SystemContext";

const VendorDashboard = () => {
  const { isSystemRunning } = useSystem();
  const [dashboardData, setDashboardData] = useState({
    configurations: [],
    analytics: {
      total_sold: 0,
      total_revenue: 0,
    },
    notifications: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(
          "http://localhost:3001/api/vendor/dashboard",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("vendorToken")}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch dashboard data");
        const data = await response.json();

        // Ensure analytics has default values if null
        setDashboardData({
          configurations: data.configurations || [],
          analytics: {
            total_sold: data.analytics?.total_sold || 0,
            total_revenue: parseFloat(data.analytics?.total_revenue || 0),
          },
          notifications: data.notifications || [],
        });
      } catch (error) {
        console.error("Dashboard error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // WebSocket connection for real-time updates
    const ws = new WebSocket("ws://localhost:3001");
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "vendor_update") {
        setDashboardData((prev) => ({
          ...prev,
          ...data.updates,
        }));
      }
    };

    return () => ws.close();
  }, []);

  if (loading)
    return <div className="loading-overlay">Loading dashboard...</div>;

  if (error) return <div className="error-message">{error}</div>;

  return (
    <div
      className={`vendor-dashboard ${
        !isSystemRunning ? "disabled-content" : ""
      }`}
    >
      <div className="dashboard-header">
        <h2>Vendor Dashboard</h2>
        <div className="system-status">
          System Status: {isSystemRunning ? "Running" : "Stopped"}
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Active Configurations */}
        <div className="dashboard-section">
          <h3>Active Configurations</h3>
          <div className="configurations-list">
            {dashboardData.configurations.length > 0 ? (
              dashboardData.configurations.map((config) => (
                <div key={config.id} className="config-card">
                  <div>Total Tickets: {config.total_tickets}</div>
                  <div>Available: {config.available_tickets}</div>
                  <div>Release Rate: {config.release_rate}/min</div>
                </div>
              ))
            ) : (
              <div className="no-data">No active configurations</div>
            )}
          </div>
        </div>

        {/* Today's Analytics */}
        <div className="dashboard-section">
          <h3>Today's Performance</h3>
          <div className="analytics-summary">
            <div className="stat-card">
              <div className="stat-value">
                {dashboardData.analytics.total_sold}
              </div>
              <div className="stat-label">Tickets Sold</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                $
                {typeof dashboardData.analytics.total_revenue === "number"
                  ? dashboardData.analytics.total_revenue.toFixed(2)
                  : "0.00"}
              </div>
              <div className="stat-label">Revenue</div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="dashboard-section">
          <h3>Recent Notifications</h3>
          <div className="notifications-list">
            {dashboardData.notifications.length > 0 ? (
              dashboardData.notifications.map((notification) => (
                <div key={notification.id} className="notification-card">
                  <div className="notification-type">{notification.type}</div>
                  <div className="notification-message">
                    {notification.message}
                  </div>
                  <div className="notification-time">
                    {new Date(notification.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data">No new notifications</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
