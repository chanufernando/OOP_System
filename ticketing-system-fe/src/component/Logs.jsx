// src/components/Logs.jsx
import React, { useState, useEffect } from "react";
import { useSystem } from "../context/SystemContext";

const Logs = () => {
  const { isSystemRunning } = useSystem();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    severity: "",
    eventType: "",
    startDate: "",
    endDate: "",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  });

  const fetchLogs = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: pagination.currentPage,
        limit: 10,
        ...filters,
      });

      const response = await fetch(
        `http://localhost:3001/api/logs?${queryParams}`
      );
      if (!response.ok) throw new Error("Failed to fetch logs");

      const data = await response.json();
      setLogs(data.logs);
      setPagination({
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        total: data.total,
      });
      setError(null);
    } catch (err) {
      setError("Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [pagination.currentPage, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "error":
        return "text-red-600";
      case "warning":
        return "text-yellow-600";
      case "info":
        return "text-blue-600";
      default:
        return "";
    }
  };

  if (loading) {
    return <div className="loading-overlay">Loading logs...</div>;
  }

  if (error) {
    return <div className="error-state">{error}</div>;
  }

  return (
    <div
      className={`logs-dashboard ${!isSystemRunning ? "disabled-content" : ""}`}
    >
      <div className="logs-header">
        <h2>System Logs</h2>
        <div className="filters">
          <select
            name="severity"
            value={filters.severity}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>

          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="filter-input"
          />

          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="filter-input"
          />
        </div>
      </div>

      <div className="logs-table">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Event Type</th>
              <th>Message</th>
              <th>Severity</th>
              <th>Entity Type</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.created_at).toLocaleString()}</td>
                <td>{log.event_type}</td>
                <td>{log.message}</td>
                <td className={getSeverityColor(log.severity)}>
                  {log.severity}
                </td>
                <td>{log.entity_type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button
          onClick={() =>
            setPagination((prev) => ({
              ...prev,
              currentPage: prev.currentPage - 1,
            }))
          }
          disabled={pagination.currentPage === 1}
          className="pagination-button"
        >
          Previous
        </button>
        <span className="page-info">
          Page {pagination.currentPage} of {pagination.totalPages}
        </span>
        <button
          onClick={() =>
            setPagination((prev) => ({
              ...prev,
              currentPage: prev.currentPage + 1,
            }))
          }
          disabled={pagination.currentPage === pagination.totalPages}
          className="pagination-button"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Logs;
