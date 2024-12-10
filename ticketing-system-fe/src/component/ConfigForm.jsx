// src/components/ConfigForm.jsx
import React, { useState, useEffect } from "react";
import { useSystem } from "../context/SystemContext";

const ConfigForm = () => {
  const { isSystemRunning } = useSystem();
  const [config, setConfig] = useState({
    totalTickets: "",
    releaseRate: "",
    retrievalRate: "",
    maxCapacity: "",
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });
  const [ticketAvailability, setTicketAvailability] = useState(0);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3001");

    ws.onopen = () => {
      console.log("Connected to WebSocket server");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setTicketAvailability(data.availableTickets);
    };

    return () => ws.close();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!config.totalTickets) {
      newErrors.totalTickets = "Total tickets is required";
    }
    if (!config.releaseRate) {
      newErrors.releaseRate = "Release rate is required";
    }
    if (!config.retrievalRate) {
      newErrors.retrievalRate = "Retrieval rate is required";
    }
    if (!config.maxCapacity) {
      newErrors.maxCapacity = "Maximum capacity is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await fetch("http://localhost:3001/api/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: data.message });
        setConfig({ totalTickets: "", releaseRate: "",retrievalRate: "", maxCapacity: "" });
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save configuration" });
    }
  };

  return (
    <div className="container">
      <div className="card fade-in">
        <div className="card-header">
          <h2 className="card-title">Ticket Configuration</h2>
        </div>

        {message.text && (
          <div className={`message ${message.type}-message`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Total Tickets</label>
            <input
              type="number"
              className={`form-input ${errors.totalTickets ? "error" : ""} ${
                !isSystemRunning ? "disabled-content" : ""
              }`}
              value={config.totalTickets}
              onChange={(e) =>
                setConfig({ ...config, totalTickets: e.target.value })
              }
            />
            {errors.totalTickets && (
              <span className="error-text">{errors.totalTickets}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Release Rate (tickets/minute)</label>
            <input
              type="number"
              className={`form-input ${errors.releaseRate ? "error" : ""} ${
                !isSystemRunning ? "disabled-content" : ""
              }`}
              value={config.releaseRate}
              onChange={(e) =>
                setConfig({ ...config, releaseRate: e.target.value })
              }
            />
            {errors.releaseRate && (
              <span className="error-text">{errors.releaseRate}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Retrieval Rate</label>
            <input
              type="number"
              className={`form-input ${errors.retrievalRate ? "error" : ""} ${
                !isSystemRunning ? "disabled-content" : ""
              }`}
              value={config.retrievalRate}
              onChange={(e) =>
                setConfig({ ...config, retrievalRate: e.target.value })
              }
            />
            {errors.retrievalRate && (
              <span className="error-text">{errors.retrievalRate}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Maximum Capacity</label>
            <input
              type="number"
              className={`form-input ${errors.maxCapacity ? "error" : ""} ${
                !isSystemRunning ? "disabled-content" : ""
              }`}
              value={config.maxCapacity}
              onChange={(e) =>
                setConfig({ ...config, maxCapacity: e.target.value })
              }
            />
            {errors.maxCapacity && (
              <span className="error-text">{errors.maxCapacity}</span>
            )}
          </div>

          <button
            type="submit"
            className={!isSystemRunning ? "button disabled-content" : "button"}
          >
            Save Configuration
          </button>
        </form>

        <div className="status-display">
          <div className="status-count">{ticketAvailability}</div>
          <div className="status-label">Available Tickets</div>
        </div>
      </div>
    </div>
  );
};

export default ConfigForm;
