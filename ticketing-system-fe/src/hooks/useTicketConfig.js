import { useState } from "react";

export const useTicketConfig = () => {
  const [config, setConfig] = useState({
    totalTickets: "",
    releaseRate: "",
    maxCapacity: "",
  });

  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validateConfig = () => {
    const newErrors = {};

    if (!config.totalTickets) {
      newErrors.totalTickets = "Total tickets is required";
    } else if (parseInt(config.totalTickets) <= 0) {
      newErrors.totalTickets = "Total tickets must be positive";
    }

    if (!config.releaseRate) {
      newErrors.releaseRate = "Release rate is required";
    } else if (parseInt(config.releaseRate) <= 0) {
      newErrors.releaseRate = "Release rate must be positive";
    }

    if (!config.maxCapacity) {
      newErrors.maxCapacity = "Maximum capacity is required";
    } else if (parseInt(config.maxCapacity) <= 0) {
      newErrors.maxCapacity = "Maximum capacity must be positive";
    } else if (parseInt(config.maxCapacity) > parseInt(config.totalTickets)) {
      newErrors.maxCapacity = "Maximum capacity cannot exceed total tickets";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!validateConfig()) return;

    try {
      const response = await fetch("http://localhost:3001/api/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) throw new Error("Failed to save configuration");

      setSuccess("Configuration saved successfully");
      setConfig({
        totalTickets: "",
        releaseRate: "",
        maxCapacity: "",
      });
    } catch (err) {
      setError(err.message);
    }
  };

  return {
    config,
    setConfig,
    errors,
    error,
    success,
    handleSubmit,
  };
};
